"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { generateInsights } from "@/app/actions/generate-insights";
import { AdvisoryOutput } from "@/ai/flows/personalized-farming-advisory-flow";
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
  AlertCircle,
  Database,
  Sprout,
  ShieldAlert
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdvisoryPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [localReport, setLocalReport] = useState<AdvisoryOutput | null>(null);

  const farmRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "farms", "primary");
  }, [db, user]);

  const { data: farmData } = useDoc(farmRef);

  const handleGenerateReport = async () => {
    if (!user) return;
    setIsGenerating(true);
    
    try {
      const result = await generateInsights(user.uid);
      setLocalReport(result.advisory);
      toast({
        title: "Report Generated",
        description: "Your scientific advisory has been updated and saved to the cloud.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate report. Ensure profile is complete.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const currentAdvisory = localReport || farmData?.latestAdvisory;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">Scientific Advisory Report</h1>
          <p className="text-muted-foreground">Detailed precision guidance derived from your lab chemistry.</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg" className="bg-primary hover:bg-primary/90">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Refresh Insights
        </Button>
      </div>

      {!farmData?.lastComputedInsights && (
        <Alert className="bg-accent/10 border-accent/20">
          <AlertCircle className="h-4 w-4 text-accent" />
          <AlertTitle>Lab Report Required</AlertTitle>
          <AlertDescription>
            To generate a high-accuracy scientific report, please upload a water or soil lab report first in the "Upload Lab Report" page.
          </AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Database className="h-4 w-4 text-accent" />
             </div>
          </div>
          <p className="text-muted-foreground animate-pulse text-sm">YieldIQ is applying agronomy models to your farm data...</p>
        </div>
      )}

      {!currentAdvisory && !isGenerating && (
        <Card className="border-dashed flex flex-col items-center justify-center p-12 bg-muted/30">
          <FileText className="h-16 w-16 text-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Advisory Found</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Click "Refresh Insights" to generate a report based on your current farm profile and weather data.
          </p>
          <Button variant="outline" onClick={handleGenerateReport}>Generate Now</Button>
        </Card>
      )}

      {currentAdvisory && !isGenerating && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Predicted Yield</p>
                <div className="text-2xl font-bold text-primary">{currentAdvisory.predictedYieldSummary.display}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{currentAdvisory.predictedYieldSummary.subtitle}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Water Needs</p>
                <div className="text-2xl font-bold text-blue-600">{currentAdvisory.waterNeedsSummary.level}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{currentAdvisory.waterNeedsSummary.nextIrrigationText}</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Soil Health</p>
                <div className="text-2xl font-bold text-accent-foreground">{currentAdvisory.soilHealthSummary.score}/10</div>
                <p className="text-[10px] text-muted-foreground mt-1">{currentAdvisory.soilHealthSummary.label}</p>
              </CardContent>
            </Card>
            <Card className={currentAdvisory.riskSummary.level === 'High' ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-muted"}>
              <CardContent className="pt-6">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Risk Status</p>
                <div className={`text-2xl font-bold ${currentAdvisory.riskSummary.level === 'High' ? 'text-destructive' : 'text-foreground'}`}>
                  {currentAdvisory.riskSummary.level}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{currentAdvisory.riskSummary.primaryRisk}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Detailed Analysis Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Technical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Water Quality & Irrigation
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentAdvisory.detailedReport.waterQualityAnalysis}
                    </p>
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 mt-2">
                       <p className="text-xs italic">{currentAdvisory.detailedReport.irrigationRecommendations}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary" />
                      Fertilizer & Soil Health
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentAdvisory.detailedReport.fertilizerRecommendations}
                    </p>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mt-2">
                       <p className="text-xs italic">{currentAdvisory.detailedReport.soilManagementTips}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      Yield Optimization Tips
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2 mt-2">
                      {currentAdvisory.detailedReport.yieldOptimizationTips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <div className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Smart Tasks Side Panel */}
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Priority Tasks</CardTitle>
                  <CardDescription>Actions based on computed farm chemistry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentAdvisory.smartTasks.map((task, i) => (
                    <div key={i} className={`p-4 rounded-lg border flex flex-col gap-2 ${
                      task.priority === 'High' ? 'bg-destructive/5 border-destructive/20' : 'bg-background border-muted'
                    }`}>
                      <div className="flex justify-between items-start">
                        <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-[9px] uppercase">
                          {task.priority}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Due: {task.dueInDays}d</span>
                      </div>
                      <h4 className="text-sm font-bold leading-tight">{task.title}</h4>
                      <p className="text-[10px] text-muted-foreground leading-snug">{task.rationale}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {currentAdvisory.detailedReport.seasonalAlerts && (
                <Alert className="border-accent/40 bg-accent/5">
                  <Zap className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-xs font-bold uppercase">Seasonal Alert</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">
                    {currentAdvisory.detailedReport.seasonalAlerts}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-8">
            <p className="text-[10px] text-muted-foreground italic text-center max-w-2xl px-4">
              {currentAdvisory.disclaimer}
            </p>
            <div className="flex items-center gap-4">
               <Button variant="outline" className="gap-2 text-xs">
                 <Download className="h-4 w-4" />
                 Download PDF Report
               </Button>
               <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                 <Database className="h-3 w-3" />
                 Report Instance: {farmData?.id || 'demo'}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
