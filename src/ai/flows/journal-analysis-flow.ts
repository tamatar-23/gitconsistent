
'use server';
/**
 * @fileOverview A Genkit flow to analyze a user's journal entry.
 *
 * - analyzeJournalEntry - A function that returns a summary of the day and mood analysis.
 * - JournalAnalysisInput - The input type for the analyzeJournalEntry function.
 * - JournalAnalysisOutput - The return type for the analyzeJournalEntry function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const JournalAnalysisInputSchema = z.object({
  journalText: z.string().describe("The user's journal entry for the day."),
});
export type JournalAnalysisInput = z.infer<typeof JournalAnalysisInputSchema>;

const JournalAnalysisOutputSchema = z.object({
  daySummary: z.string().describe("A concise summary of the key activities, events, and thoughts from your journal entry. This should be 2-4 sentences, speaking directly to you."),
  moodAnalysis: z.string().describe("An empathetic analysis of your overall mood as perceived from the journal entry. This should be 1-3 sentences and offer a gentle reflection, speaking directly to you."),
});
export type JournalAnalysisOutput = z.infer<typeof JournalAnalysisOutputSchema>;

export async function analyzeJournalEntry(input: JournalAnalysisInput): Promise<JournalAnalysisOutput> {
  return journalAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'journalAnalysisPrompt',
  input: { schema: JournalAnalysisInputSchema },
  output: { schema: JournalAnalysisOutputSchema },
  prompt: `You are a compassionate and insightful AI assistant. I've provided my journal entry for the day.
Your task is to:
1.  **Summarize My Day**: Briefly summarize the main activities, events, or significant thoughts I mentioned in my journal. Address me directly (e.g., "It sounds like you had a busy day..."). Aim for 2-4 sentences.
2.  **Analyze My Mood**: Based on my language, tone, and content, provide a gentle and empathetic analysis of my perceived mood. This could be positive, negative, mixed, or neutral. Offer a brief reflection if appropriate, addressing me directly (e.g., "You seem to be feeling..."). Aim for 1-3 sentences.

Please maintain a supportive, understanding, and user-friendly tone.

My Journal Entry:
{{{journalText}}}

Your reflection for me:
`,
});

const journalAnalysisFlow = ai.defineFlow(
  {
    name: 'journalAnalysisFlow',
    inputSchema: JournalAnalysisInputSchema,
    outputSchema: JournalAnalysisOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    if (!output) {
      console.error("AI prompt for journal analysis did not return an output.", { input, usage });
      throw new Error("AI could not analyze the journal entry at this time.");
    }
    return output;
  }
);

