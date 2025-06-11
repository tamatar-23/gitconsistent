
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { Habit } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArchiveRestore, Archive as ArchiveIcon, Inbox } from 'lucide-react';
import { unarchiveHabitAction } from '@/app/(main)/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ArchivedHabitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setArchivedHabits([]);
      setIsLoadingHabits(false);
      return;
    }
    setIsLoadingHabits(true);
    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", user.uid),
      where("archived", "==", true),
      orderBy("name", "asc") // Order by name or createdAt as preferred
    );

    const unsubscribe = onSnapshot(habitsQuery, (querySnapshot) => {
      const habitsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      } as Habit));
      setArchivedHabits(habitsData);
      setIsLoadingHabits(false);
    }, (error) => {
      console.error("Error fetching archived habits:", error);
      toast({ title: "Error", description: "Could not load archived habits.", variant: "destructive" });
      setIsLoadingHabits(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleUnarchive = async (habitId: string) => {
    if (!user) return;
    setLoadingActionId(habitId);
    try {
      await unarchiveHabitAction(user.uid, habitId);
      toast({ title: "Success", description: "Habit unarchived and moved to your active list." });
      // Data will refresh due to revalidatePath in action
    } catch (error: any) {
      console.error("Error unarchiving habit:", error);
      toast({ title: "Error", description: error.message || "Failed to unarchive habit.", variant: "destructive" });
    } finally {
      setLoadingActionId(null);
    }
  };
  
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'MMM d, yyyy');
  };

  if (isLoadingHabits) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <ArchiveIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold">Archived Habits</h1>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader>
              <Skeleton className="h-6 w-3/5 rounded" />
              <Skeleton className="h-4 w-4/5 rounded mt-1" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-10 w-32 rounded" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ArchiveIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-bold">Archived Habits</h1>
      </div>

      {archivedHabits.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="font-headline text-2xl">No Archived Habits</CardTitle>
            <CardDescription>You haven't archived any habits yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedHabits.map((habit) => (
            <Card key={habit.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="font-headline text-lg">{habit.name}</CardTitle>
                {habit.description && (
                  <CardDescription className="text-sm">{habit.description}</CardDescription>
                )}
                <CardDescription className="text-xs">
                  Archived (Created: {formatDate(habit.createdAt)})
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  onClick={() => handleUnarchive(habit.id)}
                  disabled={loadingActionId === habit.id}
                  variant="outline"
                  size="sm"
                >
                  {loadingActionId === habit.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                  )}
                  Unarchive
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
