"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Cpu, 
  Database, 
  Zap, 
  ArrowRight, 
  Activity,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Droplets,
  Thermometer,
  Wind,
  Layers
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    const interval = setInterval(() => {
      const activeSensors = sensors.filter(s => s.active);
      if (activeSensors.length === 0) return;

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
    }, 3000);

    return () => clearInterval(interval);
  }, [sensors]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Telemetry Pipeline</h1>
          <p className="text-muted-foreground">Manage connected sensors and visualize edge-to-AI telemetry processing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 border-primary/20">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
            Stream: {sensors.filter(s => s.active).length} Active Sensors
          </Badge>
        </div>
      </div>

      {/* Sensor Management Section */}
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Sensor Management
          </CardTitle>
          <CardDescription>Toggle virtual sensors to simulate different farm telemetry streams.</CardDescription>
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
                   <Badge variant="secondary" className="text-[10px] w-fit">CONNECTED</Badge>
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
            <h3 className="font-bold text-sm uppercase tracking-widest">Stage 1: Raw Input</h3>
          </div>
          {stream.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <p className="text-xs text-muted-foreground italic">Connect a sensor to start stream</p>
            </div>
          ) : stream.map((entry) => (
            <Card key={entry.id} className={`border-l-4 transition-all duration-500 ${entry.status === 'error' ? 'border-l-destructive' : 'border-l-primary'}`}>
              <CardContent className="p-4 flex justify-between items-center">
                 <div className="space-y-1">
                   <div className="text-[10px] font-mono text-muted-foreground">ENTRY: {entry.id} | {entry.time}</div>
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
               <RefreshCw className="h-32 w-32 animate-spin-slow" />
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
                   PIPELINE ACTIVE: Normalizing {sensors.filter(s => s.active).length} telemetry channels...
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
          <Card className="border-accent/20 bg-accent/5 overflow-hidden shadow-lg shadow-accent/5">
             <div className="h-1 bg-accent w-full animate-pulse" />
             <CardContent className="p-6 space-y-4">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Pre-computed NIR:</span>
                 <span className="font-bold">4.8 mm/day</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Maas-Hoffman Penalty:</span>
                 <span className="font-bold">0.0% (Safe)</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Soil Structural Risk:</span>
                 <span className="font-bold text-accent">LOW</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">Connected Channels:</span>
                 <div className="flex gap-1">
                   {sensors.filter(s => s.active).map(s => (
                     <Badge key={s.id} variant="outline" className="text-[8px] px-1 py-0">{s.name.split(' ')[0]}</Badge>
                   ))}
                 </div>
               </div>
               <div className="pt-4 mt-4 border-t border-accent/10">
                 <div className="text-[10px] text-muted-foreground mb-2">GEMINI ANALYSIS CONTEXT:</div>
                 <div className="text-[10px] font-mono p-2 bg-background rounded border border-accent/20">
                   "Analyze {sensors.filter(s => s.active).map(s => s.name).join(', ')} data against farm profile..."
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
