import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// Server-side audit for environment configuration
if (typeof process !== 'undefined') {
  const hasKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY);
  console.log(`[Genkit Setup] Gemini Key Detection: ${hasKey ? 'DETECTED' : 'MISSING'}`);
}

// Architecture Note: Gemma 2B is targeted for daily smart-task offloading
// to maximize cost-efficiency and low-latency localized reasoning.
