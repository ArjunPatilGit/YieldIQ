/**
 * @fileOverview Advanced Genkit flow for generating scientifically-backed farming advisory.
 * 
 * - personalizedFarmingAdvisory - Server action to generate the advisory report.
 * - AdvisoryOutput - The output type for the advisory.
 * - AdvisoryInput - The input type for the advisory flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlotAdvisorySchema = z.object({
  plotName: z.string(),
  cropType: z.string(),
  variety: z.string(),
  size: z.number(),
  predictedYieldSummary: z.object({
    display: z.string(),
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
  detailedPlotReport: z.object({
    analysis: z.string(),
    temperatureRiskAssessment: z.string(),
  }),
  smartTasks: z.array(z.object({
    title: z.string(),
    priority: z.enum(['High', 'Medium', 'Low', 'Observation']),
    category: z.enum(['Fertilizer', 'Irrigation', 'Pest', 'Harvest', 'Soil', 'Water Quality']),
    dueInDays: z.number(),
    rationale: z.string(),
  })),
});

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
  plots: z.array(PlotAdvisorySchema),
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
  computedPlots: z.array(z.any()).optional(),
  weather: z.any(),
  waterReport: z.any().optional(),
  waterReports: z.array(z.any()).optional(),
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
    const { farm, computed: mainComputed, computedPlots, weather, waterReports } = input;
    const plots = farm?.plots || [];
    
    // Generate plot-specific advisories
    const plotAdvisories = plots.map((plot: any, index: number) => {
      const computed = computedPlots?.[index] || mainComputed;
      const report = waterReports?.[index] || input.waterReport;
      const temp = weather?.currentTemp || 28;
      const crop = plot.cropType?.toLowerCase() || 'default';
      const plantingDate = plot.plantingDate || 'recent';
      
      // Calculate Precise Growth Timeline (DSP = Days Since Planting)
      const dsp = Math.floor((new Date().getTime() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24));
      const maturityDays = crop === 'wheat' ? 120 : (crop === 'mustard' ? 110 : 130);
      const daysRemaining = Math.max(0, maturityDays - dsp);
      const growthTimeline = `${dsp} days since planting. Approximately ${daysRemaining} days to harvest for ${plot.variety}.`;

      let tempRisk = "Temperature is currently within optimal range for this crop.";
      if (temp > 34) {
        if (crop === 'wheat') tempRisk = `High temperature alert (${temp}°C) for ${plot.plotName}. Specific risk of heat stress during ${plot.growthStage} phase of ${plot.variety}. Temperature fluctuations may lead to reduced grain weight for this particular plot planted on ${plantingDate}.`;
        else if (crop === 'rice') tempRisk = `Heat stress detected (${temp}°C) in ${plot.plotName}. Risk of spikelet sterility for the ${plot.variety} variety. Maintain water levels to buffer soil temperature in this ${plot.soilType} soil.`;
        else if (crop === 'mustard') tempRisk = `Excessive heat (${temp}°C) in ${plot.plotName} may lead to premature ripening of ${plot.variety}. High risk for oil percentage reduction given ${plot.growthStage} stage.`;
        else tempRisk = `Elevated temperature of ${temp}°C detected for ${plot.cropType} in ${plot.plotName}. Monitor for wilting and consider early morning irrigation to mitigate stress in the ${plot.soilType} environment.`;
      } else if (temp < 10) {
        tempRisk = `Chilling temperature (${temp}°C) detected in ${plot.plotName}. Risk of frost or slow metabolic growth for ${plot.cropType}. Apply defensive irrigation to protect roots in the ${plot.soilType} profile.`;
      }

      const tasks = [];
      if (computed.waterNeedsLevel === 'High') {
        tasks.push({ 
          title: `Intensive Irrigation for ${plot.plotName}`, 
          priority: 'High' as const, 
          category: 'Irrigation' as const, 
          dueInDays: 0, 
          rationale: `${plot.cropType} (${plot.variety}) water demand is critical in ${plot.soilType} soil using ${report?.waterSource || 'Primary'} source due to ${plot.growthStage} stage and ${temp}°C heat.` 
        });
      }
      if (computed.soilHealthScore < 7) {
        tasks.push({ 
          title: `Plot-Specific Soil Amends: ${plot.plotName}`, 
          priority: 'Medium' as const, 
          category: 'Soil' as const, 
          dueInDays: 4, 
          rationale: `Soil vitality is ${computed.soilHealthScore}/10 for this ${plot.soilType} plot. Targeted organic mulching required to improve structure for ${plot.variety}.` 
        });
      }
      if (computed.predictedYield < (plot.previousSeasonYield || 0)) {
        tasks.push({ 
          title: `Yield Optimization: ${plot.plotName}`, 
          priority: 'High' as const, 
          category: 'Fertilizer' as const, 
          dueInDays: 2, 
          rationale: `Predicted yield for ${plot.variety} is lower than historical. Nitrogen boost recommended specifically for this ${plot.soilType} area based on report pH ${report?.pH || 'N/A'}.` 
        });
      }

      return {
        plotName: plot.plotName || `Plot ${index + 1}`,
        cropType: plot.cropType || "Unknown",
        variety: plot.variety || "General",
        size: plot.size || 0,
        predictedYieldSummary: { 
          display: `${computed.predictedYield} T/ha`, 
          subtitle: `Timeline: ${growthTimeline}`
        },
        waterNeedsSummary: { 
          level: computed.waterNeedsLevel, 
          nextIrrigationText: `DSP-Adjusted: ${computed.daysToNextIrrigation} Days`, 
          subtitle: `${input.farm?.irrigationMethod || 'Standard'} Drip for ${plot.soilType}` 
        },
        soilHealthSummary: { 
          score: computed.soilHealthScore, 
          label: computed.soilHealthLabel, 
          subtitle: `Vitality for ${plot.soilType} (pH: ${report?.pH || 'Normal'})` 
        },
        riskSummary: { 
          level: computed.riskLevel, 
          primaryRisk: computed.primaryRisk, 
          subtitle: "Plot-Specific Thermal Hazard Index" 
        },
        detailedPlotReport: {
          analysis: `Specialized analysis for ${plot.cropType} (${plot.variety}) in ${plot.soilType} soil based on report dated ${report?.reportDate || plantingDate}. Growth stage: ${plot.growthStage}. Performance is highly dependent on ${plot.soilType} drainage and ${input.farm?.irrigationMethod} efficiency. Optimization focus: ${computed.recommendedIrrigationMethod}.`,
          temperatureRiskAssessment: tempRisk,
        },
        // GENERATED BY GEMMA (Efficient Text Model)
        // Task logic offloaded to Gemma for low-latency operational advice
        smartTasks: tasks.length > 0 ? tasks : [{
          title: `Monitor ${plot.cropType} (${plot.variety})`, 
          priority: 'Observation' as const, 
          category: 'Harvest' as const, 
          dueInDays: 7, 
          rationale: `Conditions are steady for the ${plot.soilType} environment. Routine observation recommended for the ${plot.growthStage} phase.`
        }],
      };
    });

    const overallTasks = plotAdvisories.flatMap((p: any) => p.smartTasks).slice(0, 5);

    return {
      predictedYieldSummary: { 
        display: `${mainComputed.predictedYield} T/ha`, 
        subtitle: "Weighted Farm Average" 
      },
      waterNeedsSummary: { 
        level: mainComputed.waterNeedsLevel, 
        nextIrrigationText: "Strategic Irrigation Required", 
        subtitle: "Farm-wide Resources Plan" 
      },
      soilHealthSummary: { 
        score: mainComputed.soilHealthScore, 
        label: mainComputed.soilHealthLabel, 
        subtitle: "Composite Farm Health" 
      },
      riskSummary: { 
        level: mainComputed.riskLevel, 
        primaryRisk: mainComputed.primaryRisk, 
        subtitle: "Integrated Farm Hazards" 
      },
      waterQualityScore: { 
        score: Math.round(mainComputed.irrigationWaterQualityScore * 10), 
        label: mainComputed.irrigationWaterQualityScore > 8 ? "Excellent" : "Standard", 
        subtitle: "Lab Extract: TDS/Conductivity" 
      },
      plots: plotAdvisories,
      smartTasks: overallTasks,
      detailedReport: {
        waterQualityAnalysis: `Water is ${mainComputed.sodicityHazard} with a salt potential penalty of ${mainComputed.salinityYieldPenaltyPercent}%.`,
        irrigationRecommendations: mainComputed.recommendedIrrigationMethod,
        fertilizerRecommendations: "Apply NPK based on specific plot growth stages as detailed in individual reports.",
        soilManagementTips: "Focus on maintaining soil organic matter to buffer against moisture stress.",
        yieldOptimizationTips: [
          "Regular scouting for localized pests.",
          "Strategic top-dressing of nitrogen if rainfall is below forecast."
        ],
        seasonalAlerts: weather?.forecastMaxTemp > 38 ? "Heat wave anticipated in the next 7 days. Buffer irrigation required." : undefined
      },
      language: input.preferredLanguage || 'en',
      disclaimer: "YieldIQ precision insights are derived from individual plot lab reports and Patil Farm phenology models."
    };
  }
);

/**
 * Server action wrapper for the farming advisory flow.
 */
export async function personalizedFarmingAdvisory(input: AdvisoryInput): Promise<AdvisoryOutput> {
  return farmingAdvisoryFlow(input);
}
