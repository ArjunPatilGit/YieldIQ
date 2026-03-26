"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Database, 
  Zap, 
  ArrowRight, 
  Activity,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

export default function DataPipelinePage() {
  const [stream, setStream] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // Simulate live sensor data for the hackathon demo
  useEffect(() => {
    const interval = setInterval(() => {
      const reading = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        pH: (7.4 + Math.random() * 0.4).toFixed(2),
        EC: (780 + Math.random() * 40).toFixed(0),
        status: Math.random() > 0.9 ? 'error' : 'raw'
      };
      setStream(prev => [reading, ...prev].slice(0, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Live Data Pipeline</h1>
          <p className="text-muted-foreground">Visualizing real-time telemetry processing from edge to AI.</p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Activity className="h-3 w-3 text-primary animate-pulse" />
          Live Stream
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Column 1: Raw Stream */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Stage 1: Raw Input</h3>
          </div>
          {stream.map((r) => (
            <Card key={r.id} className={`border-l-4 ${r.status === 'error' ? 'border-l-destructive' : 'border-l-muted'}`}>
              <CardContent className="p-4 flex justify-between items-center">
                 <div className="space-y-1">
                   <div className="text-[10px] font-mono text-muted-foreground">ID: {r.id} | {r.time}</div>
                   <div className="text-xs font-bold">pH: {r.pH} | EC: {r.EC} µS/cm</div>
                 </div>
                 {r.status === 'error' ? (
                   <AlertTriangle className="h-4 w-4 text-destructive animate-bounce" />
                 ) : (
                   <Badge variant="secondary" className="text-[10px]">RAW</Badge>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 2: Preprocessing */}
        <div className="flex flex-col items-center">
           <div className="flex items-center gap-2 mb-6 w-full">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Stage 2: Processing</h3>
          </div>
          <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-8 relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <RefreshCw className="h-32 w-32 animate-spin" />
             </div>
             
             {[
               "Validation (IS-10500)",
               "Outlier Clamping",
               "Moving Average (k=5)",
               "Anomaly Detection"
             ].map((step, i) => (
               <div key={i} className="relative z-10 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
               </div>
             ))}
             
             <div className="pt-4 border-t border-primary/10">
                <div className="text-center text-[10px] font-mono text-primary animate-pulse">
                   SYSTEM LOG: pH outlier detected in buffer... clamping to 7.80
                </div>
             </div>
          </div>
          <ArrowRight className="h-10 w-10 text-primary my-4 rotate-90 lg:rotate-0" />
        </div>

        {/* Column 3: AI Ready */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-accent">Stage 3: AI Insights</h3>
          </div>
          <Card className="border-accent/20 bg-accent/5 overflow-hidden">
             <div className="h-1 bg-accent w-full animate-progress" />
             <CardContent className="p-6 space-y-4">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Pre-computed NIR:</span>
                 <span className="font-bold">4.8 mm/day</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Maas-Hoffman yr:</span>
                 <span className="font-bold">0% (Safe)</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Soil Structural Risk:</span>
                 <span className="font-bold text-accent">LOW</span>
               </div>
               <div className="pt-4 mt-4 border-t border-accent/10">
                 <div className="text-[10px] text-muted-foreground mb-2">LAST GEMINI PROMPT:</div>
                 <div className="text-[10px] font-mono p-2 bg-background rounded border border-accent/20 truncate">
                   "Interpret EC 794uS/cm for Wheat stage: development..."
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
