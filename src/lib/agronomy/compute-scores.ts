/**
 * @fileOverview Scientific agronomy models for YieldIQ.
 * Implements formulas from FAO Irrigation and Drainage Papers 29 and 56, and IS-10500:2012.
 */

export interface AgronomyInput {
  // From water report
  pH?: number;
  conductivity_uScm?: number;      // µS/cm
  tds?: number;                    // mg/L
  totalHardness?: number;          // mg/L as CaCO3
  calcium?: number;                // mg/L
  magnesium?: number;              // mg/L
  sodium?: number;                 // mg/L
  chloride?: number;               // mg/L
  sulphate?: number;               // mg/L
  fluoride?: number;               // mg/L
  totalAlkalinity?: number;        // mg/L as CaCO3
  nitrate?: number;                // mg/L

  // From farm profile
  soilType: string;               
  cropType: string;               
  growthStage: string;            
  irrigationMethod: string;       
  farmSizeHa?: number;
  previousSeasonYield?: number;   

  // From weather API
  eto_mmPerDay?: number;          
  dailyRainfall_mm?: number;      
  forecast7dayRain_mm?: number;   
  currentTempC?: number;
  maxTempC?: number;
  forecastMaxTemp7day?: number;   
}

export interface ComputedInsights {
  ecw_dSm: number;
  ece_dSm: number;
  sar: number;
  rsc: number;
  sodium_est_mgL: number;
  irrigationWaterQualityScore: number;
  sodiumHazardClass: 'S1' | 'S2' | 'S3' | 'S4';
  sodicityHazard: 'Safe' | 'Marginally Safe' | 'Doubtful' | 'Unsafe';
  chlorideToxicityRisk: 'None' | 'Low' | 'Moderate' | 'High';
  dripScalingRisk: 'Low' | 'Moderate' | 'High';
  salinityYieldPenaltyPercent: number;
  predictedYield: number;
  yieldChangePercent?: number;
  yieldConfidence: 'Low' | 'Medium' | 'High';
  etc_mmPerDay: number;
  waterNeedsLevel: 'Low' | 'Medium' | 'High';
  daysToNextIrrigation: number;
  recommendedIrrigationMethod: string;
  soilHealthScore: number;
  soilHealthLabel: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  primaryRisk: string;
  riskFactors: string[];
}

const MW = { Ca: 20.04, Mg: 12.15, Na: 23.0, K: 19.5, Cl: 35.45, SO4: 48.03, F: 19.0, HCO3: 61.0, CO3: 30.0, NO3: 62.0 };

const cropSalinityParams: Record<string, { threshold: number; slope: number }> = {
  wheat: { threshold: 6.0, slope: 7.1 },
  rice: { threshold: 3.0, slope: 12.0 },
  cotton: { threshold: 7.7, slope: 5.2 },
  soybean: { threshold: 5.0, slope: 20.0 },
  sugarcane: { threshold: 1.7, slope: 5.9 },
  groundnut: { threshold: 3.2, slope: 29.0 },
  onion: { threshold: 1.2, slope: 16.0 },
  tomato: { threshold: 2.5, slope: 9.9 },
  maize: { threshold: 1.7, slope: 12.0 },
  chickpea: { threshold: 3.0, slope: 14.0 },
  sorghum: { threshold: 4.0, slope: 9.0 },
  default: { threshold: 3.0, slope: 10.0 },
};

const basePotentialYield: Record<string, Record<string, number>> = {
  'black cotton': { wheat: 4.5, soybean: 2.2, cotton: 2.0, rice: 5.0, maize: 5.5, sorghum: 3.0, chickpea: 1.5, groundnut: 2.5, default: 3.0 },
  alluvial: { wheat: 5.5, rice: 6.0, soybean: 2.5, maize: 6.0, sugarcane: 70.0, default: 4.0 },
  'red laterite': { groundnut: 2.0, cotton: 1.5, sorghum: 2.5, default: 2.0 },
  'sandy loam': { wheat: 3.5, maize: 4.5, groundnut: 1.8, default: 2.5 },
  'saline alkaline': { default: 1.5 },
};

const cropKc: Record<string, Record<string, number>> = {
  soybean: { initial: 0.40, development: 0.80, mid: 1.15, late: 0.50 },
  wheat: { initial: 0.30, development: 0.70, mid: 1.15, late: 0.40 },
  cotton: { initial: 0.35, development: 0.70, mid: 1.20, late: 0.60 },
  rice: { initial: 1.05, development: 1.15, mid: 1.20, late: 0.90 },
  maize: { initial: 0.30, development: 0.70, mid: 1.20, late: 0.60 },
  chickpea: { initial: 0.40, development: 0.70, mid: 1.00, late: 0.35 },
  groundnut: { initial: 0.40, development: 0.70, mid: 1.10, late: 0.60 },
  sorghum: { initial: 0.30, development: 0.65, mid: 1.00, late: 0.55 },
  sugarcane: { initial: 0.40, development: 0.70, mid: 1.25, late: 0.75 },
  tomato: { initial: 0.60, development: 0.75, mid: 1.15, late: 0.80 },
  onion: { initial: 0.50, development: 0.70, mid: 1.05, late: 0.75 },
  default: { initial: 0.40, development: 0.70, mid: 1.10, late: 0.60 },
};

const cropRootDepthM: Record<string, number> = {
  soybean: 0.6, wheat: 1.0, cotton: 1.2, rice: 0.3, maize: 0.9,
  chickpea: 0.7, groundnut: 0.5, sorghum: 0.9, sugarcane: 1.5,
  tomato: 0.5, onion: 0.4, default: 0.7,
};

function toMeq(mg_L: number, molarMass: number): number {
  return mg_L / molarMass;
}

export function computeAgronomyScores(input: AgronomyInput): ComputedInsights {
  const ecw = input.conductivity_uScm ? input.conductivity_uScm / 1000 : (input.tds ? input.tds / 640 : 0.5);
  const ece = ecw * 1.5;

  const Ca_meq = toMeq(input.calcium ?? 10, MW.Ca);
  const Mg_meq = toMeq(input.magnesium ?? 5, MW.Mg);
  
  // Estimate Sodium from charge balance if missing
  let Na_mg = input.sodium;
  if (Na_mg == null) {
    const alk_meq = (input.totalAlkalinity ?? 0) / 50;
    const Cl_meq = toMeq(input.chloride ?? 0, MW.Cl);
    const SO4_meq = toMeq(input.sulphate ?? 0, MW.SO4);
    const totalAnions = alk_meq + Cl_meq + SO4_meq;
    const Na_meq = Math.max(0, totalAnions - Ca_meq - Mg_meq);
    Na_mg = Na_meq * MW.Na;
  }
  const Na_meq = Na_mg / MW.Na;

  const sar = Na_meq / Math.sqrt((Ca_meq + Mg_meq) / 2);
  
  const pH = input.pH ?? 7.0;
  const CO3_meq = pH > 8.3 ? ((input.totalAlkalinity ?? 0) / 100) : 0;
  const HCO3_meq = (input.totalAlkalinity ?? 0) / 50 - CO3_meq;
  const rsc = (CO3_meq + HCO3_meq) - (Ca_meq + Mg_meq);

  // Yield penalty
  const cropKey = input.cropType.toLowerCase().replace(/\s+/g, '');
  const salParams = cropSalinityParams[cropKey] || cropSalinityParams.default;
  const salinityPenalty = ece <= salParams.threshold ? 0 : Math.min(100, salParams.slope * (ece - salParams.threshold));

  // Irrigation water quality score (0-10)
  let wqScore = 0;
  const ecScore = ecw <= 0.25 ? 10 : (ecw <= 0.75 ? 9 : (ecw <= 2.25 ? 7 : (ecw <= 4 ? 4 : 1)));
  const sarScore = sar < 10 ? 10 : (sar < 18 ? 7 : (sar < 26 ? 4 : 1));
  const rscScore = rsc < 0 ? 10 : (rsc < 1.25 ? 8 : (rsc < 2.5 ? 5 : 1));
  const phScore = (pH >= 6.5 && pH <= 7.5) ? 10 : ((pH > 7.5 && pH <= 8.5) ? 7 : 4);
  wqScore = (ecScore * 0.3) + (sarScore * 0.25) + (rscScore * 0.25) + (phScore * 0.2);

  // Soil Health
  let soilScore = basePotentialYield[input.soilType.toLowerCase()] ? 9 : 7;
  if (Ca_meq / Mg_meq < 3) soilScore -= 0.5;
  if (rsc > 0) soilScore -= Math.min(3, rsc * 1.5);
  if (ece > 2) soilScore -= Math.min(4, (ece - 2) * 1.5);
  soilScore = Math.max(0, Math.min(10, soilScore));

  // Yield Prediction
  const baseYield = basePotentialYield[input.soilType.toLowerCase()]?.[cropKey] || 3.0;
  const salinityMod = (100 - salinityPenalty) / 100;
  const wqMod = 0.8 + (wqScore / 10) * 0.2;
  
  let weatherMod = 1.0;
  if (input.maxTempC && input.maxTempC > 35) weatherMod *= 0.9;
  if (input.forecastMaxTemp7day && input.forecastMaxTemp7day > 38) weatherMod *= 0.88;
  
  const stageMod = input.growthStage === 'initial' ? 0.6 : (input.growthStage === 'mid' ? 0.85 : 0.95);
  const irrMod = input.irrigationMethod === 'drip' ? 1.0 : (input.irrigationMethod === 'rainfed' ? 0.85 : 0.92);
  
  const predictedYield = baseYield * salinityMod * wqMod * weatherMod * stageMod * irrMod;

  // Water Needs
  const kcData = cropKc[cropKey] || cropKc.default;
  const kc = kcData[input.growthStage] || kcData.mid;
  const etc = (input.eto_mmPerDay ?? 5.0) * kc;
  const nir = Math.max(0, etc - (input.dailyRainfall_mm ?? 0) * 0.8);
  
  const rootDepth = cropRootDepthM[cropKey] || 0.7;
  const availableWater = 200 * rootDepth;
  const daysToNext = Math.min(14, Math.floor((availableWater * 0.5) / Math.max(nir, 0.1)));

  // Risk Assessment
  const riskFactors = [];
  if (ecw > 1.5) riskFactors.push("High salinity detected in source water");
  if (input.forecastMaxTemp7day && input.forecastMaxTemp7day > 40) riskFactors.push("Extreme heat wave forecast");
  if (sar > 9) riskFactors.push("Sodium hazard detected (SAR > 9)");
  if (nir > 6) riskFactors.push("High crop water demand due to heat");

  const riskLevel = riskFactors.length > 2 ? 'High' : (riskFactors.length > 0 ? 'Moderate' : 'Low');

  return {
    ecw_dSm: ecw,
    ece_dSm: ece,
    sar,
    rsc,
    sodium_est_mgL: Na_mg,
    irrigationWaterQualityScore: wqScore,
    sodiumHazardClass: sar < 10 ? 'S1' : (sar < 18 ? 'S2' : (sar < 26 ? 'S3' : 'S4')),
    sodicityHazard: rsc < 0 ? 'Safe' : (rsc < 1.25 ? 'Marginally Safe' : (rsc < 2.5 ? 'Doubtful' : 'Unsafe')),
    chlorideToxicityRisk: (input.chloride ?? 0) < 140 ? 'None' : ((input.chloride ?? 0) < 350 ? 'Low' : 'High'),
    dripScalingRisk: (input.totalHardness ?? 0) > 300 ? 'High' : ((input.totalHardness ?? 0) > 150 ? 'Moderate' : 'Low'),
    salinityYieldPenaltyPercent: salinityPenalty,
    predictedYield: Number(predictedYield.toFixed(1)),
    yieldChangePercent: input.previousSeasonYield ? Math.round(((predictedYield - input.previousSeasonYield) / input.previousSeasonYield) * 100) : undefined,
    yieldConfidence: input.conductivity_uScm ? 'High' : 'Medium',
    etc_mmPerDay: Number(etc.toFixed(2)),
    waterNeedsLevel: nir < 3 ? 'Low' : (nir < 6 ? 'Medium' : 'High'),
    daysToNextIrrigation: daysToNext,
    recommendedIrrigationMethod: input.irrigationMethod === 'flood' ? 'Drip Irrigation recommended for salt management' : input.irrigationMethod,
    soilHealthScore: Number(soilScore.toFixed(1)),
    soilHealthLabel: soilScore > 8 ? 'Excellent' : (soilScore > 6 ? 'Good' : 'Fair'),
    riskLevel,
    primaryRisk: riskFactors[0] || "No major risks detected",
    riskFactors
  };
}
