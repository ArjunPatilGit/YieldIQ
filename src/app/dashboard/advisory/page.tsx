"use client";

import { useState } from "react";
import { personalizedFarmingAdvisory, PersonalizedFarmingAdvisoryOutput } from "@/ai/flows/personalized-farming-advisory-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, 
  Loader2, 
  Droplets, 
  Zap, 
  Bug, 
  Warehouse, 
  Store, 
  CheckSquare, 
  Download,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdvisoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<PersonalizedFarmingAdvisoryOutput | null>(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Mocked input for the demo based on the typical farmer's profile
      const result = await personalizedFarmingAdvisory({
        farmName: "Punjab Harvest Field",
        cropType: "Wheat",
        soilType: "Loamy",
        location: "Bathinda, Punjab",
        plantingDate: "2023-11-15",
        currentStage: "Flowering",
        recentObservations: "Dry leaves at edges, some yellowing",
        predictedYield: "4.5 tons per acre",
        predictedWaterNeeds: "450 mm for remaining season",
        predictedFertilizerNeeds: "25kg Nitrogen per acre",
        potentialPestsDiseases: "Yellow Rust, Aphids"
      });
      setReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">Personalized Advisory</h1>
          <p className="text-muted-foreground">AI-generated reports for your specific farm conditions.</p>
        </div>
        <Button onClick={generateReport} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Generate New Report
        </Button>
      </div>

      {!report && !isLoading && (
        <Card className="border-dashed flex flex-col items-center justify-center p-12 bg-muted/30">
          <FileText className="h-16 w-16 text-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Report Available</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Generate an AI report to get optimized suggestions for water, fertilizer, and pest management.
          </p>
          <Button variant="outline" onClick={generateReport}>Get Started Now</Button>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Zap className="h-4 w-4 text-accent" />
             </div>
          </div>
          <p className="text-muted-foreground animate-pulse">YieldIQ is analyzing multi-source farm data...</p>
        </div>
      )}

      {report && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary Alert */}
          <Alert className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
            <CheckSquare className="h-5 w-5 text-primary" />
            <AlertTitle className="font-bold">Executive Summary</AlertTitle>
            <AlertDescription className="text-foreground/80 leading-relaxed">
              {report.advisorySummary}
            </AlertDescription>
          </Alert>

          {/* Grid sections */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Water Optimization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.waterOptimization}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Fertilizer Optimization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.fertilizerOptimization}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Bug className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pest Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.pestManagement}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Storage & Planning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.storagePlanning}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-muted/10 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Sales Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{report.salesStrategy}</p>
                <div className="p-4 bg-background rounded-lg border border-primary/5">
                  <h4 className="text-sm font-semibold mb-2">Profit Tips</h4>
                  <p className="text-xs text-muted-foreground">{report.profitEstimationTips}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-accent" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-accent-foreground">{i + 1}</span>
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-[10px] text-muted-foreground italic text-center px-4">
            {report.disclaimer}
          </p>

          <div className="flex justify-center pt-4">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Full PDF Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
