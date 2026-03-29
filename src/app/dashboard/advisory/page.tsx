"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, doc, setDoc, serverTimestamp, collection, addDoc } from "@/firebase";
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
  ShieldAlert,
  ThermometerSun,
  FlaskConical,
  Dna,
  TrendingUp,
  Target
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdvisoryPage() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [localReport, setLocalReport] = useState<AdvisoryOutput | null>(null);

  const userUid = firebaseUser?.uid || (session?.user as any)?.id;

  const farmRef = useMemoFirebase(() => {
    if (!db || !userUid) return null;
    return doc(db, "users", userUid, "farms", "primary");
  }, [db, userUid]);

  const { data: farmData } = useDoc(farmRef);
  const farmName = farmData?.name || "Patil Farm";

  const handleGenerateReport = async () => {
    if (!userUid) return;
    setIsGenerating(true);
    
    try {
      const result = await generateInsights(userUid, farmData);
      
      // PERSIST RESULTS
      if (db) {
        try {
          const farmRef = doc(db, "users", userUid, "farms", "primary");
          await setDoc(farmRef, {
            lastComputedInsights: result.computed,
            latestAdvisory: result.advisory,
            computedPlots: result.computedPlots,
            parsedReports: result.parsedReports,
            updatedAt: serverTimestamp()
          }, { merge: true });

          // ALso save a distinct copy to advisory_reports!
          const reportsRef = collection(db, "users", userUid, "advisory_reports");
          await addDoc(reportsRef, {
            ...result.advisory,
            advisorySummary: result.advisory?.predictedYieldSummary?.subtitle || "General Advisory Analysis",
            waterOptimization: result.advisory?.waterNeedsSummary?.nextIrrigationText || "Water check required",
            generatedAt: serverTimestamp()
          });

        } catch (fsError) {
          console.error("Firestore persistence error:", fsError);
        }
      }

      // LOCAL BROWSER CACHE FALLBACK FOR DATABASE EXPLORER
      const newAdvisoryRecord = {
        id: "loc_" + Math.random().toString(36).substr(2, 9),
        ...result.advisory,
        advisorySummary: result.advisory?.predictedYieldSummary?.subtitle || "General Advisory Analysis",
        waterOptimization: result.advisory?.waterNeedsSummary?.nextIrrigationText || "Water check required",
        generatedAt: new Date().toISOString()
      };

      try {
        const existingReportsStr = localStorage.getItem('demo_advisory_reports');
        const existingReports = existingReportsStr ? JSON.parse(existingReportsStr) : [];
        existingReports.unshift(newAdvisoryRecord); // Add to beginning
        localStorage.setItem('demo_advisory_reports', JSON.stringify(existingReports));
      } catch (lsErr) {
        console.error("Local storage advisory history save error:", lsErr);
      }

      localStorage.setItem('demo_farm', JSON.stringify({
        ...farmData,
        lastComputedInsights: result.computed,
        latestAdvisory: result.advisory,
        computedPlots: result.computedPlots,
        parsedReports: result.parsedReports,
        updatedAt: new Date().toISOString()
      }));

      setLocalReport(result.advisory);
      toast({
        title: "Differentiated Report Ready",
        description: "Your Patil Farm plot-level scientific advisory has been updated.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failure",
        description: error.message || "Ensure plot profiles are complete.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const currentAdvisory = localReport || farmData?.latestAdvisory;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary font-black uppercase tracking-widest bg-primary/5">
             Patil Farm Intelligence System
          </Badge>
          <h1 className="text-3xl font-black font-headline text-foreground leading-tight">Scientific Plot-Advisory Report</h1>
          <p className="text-muted-foreground font-medium italic">Precision guidance organized per individual plot segments.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
            Regenerate Multi-Plot Insights
          </Button>
        </div>
      </div>

      {!farmData?.lastComputedInsights && (
        <Alert className="bg-accent/10 border-accent/20 p-6 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-accent" />
          <AlertTitle className="text-lg font-bold">Dynamic Analysis Dependency</AlertTitle>
          <AlertDescription className="mt-2 text-muted-foreground">
             Patil Farm's plot-specific dashboard content requires a valid water or soil lab report. Processing will derive unique insights per plot based on chemical levels and planting dates.
          </AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="relative">
             <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
             <div className="relative h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
               <Loader2 className="h-10 w-10 animate-spin" />
             </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-headline font-black text-xl uppercase tracking-widest text-primary animate-pulse">Running Scientific Simulation</p>
            <p className="text-muted-foreground text-sm font-medium">Applying differentiation models to Patil Farm plots...</p>
          </div>
        </div>
      )}

      {!currentAdvisory && !isGenerating && (
        <Card className="border-dashed flex flex-col items-center justify-center p-20 bg-muted/20 rounded-3xl border-2 border-primary/10 transition-colors hover:bg-muted/30">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-black mb-2 font-headline">No Advisory Dossier Found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8 font-medium">
            Initiate a full scan to generate separate dashboard content and risk assessments for each plot.
          </p>
          <Button variant="outline" size="lg" className="px-10 border-primary/20 hover:bg-primary/5 font-bold" onClick={handleGenerateReport}>Execute Analysis</Button>
        </Card>
      )}

      {currentAdvisory && !isGenerating && (
        <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          
          {/* Farm-Level Identity Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
               <div className="absolute right-0 top-0 opacity-10 p-2"><TrendingUp className="h-12 w-12" /></div>
               <CardContent className="pt-8">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Integrated Farm Yield</p>
                 <div className="text-4xl font-black text-primary">{currentAdvisory?.predictedYieldSummary?.display || "--"}</div>
                 <p className="text-[10px] text-muted-foreground mt-2 font-bold">{currentAdvisory?.predictedYieldSummary?.subtitle}</p>
               </CardContent>
             </Card>
             <Card className="bg-blue-500/5 border-blue-500/20 overflow-hidden relative">
               <div className="absolute right-0 top-0 opacity-10 p-2"><Droplets className="h-12 w-12" /></div>
               <CardContent className="pt-8">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Corporate Water Resource</p>
                 <div className="text-3xl font-black text-blue-600 shrink-0">{currentAdvisory?.waterNeedsSummary?.level || "--"}</div>
                 <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter truncate">{currentAdvisory?.waterNeedsSummary?.nextIrrigationText}</p>
               </CardContent>
             </Card>
             <Card className="bg-accent/5 border-accent/20 overflow-hidden relative">
               <div className="absolute right-0 top-0 opacity-10 p-2"><CheckSquare className="h-12 w-12" /></div>
               <CardContent className="pt-8">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Integrated Soil Health</p>
                 <div className="text-3xl font-black text-accent-foreground">{currentAdvisory?.soilHealthSummary?.score ?? "--"}/10</div>
                 <p className="text-[10px] text-muted-foreground mt-2 font-bold">{currentAdvisory?.soilHealthSummary?.label}</p>
               </CardContent>
             </Card>
             <Card className={currentAdvisory?.riskSummary?.level === 'High' ? "bg-destructive/5 border-destructive/20" : "bg-muted/10 border-muted/50"}>
               <CardContent className="pt-8">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Global Hazard Status</p>
                 <div className={`text-3xl font-black ${currentAdvisory?.riskSummary?.level === 'High' ? 'text-destructive' : 'text-foreground'}`}>
                   {currentAdvisory?.riskSummary?.level || "--"}
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-2 font-bold truncate uppercase">{currentAdvisory?.riskSummary?.primaryRisk}</p>
               </CardContent>
             </Card>
          </div>

          <div className="space-y-12 pt-8">
            <div className="flex items-center gap-4 justify-between border-b-4 border-primary/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Dna className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black font-headline tracking-tight uppercase">Segmented Plot Analysis</h2>
                  <p className="font-medium text-muted-foreground italic">Discrete technical depth for Patil Farm's individual production units.</p>
                </div>
              </div>
              <Badge variant="secondary" className="px-6 py-2 bg-primary/10 text-primary border-none text-xs font-bold uppercase hidden md:flex">
                Proprietary Patil Farm Model
              </Badge>
            </div>
            
            <div className="grid gap-20">
              {(currentAdvisory?.plots?.length ?? 0) > 0 ? (
                currentAdvisory?.plots?.map((plot: any, idx: number) => (
                  <div key={idx} className="space-y-8 animate-in slide-in-from-left-6 duration-700" style={{ animationDelay: `${idx * 200}ms` }}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-8 border-primary pl-8 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-3xl font-black tracking-tighter uppercase">{plot.plotName}</h3>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">{plot.size} Acres</Badge>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full">
                            <Sprout className="h-3 w-3" /> {plot.cropType}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary/80 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                            <Database className="h-3 w-3" /> Variety: {plot.variety}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Growth Phase Analysis</p>
                         <Badge variant="outline" className="text-lg px-4 py-1.5 border-primary/20 text-primary font-black uppercase">{plot.growthStage}</Badge>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-10">
                      {/* Deep Technical Analysis */}
                      <Card className="lg:col-span-8 border-primary/5 shadow-xl bg-gradient-to-br from-background to-muted/20 relative group hover:border-primary/20 transition-all duration-300 rounded-3xl overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary/60 to-transparent" />
                        <CardHeader className="bg-muted/10 border-b border-primary/5 py-5 px-8">
                          <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-foreground/80">
                             <FlaskConical className="h-5 w-5 text-primary" />
                             Technical Performance & Differentiated Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-lg text-muted-foreground leading-relaxed font-serif italic text-foreground/90 leading-loose border-l-2 border-muted pl-8">
                              {plot.detailedPlotReport?.analysis}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-primary/10">
                            <div className="p-5 rounded-2xl bg-background border shadow-sm group/met">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest group-hover/met:text-primary transition-colors">Yield Potential</p>
                               <div className="text-2xl font-black text-primary">{plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.predictedYieldSummary?.display : "PENDING"}</div>
                               <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 opacity-70">{plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.predictedYieldSummary?.subtitle : "LAB REPORT REQUIRED"}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-background border shadow-sm group/met">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest group-hover/met:text-blue-600 transition-colors">Water Budget</p>
                               <div className="text-2xl font-black text-blue-600">{plot.waterNeedsSummary?.level !== "Medium" || plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.waterNeedsSummary?.level : "PENDING"}</div>
                               <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 opacity-70">{plot.waterNeedsSummary?.nextIrrigationText !== "DSP-Adjusted: 0 Days" ? plot.waterNeedsSummary?.nextIrrigationText : "ANALYSIS REQUIRED"}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-background border shadow-sm group/met">
                               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest group-hover/met:text-accent-foreground transition-colors">Soil Integrity</p>
                               <div className="text-2xl font-black text-accent-foreground">{plot.soilHealthSummary?.score !== 0 ? `${plot.soilHealthSummary?.score}/10` : "PENDING"}</div>
                               <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 opacity-70">{plot.soilHealthSummary?.label || "WAITING"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Focused Risk & Priorities */}
                      <div className="lg:col-span-4 space-y-8">
                        {/* Thermal Hazard Modeling */}
                        <Card className="border-orange-500/10 bg-orange-500/5 shadow-xl rounded-2xl overflow-hidden shadow-orange-500/5 hover:shadow-orange-500/10 transition-shadow">
                          <div className="bg-orange-500/10 py-3 px-6 border-b border-orange-500/10">
                            <CardTitle className="text-[11px] font-black flex items-center gap-2 text-orange-700 uppercase tracking-widest">
                               <ThermometerSun className="h-4 w-4" />
                               Dynamic Temperature-Risk Index
                            </CardTitle>
                          </div>
                          <CardContent className="p-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-500/5">
                              <p className="text-sm font-medium text-muted-foreground italic leading-relaxed text-slate-700">
                                {plot.detailedPlotReport?.temperatureRiskAssessment}
                              </p>
                            </div>
                            <div className="mt-8 flex items-center justify-between border-t border-orange-500/10 pt-6">
                               <div className="space-y-1">
                                 <p className="text-[9px] font-black uppercase text-orange-800 tracking-widest">Current Multi-Factor Risk</p>
                                 <p className="text-xs font-bold text-orange-700">{plot.riskSummary?.primaryRisk}</p>
                               </div>
                               <Badge className={plot.riskSummary?.level === 'High' ? 'bg-destructive px-4 py-1 text-[10px] font-black uppercase tracking-widest' : 'bg-orange-500 px-4 py-1 text-[10px] font-black uppercase tracking-widest'}>
                                 {plot.riskSummary?.level}
                               </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Top Direct Actions */}
                        <Card className="border-primary/10 shadow-xl rounded-2xl">
                           <div className="bg-primary/10 py-3 px-6 border-b border-primary/10">
                             <CardTitle className="text-[11px] font-black flex items-center gap-2 text-primary uppercase tracking-widest">
                               <CheckSquare className="h-4 w-4" />
                               Localized Action Protocols
                             </CardTitle>
                          </div>
                          <CardContent className="p-6">
                             <div className="space-y-4">
                                {plot.smartTasks?.map((task: any, i: number) => (
                                   <div key={i} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] cursor-default ${
                                     task.priority === 'High' ? 'bg-destructive/5 border-destructive/20 shadow-lg shadow-destructive/5' : 'bg-background border-primary/5 shadow-sm'
                                   }`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-black text-sm uppercase tracking-tight leading-none">{task.title}</span>
                                        <Badge variant="outline" className="text-[8px] border-muted px-2 py-0 uppercase font-black">DSP_REF_{idx+1}</Badge>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{task.rationale}</p>
                                   </div>
                                ))}
                             </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border-4 rounded-[3rem] bg-muted/10 border-dashed border-primary/5">
                  <Sprout className="h-16 w-16 text-primary/20 mx-auto mb-6" />
                  <p className="text-xl font-bold text-muted-foreground uppercase tracking-widest opacity-50">Empty Multi-Plot Queue</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-10 pt-20 border-t-8 border-primary/5 mt-16 pb-20">
            <div className="md:col-span-2 space-y-10">
              {/* Comprehensive Summary Identity */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tight">Macro-Integrity Modeling</h2>
                <div className="h-1.5 w-24 bg-primary rounded-full" />
              </div>
              
              <Card className="border-primary/5 shadow-2xl rounded-[2.5rem] bg-gradient-to-b from-background to-primary/5 overflow-hidden">
                <CardContent className="p-12 space-y-10">
                  <div className="space-y-4">
                    <h4 className="text-lg font-black flex items-center gap-3 uppercase tracking-wider">
                      <Droplets className="h-6 w-6 text-blue-500" />
                      Regional Water Source Profile
                    </h4>
                    <p className="text-md text-muted-foreground leading-[1.8] font-medium p-8 bg-background/80 backdrop-blur-sm rounded-3xl border shadow-inner">
                      {currentAdvisory?.detailedReport?.waterQualityAnalysis}
                    </p>
                    <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 mt-4">
                       <p className="text-sm italic text-blue-800 font-black uppercase tracking-widest text-center">Global Recommendation: {currentAdvisory?.detailedReport?.irrigationRecommendations}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-black flex items-center gap-3 uppercase tracking-wider">
                      <Sprout className="h-6 w-6 text-primary" />
                      Integrated Growth Matrix
                    </h4>
                    <p className="text-md text-muted-foreground leading-relaxed font-medium pl-10 border-l-4 border-primary/20">
                      {currentAdvisory?.detailedReport?.fertilizerRecommendations}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black flex items-center gap-3 text-destructive uppercase tracking-wider">
                      <ShieldAlert className="h-6 w-6" />
                      Advanced Optimization Layer
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-6 mt-4">
                      {currentAdvisory?.detailedReport?.yieldOptimizationTips?.map((tip: string, i: number) => (
                        <li key={i} className="text-xs font-bold text-muted-foreground bg-background p-6 rounded-3xl border-2 border-primary/5 flex items-start gap-4 shadow-md transition-all hover:border-primary/20 hover:bg-primary/5">
                          <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-black shrink-0 shadow-lg shadow-primary/20">
                            {i+1}
                          </div>
                          <span className="leading-relaxed opacity-90">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tight">Environmental</h2>
                <div className="h-1.5 w-16 bg-accent rounded-full" />
              
              <Card className="bg-gradient-to-br from-primary/20 to-accent/10 border-none shadow-2xl rounded-[2.5rem] overflow-hidden sticky top-8">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-xl font-black uppercase tracking-widest">Farm-Wide Dossier</CardTitle>
                  <CardDescription className="text-xs font-bold font-serif opacity-70">Unified data aggregate for Patil Farm.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-6">
                  <div className="p-6 rounded-3xl bg-background/60 backdrop-blur-md border border-white/20 shadow-xl space-y-3">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Consolidated Chemical Score</p>
                     <div className="flex items-center gap-4">
                        <div className="text-4xl font-black text-primary tracking-tighter">{currentAdvisory?.waterQualityScore?.score}/100</div>
                        <Badge className="bg-primary px-3 py-1 font-black uppercase text-[10px]">{currentAdvisory?.waterQualityScore?.label}</Badge>
                     </div>
                     <p className="text-[10px] text-muted-foreground font-bold italic">{currentAdvisory?.waterQualityScore?.subtitle}</p>
                  </div>

                  {currentAdvisory?.detailedReport?.seasonalAlerts && (
                    <Alert className="border-orange-500/40 bg-white/40 backdrop-blur-md rounded-3xl p-6">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <div className="ml-4">
                        <AlertTitle className="text-[10px] font-black uppercase text-orange-800 tracking-widest mb-1">Seasonal Hazard Override</AlertTitle>
                        <AlertDescription className="text-xs leading-relaxed font-bold text-slate-800">
                          {currentAdvisory.detailedReport.seasonalAlerts}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="pt-6 space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">System-Wide Priorities</p>
                    {currentAdvisory?.smartTasks?.map((task: any, i: number) => (
                      <div key={i} className="p-5 rounded-3xl border bg-background/40 backdrop-blur-sm text-xs space-y-2 hover:bg-background/60 transition-colors shadow-sm">
                        <p className="font-black text-primary uppercase leading-tight">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic line-clamp-2">{task.rationale}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-20 border-t-2 border-muted border-dashed space-y-12 pb-20">
            <Card className="border-primary/20 bg-primary/5 shadow-xl rounded-[2.5rem] overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-8 animate-in zoom-in duration-500">
               <div className="flex-1 space-y-3">
                 <div className="flex items-center gap-3 text-primary">
                    <TrendingUp className="h-8 w-8" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Strategic Cultivation Roadmap</h3>
                 </div>
                 <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-xl">
                   Go beyond daily tasks. Trigger our <b>Senior Agronomist AI</b> to synthesize your plot's chemical profile with Agmarknet market prices and GDD thermal modeling for a total 7-step planning strategy.
                 </p>
               </div>
               <Button size="lg" className="h-16 px-10 font-black uppercase shadow-xl shadow-primary/30 shrink-0 text-lg gap-3" asChild>
                 <Link href="/dashboard/cultivation-strategy">
                   <Target className="h-6 w-6" />
                   Generate Final Strategy
                 </Link>
               </Button>
            </Card>
            <p className="text-[10px] text-muted-foreground font-bold italic text-center max-w-2xl mx-auto px-8 opacity-60 uppercase tracking-widest leading-loose">
              {currentAdvisory?.disclaimer}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
               <Button variant="outline" size="lg" className="gap-3 text-xs font-black uppercase border-primary/30 hover:bg-primary/5 h-14 px-10 rounded-2xl shadow-md">
                 <Download className="h-5 w-5" />
                 Download Comprehensive Patil Farm Dossier
               </Button>
               <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-muted/50 border border-muted px-8 h-14 rounded-2xl font-black uppercase tracking-widest">
                 <Database className="h-4 w-4" />
                 INST_REF: {farmData?.id || 'YIQ-' + Math.random().toString(36).substr(2, 6).toUpperCase()}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
