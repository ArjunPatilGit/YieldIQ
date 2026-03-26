"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  AlertCircle,
  Database
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdvisoryPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<PersonalizedFarmingAdvisoryOutput | null>(null);

  const farmRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "farms", "primary");
  }, [db, user]);

  const { data: farmData } = useDoc(farmRef);

  const generateReport = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    
    try {
      const input = {
        farmName: farmData?.name || "My Farm",
        cropType: farmData?.cropType || "Wheat",
        soilType: farmData?.soilType || "Loamy",
        location: farmData?.location || "Unknown",
        plantingDate: farmData?.plantingDate || new Date().toISOString().split('T')[0],
        currentStage: farmData?.growthStage || "Vegetative",
        recentObservations: "AI analysis requested based on current profile settings.",
        predictedYield: "Estimating...",
        predictedWaterNeeds: "Analyzing...",
        predictedFertilizerNeeds: "Calculating...",
      };

      const result = await personalizedFarmingAdvisory(input);
      setReport(result);

      // Save report to Firestore for administrative oversight
      const reportsCol = collection(db, "users", user.uid, "advisory_reports");
      addDoc(reportsCol, {
        ...result,
        generatedAt: serverTimestamp(),
        farmId: "primary",
      }).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${user.uid}/advisory_reports`,
          operation: 'create',
          requestResourceData: result
        }));
      });

      toast({
        title: "Report Generated",
        description: "Your personalized advisory has been saved to the cloud database.",
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to connect to YieldIQ AI service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">Personalized Advisory</h1>
          <p className="text-muted-foreground">AI-generated reports powered by your live cloud data.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={generateReport} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Generate New Report
          </Button>
        </div>
      </div>

      {!farmData && (
        <Alert className="bg-accent/10 border-accent/20">
          <AlertCircle className="h-4 w-4 text-accent" />
          <AlertTitle>Farm Profile Incomplete</AlertTitle>
          <AlertDescription>
            The AI uses your Farm Profile to generate accuracy. Please ensure your crop and soil details are set in the Farm Profile page.
          </AlertDescription>
        </Alert>
      )}

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
          <Alert className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
            <CheckSquare className="h-5 w-5 text-primary" />
            <AlertTitle className="font-bold">Executive Summary</AlertTitle>
            <AlertDescription className="text-foreground/80 leading-relaxed">
              {report.advisorySummary}
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-lg">Water Optimization</CardTitle>
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
                <CardTitle className="text-lg">Fertilizer Optimization</CardTitle>
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
                <CardTitle className="text-lg">Pest Management</CardTitle>
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
                <CardTitle className="text-lg">Storage & Planning</CardTitle>
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

          <div className="flex flex-col items-center gap-4 pt-4">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Full PDF Report
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              Saved to cloud collection: advisory_reports
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
