'use server';
/**
 * @fileOverview A conversational AI assistant for farmers, providing advice in local languages.
 *
 * - localLanguageAssistant - A function that handles farmer queries and provides advice.
 * - LocalLanguageAssistantInput - The input type for the localLanguageAssistant function.
 * - LocalLanguageAssistantOutput - The return type for the localLanguageAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocalLanguageAssistantInputSchema = z.object({
  query: z
    .string()
    .describe('The farmer\'s question or statement in a local language (e.g., Hindi, Marathi).'),
});
export type LocalLanguageAssistantInput = z.infer<typeof LocalLanguageAssistantInputSchema>;

const LocalLanguageAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s advice or answer in the detected local language.'),
});
export type LocalLanguageAssistantOutput = z.infer<typeof LocalLanguageAssistantOutputSchema>;

export async function localLanguageAssistant(input: LocalLanguageAssistantInput): Promise<LocalLanguageAssistantOutput> {
  return localLanguageAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'localLanguageAssistantPrompt',
  input: {schema: LocalLanguageAssistantInputSchema},
  output: {schema: LocalLanguageAssistantOutputSchema},
  prompt: `You are a helpful and knowledgeable agricultural assistant named YieldIQ. Your primary goal is to provide immediate, relevant, and easy-to-understand advice to farmers regarding their farming practices. You should be able to understand and respond in local Indian languages like Hindi and Marathi, as well as English. The farmer's input will be in their preferred language.

Be concise and focus on practical, actionable advice.

Farmer's Query: {{{query}}}`,
});

const localLanguageAssistantFlow = ai.defineFlow(
  {
    name: 'localLanguageAssistantFlow',
    inputSchema: LocalLanguageAssistantInputSchema,
    outputSchema: LocalLanguageAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
