
'use server';
/**
 * @fileOverview A Genkit flow to analyze user's habit data and provide insights.
 *
 * - generateHabitInsights - A function that returns an analysis of habit consistency and patterns.
 * - HabitInsightsInput - The input type for the generateHabitInsights function.
 * - HabitInsightsOutput - The return type for the generateHabitInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Habit, HabitLog } from '@/types/habit'; // Assuming types are correctly defined

// Define Zod schemas for Habit and HabitLog if not already available for Genkit
// For simplicity, we'll use z.any() here but ideally, these would be more specific.
// If Habit and HabitLog types from '@/types/habit' are Zod schemas, use them directly.
// For this example, let's assume they are not, so we define simplified ones.
const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly']),
  targetDays: z.array(z.number()).optional(),
  archived: z.boolean().optional(),
  // createdAt: z.any().describe('Timestamp object, not directly used in prompt text but part of data structure'),
});

const HabitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string().describe('YYYY-MM-DD format'),
  completed: z.boolean(),
  // createdAt: z.any().optional(),
});


const HabitInsightsInputSchema = z.object({
  userId: z.string().describe("The user's unique identifier."),
  timePeriod: z.enum(['weekly', 'monthly']).describe('The period for which the review is generated.'),
  habits: z.array(HabitSchema).describe('An array of the user\'s active habits.'),
  periodLogs: z.array(HabitLogSchema).describe('An array of habit logs for the user within the specified time period.'),
});
export type HabitInsightsInput = z.infer<typeof HabitInsightsInputSchema>;

const HabitInsightsOutputSchema = z.object({
  analysis: z.string().describe('A detailed, empathetic, and actionable analysis of the user\'s habit performance over the period. This should highlight achievements, identify patterns (e.g., most consistent habits, challenging days/habits), and offer encouragement and practical advice for improvement. The tone should be supportive and insightful, like a helpful coach. Format as Markdown.'),
});
export type HabitInsightsOutput = z.infer<typeof HabitInsightsOutputSchema>;


export async function generateHabitInsights(input: HabitInsightsInput): Promise<HabitInsightsOutput> {
  return habitInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'habitInsightsPrompt',
  input: { schema: HabitInsightsInputSchema },
  output: { schema: HabitInsightsOutputSchema },
  prompt: `You are an expert AI Habit Analyst. Your goal is to provide a personalized, insightful, and encouraging review of a user's habit progress.

Analyze the following data for the user over the past {{{timePeriod}}}:

User's Active Habits:
{{#if habits}}
  {{#each habits}}
  - Habit: {{this.name}} (ID: {{this.id}})
    Description: {{#if this.description}}{{this.description}}{{else}}Not provided{{/if}}
    Frequency: {{this.frequency}}
    {{#if this.targetDays}}Target Days (0=Sun, 1=Mon, ..., 6=Sat): {{#each this.targetDays}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
  ---
  {{/each}}
{{else}}
  The user has no active habits defined.
{{/if}}

Habit Logs for the Period ({{{timePeriod}}}):
{{#if periodLogs}}
  {{#each periodLogs}}
  - Log for Habit ID {{this.habitId}} on {{this.date}}: {{#if this.completed}}COMPLETED{{else}}NOT COMPLETED{{/if}}
  ---
  {{/each}}
{{else}}
  No habit activity was logged during this period.
{{/if}}

Based *solely* on the habit and log data provided above, please provide a comprehensive analysis. Structure your response in Markdown.
**Important Formatting Note for your Response:** When referring to specific habits in your review text, please use their names. Do *not* include the habit IDs or log IDs in your generated analysis text meant for the user.

Your analysis should:
1.  **Overall Summary:** Start with a positive and encouraging overview of their efforts during the period, based on the logs.
2.  **Achievements & Strengths:** Highlight any habits they were particularly consistent with (referencing specific habit names and dates/counts from logs), notable streaks (if clearly calculable from the provided daily logs for daily habits), or days with high completion rates. Be specific and use data from the logs.
3.  **Patterns & Observations:**
    *   Identify any patterns in their consistency by correlating habits and logs. For example, are they more consistent on weekdays vs. weekends? Are certain habits (by name) easier or harder for them, based on completion rates in the logs?
    *   Mention any habits (by name) that were frequently missed or had low completion rates according to the logs.
4.  **Challenges & Areas for Growth:** Gently point out challenges, supported by evidence from the logs. For example, if a weekly habit with specific target days was often missed on those days, as seen in the logs.
5.  **Actionable Advice & Encouragement:** Provide 2-3 specific, practical, and empathetic pieces of advice to help them improve or maintain their momentum. Tailor this to their specific patterns observed from the habits and logs.
6.  **Concluding Thought:** End with an encouraging note, reinforcing their ability to build good habits.

Maintain a supportive, insightful, and human-like tone. The output should be formatted as Markdown for good readability.
**Crucially, do not invent or assume any data not explicitly present in the 'User's Active Habits' or 'Habit Logs for the Period' sections above. Your entire analysis must be grounded in the provided data.**
For example, if logs for a daily habit are missing for 3 days in a week, that's a point of inconsistency. If a weekly habit set for Mon, Wed, Fri was only completed on Mon (according to the logs), mention that.
`,
});

const habitInsightsFlow = ai.defineFlow(
  {
    name: 'habitInsightsFlow',
    inputSchema: HabitInsightsInputSchema,
    outputSchema: HabitInsightsOutputSchema,
  },
  async (input) => {    
    const { output, usage } = await prompt(input);
    if (!output) {
      console.error("AI prompt for habit insights did not return an output.", { input, usage });
      throw new Error("AI coach could not generate habit insights at this time.");
    }
    return output;
  }
);

