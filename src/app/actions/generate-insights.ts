/**
 * @fileOverview Orchestration action for the full YieldIQ scientific pipeline.
 */
'use server';

import { parseWaterReport } from '@/ai/flows/parse-water-report-flow';
import { computeAgronomyScores } from '@/lib/agronomy/compute-scores';
import { personalizedFarmingAdvisory } from '@/ai/flows/personalized-farming-advisory-flow';
import { getWeatherData } from '@/lib/weather';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function generateInsights(userId: string, photoDataUri?: string) {
  const { firestore } = initializeFirebase();
  
  // 1. Fetch farm profile
  const farmRef = doc(firestore, `users/${userId}/farms/primary`);
  const farmSnap = await getDoc(farmRef);
  const farm = farmSnap.data();

  if (!farm) throw new Error("Farm profile not found.");

  // 2. Parse Report if provided
  let waterReport = farm.waterReport;
  if (photoDataUri) {
    waterReport = await parseWaterReport({ photoDataUri });
    await updateDoc(farmRef, {
      waterReport,
      waterReportUploadDate: new Date().toISOString(),
    });
  }

  // 3. Fetch weather
  // Mock lat/lng based on location string if not available, or use Bathinda coordinates for demo
  const lat = 30.2110; 
  const lng = 74.9455;
  const weather = await getWeatherData(lat, lng);

  // 4. Compute agronomy scores (deterministic)
  const computed = computeAgronomyScores({
    ...waterReport,
    soilType: farm.soilType || 'black cotton',
    cropType: farm.cropType || 'wheat',
    growthStage: farm.growthStage || 'mid',
    irrigationMethod: farm.irrigationMethod || 'flood',
    previousSeasonYield: farm.previousSeasonYield,
    eto_mmPerDay: weather?.eto,
    dailyRainfall_mm: weather?.currentRainfall,
    forecast7dayRain_mm: weather?.forecast7dayRain,
    currentTempC: weather?.currentTemp,
    forecastMaxTemp7day: weather?.forecastMaxTemp,
  });

  // 5. Generate AI advisory
  const advisory = await personalizedFarmingAdvisory({
    farm,
    computed,
    weather,
    waterReport,
    preferredLanguage: farm.preferredLanguage || 'en'
  });

  // 6. Save results
  await updateDoc(farmRef, {
    lastComputedInsights: computed,
    lastInsightsComputedAt: new Date().toISOString(),
    latestAdvisory: advisory
  });

  const reportId = `report_${Date.now()}`;
  const reportRef = doc(firestore, `users/${userId}/advisory_reports`, reportId);
  await setDoc(reportRef, {
    createdAt: serverTimestamp(),
    advisory,
    computed,
    farmSnapshot: farm,
  });

  return { computed, advisory };
}
