'use server';
/**
 * @fileOverview Plant Health Scanner AI Flow
 * Uses Gemini's multimodal vision to analyze crop leaf images and return
 * structured disease diagnostics focused on Indian crops.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlantScannerInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe('A base64 data URI of the plant or leaf image to analyze.'),
  cropHint: z
    .string()
    .optional()
    .describe('Optional crop type hint (e.g., Cotton, Wheat, Rice, Soybean).'),
});
export type PlantScannerInput = z.infer<typeof PlantScannerInputSchema>;

const PlantScannerOutputSchema = z.object({
  diseaseName: z.string().describe('Common name of the identified disease or condition.'),
  scientificName: z.string().describe('Scientific name of the pathogen or condition.'),
  confidence: z.enum(['High', 'Medium', 'Low']).describe('Confidence level of the diagnosis.'),
  rootCause: z.string().describe('Detailed explanation of how this disease occurs.'),
  organicTreatments: z.array(z.string()).describe('Organic and natural remedies.'),
  chemicalTreatments: z.array(z.string()).describe('Recommended pesticides or fungicides with dosages.'),
  immediateActions: z.array(z.string()).describe('3-5 immediate action steps for the farmer.'),
  preventionTips: z.array(z.string()).describe('Future prevention tips.'),
  affectedCrop: z.string().describe('Name of the identified crop in the image.'),
  severity: z.enum(['Mild', 'Moderate', 'Severe']).describe('Severity of the infection.'),
});
export type PlantScannerOutput = z.infer<typeof PlantScannerOutputSchema>;

export async function scanPlantHealth(input: PlantScannerInput): Promise<PlantScannerOutput> {
  return plantScannerFlow(input);
}

const plantScannerFlow = ai.defineFlow(
  {
    name: 'plantScannerFlow',
    inputSchema: PlantScannerInputSchema,
    outputSchema: PlantScannerOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        output: { schema: PlantScannerOutputSchema },
        prompt: [
          {
            media: {
              url: input.imageDataUri,
            },
          },
          {
            text: `You are an expert agricultural plant pathologist specializing in Indian crops including Cotton (Gossypium hirsutum), Rice (Oryza sativa), Soybean (Glycine max), Wheat (Triticum aestivum), Black Gram (Vigna mungo), Green Gram (Vigna radiata), Pigeon Pea (Cajanus cajan), and Jowar (Sorghum bicolor).

Analyze this plant/leaf image carefully and provide a structured disease diagnosis.
${input.cropHint ? `Crop type hint from farmer: ${input.cropHint}` : ''}

Focus on:
1. Visual symptoms: leaf spots, discoloration, wilting, lesions, pustules, necrosis, mold, insect damage
2. Pattern recognition: color, shape, size, and distribution of symptoms  
3. Matching to known Indian agricultural diseases

Return a comprehensive, accurate diagnosis. If the plant appears healthy, indicate "No Disease Detected" with confidence. If unclear, indicate low confidence and suggest physical examination.

Be specific with chemical treatment names, dosages, and application methods relevant to Indian agricultural standards.`,
          },
        ],
      });

      if (!output) throw new Error('No output from vision model');
      return output;
    } catch (error: any) {
      console.error('Plant Scanner Flow Error:', error);
      // Scientific fallback
      return {
        diseaseName: 'Analysis Pending - API Connectivity Issue',
        scientificName: 'Diagnosis requires active vision model connection',
        confidence: 'Low',
        rootCause: `The image scan could not be completed due to: ${error.message}. Please ensure your Gemini API key is valid and retry.`,
        organicTreatments: ['Neem oil spray (5ml/L water)', 'Trichoderma viride biocontrol agent'],
        chemicalTreatments: ['Consult local agricultural extension officer for chemical recommendations'],
        immediateActions: [
          'Isolate the affected plant from healthy crops immediately',
          'Remove and burn visibly infected leaves',
          'Ensure proper field drainage to reduce humidity',
          'Monitor surrounding plants for similar symptoms',
        ],
        preventionTips: [
          'Maintain proper plant spacing for air circulation',
          'Avoid overhead irrigation which spreads fungal spores',
          'Rotate crops each season',
        ],
        affectedCrop: input.cropHint || 'Unknown - could not process image',
        severity: 'Moderate',
      };
    }
  }
);
