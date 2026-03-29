# YieldIQ — Firebase AI Implementation Prompt
## "What Can Be Scientifically Derived From a Lab Report + Farm Profile"

---

## CONTEXT: READ THIS FIRST

You are helping build **YieldIQ**, an AI-powered agricultural intelligence platform. The existing codebase uses Next.js 15, Firebase/Firestore, and Google Genkit 1.x with Gemini 2.5 Flash. The existing project already has:
- Authentication (email + Google OAuth)
- Farm Profile page (collects: farm name, location, soil type, crop type, planting date, growth stage, farm size)
- Dashboard with cards: Predicted Yield, Water Needs, Soil Health, Risk Level
- AI Advisory flow (basic)
- AI Chat Assistant (multilingual)
- Firestore schema at `/users/{userId}/farms/primary`

The objective is to make the dashboard fields **scientifically derived** from real inputs — specifically a water/soil lab report PDF that the farmer uploads — combined with their farm profile and live weather data. We need to show a compelling, realistic demo at a hackathon in 1 day.

The core insight: **Most Indian farmers already have water/soil lab reports from government district labs (IS-10500 format). YieldIQ parses these PDFs through Gemini, runs established agronomy algorithms, and produces the same precision intelligence that expensive IoT sensor platforms offer — without any hardware.**

---

## PART 1: THE SCIENCE — WHAT IS ACTUALLY DERIVABLE

This section explains the real agricultural science behind each dashboard field. Firebase AI must implement these as Genkit flows or server-side functions — **no hardcoded values**.

### 1.1 From the Water Quality Report (IS-10500 Format)

A standard Indian district lab water report gives these parameters. Here is what each one enables us to compute:

**ELECTRICAL CONDUCTIVITY (EC, in µS/cm or dS/m)**
- EC ÷ 1000 = ECw (dS/m), the standard irrigation water salinity unit
- ECe (estimated soil salinity after irrigation) = ECw × 1.5 (at ~20% leaching fraction, appropriate for black cotton/Vertisol soil)
- This feeds directly into the **Maas-Hoffman Yield Reduction Model**:
  - If ECe < threshold for the crop → 0% yield reduction
  - If ECe ≥ threshold → Yr = 100 - b × (ECe - threshold)
  - Thresholds (ECe in dS/m) and slopes (b, % per dS/m) by crop:
    - Wheat: threshold 6.0, slope 7.1
    - Rice: threshold 3.0, slope 12.0
    - Cotton: threshold 7.7, slope 5.2
    - Soybean: threshold 5.0, slope 20.0
    - Sugarcane: threshold 1.7, slope 5.9
    - Groundnut: threshold 3.2, slope 29.0
    - Onion: threshold 1.2, slope 16.0
    - Tomato: threshold 2.5, slope 9.9
    - Maize: threshold 1.7, slope 12.0
    - Chickpea: threshold 3.0, slope 14.0
  - Store as a lookup table keyed by cropType string from farm profile.
  - Output: `salinityYieldPenaltyPercent` (0 means no reduction)

**CALCIUM (Ca²⁺, mg/L) and MAGNESIUM (Mg²⁺, mg/L)**
- Convert to meq/L: Ca_meq = Ca_mgL / 20.04; Mg_meq = Mg_mgL / 12.15
- Ca:Mg ratio in meq/L. Ideal for black cotton (Vertisol) soil is ≥ 5:1 (Ca:Mg).
- Ratio below 3:1 → long-term Mg accumulation in Vertisol → soil structure degradation risk
- This affects: `soilHealthScore`, `fertilizer recommendations` (gypsum/calcium supplement advice)

**SODIUM (Na, mg/L) — often not measured, must be estimated**
- Estimate Na from charge balance:
  - Sum anions (meq/L): HCO₃⁻ (from alkalinity) + Cl⁻ + SO₄²⁻ + F⁻ + (NO₃⁻ if measured)
    - HCO₃⁻_meq = (totalAlkalinity_mgL / 50) (since alkalinity expressed as CaCO₃, 1 meq = 50 mg/L CaCO₃)
    - Cl_meq = Cl_mgL / 35.45
    - SO₄_meq = SO4_mgL / 48.03
    - F_meq = F_mgL / 19.0
  - Sum measured cations (meq/L): Ca_meq + Mg_meq
  - Estimated Na_meq = totalAnions_meq - measuredCations_meq (charge balance)
  - Na_mgL = Na_meq × 23

**SAR (Sodium Adsorption Ratio)**
- SAR = Na_meq / √((Ca_meq + Mg_meq) / 2)
- Classification: SAR < 10 → S1 (safe); 10-18 → S2 (medium); 18-26 → S3 (high); > 26 → S4 (very high)
- For Vertisol soils (smectite clay), SAR > 6-9 begins to cause permeability problems
- Output: `sodiumHazardClass`, `soilPermeabilityRisk`

**RSC (Residual Sodium Carbonate)**
- RSC = (CO₃_meq + HCO₃_meq) - (Ca_meq + Mg_meq)
- Note: CO₃²⁻ only present if pH > 8.3; for pH ≤ 8.3, CO₃ = 0
- RSC < 0 → safe (no sodicity risk)
- RSC 0–1.25 → marginally safe
- RSC 1.25–2.5 → doubtful
- RSC > 2.5 → not suitable for irrigation
- Output: `sodicityhazard` label

**CHLORIDE (Cl⁻, mg/L)**
- Cl_meq = Cl_mgL / 35.45
- Sensitive crops (citrus, grapes, stone fruit): leaf injury at Cl > 4 meq/L
- Field crops (wheat, soybean, cotton, rice): tolerant up to 10+ meq/L
- Output: `chlorideToxicityRisk` per crop type

**TOTAL HARDNESS (as CaCO₃, mg/L)**
- < 75: soft; 75-150: moderately hard; 150-300: hard; > 300: very hard
- Hard water (> 150 mg/L) causes scaling in drip irrigation emitters
- Output: `dripScalingRisk` → if using drip irrigation, recommend acid flushing schedule

**pH**
- Optimal irrigation water pH: 6.5–8.5 (IS-10500)
- pH affects nutrient availability in soil. For Vertisol (typically alkaline):
  - pH 7.0–7.5: optimal availability of N, P, K, Ca, Mg, S
  - pH 7.5–8.0: slight reduction in P, Fe, Mn, Zn, Cu, B availability → may need micronutrient supplements
  - pH > 8.0: significant micronutrient lockout
- Output: `pHNutrientEffect` string + `micronutrientSupplementNeeded` boolean

**FLUORIDE (mg/L)**
- IS-10500 limit: 1.0 mg/L (acceptable), 1.5 mg/L (permissible without alternative)
- For crops: < 1 mg/L generally safe; long-term > 2 mg/L can cause fluoride accumulation in leafy crops
- Output: `fluorideRisk`

**TDS (mg/L)**
- TDS / 640 ≈ EC in dS/m (rough conversion, use actual EC if available)
- TDS 500-1000: usable with management; > 2000: not suitable
- Output: used in water quality composite score

**TOTAL ALKALINITY (as CaCO₃, mg/L)**
- Used to compute HCO₃⁻ and RSC (above)
- High alkalinity (> 400) + high Ca → calcium carbonate scale in irrigation pipes
- Output: `pipeScalingRisk`

### 1.2 Computed Composite Scores

**IRRIGATION WATER QUALITY SCORE (0–10)**
Compute as weighted average:
- EC class score: C1(≤0.25 dS/m)=10, C2(0.25-0.75)=9, C3(0.75-2.25)=7, C4(2.25-4.0)=4, C5(>4.0)=1 → weight 30%
- SAR class: S1(<10)=10, S2(10-18)=7, S3(18-26)=4, S4(>26)=1 → weight 25%
- RSC: <0=10, 0-1.25=8, 1.25-2.5=5, >2.5=1 → weight 20%
- pH: 6.5-7.5=10, 7.5-8.0=8, 6.0-6.5=7, 8.0-8.5=5, outside=2 → weight 15%
- Chloride class vs crop tolerance → weight 10%

**SOIL HEALTH SCORE (0–10)** from water interaction with soil type
- Base for soil type: Vertisol=9, Alluvial=8.5, Red Laterite=7, Sandy=6, Saline-Alkaline=4
- Deduction for Ca:Mg ratio < 3:1 (long-term Mg excess risk): -0.5
- Deduction for RSC > 0 (sodicity building): -1 per 0.5 meq/L above 0
- Deduction for ECe > 2 dS/m: -1 per dS/m
- Deduction for pH > 8.0: -0.5 (micronutrient lockout risk)
- Clamp to [0, 10]

### 1.3 Yield Prediction Model (Multi-Factor)

**BASE POTENTIAL YIELD by soil type and crop (tons/ha, from India agronomy data):**
This is the attainable yield under optimal management. Store as a lookup:
```
Vertisol (Black Cotton): wheat=4.5, soybean=2.2, cotton=2.0(seed cotton), rice=5.0, maize=5.5, sorghum=3.0, chickpea=1.5, groundnut=2.5
Alluvial: wheat=5.5, rice=6.0, soybean=2.5, maize=6.0, sugarcane=70.0
Red Laterite: groundnut=2.0, cotton=1.5, sorghum=2.5
Sandy Loam: wheat=3.5, maize=4.5, groundnut=1.8
```

**MODIFIERS (each multiplied together, all between 0.5 and 1.0 unless noted):**

1. `salinityModifier` = (100 - salinityYieldPenaltyPercent) / 100
2. `waterQualityModifier` = 0.8 + (waterQualityScore / 10) × 0.2  (range 0.8 to 1.0)
3. `weatherModifier` (from weather API):
   - If heat days (Tmax > 35°C) in past 14 days > 7: multiply 0.85
   - If rainfall deficit vs ETc > 30mm: multiply 0.90
   - If heatwave forecast in next 7 days (Tmax > 38°C): multiply 0.88
   - Combine multiplicatively
4. `growthStageModifier` (how much of the season is complete):
   - Planting → Vegetative: estimated yield × 0.6 (more uncertainty)
   - Flowering / Reproductive: × 0.8 (critical stage passed)
   - Grain fill / Maturation: × 0.95 (near-final estimate)
   - Post-harvest: N/A
5. `irrigationMethodModifier`:
   - Drip: 1.0 (most efficient, no salt concentration in root zone)
   - Sprinkler: 0.97 (minor leaf burn risk with Cl)
   - Flood/Furrow: 0.92 (salt can accumulate; higher water use)
   - Rainfed: 0.85 (yield limited by monsoon variability)

**FINAL PREDICTED YIELD:**
`predictedYield = basePotential × salinityModifier × waterQualityModifier × weatherModifier × growthStageModifier × irrigationMethodModifier`

Round to 1 decimal. Express in tons/ha.

**YEAR-OVER-YEAR CHANGE:**
If `previousSeasonYield` is stored in farm profile, compute:
`yieldChangePercent = ((predictedYield - previousSeasonYield) / previousSeasonYield) × 100`
Round to nearest integer. If no previous yield, omit this field (do NOT hardcode "+12%").

### 1.4 Water Needs & Irrigation Scheduling

**From weather API (Open-Meteo, free, no API key):**
URL: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max&current=soil_moisture_0_to_1cm,temperature_2m,precipitation&timezone=Asia/Kolkata&forecast_days=7`

- `ETo` (reference evapotranspiration) = `et0_fao_evapotranspiration[0]` in mm/day

**CROP COEFFICIENT (Kc) by crop and growth stage (FAO-56 values):**
```
Soybean:     initial=0.40, development=0.80, mid=1.15, late=0.50
Wheat:       initial=0.30, development=0.70, mid=1.15, late=0.40
Cotton:      initial=0.35, development=0.70, mid=1.20, late=0.60
Rice:        initial=1.05, development=1.15, mid=1.20, late=0.90
Maize:       initial=0.30, development=0.70, mid=1.20, late=0.60
Chickpea:    initial=0.40, development=0.70, mid=1.00, late=0.35
Groundnut:   initial=0.40, development=0.70, mid=1.10, late=0.60
Sorghum:     initial=0.30, development=0.65, mid=1.00, late=0.55
```

**CROP WATER DEMAND:**
`ETc = ETo × Kc` (mm/day, net crop water requirement)

**NET IRRIGATION REQUIREMENT (NIR):**
`NIR_daily = ETc - effectiveRainfall` (effectiveRainfall = 80% of daily precipitation for loam/clay soils)
If NIR_daily ≤ 0, no irrigation needed today.

**DAYS TO NEXT IRRIGATION:**
For Vertisol (black cotton soil): assume field capacity soil water = ~200mm per meter depth.
Root depth by crop: soybean=0.6m, wheat=1.0m, cotton=1.2m, rice=0.3m.
Available water in root zone = 200mm × rootDepth (rough estimate for Vertisol).
Soil moisture depletion rate = NIR_daily.
`daysToNextIrrigation = floor(availableWater × 0.5 / max(NIR_daily, 0.1))`
(0.5 = allow 50% depletion before irrigation, standard for most crops; adjust for rice to 0.2)
Clamp to [0, 14] days.

**WATER NEEDS LEVEL:**
- If NIR_daily < 3mm/day AND daysToNextIrrigation > 5: "Low"
- If NIR_daily 3-6mm/day OR daysToNextIrrigation 2-5: "Medium"  
- If NIR_daily > 6mm/day OR daysToNextIrrigation ≤ 1: "High"

### 1.5 Risk Assessment (Multi-Source)

Compute `riskLevel` and `primaryRisk` from:

**Water Quality Risks:**
- EC > 1.5 dS/m AND sensitive crop: HIGH risk
- Cl > 4 meq/L AND sensitive crop: HIGH risk
- SAR > 9 AND Vertisol soil: MODERATE risk
- TH > 200 AND drip irrigation method: LOW-MODERATE risk (scaling)
- RSC > 1.25: MODERATE risk

**Weather Risks (from Open-Meteo 7-day forecast):**
- Any day Tmax > 40°C: HIGH heat risk
- Any day Tmax 35-40°C during flowering/grain fill: MODERATE heat risk
- 7-day rainfall sum < 5mm during critical growth stage: MODERATE drought risk
- Any day with weather_code ≥ 95 (thunderstorm): MODERATE storm risk

**Growth Stage Risks:**
- Flowering + heat stress: HIGH (pollen sterility risk)
- Grain fill + drought: HIGH (yield loss up to 30%)
- Seedling + waterlogging (rainfall > 50mm/day): HIGH

**Overall Risk = highest risk from any source**
If multiple MODERATE risks: escalate to HIGH.

---

## PART 2: ADDITIONAL PROFILE DATA TO COLLECT FROM FARMERS

Extend the Farm Profile page (`/dashboard/farm-profile`) with these additional fields. Add them as a second section titled "Seasonal Details" — collapsible, non-mandatory for first login but prompted with a banner.

```typescript
// Add to the Farm type in Firestore /users/{userId}/farms/primary

// Existing fields kept as-is:
// farmName, location (lat/lng), farmSize, soilType, cropType, plantingDate, growthStage

// New fields to add:
interface FarmProfile {
  // ... existing fields ...
  
  // Seasonal Details (new section)
  previousSeasonYield?: number;         // tons/ha — for % change calculation
  irrigationMethod: 'drip' | 'flood' | 'sprinkler' | 'furrow' | 'rainfed';
  lastIrrigationDate?: string;          // ISO date — for soil moisture estimation
  lastFertilizerDate?: string;          // ISO date
  lastFertilizerType?: string;          // e.g. "Urea", "DAP", "NPK 20-20-0", "FYM"
  cropVariety?: string;                 // e.g. "JS-335" for soybean, free text
  approximateRainfallMm?: number;       // farmer's estimate since last irrigation
  
  // Lab Report Data (populated by AI parsing, not manual entry)
  waterReport?: WaterReportData;        // parsed from uploaded PDF
  waterReportUploadDate?: string;       // ISO date
  
  // Computed fields (server-side only, written by Genkit flows)
  lastComputedInsights?: ComputedInsights;
  lastInsightsComputedAt?: string;
}

interface WaterReportData {
  reportDate?: string;
  waterSource?: string;
  pH?: number;
  tds?: number;
  conductivity?: number;        // µS/cm
  turbidity?: number;           // NTU
  totalHardness?: number;       // mg/L as CaCO₃
  calcium?: number;             // mg/L
  magnesium?: number;           // mg/L
  chloride?: number;            // mg/L
  sulphate?: number;            // mg/L
  nitrate?: number;             // mg/L
  fluoride?: number;            // mg/L
  totalAlkalinity?: number;     // mg/L as CaCO₃
  sodium?: number;              // mg/L if directly measured
  colour?: number;              // Hazen units
  // Soil report fields (if combined soil+water report)
  soilOrganicCarbon?: number;   // %
  soilNitrogen?: number;        // kg/ha
  soilPhosphorus?: number;      // kg/ha  
  soilPotassium?: number;       // kg/ha
  availableZinc?: number;       // ppm
}

interface ComputedInsights {
  // Water quality computations
  ecw_dSm: number;              // EC in dS/m
  ece_dSm: number;              // estimated soil ECe
  sar: number;
  rsc: number;
  sodium_est_mgL: number;       // estimated if not measured
  irrigationWaterQualityScore: number;  // 0-10
  sodiumHazardClass: 'S1' | 'S2' | 'S3' | 'S4';
  sodicityHazard: 'Safe' | 'Marginally Safe' | 'Doubtful' | 'Unsafe';
  chlorideToxicityRisk: 'None' | 'Low' | 'Moderate' | 'High';
  dripScalingRisk: 'Low' | 'Moderate' | 'High';
  salinityYieldPenaltyPercent: number;
  
  // Yield prediction
  predictedYield: number;       // tons/ha
  yieldChangePercent?: number;  // only if previousSeasonYield set
  yieldConfidence: 'Low' | 'Medium' | 'High';
  
  // Water needs
  etc_mmPerDay: number;
  waterNeedsLevel: 'Low' | 'Medium' | 'High';
  daysToNextIrrigation: number;
  recommendedIrrigationMethod: string;
  
  // Soil health
  soilHealthScore: number;      // 0-10
  soilHealthLabel: string;
  
  // Risk
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  primaryRisk: string;
  riskFactors: string[];
}
```

---

## PART 3: FIREBASE AI — WHAT TO BUILD

### 3.1 New Genkit Flow: `parse-water-report-flow.ts`

**Purpose:** Accept a base64-encoded PDF of a lab water/soil report and extract all parameters.

```typescript
// Location: src/ai/flows/parse-water-report-flow.ts

import { defineFlow, generate } from '@genkit-ai/flow';
import { gemini25Flash } from '@genkit-ai/googleai';
import { z } from 'zod';

const WaterReportSchema = z.object({
  reportDate: z.string().optional(),
  waterSource: z.string().optional(),
  sampleType: z.string().optional(),
  location: z.string().optional(),
  labName: z.string().optional(),
  pH: z.number().optional(),
  tds: z.number().optional(),
  conductivity: z.number().optional(),
  turbidity: z.number().optional(),
  colour: z.number().optional(),
  totalHardness: z.number().optional(),
  calcium: z.number().optional(),
  magnesium: z.number().optional(),
  sodium: z.number().optional(),
  potassium: z.number().optional(),
  chloride: z.number().optional(),
  sulphate: z.number().optional(),
  nitrate: z.number().optional(),
  fluoride: z.number().optional(),
  totalAlkalinity: z.number().optional(),
  bicarbonate: z.number().optional(),
  soilOrganicCarbon: z.number().optional(),
  soilNitrogen: z.number().optional(),
  soilPhosphorus: z.number().optional(),
  soilPotassium: z.number().optional(),
  availableZinc: z.number().optional(),
  parsingConfidence: z.enum(['High', 'Medium', 'Low']),
  notes: z.string().optional(),
});

export const parseWaterReportFlow = defineFlow(
  {
    name: 'parse-water-report',
    inputSchema: z.object({
      pdfBase64: z.string(),
      mediaType: z.string().default('application/pdf'),
    }),
    outputSchema: WaterReportSchema,
  },
  async ({ pdfBase64, mediaType }) => {
    const result = await generate({
      model: gemini25Flash,
      messages: [
        {
          role: 'user',
          content: [
            {
              media: {
                contentType: mediaType as any,
                url: `data:${mediaType};base64,${pdfBase64}`,
              },
            },
            {
              text: `You are an agricultural lab report parser. Extract all water and soil quality parameter values from this lab report document.

Return ONLY a valid JSON object. Do not include any explanation, markdown, or code fences.
If a parameter is not present in the report, omit that key.
All numeric values must be in the units standard to IS-10500 (mg/L for dissolved parameters, µS/cm for conductivity, NTU for turbidity, Hazen for colour).
If the report is in a regional language (Hindi, Gujarati, Marathi), translate parameter names and extract values correctly.
Set parsingConfidence to "High" if you found at least 8 parameters, "Medium" for 4-7, "Low" for fewer than 4.

Expected JSON structure:
{
  "reportDate": "YYYY-MM-DD or null",
  "waterSource": "groundwater|surface|canal|borewell|other",
  "sampleType": "e.g. TUBE WELL, BORE WELL, TAP WATER",
  "location": "village/taluka/district if mentioned",
  "labName": "issuing lab name if present",
  "pH": number,
  "tds": number (mg/L),
  "conductivity": number (µS/cm),
  "turbidity": number (NTU),
  "colour": number (Hazen),
  "totalHardness": number (mg/L as CaCO3),
  "calcium": number (mg/L),
  "magnesium": number (mg/L),
  "sodium": number (mg/L, if measured),
  "potassium": number (mg/L, if measured),
  "chloride": number (mg/L),
  "sulphate": number (mg/L),
  "nitrate": number (mg/L as NO3),
  "fluoride": number (mg/L),
  "totalAlkalinity": number (mg/L as CaCO3),
  "bicarbonate": number (mg/L, if separately measured),
  "soilOrganicCarbon": number (%, if soil report included),
  "soilNitrogen": number (kg/ha, if present),
  "soilPhosphorus": number (kg/ha, if present),
  "soilPotassium": number (kg/ha, if present),
  "availableZinc": number (ppm, if present),
  "parsingConfidence": "High"|"Medium"|"Low",
  "notes": "any important observations or caveats"
}`,
            },
          ],
        },
      ],
    });

    const rawText = result.text.replace(/```json|```/g, '').trim();
    return JSON.parse(rawText);
  }
);
```

### 3.2 New Utility: `compute-agronomy-scores.ts`

**Purpose:** Pure TypeScript functions implementing the scientific models from Part 1. No AI needed — deterministic calculation. Call this from server actions after parsing the report.

```typescript
// Location: src/lib/agronomy/compute-scores.ts
// This file implements the agricultural science models described in Part 1.
// All formulas are from FAO Irrigation and Drainage Papers 29 and 56, and IS-10500:2012.

export interface AgronomyInput {
  // From water report
  pH?: number;
  conductivity_uScm?: number;      // µS/cm
  tds?: number;                    // mg/L
  totalHardness?: number;          // mg/L as CaCO3
  calcium?: number;                // mg/L
  magnesium?: number;              // mg/L
  sodium?: number;                 // mg/L (measured or will be estimated)
  chloride?: number;               // mg/L
  sulphate?: number;               // mg/L
  fluoride?: number;               // mg/L
  totalAlkalinity?: number;        // mg/L as CaCO3
  nitrate?: number;                // mg/L

  // From farm profile
  soilType: string;               // 'black cotton' | 'alluvial' | 'red laterite' | 'sandy loam' | 'saline alkaline'
  cropType: string;               // e.g. 'soybean', 'wheat', 'cotton', 'rice'
  growthStage: string;            // 'initial' | 'development' | 'mid' | 'late'
  irrigationMethod: string;       // 'drip' | 'flood' | 'sprinkler' | 'furrow' | 'rainfed'
  farmSizeHa?: number;
  previousSeasonYield?: number;   // tons/ha

  // From weather API
  eto_mmPerDay?: number;          // reference ET from Open-Meteo
  dailyRainfall_mm?: number;      // today's rainfall
  forecast7dayRain_mm?: number;   // 7-day rainfall sum
  currentTempC?: number;
  maxTempC?: number;
  forecastMaxTemp7day?: number;   // max temperature in next 7 days
}

// ----- CONVERSION CONSTANTS -----
const MW = { Ca: 20.04, Mg: 12.15, Na: 23.0, K: 19.5, Cl: 35.45, SO4: 48.03, F: 19.0, HCO3: 61.0, CO3: 30.0, NO3: 62.0 };

// ----- WATER CHEMISTRY FUNCTIONS -----

function toMeq(mg_L: number, molarMass: number): number {
  return mg_L / molarMass;
}

function estimateSodium(report: AgronomyInput): number {
  if (report.sodium != null) return report.sodium;
  const Ca_meq = toMeq(report.calcium ?? 0, MW.Ca);
  const Mg_meq = toMeq(report.magnesium ?? 0, MW.Mg);
  const alk_meq = (report.totalAlkalinity ?? 0) / 50;
  const Cl_meq = toMeq(report.chloride ?? 0, MW.Cl);
  const SO4_meq = toMeq(report.sulphate ?? 0, MW.SO4);
  const F_meq = toMeq(report.fluoride ?? 0, MW.F);
  const NO3_meq = toMeq(report.nitrate ?? 0, MW.NO3);
  const totalAnions = alk_meq + Cl_meq + SO4_meq + F_meq + NO3_meq;
  const Na_meq = Math.max(0, totalAnions - Ca_meq - Mg_meq);
  return Na_meq * MW.Na;
}

function computeSAR(report: AgronomyInput): number {
  const Ca_meq = toMeq(report.calcium ?? 10, MW.Ca);
  const Mg_meq = toMeq(report.magnesium ?? 5, MW.Mg);
  const Na_mg = estimateSodium(report);
  const Na_meq = Na_mg / MW.Na;
  const denom = Math.sqrt((Ca_meq + Mg_meq) / 2);
  return denom > 0 ? Na_meq / denom : 0;
}

function computeRSC(report: AgronomyInput): number {
  const pH = report.pH ?? 7.0;
  const CO3_meq = pH > 8.3 ? ((report.totalAlkalinity ?? 0) / 100) : 0; // rough split above 8.3
  const HCO3_meq = (report.totalAlkalinity ?? 0) / 50 - CO3_meq;
  const Ca_meq = toMeq(report.calcium ?? 0, MW.Ca);
  const Mg_meq = toMeq(report.magnesium ?? 0, MW.Mg);
  return (CO3_meq + HCO3_meq) - (Ca_meq + Mg_meq);
}

function getECw(report: AgronomyInput): number {
  if (report.conductivity_uScm != null) return report.conductivity_uScm / 1000;
  if (report.tds != null) return report.tds / 640;
  return 0.5; // fallback
}

function getECe(ecw: number): number {
  return ecw * 1.5; // standard estimate with 20% leaching fraction
}

// ----- YIELD PENALTY (MAAS-HOFFMAN) -----

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

function getSalinityYieldPenalty(ecw_dSm: number, cropType: string): number {
  const key = cropType.toLowerCase().replace(/\s+/g, '');
  const params = cropSalinityParams[key] || cropSalinityParams.default;
  const ece = getECe(ecw_dSm);
  if (ece <= params.threshold) return 0;
  return Math.min(100, params.slope * (ece - params.threshold));
}

// ----- BASE YIELD POTENTIAL -----

const basePotentialYield: Record<string, Record<string, number>> = {
  'black cotton': { wheat: 4.5, soybean: 2.2, cotton: 2.0, rice: 5.0, maize: 5.5, sorghum: 3.0, chickpea: 1.5, groundnut: 2.5, default: 3.0 },
  alluvial: { wheat: 5.5, rice: 6.0, soybean: 2.5, maize: 6.0, sugarcane: 70.0, default: 4.0 },
  'red laterite': { groundnut: 2.0, cotton: 1.5, sorghum: 2.5, default: 2.0 },
  'sandy loam': { wheat: 3.5, maize: 4.5, groundnut: 1.8, default: 2.5 },
  'saline alkaline': { default: 1.5 },
};

function getBasePotential(soilType: string, cropType: string): number {
  const soilKey = soilType.toLowerCase().replace(/\s+/g, ' ').trim();
  const cropKey = cropType.toLowerCase().trim();
  const soilData = basePotentialYield[soilKey] || basePotentialYield['alluvial'];
  return soilData[cropKey] || soilData.default || 3.0;
}

// ----- CROP COEFFICIENTS (FAO-56) -----

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

// ----- MAIN COMPUTE FUNCTION -----
// Implement this function following all the rules in Part 1 above.
// It should return a ComputedInsights object.
export function computeAgronomyScores(input: AgronomyInput): ComputedInsights {
  // Step 1: Water quality derived values
  const ecw = getECw(input);
  const ece = getECe(ecw);
  const sar = computeSAR(input);
  const rsc = computeRSC(input);
  const na_est = estimateSodium(input);
  const salinityPenalty = getSalinityYieldPenalty(ecw, input.cropType);

  // Step 2: Irrigation water quality score (weighted, 0-10)
  // ... (implement per Part 1.2 spec above) ...

  // Step 3: Soil health score
  // ... (implement per Part 1.2 spec above) ...

  // Step 4: Predicted yield
  const basePotential = getBasePotential(input.soilType, input.cropType);
  // ... apply all modifiers per Part 1.3 spec above ...

  // Step 5: Water needs
  const cropKey = input.cropType.toLowerCase().trim();
  const kcData = cropKc[cropKey] || cropKc.default;
  const kc = kcData[input.growthStage as keyof typeof kcData] || kcData.mid;
  const etc = (input.eto_mmPerDay ?? 5.0) * kc;
  // ... compute daysToNextIrrigation per Part 1.4 spec ...

  // Step 6: Risk assessment
  // ... compute per Part 1.5 spec ...

  // Return ComputedInsights object
}
```

**IMPORTANT:** Firebase AI should implement the full bodies of `computeAgronomyScores` following every rule specified in Part 1 above. The function should be deterministic (no randomness), pure (no side effects), and fully typed.

### 3.3 Updated Genkit Flow: `personalized-farming-advisory-flow.ts`

**Purpose:** Replace the existing advisory flow with one that takes pre-computed scores + farm context and produces the rich advisory content for display. The AI's job here is **interpretation and recommendations**, not number-crunching (numbers come from `computeAgronomyScores`).

The flow should accept as input the full `ComputedInsights` object + `FarmProfile` + `WeatherData` and produce natural language explanations + specific task recommendations in the farmer's language (auto-detect or use profile preference: Hindi/Marathi/Gujarati/English).

Output schema:

```typescript
const AdvisoryOutputSchema = z.object({
  // Summaries for dashboard cards (short, human-readable)
  predictedYieldSummary: z.object({
    display: z.string(),      // e.g. "3.8 T/ha"
    changeText: z.string().optional(),  // e.g. "+12% from last season" (only if data available)
    subtitle: z.string(),     // e.g. "Salinity stress: None. Water quality: Good (8.2/10)"
  }),
  waterNeedsSummary: z.object({
    level: z.enum(['Low', 'Medium', 'High']),
    nextIrrigationText: z.string(),    // e.g. "Next irrigation in 3 days"
    subtitle: z.string(),              // e.g. "ETc: 4.8 mm/day | EC safe for soybean"
  }),
  soilHealthSummary: z.object({
    score: z.number(),
    label: z.string(),          // e.g. "Good" or "Excellent"
    subtitle: z.string(),       // e.g. "Black Vertisol | Ca:Mg needs attention | pH 7.56 ✓"
  }),
  riskSummary: z.object({
    level: z.enum(['Low', 'Moderate', 'High', 'Critical']),
    primaryRisk: z.string(),    // e.g. "Heat wave expected"
    subtitle: z.string(),       // supporting detail
  }),
  waterQualityScore: z.object({
    score: z.number(),
    label: z.string(),
    subtitle: z.string(),       // e.g. "Lab verified • Groundwater • IS-10500 compliant"
  }),

  // Smart tasks for the Smart Tasks panel
  smartTasks: z.array(z.object({
    title: z.string(),
    priority: z.enum(['High', 'Medium', 'Low', 'Observation']),
    category: z.enum(['Fertilizer', 'Irrigation', 'Pest', 'Harvest', 'Soil', 'Water Quality']),
    dueInDays: z.number(),
    rationale: z.string(),       // brief scientific reason
  })),

  // Detailed advisory text (for /dashboard/advisory page)
  detailedReport: z.object({
    waterQualityAnalysis: z.string(),
    irrigationRecommendations: z.string(),
    fertilizerRecommendations: z.string(),
    soilManagementTips: z.string(),
    yieldOptimizationTips: z.array(z.string()),
    seasonalAlerts: z.string().optional(),
  }),

  language: z.string(),   // detected/used language code
});
```

**Prompt template for this flow:**

```
You are YieldIQ's precision agriculture advisor. Your role is to INTERPRET pre-computed scientific scores and translate them into clear, actionable advice for a farmer.

FARM CONTEXT:
- Crop: {{cropType}} | Variety: {{cropVariety}} | Stage: {{growthStage}}
- Soil Type: {{soilType}} | Farm Size: {{farmSizeHa}} hectares
- Location: {{locationDescription}} | Season: {{currentSeason}}
- Irrigation Method: {{irrigationMethod}}
- Planting Date: {{plantingDate}}

PRE-COMPUTED SCIENTIFIC SCORES (derived from lab report + weather, do not recompute):
- Water EC: {{ecw_dSm}} dS/m → ECe (soil): {{ece_dSm}} dS/m
- SAR: {{sar}} ({{sodiumHazardClass}}) | RSC: {{rsc}} meq/L ({{sodicityhazard}})
- Irrigation Water Quality Score: {{irrigationWaterQualityScore}}/10
- Salinity Yield Penalty: {{salinityYieldPenaltyPercent}}%
- Chloride Toxicity Risk: {{chlorideToxicityRisk}}
- Drip Scaling Risk (from hardness {{totalHardness}} mg/L): {{dripScalingRisk}}
- Soil Health Score: {{soilHealthScore}}/10
- Predicted Yield: {{predictedYield}} T/ha{{#if yieldChangePercent}} ({{yieldChangePercent}}% vs last season){{/if}}
- ETc (crop water demand): {{etc_mmPerDay}} mm/day
- Water Needs Level: {{waterNeedsLevel}} | Days to next irrigation: {{daysToNextIrrigation}}
- Risk Level: {{riskLevel}} | Primary risk: {{primaryRisk}}

CURRENT WEATHER (from Open-Meteo):
- Temperature: {{currentTempC}}°C | Max this week: {{forecastMaxTemp7day}}°C
- 7-day rainfall forecast: {{forecast7dayRain_mm}} mm
- ETo: {{eto_mmPerDay}} mm/day

WATER REPORT DATE: {{waterReportUploadDate}}
LAB SOURCE: {{waterSource}} | Sample: {{sampleType}}

TASK:
1. Generate all dashboard summary texts. Be specific — cite the actual numbers.
2. Generate 3–5 smart tasks ranked by urgency. Base tasks strictly on the computed scores above.
   Examples of data-driven tasks:
   - If Ca:Mg ratio (water) < 2:1 AND soil is Vertisol → task: Apply gypsum to correct Ca:Mg imbalance
   - If dripScalingRisk = High AND irrigationMethod = drip → task: Acid flush drip emitters
   - If salinityYieldPenaltyPercent > 5 → task: Increase leaching fraction
   - If waterNeedsLevel = High AND growthStage = mid → task: Immediate irrigation
   - If forecastMaxTemp7day > 38 AND growthStage = mid/late → task: Shade netting / schedule irrigation at dawn
3. Generate detailed advisory sections.
4. Detect farmer's preferred language from their previous chat messages or use {{preferredLanguage}}.
   If Hindi/Marathi/Gujarati: translate summaries and smart task titles to that language; keep technical terms bilingual.

Return ONLY valid JSON matching the output schema. No markdown, no preamble.
```

### 3.4 New Server Action: `generate-insights-server-action.ts`

**Purpose:** Orchestrate the full pipeline when a farmer uploads a report or requests a refresh.

```typescript
// Location: src/app/actions/generate-insights.ts
'use server';

import { parseWaterReportFlow } from '@/ai/flows/parse-water-report-flow';
import { computeAgronomyScores } from '@/lib/agronomy/compute-scores';
import { farmingAdvisoryFlow } from '@/ai/flows/personalized-farming-advisory-flow';
import { getWeatherData } from '@/lib/weather';
import { db } from '@/lib/firebase-admin';

export async function generateInsights(userId: string, pdfBase64?: string) {
  // 1. Fetch farm profile
  const farmDoc = await db.doc(`users/${userId}/farms/primary`).get();
  const farm = farmDoc.data();

  // 2. Parse PDF if provided
  let waterReport = farm?.waterReport;
  if (pdfBase64) {
    waterReport = await parseWaterReportFlow({ pdfBase64 });
    await db.doc(`users/${userId}/farms/primary`).update({
      waterReport,
      waterReportUploadDate: new Date().toISOString(),
    });
  }

  // 3. Fetch weather
  const weather = farm?.location
    ? await getWeatherData(farm.location.lat, farm.location.lng)
    : null;

  // 4. Compute agronomy scores (deterministic, no AI)
  const computed = computeAgronomyScores({
    ...waterReport,
    soilType: farm?.soilType,
    cropType: farm?.cropType,
    growthStage: farm?.growthStage,
    irrigationMethod: farm?.irrigationMethod || 'flood',
    previousSeasonYield: farm?.previousSeasonYield,
    eto_mmPerDay: weather?.eto,
    dailyRainfall_mm: weather?.currentRainfall,
    forecast7dayRain_mm: weather?.forecast7dayRain,
    currentTempC: weather?.currentTemp,
    forecastMaxTemp7day: weather?.forecastMaxTemp,
  });

  // 5. Generate AI advisory (interpretation + recommendations)
  const advisory = await farmingAdvisoryFlow({
    farm,
    computed,
    weather,
    waterReport,
  });

  // 6. Save to Firestore
  const reportId = `report_${Date.now()}`;
  await db.doc(`users/${userId}/farms/primary`).update({
    lastComputedInsights: computed,
    lastInsightsComputedAt: new Date().toISOString(),
  });
  await db.doc(`users/${userId}/advisory_reports/${reportId}`).set({
    createdAt: new Date().toISOString(),
    advisory,
    computed,
    farmSnapshot: farm,
  });

  return { computed, advisory };
}
```

### 3.5 Updated Dashboard Cards

Update the dashboard overview (`/dashboard/page.tsx`) to display fields from `advisory` (Firestore `lastComputedInsights` + latest advisory report), not hardcoded values.

**Card mapping:**

| Card | Data Source | Field |
|---|---|---|
| Predicted Yield | `advisory.predictedYieldSummary.display` | e.g. "3.8 T/ha" |
| Yield subtitle | `advisory.predictedYieldSummary.changeText` | Only show if data exists |
| Water Needs | `advisory.waterNeedsSummary.level` | "Low" / "Medium" / "High" |
| Water Needs detail | `advisory.waterNeedsSummary.nextIrrigationText` | "Next irrigation in 3 days" |
| Water Needs subtitle | `advisory.waterNeedsSummary.subtitle` | "ETc: 4.8 mm/day..." |
| Soil Health | `advisory.soilHealthSummary.label` | "Good" |
| Soil Health subtitle | `advisory.soilHealthSummary.subtitle` | "Black Vertisol | pH 7.56 ✓" |
| Risk Level | `advisory.riskSummary.level` | "Moderate" |
| Risk subtitle | `advisory.riskSummary.primaryRisk` | "Heat wave expected" |
| Water Quality (NEW 5th card) | `advisory.waterQualityScore.score` | "8.4/10" |
| Smart Tasks | `advisory.smartTasks` | Array of tasks |

**IMPORTANT:** If `lastComputedInsights` is null (no report uploaded yet), show a prominent "Upload Lab Report" CTA on the dashboard instead of placeholder values. Do NOT display dummy data.

### 3.6 New Page: `/dashboard/report-upload`

A dedicated page for uploading lab reports. Features:
1. Drag-and-drop PDF upload zone (accept PDF and JPG/PNG for scanned reports)
2. Upload → shows parsing progress animation ("Reading report... Extracting parameters... Computing scores...")
3. After parsing: shows extracted values in a table with IS-10500 compliance status (✅/⚠️/❌ per parameter)
4. "Generate Farm Insights" button → triggers `generateInsights` server action
5. Shows parsed date and lab name from report
6. Allows re-upload to update

### 3.7 Weather Integration

```typescript
// Location: src/lib/weather.ts
export async function getWeatherData(lat: number, lng: number) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lng.toString());
  url.searchParams.set('current', [
    'temperature_2m', 'relative_humidity_2m', 'precipitation',
    'weather_code', 'soil_temperature_0cm', 'soil_moisture_0_to_1cm'
  ].join(','));
  url.searchParams.set('daily', [
    'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'et0_fao_evapotranspiration',
    'weather_code'
  ].join(','));
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('timezone', 'Asia/Kolkata');

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } }); // cache 30min
  const data = await res.json();

  return {
    currentTemp: data.current.temperature_2m,
    currentHumidity: data.current.relative_humidity_2m,
    currentRainfall: data.current.precipitation,
    weatherCode: data.current.weather_code,
    soilMoistureTop: data.current.soil_moisture_0_to_1cm,
    soilTempSurface: data.current.soil_temperature_0cm,
    eto: data.daily.et0_fao_evapotranspiration[0],
    forecast7dayRain: data.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0),
    forecastMaxTemp: Math.max(...data.daily.temperature_2m_max),
    dailyForecast: data.daily,
  };
}
```

---

## PART 4: DEMO SENSOR SIMULATOR

For the hackathon demo, create a script that simulates IoT sensor heartbeats writing to Firestore. The data should be **consistent with the lab report values** — not random noise.

```typescript
// Location: scripts/sensor-simulator.ts
// Run with: npx ts-node scripts/sensor-simulator.ts

// Simulate sensors that produce readings consistent with the uploaded lab report.
// Base values derived from the actual water report parameters:
// pH 7.56, EC 794 µS/cm, TDS 514 mg/L → calibrate sensor sim to match

interface SensorReading {
  timestamp: string;
  sensor_pH: number;           // oscillates ±0.2 around water report pH
  sensor_EC_uScm: number;      // oscillates ±30 around water report EC
  sensor_soilMoisture_pct: number;  // varies by irrigation/ET
  sensor_soilTemp_C: number;
  sensor_airTemp_C: number;
  sensor_humidity_pct: number;
  sensor_lightLux: number;
  npk_nitrogen_index: number;  // relative index 0-100
  npk_phosphorus_index: number;
  npk_potassium_index: number;
  dataQuality: 'raw';
  requiresPreprocessing: boolean;
}

// The simulator should write to:
// /users/{DEMO_USER_ID}/farms/primary/sensor_stream/{auto-id}  (append-only log)
// /users/{DEMO_USER_ID}/farms/primary/latest_sensor  (overwrite, for dashboard)
// Update interval: every 5 seconds
// Add occasional "outlier" readings that get flagged and clamped in preprocessing
```

---

## PART 5: DATA PIPELINE VISUALIZATION

Create a new page `/dashboard/data-pipeline` that visualizes data flowing through the system.

**Three-column layout:**

**Column 1 — RAW INPUT:**
- Live feed from `sensor_stream` using `onSnapshot()`
- Shows raw JSON values ticking in real-time
- Highlight anomalous values in red

**Column 2 — PREPROCESSING:**
- Animated steps: Validate → Normalize → Moving Average (5 readings) → Anomaly Detection → Clean
- Show when a value gets clamped: "pH 6.1 → clamped to 6.5 (out of range)"
- Show preprocessing stats: "47 readings processed | 3 outliers removed"

**Column 3 — AI-READY OUTPUT:**
- Cleaned, averaged values ready to feed into Gemini
- "Last sent to model: 2 seconds ago"
- Show derived fields: "Irrigation Flag: false | Nitrogen Alert: LOW"

This page is **purely visual** for the demo. The preprocessing animation can be CSS-driven with artificial delays to make it look like computation is happening.

---

## IMPLEMENTATION ORDER FOR 1-DAY SPRINT

1. **`compute-agronomy-scores.ts`** (pure TS, no Firebase dependency) — 2h
2. **`weather.ts`** (fetch Open-Meteo, no API key) — 30min
3. **`parse-water-report-flow.ts`** (Genkit + Gemini PDF parsing) — 1h
4. **`generate-insights-server-action.ts`** (orchestration) — 1h
5. **Farm Profile page additions** (new fields + PDF upload) — 1h
6. **Dashboard cards update** (read from Firestore, no hardcodes) — 1h
7. **`personalized-farming-advisory-flow.ts`** (update with new prompt) — 1h
8. **`/dashboard/report-upload` page** (upload UI + parsing visualization) — 1h
9. **Sensor simulator script** — 30min
10. **`/dashboard/data-pipeline` page** (visual only) — 1h

---

## NOTES FOR FIREBASE AI

- Never hardcode agricultural values. Every number on the dashboard must trace back to either: (a) a parsed lab report value, (b) a computation from `computeAgronomyScores`, (c) live weather API data, or (d) an AI-interpreted text from the advisory flow.
- If a farmer hasn't uploaded a report yet, the dashboard should show a "Setup Required" state with a clear CTA, not fake placeholder data.
- The `computeAgronomyScores` function must be fully implemented with all the formulas from Part 1 — not just skeleton code. This is the scientific heart of the platform.
- Use `conductivity_uScm` (from the report) as the primary EC source. Fall back to `tds / 640` only if conductivity is missing.
- All Genkit flows should handle the case where `waterReport` is null/undefined — return graceful defaults with a `reportRequired: true` flag.
- The Maas-Hoffman crop table must be complete — at minimum the 11 crops listed. Match fuzzy crop names from profile (e.g. "Soya" → "soybean", "Gehun" → "wheat").
