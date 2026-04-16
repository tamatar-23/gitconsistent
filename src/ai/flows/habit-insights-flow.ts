'use server';

import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly']),
  targetDays: z.array(z.number()).optional(),
  archived: z.boolean().optional(),
});

const HabitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  completed: z.boolean(),
});

const HabitInsightsInputSchema = z.object({
  userId: z.string(),
  timePeriod: z.enum(['weekly', 'monthly']),
  habits: z.array(HabitSchema),
  periodLogs: z.array(HabitLogSchema),
});
export type HabitInsightsInput = z.infer<typeof HabitInsightsInputSchema>;

const HabitInsightsOutputSchema = z.object({
  analysis: z.string(),
});
export type HabitInsightsOutput = z.infer<typeof HabitInsightsOutputSchema>;

export async function generateHabitInsights(input: HabitInsightsInput): Promise<HabitInsightsOutput> {
  const systemPrompt = `You are an expert AI Habit Analyst. Your goal is to provide a personalized, insightful, and encouraging review of a user's habit progress.
Provide your response strictly in formatted Markdown. Make the entire analysis highly concise, brief, and scannable. Do not write wall-of-text paragraphs.
Do not include habit IDs or log IDs in the final text.
Your analysis should include:
1. Quick 2-sentence Overall Summary
2. Key Strengths (Bullet points)
3. Actionable Advice (Bullet points)
Keep it short. Less is more.`;

  const userPrompt = `Analyze the following data for the past ${input.timePeriod}:

User's Active Habits:
${JSON.stringify(input.habits, null, 2)}

Habit Logs for the Period:
${JSON.stringify(input.periodLogs, null, 2)}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
    });

    return {
      analysis: chatCompletion.choices[0]?.message?.content || "No analysis could be generated.",
    };
  } catch (error) {
    console.error("Groq AI Error in generateHabitInsights:", error);
    throw new Error("AI could not generate habit insights at this time.");
  }
}
