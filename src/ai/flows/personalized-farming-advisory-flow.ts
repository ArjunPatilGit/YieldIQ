'use server';
/**
 * @fileOverview A Genkit flow for generating personalized farming advisory reports.
 *
 * - personalizedFarmingAdvisory - A function that generates a personalized advisory report based on farmer data and AI predictions.
 * - PersonalizedFarmingAdvisoryInput - The input type for the personalizedFarmingAdvisory function.
 * - PersonalizedFarmingAdvisoryOutput - The return type for the personalizedFarmingAdvisory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedFarmingAdvisoryInputSchema = z.object({
  farmName: z.string().describe('The name of the farm.'),
  cropType: z.string().describe('The type of crop being grown (e.g., "Wheat", "Corn", "Tomatoes").'),
  soilType: z.string().describe('The type of soil (e.g., "Loamy", "Clay", "Sandy").'),
  location: z.string().describe('The geographical location of the farm.'),
  plantingDate: z.string().describe('The date when the crop was planted (e.g., "YYYY-MM-DD").'),
  currentStage: z.string().describe('The current growth stage of the crop (e.g., "Vegetative", "Flowering", "Fruiting").'),
  recentObservations: z.string().optional().describe('Any recent observations or issues, such as pest sightings, disease symptoms, or weather stress.'),
  predictedYield: z.string().describe('AI predicted yield for the current season (e.g., "10 tons per acre").'),
  predictedWaterNeeds: z.string().describe('AI predicted water requirements (e.g., "500 mm per season").'),
  predictedFertilizerNeeds: z.string().describe('AI predicted fertilizer requirements (e.g., "100 kg Nitrogen per acre").'),
  potentialPestsDiseases: z.string().optional().describe('AI predicted potential pests or diseases for the season.'),
});
export type PersonalizedFarmingAdvisoryInput = z.infer<typeof PersonalizedFarmingAdvisoryInputSchema>;

const PersonalizedFarmingAdvisoryOutputSchema = z.object({
  advisorySummary: z.string().describe('A concise summary of the key recommendations and insights.'),
  waterOptimization: z.string().describe('Specific recommendations for optimizing water usage and irrigation schedules.'),
  fertilizerOptimization: z.string().describe('Specific recommendations for optimizing fertilizer application based on soil type and crop needs.'),
  pestManagement: z.string().describe('Guidance on preventing and managing common pests and diseases, including preventive measures and treatment options.'),
  storagePlanning: z.string().describe('Advice on best practices for crop storage to minimize losses and maintain quality.'),
  salesStrategy: z.string().describe('Recommendations for developing an effective sales strategy, including market timing and pricing.'),
  profitEstimationTips: z.string().describe('Tips and considerations for estimating potential profits based on yield, costs, and market prices.'),
  actionItems: z.array(z.string()).describe('A list of actionable steps the farmer can take.'),
  disclaimer: z.string().describe('A disclaimer stating that this is AI-generated advice and should be reviewed by a human expert.'),
});
export type PersonalizedFarmingAdvisoryOutput = z.infer<typeof PersonalizedFarmingAdvisoryOutputSchema>;

export async function personalizedFarmingAdvisory(input: PersonalizedFarmingAdvisoryInput): Promise<PersonalizedFarmingAdvisoryOutput> {
  return personalizedFarmingAdvisoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFarmingAdvisoryPrompt',
  input: { schema: PersonalizedFarmingAdvisoryInputSchema },
  output: { schema: PersonalizedFarmingAdvisoryOutputSchema },
  prompt: `You are an expert agricultural consultant for YieldIQ, specializing in helping farmers optimize their practices using AI-driven insights.
Your task is to generate a personalized, easy-to-understand advisory report for a farmer based on the provided farm data and AI predictions.

The report should cover optimization strategies for water, fertilizer, and pest management, as well as planning for storage, sales, and profit estimation.
Ensure the advice is practical, actionable, and tailored to the farmer's specific context.

Farm Information:
Farm Name: {{{farmName}}}
Crop Type: {{{cropType}}}
Soil Type: {{{soilType}}}
Location: {{{location}}}
Planting Date: {{{plantingDate}}}
Current Growth Stage: {{{currentStage}}}
{{#if recentObservations}}
Recent Observations: {{{recentObservations}}}
{{/if}}

AI Predictions:
Predicted Yield: {{{predictedYield}}}
Predicted Water Needs: {{{predictedWaterNeeds}}}
Predicted Fertilizer Needs: {{{predictedFertilizerNeeds}}}
{{#if potentialPestsDiseases}}
Potential Pests/Diseases: {{{potentialPestsDiseases}}}
{{/if}}

Generate the advisory report in a structured JSON format as described in the output schema. Focus on clarity and actionable advice.
`,
});

const personalizedFarmingAdvisoryFlow = ai.defineFlow(
  {
    name: 'personalizedFarmingAdvisoryFlow',
    inputSchema: PersonalizedFarmingAdvisoryInputSchema,
    outputSchema: PersonalizedFarmingAdvisoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
