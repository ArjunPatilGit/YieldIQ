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
  RefreshCw,
  Droplets,
  Thermometer,
  Layers,
  LineChart,
  Binary
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Sensor {
  id: string;
  name: string;
  type: string;
  unit: string;
  base: number;
  variance: number;
  active: boolean;
  icon: any;
}

export default function DataPipelinePage() {
  const [stream, setStream] = useState<any[]>([]);
  const [isCrunching, setIsCrunching] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([
    { id: "ph-1", name: "pH Sensor", type: "Chemistry", unit: "", base: 7.4, variance: 0.4, active: true, icon: Database },
    { id: "ec-1", name: "EC Sensor", type: "Salinity", unit: "µS/cm", base: 780, variance: 40, active: true, icon: Zap },
    { id: "sm-1", name: "Soil Moisture", type: "Hydrology", unit: "%", base: 28, variance: 5, active: false, icon: Droplets },
    { id: "at-1", name: "Air Temp", type: "Ambient", unit: "°C", base: 32, variance: 2, active: false, icon: Thermometer },
    { id: "npk-1", name: "NPK Index", type: "Nutrient", unit: "/100", base: 65, variance: 10, active: false, icon: Layers },
  ]);

  const toggleSensor = (id: string) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  useEffect(() => {
    // 5 second heartbeat as requested
    const interval = setInterval(() => {
      const activeSensors = sensors.filter(s => s.active);
      if (activeSensors.length === 0) return;

      setIsCrunching(true);
      
      const readings = activeSensors.reduce((acc, sensor) => {
        acc[sensor.id] = (sensor.base + (Math.random() - 0.5) * sensor.variance).toFixed(sensor.base < 10 ? 2 : 0);
        return acc;
      }, {} as any);

      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        readings,
        status: Math.random() > 0.95 ? 'error' : 'raw'
      };

      setStream(prev => [logEntry, ...prev].slice(0, 5));
      
      // Reset crunching animation after 2s
      setTimeout(() => setIsCrunching(false), 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, [sensors]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Intelligence Pipeline</h1>
          <p className="text-muted-foreground">Witness the raw telemetry being standardizing and normalized for AI analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-2 px-3 py-1 ${isCrunching ? 'bg-accent/20 border-accent' : 'bg-primary/5 border-primary/20'}`}>
            <Activity className={`h-3 w-3 ${isCrunching ? 'text-accent animate-spin' : 'text-primary animate-pulse'}`} />
            {isCrunching ? 'CRUNCHING BATCH...' : `Connected: ${sensors.filter(s => s.active).length} Sensors`}
          </Badge>
        </div>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Layers className="h-5 w-5 text-primary" />
            Active Sensor Management
          </CardTitle>
          <CardDescription>Only toggled sensors will contribute to the real-time AI batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {sensors.map((sensor) => (
              <div key={sensor.id} className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${sensor.active ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/30 border-muted opacity-60'}`}>
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg ${sensor.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <sensor.icon className="h-4 w-4" />
                  </div>
                  <Switch 
                    checked={sensor.active} 
                    onCheckedChange={() => toggleSensor(sensor.id)} 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{sensor.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{sensor.type}</p>
                </div>
                {sensor.active && (
                   <Badge variant="secondary" className="text-[10px] w-fit">ACTIVE STREAM</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Column 1: Raw Stream */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Stage 1: Raw Stream</h3>
          </div>
          {stream.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <p className="text-xs text-muted-foreground italic">Connect a sensor to start stream</p>
            </div>
          ) : stream.map((entry) => (
            <Card key={entry.id} className={`border-l-4 transition-all duration-500 ${entry.status === 'error' ? 'border-l-destructive' : 'border-l-primary'}`}>
              <CardContent className="p-4 flex justify-between items-center">
                 <div className="space-y-1">
                   <div className="text-[10px] font-mono text-muted-foreground">ID: {entry.id} • {entry.time}</div>
                   <div className="flex flex-wrap gap-2">
                      {Object.entries(entry.readings).map(([id, val]) => {
                        const sensor = sensors.find(s => s.id === id);
                        return (
                          <span key={id} className="text-xs font-bold">
                            {sensor?.name.split(' ')[0]}: {val}{sensor?.unit}
                          </span>
                        );
                      })}
                   </div>
                 </div>
                 {entry.status === 'error' ? (
                   <AlertTriangle className="h-4 w-4 text-destructive animate-bounce" />
                 ) : (
                   <div className={`h-2 w-2 rounded-full bg-primary ${isCrunching && entry.id === stream[0].id ? 'animate-ping' : ''}`} />
                 )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 2: Scientific Preprocessing */}
        <div className="flex flex-col items-center">
           <div className="flex items-center gap-2 mb-6 w-full">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Stage 2: Crunching</h3>
          </div>
          <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-6 relative overflow-hidden">
             {isCrunching && (
               <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-progress" />
             )}
             
             {[
               { label: "Data Cleaning", icon: RefreshCw },
               { label: "Standardization (IS-10500)", icon: Binary },
               { label: "Channel Normalization", icon: LineChart },
               { label: "Anomaly Mitigation", icon: ShieldCheck }
             ].map((step, i) => (
               <div key={i} className="relative z-10 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isCrunching ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  <step.icon className={`h-4 w-4 text-primary transition-opacity ${isCrunching ? 'opacity-100 animate-pulse' : 'opacity-30'}`} />
               </div>
             ))}
             
             <div className="pt-4 border-t border-primary/10">
                <div className="text-[10px] font-mono text-primary flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                   {isCrunching ? 'CALCULATING VARIANCES...' : 'PIPELINE READY'}
                </div>
             </div>
          </div>
          
          <div className="flex flex-col items-center mt-4">
            <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-mono text-accent-foreground mb-2">
              PRE-AI ANALYSIS CONTEXT:
            </div>
            <div className="text-[10px] italic text-muted-foreground text-center max-w-[200px] mb-2">
              "Assemble normalized stream from {sensors.filter(s => s.active).map(s => s.name.split(' ')[0]).join(', ')}..."
            </div>
            <ArrowRight className="h-8 w-8 text-primary rotate-90 lg:rotate-0" />
          </div>
        </div>

        {/* Column 3: AI Ready Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-accent">Stage 3: Predictions</h3>
          </div>
          <Card className="border-accent/20 bg-accent/5 overflow-hidden shadow-lg">
             <div className="h-1 bg-accent w-full animate-pulse" />
             <CardContent className="p-6 space-y-4">
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-bold text-muted-foreground">Yield Potential</p>
                 <div className="text-xl font-bold text-foreground">
                   {isCrunching ? '--' : '4.2 Tons/ha'}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[10px] text-muted-foreground">Water Demand</p>
                   <p className="text-sm font-bold">4.8 mm/day</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-muted-foreground">Soil Health</p>
                   <p className="text-sm font-bold text-accent">STABLE</p>
                 </div>
               </div>

               <div className="pt-4 mt-4 border-t border-accent/10 space-y-3">
                 <div className="p-3 bg-background rounded-lg border border-accent/20">
                    <p className="text-[10px] font-bold text-primary mb-1 uppercase">AI Recommendation</p>
                    <p className="text-xs italic leading-relaxed">
                      "Based on standardized {sensors.find(s => s.id === 'ph-1')?.active ? 'pH' : ''} {sensors.find(s => s.id === 'ec-1')?.active ? '& EC' : ''} trends, irrigation is optimal for current growth stage."
                    </p>
                 </div>
                 <div className="flex justify-center">
                    <Badge variant="outline" className="text-[8px] border-accent/30 text-accent-foreground">
                      GEMINI-MODEL-FLASH-2.5
                    </Badge>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
