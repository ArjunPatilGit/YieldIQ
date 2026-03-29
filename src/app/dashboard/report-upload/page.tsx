"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, doc, setDoc, serverTimestamp } from "@/firebase";
import { generateInsights } from "@/app/actions/generate-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Zap, 
  FlaskConical,
  Beaker,
  Database,
  Droplets,
  Sprout,
  Trash2,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

export default function ReportUploadPage() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();

  const userUid = firebaseUser?.uid || (session?.user as any)?.id;

  const farmRef = useMemoFirebase(() => {
    if (!db || !userUid) return null;
    return doc(db, "users", userUid, "farms", "primary");
  }, [db, userUid]);

  const { data: farmData, isLoading: isFarmLoading } = useDoc(farmRef);

  const [plotReports, setPlotReports] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>("");

  const plots = farmData?.plots || [];
  const allUploaded = plots.length > 0 && Object.keys(plotReports).length === plots.length;

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setPlotReports(prev => ({ ...prev, [index]: base64 }));
      toast({
        title: `Report for Plot ${index + 1} Staged`,
        description: "File successfully read and ready for analysis.",
      });
    };
  };

  const removeReport = (index: number) => {
    const newReports = { ...plotReports };
    delete newReports[index];
    setPlotReports(newReports);
  };

  const handleRunAnalysis = async () => {
    if (!userUid || !allUploaded) return;

    setIsAnalyzing(true);
    setProgress(10);
    setStep("Orchestrating multi-plot analysis...");

    try {
      const reportsArray = plots.map((_: any, i: number) => plotReports[i]);
      
      setProgress(30);
      setStep("Extracting parameters across all plots...");
      
      const result = await generateInsights(userUid, farmData, reportsArray);
      
      setProgress(60);
      setStep("Generating differentiated agronomic models...");

      if (db && userUid) {
        try {
          const farmRef = doc(db, "users", userUid, "farms", "primary");
          await setDoc(farmRef, {
            lastComputedInsights: result.computed,
            latestAdvisory: result.advisory,
            computedPlots: result.computedPlots,
            parsedReports: result.parsedReports,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (fsError: any) {
          console.warn("Firestore write failed, using localStorage fallback:", fsError.message);
          // We continue to localStorage so the demo doesn't break
        }
      }

      localStorage.setItem('demo_farm', JSON.stringify({
         ...farmData,
         lastComputedInsights: result.computed,
         latestAdvisory: result.advisory,
         computedPlots: result.computedPlots,
         parsedReports: result.parsedReports,
         updatedAt: new Date().toISOString()
      }));
      
      setProgress(90);
      setStep("Finalizing precision results...");
      
      setTimeout(() => {
        setProgress(100);
        setStep("Dossier Complete!");
        toast({
          title: "Patil Farm Analysis Complete",
          description: "All plots have been analyzed with their unique lab data.",
        });
        router.push("/dashboard");
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setIsAnalyzing(false);
      toast({
        variant: "destructive",
        title: "Analysis Engine Halted",
        description: error.message || "A failure occurred during multi-plot parsing.",
      });
    }
  };

  if (isFarmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">No Plots Defined</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You must define your farm plots in the Farm Profile before uploading lab reports.
        </p>
        <Button asChild>
          <a href="/dashboard/farm-profile">Go to Farm Profile</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-foreground tracking-tight">PATIL FARM SCIENTIFIC UPLOAD</h1>
          <p className="text-muted-foreground font-medium italic">Mandatory plot-specific lab report submission for precision agriculture.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 font-bold uppercase tracking-widest">
          {plots.length} Plots Defined
        </Badge>
      </div>

      {isAnalyzing ? (
        <Card className="p-12 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative h-20 w-20 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Beaker className="h-10 w-10 animate-pulse" />
              </div>
            </div>
            <div className="w-full max-w-lg space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-black text-primary uppercase tracking-widest">{step}</span>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 shadow-inner" />
              <p className="text-center text-xs text-muted-foreground font-medium leading-relaxed">
                YieldIQ is performing hyper-localized chemical simulations for every plot on Patil Farm. <br />
                Using Google Gemini 1.5 Flash for high-fidelity extraction.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {plots.map((plot: any, index: number) => (
                <Card key={index} className={`border-primary/10 transition-all ${plotReports[index] ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-background'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">{plot.plotName || `Plot ${index + 1}`}</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {plot.cropType} • {plot.soilType}
                        </CardDescription>
                      </div>
                      {plotReports[index] ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Badge variant="destructive" className="text-[9px] uppercase font-black px-1.5 h-4">MANDATORY</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {plotReports[index] ? (
                        <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm">
                          <FileText className="h-6 w-6 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">Lab_Report_P{index+1}.data</p>
                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Ready for processing</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeReport(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <label 
                            htmlFor={`file-${index}`} 
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-all group"
                          >
                            <FileUp className="h-6 w-6 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload Report for Plot {index + 1}</span>
                            <input 
                              id={`file-${index}`} 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,image/*" 
                              onChange={(e) => handleFileChange(index, e)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-6 border-t">
              <Button 
                className="w-full h-16 text-lg font-black uppercase tracking-widest gap-3 shadow-xl"
                disabled={!allUploaded}
                onClick={handleRunAnalysis}
              >
                <Zap className="h-6 w-6" />
                EXECUTE SCIENTIFIC ANALYSIS
              </Button>
              {!allUploaded && (
                <p className="text-center text-xs text-muted-foreground font-bold italic mt-4 uppercase tracking-tighter">
                  Analysis locked. Please upload unique lab reports for all {plots.length} plots to continue.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-muted/30 border-primary/10">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  ANALYSIS CORE
                </CardTitle>
                <CardDescription className="text-xs">Precision outcomes from plot reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: FlaskConical, title: "Differentiated Yield", desc: "Non-identical $T/ha$ predictions" },
                  { icon: Droplets, title: "Discrete Water Budgets", desc: "Per-plot irrigation schedules" },
                  { icon: Sprout, title: "Growth Phoenix", desc: "Timeline: Planting to Harvest" },
                  { icon: AlertCircle, title: "Thermal Indexing", desc: "Real-time crop risk maps" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <item.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[9px] text-muted-foreground leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Alert className="bg-orange-500/5 border-orange-500/20">
               <Info className="h-4 w-4 text-orange-600" />
               <div className="ml-2">
                 <AlertTitle className="text-[10px] font-black uppercase text-orange-800 tracking-widest mb-1">Mandatory Policy</AlertTitle>
                 <AlertDescription className="text-[9px] leading-relaxed font-bold text-slate-800">
                   Patil Farm precision models require individualized plot data. Duplicate reports for different plots are strictly forbidden to maintain scientific integrity.
                 </AlertDescription>
               </div>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}
