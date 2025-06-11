
"use server";

import { z } from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc, deleteDoc, Timestamp, setDoc, getDoc, endAt, startAt, orderBy, updateDoc } from "firebase/firestore";
import { habitCoachTips, HabitCoachTipsInput, HabitCoachTipsOutput } from '@/ai/flows/habit-coach-tips';
import { generateHabitInsights, HabitInsightsInput, HabitInsightsOutput } from '@/ai/flows/habit-insights-flow';
import { analyzeJournalEntry, JournalAnalysisInput as GenkitJournalAnalysisInput, JournalAnalysisOutput as GenkitJournalAnalysisOutput } from '@/ai/flows/journal-analysis-flow';
import type { Habit, HabitLog } from "@/types/habit";
import type { UserSettings } from "@/types/user";
import type { JournalEntry } from "@/types/journal"; // New journal type
import { revalidatePath } from "next/cache";
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';


// Schema for adding a habit
const AddHabitSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  frequency: z.enum(["daily", "weekly"]),
  targetDays: z.array(z.number().min(0).max(6)).optional(),
});

// Schema for updating a habit (can be the same as adding, or more specific if needed)
const UpdateHabitSchema = AddHabitSchema;


export async function addHabitAction(userId: string, values: z.infer<typeof AddHabitSchema>) {
  if (!userId) {
    throw new Error("User ID not provided to action");
  }

  const validatedData = AddHabitSchema.parse(values);

  try {
    await addDoc(collection(db, "habits"), {
      userId: userId,
      name: validatedData.name,
      description: validatedData.description || "",
      frequency: validatedData.frequency,
      targetDays: validatedData.targetDays || [],
      createdAt: serverTimestamp(),
      archived: false,
    });
    revalidatePath("/dashboard");
    revalidatePath("/insights"); 
    revalidatePath("/journal");
    revalidatePath("/archive");
    revalidatePath("/(main)", "layout");
  } catch (error: any) {
    console.error("Error adding habit: ", error); 
    let errorMessage = "Failed to add habit. Please check server logs for the original Firestore error message.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to add habit due to Firestore permission issues. This can occur if your security rules rely on 'request.auth' (e.g., 'request.auth.uid == resource.data.userId'), which is typically null when operations are performed via Next.js Server Actions using the Firebase client SDK. Ensure your rules are set up to correctly authorize writes originating from your server actions, possibly by verifying an ID token if you pass one, or by adjusting rules if you trust the server action to set the correct 'userId'. Please review your Firestore security rules in the Firebase console and the guidance in README.md.";
    } else if (error.message) {
      errorMessage = `Failed to add habit: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}

export async function updateHabitAction(habitId: string, userId: string, values: z.infer<typeof UpdateHabitSchema>) {
  if (!userId) {
    throw new Error("User ID not provided for update action");
  }
  if (!habitId) {
    throw new Error("Habit ID not provided for update action");
  }

  const validatedData = UpdateHabitSchema.parse(values);
  const habitDocRef = doc(db, "habits", habitId);

  try {
    await updateDoc(habitDocRef, {
      name: validatedData.name,
      description: validatedData.description || "",
      frequency: validatedData.frequency,
      targetDays: validatedData.targetDays || [],
    });
    revalidatePath("/dashboard");
    revalidatePath("/insights"); 
    revalidatePath("/journal");
    revalidatePath("/archive");
    revalidatePath("/(main)", "layout");
  } catch (error: any) {
    console.error("Error updating habit: ", error);
    let errorMessage = "Failed to update habit. Please check server logs for details.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to update habit due to Firestore permission issues. Ensure your security rules allow updates for the habit owner. See README.md.";
    } else if (error.message) {
      errorMessage = `Failed to update habit: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}


export async function toggleHabitCompletionAction(userId: string, habitId: string, date: string, completed: boolean) {
  if (!userId) {
    throw new Error("User ID not provided to action");
  }

  const logRef = collection(db, "habitLogs");
  const q = query(logRef, where("userId", "==", userId), where("habitId", "==", habitId), where("date", "==", date));

  try {
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    if (querySnapshot.empty) {
      if (completed) { 
        const newLogDocRef = doc(collection(db, "habitLogs"));
        batch.set(newLogDocRef, {
          userId: userId,
          habitId: habitId,
          date: date,
          completed: true,
          createdAt: serverTimestamp(),
        });
      }
    } else {
      querySnapshot.forEach((document) => {
        batch.update(doc(db, "habitLogs", document.id), { completed: completed });
      });
    }
    await batch.commit();
    revalidatePath("/dashboard");
    revalidatePath("/insights"); 
    revalidatePath("/journal");
    revalidatePath("/archive");
    revalidatePath("/(main)", "layout");
  } catch (error: any) {
    console.error("Error toggling habit completion: ", error); 
    let errorMessage = "Failed to update habit completion. Please check server logs for details.";
     if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to update habit completion due to Firestore permission issues. This can occur if your security rules rely on 'request.auth', which is typically null in Server Actions using the Firebase client SDK. Please review your Firestore security rules and README.md guidance.";
    } else if (error.message) {
      errorMessage = `Failed to update habit completion: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}

export async function deleteHabitAction(userId: string, habitId: string) {
    if (!userId) {
        throw new Error("User ID not provided to action");
    }

    try {
        const batch = writeBatch(db);

        const habitDocRef = doc(db, "habits", habitId);
        batch.delete(habitDocRef);

        const logsQuery = query(collection(db, "habitLogs"), where("habitId", "==", habitId), where("userId", "==", userId));
        const logsSnapshot = await getDocs(logsQuery);
        logsSnapshot.forEach(logDoc => {
            batch.delete(doc(db, "habitLogs", logDoc.id));
        });

        await batch.commit();
        revalidatePath("/dashboard");
        revalidatePath("/insights");
        revalidatePath("/journal");
        revalidatePath("/archive");
        revalidatePath("/(main)", "layout");
    } catch (error: any) {
        console.error("Error deleting habit: ", error); 
        let errorMessage = "Failed to delete habit. Please check server logs for details.";
        if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
          errorMessage = "Failed to delete habit due to Firestore permission issues. This can occur if your security rules rely on 'request.auth', which is typically null in Server Actions using the Firebase client SDK. Please review your Firestore security rules and README.md guidance.";
        } else if (error.message) {
          errorMessage = `Failed to delete habit: ${error.message.substring(0, 250)}`;
        }
        throw new Error(errorMessage);
    }
}

export async function archiveHabitAction(userId: string, habitId: string) {
  if (!userId) {
    throw new Error("User ID not provided to archive action");
  }
  if (!habitId) {
    throw new Error("Habit ID not provided to archive action");
  }

  try {
    const habitDocRef = doc(db, "habits", habitId);
    await updateDoc(habitDocRef, { archived: true });
    revalidatePath("/dashboard");
    revalidatePath("/insights");
    revalidatePath("/journal");
    revalidatePath("/archive");
    revalidatePath("/(main)", "layout"); 
  } catch (error: any) {
    console.error("Error archiving habit: ", error);
    let errorMessage = "Failed to archive habit. Please check server logs for details.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to archive habit due to Firestore permission issues. Please review your Firestore security rules and README.md guidance.";
    } else if (error.message) {
      errorMessage = `Failed to archive habit: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}

export async function unarchiveHabitAction(userId: string, habitId: string) {
  if (!userId) {
    throw new Error("User ID not provided to unarchive action");
  }
  if (!habitId) {
    throw new Error("Habit ID not provided to unarchive action");
  }

  try {
    const habitDocRef = doc(db, "habits", habitId);
    await updateDoc(habitDocRef, { archived: false });
    revalidatePath("/dashboard");
    revalidatePath("/archive");
    revalidatePath("/(main)", "layout");
  } catch (error: any) {
    console.error("Error unarchiving habit: ", error);
    let errorMessage = "Failed to unarchive habit. Please check server logs for details.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to unarchive habit due to Firestore permission issues. Please review your Firestore security rules and README.md guidance.";
    } else if (error.message) {
      errorMessage = `Failed to unarchive habit: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}


// AI Coach Action - Updated to accept HabitCoachTipsInput which includes history
export async function getAICoachTipsAction(input: HabitCoachTipsInput): Promise<HabitCoachTipsOutput> {
  const result = await habitCoachTips(input);
  if (!result?.tips) {
    console.error("AI coach did not return tips.", {input, result});
    throw new Error("AI coach could not generate a response at this time. The response was empty.");
  }
  return result;
}

// AI Habit Review Action
export async function getAIHabitReviewAction(userId: string, timePeriod: 'weekly' | 'monthly'): Promise<HabitInsightsOutput> {
  if (!userId) {
    throw new Error("User ID not provided for AI Habit Review action");
  }

  try {
    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", userId),
      where("archived", "==", false) 
    );
    const habitsSnapshot = await getDocs(habitsQuery);
    const userHabits: Habit[] = habitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));

    if (userHabits.length === 0) {
        return { analysis: "You don't have any active habits to review. Add some habits first!" };
    }

    const today = startOfDay(new Date());
    let startDate: Date;
    if (timePeriod === 'weekly') {
      startDate = subDays(today, 6); 
    } else { 
      startDate = subDays(today, 29); 
    }
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endOfDay(today), 'yyyy-MM-dd'); 

    const logsQuery = query(
      collection(db, "habitLogs"),
      where("userId", "==", userId),
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr),
      orderBy("date", "asc")
    );
    const logsSnapshot = await getDocs(logsQuery);
    const periodLogs: HabitLog[] = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog));

    if (periodLogs.length === 0 && userHabits.length > 0) {
        return { analysis: `No activity logged in the last ${timePeriod === 'weekly' ? '7 days' : '30 days'}. Start tracking your habits to get a review!` };
    }

    const flowInput: HabitInsightsInput = {
      userId,
      timePeriod,
      habits: userHabits.map(h => ({ 
        id: h.id,
        name: h.name,
        description: h.description || "",
        frequency: h.frequency,
        targetDays: h.targetDays || [],
        archived: h.archived || false,
      })),
      periodLogs: periodLogs.map(l => ({ 
        id: l.id,
        habitId: l.habitId,
        date: l.date,
        completed: l.completed,
      })),
    };

    const result = await generateHabitInsights(flowInput);

    if (!result?.analysis) {
      console.error("AI habit insights flow did not return an analysis.", { flowInput, result });
      throw new Error("AI could not generate a review at this time. The response was empty.");
    }
    return result;

  } catch (error: any) {
    console.error("Error in getAIHabitReviewAction: ", error);
    let errorMessage = "Failed to generate AI habit review. Please check server logs.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to generate review due to Firestore permission issues. Please review your Firestore security rules and README.md guidance.";
    } else if (error.message) { 
        if (error.message.includes("https://console.firebase.google.com/v1/r/project/") && error.message.includes("/firestore/indexes?create_composite=")) {
             errorMessage = `Failed to generate review: Firestore requires a composite index. If the auto-creation link in the original error is not working, please create it manually in the Firebase Console. The README.md file under "Create Necessary Firestore Indexes" provides guidance. For the 'habits' collection, you likely need an index on 'userId' (ASC) and 'archived' (ASC). For 'habitLogs', an index on 'userId' (ASC) and 'date' (ASC) is common. Original error: ${error.message.substring(0, 200)}`;
        } else {
            errorMessage = `Failed to generate review: ${error.message.substring(0, 250)}`;
        }
    }
    throw new Error(errorMessage);
  }
}


// Update Nudge Preference Action
export async function updateNudgePreferenceAction(userId: string, enabled: boolean): Promise<void> {
  if (!userId) {
    throw new Error("User ID not provided to update nudge preference action");
  }

  try {
    const settingsDocRef = doc(db, 'userSettings', userId);
    const settingData: UserSettings = {
      userId: userId,
      proactiveNudgesEnabled: enabled,
      updatedAt: serverTimestamp() as Timestamp 
    };
    await setDoc(settingsDocRef, settingData, { merge: true });
    revalidatePath("/insights"); 
    revalidatePath("/(main)", "layout"); 
  } catch (error: any) {
    console.error("Error updating nudge preference: ", error);
    let errorMessage = "Failed to update nudge preference. Please check server logs for details.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to update nudge preference due to Firestore permission issues. Please review your Firestore security rules and README.md guidance.";
    } else if (error.message) {
      errorMessage = `Failed to update nudge preference: ${error.message.substring(0, 250)}`;
    }
    throw new Error(errorMessage);
  }
}

// Journal Analysis Action
export type JournalAnalysisInput = GenkitJournalAnalysisInput;
export type JournalAnalysisOutput = GenkitJournalAnalysisOutput;

export async function analyzeJournalEntryAction(userId: string, input: JournalAnalysisInput): Promise<JournalAnalysisOutput> {
  if (!userId) {
    throw new Error("User ID not provided for journal analysis.");
  }

  const aiAnalysisResult = await analyzeJournalEntry(input);
  if (!aiAnalysisResult?.daySummary || !aiAnalysisResult?.moodAnalysis) {
    console.error("AI journal analysis did not return a complete summary.", { input, aiAnalysisResult });
    throw new Error("AI could not analyze the journal entry at this time. The response was incomplete.");
  }

  try {
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    
    const entriesQuery = query(
      collection(db, "journalEntries"),
      where("userId", "==", userId),
      where("date", "==", todayDateStr)
    );
    const entriesSnapshot = await getDocs(entriesQuery);
    const entrySuffix = entriesSnapshot.docs.length + 1;

    await addDoc(collection(db, "journalEntries"), {
      userId: userId,
      date: todayDateStr,
      entryText: input.journalText,
      aiDaySummary: aiAnalysisResult.daySummary,
      aiMoodAnalysis: aiAnalysisResult.moodAnalysis,
      createdAt: serverTimestamp(),
      entrySuffix: entrySuffix,
    } as Omit<JournalEntry, 'id'>); 

    revalidatePath("/journal");
    return aiAnalysisResult;

  } catch (error: any) {
    console.error("Error saving journal entry to Firestore: ", error);
    let errorMessage = "Failed to save journal entry. Please check server logs for details.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
      errorMessage = "Failed to save journal entry due to Firestore permission issues. Ensure your security rules for 'journalEntries' allow creates for authenticated users where 'request.resource.data.userId == request.auth.uid'. See README.md.";
    } else if (error.message) {
      errorMessage = `Failed to save journal entry: ${error.message.substring(0, 250)}`;
    }
    throw new Error(`AI analysis complete, but failed to save journal entry: ${errorMessage}`);
  }
}
