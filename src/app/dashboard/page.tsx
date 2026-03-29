"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase, doc } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  ArrowRight,
  Loader2,
  Info,
  FileUp,
  FlaskConical,
  Sun,
  CloudRain,
  Sprout, 
  Zap, 
  FileText, 
  MapPin,
  ThermometerSun
} from "lucide-react";
import Link from "next/link";
import { YieldOverviewChart } from "@/components/dashboard/yield-overview-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();

  // Prefer NextAuth session if Firebase user isn't synced yet (for UI only)
  const displayUser = firebaseUser || session?.user;
  const userUid = firebaseUser?.uid || (session?.user as any)?.id;
  const userName = (displayUser as any)?.name || (displayUser as any)?.displayName || "Farmer";

  const farmRef = useMemoFirebase(() => {
    if (!db || !userUid) return null;
    return doc(db, "users", userUid, "farms", "primary");
  }, [db, userUid]);

  const { data: farmData, isLoading: isFarmLoading } = useDoc(farmRef);

  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  if (isFarmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const farmName = farmData?.name || "Patil Farm";
  const hasInsights = !!farmData?.lastComputedInsights;
  const advisory = farmData?.latestAdvisory;
  const insights = farmData?.lastComputedInsights;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase tracking-widest bg-primary/5">
              Patil Farm Infrastructure
            </Badge>
          </div>
          <h1 className="text-3xl font-bold font-headline text-foreground">
            {farmName} Overview
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <MapPin className="h-3 w-3" />
            {farmData?.location || "Bathinda Precision Hub"} • Micro-climate optimization active
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary/30 px-4 py-2 rounded-xl border border-primary/10 backdrop-blur-sm">
            <Sun className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold tracking-tight">32°C • Dynamic Monitoring</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 px-4 py-2 rounded-xl border border-primary/10 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">{today}</span>
          </div>
        </div>
      </div>

      {!hasInsights && (
        <Alert className="bg-primary/5 border-primary/20 p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FlaskConical className="h-24 w-24" />
          </div>
          <FlaskConical className="h-8 w-8 text-primary relative z-10" />
          <div className="ml-4 flex-1 relative z-10">
            <AlertTitle className="text-xl font-bold font-headline">Differentiated Plot Analysis Required</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <span className="max-w-xl text-muted-foreground leading-relaxed">
                Connect your Patil Farm lab reports to generate separate, dynamic dashboard content for each individual plot based on planting dates and soil chemistry.
              </span>
              <Button size="lg" className="shrink-0 gap-2 shadow-lg shadow-primary/20" asChild>
                <Link href="/dashboard/report-upload">
                  <FileUp className="h-4 w-4" />
                  Apply Lab Data
                </Link>
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Dynamic Plot Modules - Sequential */}
      {hasInsights && (advisory?.plots?.length ?? 0) > 0 && (
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b-2 border-primary/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shadow-sm">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-black font-headline tracking-tight uppercase text-foreground/90">Patil Farm Plot-Level Intelligence</h2>
            </div>
            <Badge variant="secondary" className="px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] bg-primary/5 text-primary border-primary/20">
              Unique Data Verified
            </Badge>
          </div>
          
          <div className="space-y-10">
            {advisory?.plots?.map((plot: any, idx: number) => (
              <div key={idx} className="relative group/plot">
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/20 rounded-full group-hover/plot:bg-primary transition-all duration-500" />
                <Card className="border-primary/10 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 bg-white border-none ring-1 ring-slate-200">
                  <div className="bg-slate-50/80 px-8 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
                        P{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase">{plot.plotName}</span>
                          <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-slate-300 bg-white shadow-sm">
                            {plot.variety}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase tracking-widest">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {plot.soilType} Profile
                          </p>
                          <div className="h-3 w-[1px] bg-slate-300" />
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                            {plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.predictedYieldSummary?.subtitle : "WAITING FOR LAB REPORT"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className="flex-1 sm:flex-none p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Source Veracity</p>
                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none">Unique Report P{idx+1}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                      {/* Metric Cluster */}
                      <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                        <div className="relative p-8 rounded-3xl bg-slate-900 text-white overflow-hidden shadow-2xl group/yield">
                          <div className="absolute right-0 top-0 p-8 opacity-20 group-hover/yield:scale-110 transition-transform duration-700">
                            <TrendingUp className="h-32 w-32" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Yield Potential</span>
                            </div>
                            <p className="text-6xl font-black tracking-tighter mb-4">{plot.predictedYieldSummary?.display}</p>
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md inline-flex items-center gap-3 border border-white/10">
                               <Sprout className="h-4 w-4 text-primary" />
                               <span className="text-[11px] font-black uppercase tracking-widest">{plot.predictedYieldSummary?.subtitle}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 shadow-sm">
                            <Droplets className="h-6 w-6 text-blue-600 mb-4" />
                            <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Water Budget</p>
                            <p className="text-2xl font-black text-blue-700">{plot.waterNeedsSummary?.level !== "Medium" || plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.waterNeedsSummary?.level : "PENDING"}</p>
                            <p className="text-[10px] text-blue-600/70 font-bold uppercase mt-1">{plot.waterNeedsSummary?.nextIrrigationText !== "DSP-Adjusted: 0 Days" ? plot.waterNeedsSummary?.nextIrrigationText : "ANALYSIS REQUIRED"}</p>
                          </div>
                          <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-sm">
                            <Sprout className="h-6 w-6 text-emerald-600 mb-4" />
                            <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Soil Status</p>
                            <p className="text-2xl font-black text-emerald-700">{plot.soilHealthSummary?.score !== 0 ? `${plot.soilHealthSummary?.score}/10` : "PENDING"}</p>
                            <p className="text-[10px] text-emerald-600/70 font-bold uppercase mt-1">{plot.soilHealthSummary?.label || "WAITING"}</p>
                          </div>
                          <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100 shadow-sm">
                            <AlertTriangle className="h-6 w-6 text-orange-600 mb-4" />
                            <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Hazard Index</p>
                            <p className="text-2xl font-black text-orange-700">{plot.riskSummary?.level !== "Moderate" || plot.predictedYieldSummary?.display !== "0 T/ha" ? plot.riskSummary?.level : "PENDING"}</p>
                            <p className="text-[10px] text-orange-600/70 font-bold uppercase mt-1">{plot.riskSummary?.primaryRisk !== "Pending Lab Report Analysis" ? plot.riskSummary?.primaryRisk : "UPLOAD REQUIRED"}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning & Risk */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex-1 p-8 rounded-3xl border border-slate-200 bg-slate-50 shadow-sm relative overflow-hidden group/risk">
                           <div className="absolute right-0 top-0 p-4 opacity-[0.03] group-hover/risk:rotate-12 transition-transform duration-700">
                             <ThermometerSun className="h-40 w-40" />
                           </div>
                           <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                             <ThermometerSun className="h-4 w-4 text-orange-500" />
                             Dynamic Temperature Risk: Plot {idx+1}
                           </h4>
                           <p className="text-base font-bold text-slate-800 leading-relaxed italic border-l-4 border-orange-400 pl-6 mb-8 uppercase tracking-tight">
                             "{plot.detailedPlotReport?.temperatureRiskAssessment}"
                           </p>
                           
                           <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                             Technical Reasoning (Differentiated)
                           </h4>
                           <p className="text-sm font-medium text-slate-600 leading-relaxed">
                             {plot.detailedPlotReport?.analysis}
                           </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Localized Action Protocols</h4>
                            <Badge className="bg-primary text-[9px] font-black uppercase px-2">{plot.smartTasks?.length} Ops</Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {plot.smartTasks?.map((task: any, i: number) => (
                               <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    task.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'
                                  }`}>
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 leading-none mb-1 uppercase tracking-tight truncate">{task.title}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter line-clamp-1">{task.category}</p>
                                  </div>
                                </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Dashboard View (Patil Farm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t-2 border-muted/50">
        <Card className={hasInsights ? "bg-primary shadow-lg text-primary-foreground border-none" : "opacity-60"}>
          <CardContent className="pt-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Aggregate Farm Yield</p>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
            <div className="text-4xl font-black">{advisory?.predictedYieldSummary?.display || "--"}</div>
            <p className="text-[10px] mt-2 opacity-70 font-medium">
              Weighted Average across Patil Farm plots
            </p>
          </CardContent>
        </Card>

        {[
          { label: "Consolidated Water", value: advisory?.waterNeedsSummary?.level, sub: advisory?.waterNeedsSummary?.nextIrrigationText, icon: Droplets, color: "text-blue-600" },
          { label: "Composite Health", value: advisory?.soilHealthSummary?.score ? `${advisory.soilHealthSummary.score}/10` : "--", sub: advisory?.soilHealthSummary?.label, icon: CheckCircle2, color: "text-accent-foreground" },
          { label: "Integrated Risk", value: advisory?.riskSummary?.level, sub: advisory?.riskSummary?.primaryRisk, icon: AlertTriangle, color: "text-destructive" }
        ].map((stat, i) => (
          <Card key={i} className={hasInsights ? "shadow-md hover:shadow-lg transition-shadow" : "opacity-60"}>
            <CardContent className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <stat.icon className={`h-5 w-5 ${stat.color} opacity-80`} />
              </div>
              <div className="text-3xl font-black tracking-tight">{stat.value || "--"}</div>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold truncate uppercase">{stat.sub || "Waiting for data stream"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 pb-12">
        {/* Main Chart Card */}
        <Card className="lg:col-span-2 shadow-xl border-primary/5 bg-gradient-to-b from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="font-headline text-2xl font-black">Patil Farm Scientific Model</CardTitle>
              <CardDescription>Predictive yield simulations mapped against historical performance.</CardDescription>
            </div>
            {hasInsights && (
               <Badge className="bg-primary px-4 py-1 text-[10px] font-black tracking-widest uppercase">
                 AI Verified
               </Badge>
            )}
          </CardHeader>
          <CardContent>
            <YieldOverviewChart />
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="shadow-xl overflow-hidden bg-primary/5 border-primary/10 group">
          <CardHeader className="bg-primary/10 border-b border-primary/10">
            <CardTitle className="font-headline text-lg font-black flex items-center gap-3">
               <Zap className="h-5 w-5 text-primary" />
               Agronomy Intelligence
            </CardTitle>
            <CardDescription className="font-medium">Direct control of Patil Farm advisory systems.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-8">
            <Button className="w-full h-14 gap-3 text-lg font-bold group-hover:scale-[1.02] transition-transform" variant="outline" asChild>
              <Link href="/dashboard/cultivation-strategy">
                <Sprout className="h-5 w-5 text-primary" />
                Senior Agronomist Plan
              </Link>
            </Button>

            <Button className="w-full h-14 gap-3 text-lg font-bold group-hover:scale-[1.02] transition-transform" variant="outline" asChild>
              <Link href="/dashboard/advisory">
                <FileText className="h-5 w-5 text-primary" />
                Differentiated Reports
              </Link>
            </Button>
            
            <Button className="w-full h-14 gap-3 text-lg font-bold shadow-lg shadow-primary/20 group-hover:scale-[1.02] transition-transform" asChild>
              <Link href="/dashboard/assistant">
                <div className="p-1 bg-white/20 rounded">
                  <Zap className="h-5 w-5" />
                </div>
                Ask Global Agronomy AI
              </Link>
            </Button>

            <div className="pt-6 border-t border-primary/10 text-[11px] text-muted-foreground leading-relaxed italic font-medium">
              "Patil Farm utilizes real-time DSP (Days Since Planting) indexing and hyper-localized soil mapping for each individual plot dashboard."
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
