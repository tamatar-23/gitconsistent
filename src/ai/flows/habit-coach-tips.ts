'use server';

import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const HabitCoachTipsInputSchema = z.object({
  currentInput: z.string(),
  history: z.array(MessageSchema).optional(),
});
export type HabitCoachTipsInput = z.infer<typeof HabitCoachTipsInputSchema>;

const HabitCoachTipsOutputSchema = z.object({
  tips: z.string(),
});
export type HabitCoachTipsOutput = z.infer<typeof HabitCoachTipsOutputSchema>;

export async function habitCoachTips(input: HabitCoachTipsInput): Promise<HabitCoachTipsOutput> {
  const systemPrompt = `You are a compassionate and insightful AI Habit Coach, like a friendly therapist.
Your goal is to help the user understand their patterns and feel supported by continuing the conversation naturally.
Provide personalized, thoughtful, and encouraging guidance. Offer tips to improve habit consistency, gently address bad habits, and support their stated goals.
Refer to previous parts of the conversation when it's relevant to provide a coherent and contextual response.
Please make your responses extremely concise, impactful, and ideally under 3 short paragraphs. Aim for a conversational and supportive interaction. Avoid overly long explanations or generic filler. Instead, give a quick thought and an actionable tip.`;

  const messages: any[] = [{ role: 'system', content: systemPrompt }];

  if (input.history && input.history.length > 0) {
    messages.push(...input.history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })));
  }

  messages.push({ role: 'user', content: input.currentInput });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const output = chatCompletion.choices[0]?.message?.content || "";

    return {
      tips: output
    };
  } catch (error) {
    console.error("Groq AI Error in habitCoachTips:", error);
    throw new Error("AI coach could not generate a response at this time.");
  }
}
