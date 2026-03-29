'use server';

import { cultivationStrategyFlow } from '@/ai/flows/cultivation-strategy-flow';

interface StrategyInputParams {
  location?: string;
  farmSize?: number;
  landTenure?: 'Owned' | 'Leased' | 'Shared';
  irrigationInfrastructure?: string;
  soilType?: string;
  previousCrop?: string;
  workingCapital?: number;
  creditAccess?: boolean;
  target?: 'Maximum Yield' | 'Maximum Profit' | 'Soil Restoration' | 'Low-risk crop';
  labReportData?: string;
}

export async function generateCultivationStrategy(
  userId: string, 
  farmData?: any, 
  plotReports?: any[],
  extraParams?: StrategyInputParams
) {
  try {
    const strategy = await cultivationStrategyFlow({
      location: extraParams?.location || farmData?.location || 'Nagpur, Maharashtra',
      farmAreaHectares: extraParams?.farmSize || farmData?.totalAreaHectares || 1,
      soilType: extraParams?.soilType || farmData?.soilType || 'Black',
      irrigationMethod: extraParams?.irrigationInfrastructure || farmData?.irrigationMethod || 'Drip',
      history: extraParams?.previousCrop ? [extraParams.previousCrop] : ["Soybean", "Wheat"],
      landTenure: extraParams?.landTenure || 'Owned',
      workingCapital: extraParams?.workingCapital || 50000,
      creditAccess: extraParams?.creditAccess || false,
      target: extraParams?.target || 'Maximum Profit',
      labReportUploaded: !!extraParams?.labReportData,
      labReportData: extraParams?.labReportData
    });

    return strategy;
  } catch (error) {
    console.error("Error generating cultivation strategy:", error);
    throw new Error("Strategic AI synthesis failed. Please check input parameters.");
  }
}
