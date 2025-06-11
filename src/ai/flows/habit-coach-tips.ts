
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized habit coaching tips.
 * It now supports conversation history for contextual responses.
 *
 * - habitCoachTips - A function that returns habit coaching tips based on user data and conversation history.
 * - HabitCoachTipsInput - The input type for the habitCoachTips function.
 * - HabitCoachTipsOutput - The return type for the habitCoachTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const HabitCoachTipsInputSchema = z.object({
  currentInput: z
    .string()
    .describe("The user's latest message or query."),
  history: z
    .array(MessageSchema)
    .optional()
    .describe("The preceding conversation history, if any. Ordered from oldest to newest."),
});
export type HabitCoachTipsInput = z.infer<typeof HabitCoachTipsInputSchema>;

const HabitCoachTipsOutputSchema = z.object({
  tips: z
    .string()
    .describe(
      'Personalized, empathetic, and detailed guidance for improving habit consistency, overcoming challenges, and removing bad habits, based on the user data and conversation history. The tone should be supportive and human-like, similar to a therapist.'
    ),
});
export type HabitCoachTipsOutput = z.infer<typeof HabitCoachTipsOutputSchema>;

export async function habitCoachTips(input: HabitCoachTipsInput): Promise<HabitCoachTipsOutput> {
  return habitCoachTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'habitCoachTipsPrompt',
  input: {schema: HabitCoachTipsInputSchema},
  output: {schema: HabitCoachTipsOutputSchema},
  prompt: `You are a compassionate and insightful AI Habit Coach, like a friendly therapist.
Your goal is to help the user understand their patterns and feel supported by continuing the conversation naturally.
Analyze the user's latest input in the context of the preceding conversation history, if any.
Provide personalized, thoughtful, and encouraging guidance. Offer tips to improve habit consistency, gently address bad habits, and support their stated goals.
Refer to previous parts of the conversation when it's relevant to provide a coherent and contextual response.
Please make your responses detailed, empathetic, and human-like. You can ask reflective questions to help the user think deeper.
Avoid very short, curt answers. Aim for a conversational and supportive interaction. Ensure your response is at least a few sentences long and offers actionable or reflective advice.

{{#if history}}
Conversation History (oldest to newest):
  {{#each history}}
{{#if (eq this.role "user")}}User: {{this.content}}{{/if}}
{{#if (eq this.role "assistant")}}Coach: {{this.content}}{{/if}}
  {{/each}}
---
{{/if}}

Current User Input:
User: {{{currentInput}}}

Coach's Thoughtful Guidance:
`,
});

// Register 'eq' helper for Handlebars if not available by default in Genkit's Handlebars instance
// This is a common Handlebars helper. If Genkit's environment doesn't have it,
// the prompt might need adjustment or the helper registration in Genkit (if possible).
// For now, assuming a standard Handlebars environment or that Genkit handles basic helpers.
// If (eq this.role "user") doesn't work, an alternative is:
// {{this.role}}: {{this.content}} which is simpler and LLMs can typically parse.
// Let's use the simpler version for robustness if 'eq' is not standard in Genkit's Handlebars
const simplerPrompt = ai.definePrompt({
  name: 'habitCoachTipsPromptSimpler',
  input: {schema: HabitCoachTipsInputSchema},
  output: {schema: HabitCoachTipsOutputSchema},
  prompt: `You are a compassionate and insightful AI Habit Coach, like a friendly therapist.
Your goal is to help the user understand their patterns and feel supported by continuing the conversation naturally.
Analyze the user's latest input in the context of the preceding conversation history, if any.
Provide personalized, thoughtful, and encouraging guidance. Offer tips to improve habit consistency, gently address bad habits, and support their stated goals.
Refer to previous parts of the conversation when it's relevant to provide a coherent and contextual response.
Please make your responses detailed, empathetic, and human-like. You can ask reflective questions to help the user think deeper.
Avoid very short, curt answers. Aim for a conversational and supportive interaction. Ensure your response is at least a few sentences long and offers actionable or reflective advice.

{{#if history}}
Conversation History (oldest to newest):
  {{#each history}}
{{this.role}}: {{this.content}}
  {{/each}}
---
{{/if}}

User's Latest Input:
user: {{{currentInput}}}

Coach's Thoughtful Guidance:
`,
});


const habitCoachTipsFlow = ai.defineFlow(
  {
    name: 'habitCoachTipsFlow',
    inputSchema: HabitCoachTipsInputSchema,
    outputSchema: HabitCoachTipsOutputSchema,
  },
  async input => {
    // Using the simpler prompt version for robustness
    const {output, usage} = await simplerPrompt(input);
    if (!output) {
      console.error("AI prompt did not return an output.", {input, usage});
      throw new Error("AI coach could not generate a response at this time.");
    }
    return output;
  }
);
