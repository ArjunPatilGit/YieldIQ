/**
 * @fileOverview Genkit flow for parsing agricultural lab reports (water/soil).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const WaterReportSchema = z.object({
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

export type WaterReport = z.infer<typeof WaterReportSchema>;

const ParseWaterReportInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a lab report, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export const parseWaterReportFlow = ai.defineFlow(
  {
    name: 'parseWaterReportFlow',
    inputSchema: ParseWaterReportInputSchema,
    outputSchema: WaterReportSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      output: { schema: WaterReportSchema },
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `You are an expert agricultural lab report parser. Extract all water and soil quality parameter values from this report.
        
        All numeric values must be in the units standard to IS-10500 (mg/L for dissolved parameters, µS/cm for conductivity, NTU for turbidity).
        If the report is in a regional language like Hindi or Marathi, translate parameter names accurately.
        If a value is not present, omit the key.` }
      ],
    });

    if (!output) throw new Error("Failed to parse report.");
    return output;
  }
);
