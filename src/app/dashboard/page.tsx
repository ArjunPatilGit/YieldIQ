"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
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
  CloudRain
} from "lucide-react";
import Link from "next/link";
import { YieldOverviewChart } from "@/components/dashboard/yield-overview-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const farmRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "farms", "primary");
  }, [db, user]);

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

  const hasInsights = !!farmData?.lastComputedInsights;
  const advisory = farmData?.latestAdvisory;
  const insights = farmData?.lastComputedInsights;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Welcome back, {user?.displayName?.split(' ')[0] || "Farmer"}
          </h1>
          <p className="text-muted-foreground">
            {farmData?.name ? `Farm: ${farmData.name}` : "Connect your data for AI-driven farming advice."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-lg border border-primary/10">
            <Sun className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">32°C • Clear</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg border border-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{today}</span>
          </div>
        </div>
      </div>

      {!hasInsights && (
        <Alert className="bg-primary/5 border-primary/20 p-6">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div className="ml-4 flex-1">
            <AlertTitle className="text-lg font-bold">Scientific Insights Ready for You</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <span className="max-w-xl text-muted-foreground">
                Upload your water or soil lab report to see your predicted yield and irrigation schedule tailored to your land.
              </span>
              <Button size="lg" className="shrink-0 gap-2" asChild>
                <Link href="/dashboard/report-upload">
                  <FileUp className="h-4 w-4" />
                  Upload Lab Report
                </Link>
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Simplified Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={hasInsights ? "bg-primary/5 border-primary/20 shadow-sm" : "opacity-60"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Yield Prediction</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{advisory?.predictedYieldSummary?.display || "--"}</div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {advisory?.predictedYieldSummary?.subtitle || "Awaiting lab report"}
            </p>
          </CardContent>
        </Card>

        <Card className={hasInsights ? "shadow-sm" : "opacity-60"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Water Needs</p>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{advisory?.waterNeedsSummary?.level || "--"}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{advisory?.waterNeedsSummary?.nextIrrigationText || "Waiting for data"}</p>
          </CardContent>
        </Card>

        <Card className={hasInsights ? "shadow-sm" : "opacity-60"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soil Health</p>
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div className="text-3xl font-bold">{advisory?.soilHealthSummary?.label || "--"}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{advisory?.soilHealthSummary?.score ? `Score: ${advisory.soilHealthSummary.score}/10` : "No data"}</p>
          </CardContent>
        </Card>

        <Card className={advisory?.riskSummary?.level === 'High' ? "bg-destructive/5 border-destructive/20" : "shadow-sm"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</p>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-3xl font-bold">{advisory?.riskSummary?.level || "--"}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{advisory?.riskSummary?.primaryRisk || "Safe conditions"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-xl">Harvest Forecast</CardTitle>
              <CardDescription>Comparison of your historical yield against AI predictions.</CardDescription>
            </div>
            {hasInsights && (
               <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                 Science Verified
               </Badge>
            )}
          </CardHeader>
          <CardContent>
            <YieldOverviewChart />
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
               Smart Tasks
               {hasInsights && <Badge className="ml-2 bg-primary">{advisory?.smartTasks?.length}</Badge>}
            </CardTitle>
            <CardDescription>Actions to take right now for better growth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasInsights ? (
              advisory?.smartTasks?.map((task: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors group">
                  <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${
                    task.priority === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'
                  }`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Priority: {task.priority}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                 <Info className="h-10 w-10 text-muted mx-auto mb-4" />
                 <p className="text-sm text-muted-foreground">Upload a lab report to see your tasks.</p>
              </div>
            )}
            
            <Button className="w-full mt-4" asChild>
              <Link href="/dashboard/advisory">Read Full Advice Report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
