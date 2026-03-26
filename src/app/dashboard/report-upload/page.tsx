"use client";

import { useState, useRef } from "react";
import { useUser } from "@/firebase";
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
  Database
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ReportUploadPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setProgress(10);
    setStep("Reading report...");

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        setProgress(30);
        setStep("Extracting lab parameters with Gemini...");
        
        const result = await generateInsights(user.uid, base64);
        
        setProgress(70);
        setStep("Running agronomy models...");
        
        setTimeout(() => {
          setProgress(100);
          setStep("Analysis Complete!");
          toast({
            title: "Report Analyzed",
            description: "Your dashboard has been updated with new precision insights.",
          });
          router.push("/dashboard");
        }, 1500);
      };
    } catch (error: any) {
      console.error(error);
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to parse lab report.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Lab Report Analysis</h1>
        <p className="text-muted-foreground">Upload your water or soil report to derive scientific farm intelligence.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Upload Report
            </CardTitle>
            <CardDescription>Support PDF and high-res images of government or private lab reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors ${
                isUploading ? 'bg-muted/50 border-muted' : 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="w-full max-w-sm space-y-4">
                  <div className="flex items-center justify-center gap-3 text-primary animate-pulse">
                     <Beaker className="h-8 w-8" />
                     <span className="font-bold text-lg">{step}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-xs text-muted-foreground">
                    YieldIQ is interpreting IS-10500 standards for your farm...
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Click to browse or drag & drop</h3>
                  <p className="text-sm text-muted-foreground">PDF, PNG, JPG (Max 5MB)</p>
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".pdf,image/*" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>

            <Alert className="bg-accent/5 border-accent/20">
              <Zap className="h-4 w-4 text-accent" />
              <AlertTitle className="text-accent-foreground font-bold">Hackathon Demo Hack</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                Don't have a report? Use any document with "pH", "Conductivity", or "TDS" values to see the Gemini parsing engine in action.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">What we derive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {[
               { icon: FlaskConical, title: "Salinity Penalty", desc: "Maas-Hoffman yield reduction %" },
               { icon: Droplets, title: "Sodium Hazard", desc: "SAR & RSC calculations" },
               { icon: CheckCircle2, title: "Soil Structure", desc: "Permeability risks for Vertisols" },
               { icon: Database, title: "Drip Scaling", desc: "Hardness-based emitter risk" }
             ].map((item, i) => (
               <div key={i} className="flex gap-3">
                 <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-semibold">{item.title}</h4>
                   <p className="text-xs text-muted-foreground">{item.desc}</p>
                 </div>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
