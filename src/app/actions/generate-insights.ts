/**
 * @fileOverview Orchestration action for the full YieldIQ scientific pipeline.
 */
'use server';

import { parseWaterReport } from '@/ai/flows/parse-water-report-flow';
import { computeAgronomyScores } from '@/lib/agronomy/compute-scores';
import { personalizedFarmingAdvisory } from '@/ai/flows/personalized-farming-advisory-flow';
import { getWeatherData } from '@/lib/weather';

export async function generateInsights(userId: string, farm?: any, plotReports?: (string | null)[]) {
  // Use provided farm data or fallback to a default mock with multiple plots
  const activeFarm = farm || {
    name: 'Patil Farm',
    location: { lat: 30.2110, lng: 74.9455 },
    totalAreaHectares: 10,
    plots: [
      { plotName: "Plot 1 (North)", cropType: "wheat", size: 6, growthStage: "mid", plantingDate: "2026-11-15", soilType: "black cotton", variety: "PBW 343" },
      { plotName: "Plot 2 (South)", cropType: "mustard", size: 4, growthStage: "vegetative", plantingDate: "2026-12-01", soilType: "alluvial", variety: "Pusa Bold" }
    ],
    irrigationMethod: 'drip'
  };

  // 1. Process Multi-Plot Reports
  const plots = activeFarm.plots || [];
  const parsedReports = await Promise.all(plots.map(async (plot: any, idx: number) => {
    const reportData = plotReports?.[idx];
    if (reportData) {
      return await parseWaterReport({ photoDataUri: reportData });
    }
    // FALLBACK: Use already parsed reports if available in the farm profile
    return activeFarm.parsedReports?.[idx] || activeFarm.waterReport || null;
  }));

  // 2. Fetch weather using real farm coordinates
  const lat = activeFarm.location?.lat || 30.2110; 
  const lng = activeFarm.location?.lng || 74.9455;
  const weather = await getWeatherData(lat, lng);

  // 3. Compute scores for ALL plots with their UNIQUE reports
  const computedPlots = plots.map((plot: any, idx: number) => {
    const report = parsedReports[idx];
    return computeAgronomyScores({
      ...report, // Extract pH, tds, etc from plot-specific report
      soilType: plot.soilType || activeFarm.soilType || 'black cotton',
      cropType: plot.cropType || activeFarm.cropType || 'wheat',
      growthStage: plot.growthStage || activeFarm.growthStage || 'mid',
      plantingDate: plot.plantingDate || activeFarm.plantingDate,
      variety: plot.variety,
      irrigationMethod: activeFarm.irrigationMethod || 'drip',
      previousSeasonYield: plot.previousSeasonYield,
      eto_mmPerDay: weather?.eto,
      dailyRainfall_mm: weather?.currentRainfall,
      forecast7dayRain_mm: weather?.forecast7dayRain,
      currentTempC: weather?.currentTemp,
      forecastMaxTemp7day: weather?.forecastMaxTemp,
    });
  });

  // Summary computed (e.g. for overall farm dashboard stats)
  const mainComputed = computedPlots[0] || computeAgronomyScores({
    soilType: activeFarm.soilType || 'black cotton',
    cropType: activeFarm.cropType || 'wheat',
    growthStage: activeFarm.growthStage || 'mid',
    irrigationMethod: activeFarm.irrigationMethod || 'drip',
    eto_mmPerDay: weather?.eto,
  });

  // 4. Generate AI advisory with full per-plot data
  const advisory = await personalizedFarmingAdvisory({
    farm: activeFarm,
    computed: mainComputed,
    computedPlots,
    weather,
    waterReport: parsedReports[0], // Historic compatibility for overall report
    waterReports: parsedReports,   // Added for per-plot advisory
    preferredLanguage: activeFarm.preferredLanguage || 'en'
  });

  return { computed: mainComputed, advisory, computedPlots, parsedReports };
}
