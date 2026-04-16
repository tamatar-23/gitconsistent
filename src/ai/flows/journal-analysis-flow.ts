'use server';

import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const JournalAnalysisInputSchema = z.object({
  journalText: z.string(),
});
export type JournalAnalysisInput = z.infer<typeof JournalAnalysisInputSchema>;

const JournalAnalysisOutputSchema = z.object({
  daySummary: z.string(),
  moodAnalysis: z.string(),
});
export type JournalAnalysisOutput = z.infer<typeof JournalAnalysisOutputSchema>;

export async function analyzeJournalEntry(input: JournalAnalysisInput): Promise<JournalAnalysisOutput> {
  const systemPrompt = `You are a compassionate and insightful AI assistant.
Respond ONLY in valid JSON format matching this schema:
{
  "daySummary": "A concise summary of the key activities, events, and thoughts from the journal entry (2-4 sentences).",
  "moodAnalysis": "An empathetic analysis of the overall mood perceived from the journal entry (1-3 sentences)."
}
Do not include any characters outside of the JSON object.`;

  const userPrompt = `My Journal Entry:
${input.journalText}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq.");
    }
    
    const parsed = JSON.parse(content);
    return {
      daySummary: parsed.daySummary || "Summary not available.",
      moodAnalysis: parsed.moodAnalysis || "Mood analysis not available."
    };
  } catch (error) {
    console.error("Groq AI Error in analyzeJournalEntry:", error);
    throw new Error("AI could not analyze the journal entry at this time.");
  }
}
