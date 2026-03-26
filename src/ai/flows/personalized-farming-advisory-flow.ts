'use server';
/**
 * @fileOverview Advanced Genkit flow for generating scientifically-backed farming advisory.
 * 
 * - personalizedFarmingAdvisory - Server action to generate the advisory report.
 * - AdvisoryOutput - The output type for the advisory.
 * - AdvisoryInput - The input type for the advisory flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdvisoryOutputSchema = z.object({
  predictedYieldSummary: z.object({
    display: z.string(),
    changeText: z.string().optional(),
    subtitle: z.string(),
  }),
  waterNeedsSummary: z.object({
    level: z.enum(['Low', 'Medium', 'High']),
    nextIrrigationText: z.string(),
    subtitle: z.string(),
  }),
  soilHealthSummary: z.object({
    score: z.number(),
    label: z.string(),
    subtitle: z.string(),
  }),
  riskSummary: z.object({
    level: z.enum(['Low', 'Moderate', 'High', 'Critical']),
    primaryRisk: z.string(),
    subtitle: z.string(),
  }),
  waterQualityScore: z.object({
    score: z.number(),
    label: z.string(),
    subtitle: z.string(),
  }),
  smartTasks: z.array(z.object({
    title: z.string(),
    priority: z.enum(['High', 'Medium', 'Low', 'Observation']),
    category: z.enum(['Fertilizer', 'Irrigation', 'Pest', 'Harvest', 'Soil', 'Water Quality']),
    dueInDays: z.number(),
    rationale: z.string(),
  })),
  detailedReport: z.object({
    waterQualityAnalysis: z.string(),
    irrigationRecommendations: z.string(),
    fertilizerRecommendations: z.string(),
    soilManagementTips: z.string(),
    yieldOptimizationTips: z.array(z.string()),
    seasonalAlerts: z.string().optional(),
  }),
  language: z.string(),
  disclaimer: z.string().default('YieldIQ provides data-driven suggestions based on IS-10500 standards. Always consult a local agricultural extension officer for critical decisions.'),
});

export type AdvisoryOutput = z.infer<typeof AdvisoryOutputSchema>;
export type PersonalizedFarmingAdvisoryOutput = AdvisoryOutput;

const AdvisoryInputSchema = z.object({
  farm: z.any(),
  computed: z.any(),
  weather: z.any(),
  waterReport: z.any().optional(),
  preferredLanguage: z.string().default('en'),
});

export type AdvisoryInput = z.infer<typeof AdvisoryInputSchema>;

const farmingAdvisoryFlow = ai.defineFlow(
  {
    name: 'farmingAdvisoryFlow',
    inputSchema: AdvisoryInputSchema,
    outputSchema: AdvisoryOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      output: { schema: AdvisoryOutputSchema },
      prompt: `You are YieldIQ's precision agriculture advisor. INTERPRET these scientific scores for a farmer.
      
      FARM CONTEXT:
      - Crop: ${input.farm.cropType} | Stage: ${input.farm.growthStage}
      - Soil: ${input.farm.soilType} | Irrigation: ${input.farm.irrigationMethod}
      
      COMPUTED SCORES:
      - Water Quality: ${input.computed.irrigationWaterQualityScore}/10 (SAR: ${input.computed.sar}, RSC: ${input.computed.rsc})
      - Salinity Penalty: ${input.computed.salinityYieldPenaltyPercent}%
      - Yield Forecast: ${input.computed.predictedYield} T/ha
      - Water Demand (ETc): ${input.computed.etc_mmPerDay} mm/day
      - Days to Next Irrigation: ${input.computed.daysToNextIrrigation}
      
      WEATHER:
      - Current: ${input.weather?.currentTemp}°C | 7-day Max: ${input.weather?.forecastMaxTemp}°C
      
      TASK:
      1. Translate these numbers into actionable advice. 
      2. If Ca:Mg ratio or SAR is problematic, suggest specific amendments like gypsum.
      3. If heat wave is coming, suggest early morning irrigation.
      4. Support ${input.preferredLanguage}. If local language, keep technical terms bilingual.`
    });

    if (!output) throw new Error("Failed to generate advisory.");
    return output!;
  }
);

/**
 * Server action wrapper for the farming advisory flow.
 */
export async function personalizedFarmingAdvisory(input: AdvisoryInput): Promise<AdvisoryOutput> {
  return farmingAdvisoryFlow(input);
}
