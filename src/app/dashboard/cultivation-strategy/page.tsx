"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, doc, setDoc, serverTimestamp, useMemoFirebase } from "@/firebase";
import { generateCultivationStrategy } from "@/app/actions/generate-cultivation-strategy";
import { CultivationStrategyOutput } from "@/ai/flows/cultivation-strategy-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  Sprout, 
  Loader2, 
  MapPin, 
  BrainCircuit, 
  TrendingUp, 
  Flame,
  LineChart as LineChartIcon,
  Recycle,
  Satellite,
  Target,
  DollarSign,
  CalendarDays,
  PlayCircle,
  AlertCircle,
  FlaskConical,
  FileUp,
  Wallet,
  Landmark,
  CheckCircle2,
  Info,
  Coins,
  Bug,
  ListTodo,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
  Droplets,
  Zap
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";

export default function CultivationStrategyPage() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userUid = firebaseUser?.uid || (session?.user as any)?.id;

  const farmRef = useMemoFirebase(() => {
    if (!db || !userUid) return null;
    return doc(db, "users", userUid, "farms", "primary");
  }, [db, userUid]);

  const { data: farmData, isLoading: isFarmLoading } = useDoc(farmRef);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStrategy, setStrategy] = useState<CultivationStrategyOutput | null>(farmData?.cultivationStrategy || null);
  
  // Agronomic & Economic Profile State
  const [location, setLocation] = useState(farmData?.location || "");
  const [farmSize, setFarmSize] = useState<number>(farmData?.totalAreaHectares || 1);
  const [landTenure, setLandTenure] = useState<'Owned' | 'Leased' | 'Shared'>('Owned');
  const [irrigation, setIrrigation] = useState('Drip');
  const [soilType, setSoilType] = useState('Black');
  const [previousCrop, setPreviousCrop] = useState("");
  const [workingCapital, setWorkingCapital] = useState<number>(50000);
  const [creditAccess, setCreditAccess] = useState<boolean>(false);
  const [target, setTarget] = useState<'Maximum Yield' | 'Maximum Profit' | 'Soil Restoration' | 'Low-risk crop'>('Maximum Profit');
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  if (isFarmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!userUid) return;
    setIsGenerating(true);
    try {
      const generated = await generateCultivationStrategy(userUid, farmData, [], {
        location,
        farmSize,
        landTenure,
        irrigationInfrastructure: irrigation,
        soilType,
        previousCrop,
        workingCapital,
        creditAccess,
        target
      });
      
      // Persist in Cloud
      if (db) {
        try {
          const ref = doc(db, "users", userUid, "farms", "primary");
          await setDoc(ref, {
            cultivationStrategy: generated,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch(e) {
          console.warn("Storage restricted. Displaying local generated result.");
        }
      }

      // Persist Locally in Browser Cache (for Database Explorer without Cloud)
      try {
        const existing = localStorage.getItem('demo_farm');
        const parsed = existing ? JSON.parse(existing) : Object.assign({}, farmData);
        parsed.cultivationStrategy = generated;
        parsed.updatedAt = new Date().toISOString();
        localStorage.setItem('demo_farm', JSON.stringify(parsed));
      } catch (lsError) {
        console.error("Local storage strategy save error", lsError);
      }
      setStrategy(generated);
      toast({ title: "Cultivation Strategy Generated", description: "Your precision agronomic plan is ready." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: error.message });
    } finally {
      setIsGenerating(false);
      setShowSurvey(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">
             Cultivation Strategy
           </h1>
           <p className="text-muted-foreground font-medium mt-1">AI-driven precision plan based on soil, climate, and economics.</p>
        </div>
        {currentStrategy && !showSurvey && (
           <Button variant="outline" onClick={() => setShowSurvey(true)} className="h-10 gap-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold">
              Configure New Strategy
           </Button>
        )}
      </div>

      {(showSurvey || !currentStrategy) && !isGenerating && (
        <Card className="border-none shadow-xl bg-white animate-in zoom-in-95 duration-300">
           <CardHeader className="border-b border-slate-100 pb-6 pt-8">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
                 <Sprout className="h-6 w-6 text-primary" /> Agronomic & Economic Profile
              </CardTitle>
           </CardHeader>
           <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Row 1 */}
                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Location (District/State)</Label>
                   <Input 
                      placeholder="e.g. Nagpur, Maharashtra"
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-10 bg-slate-50 border-slate-200"
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Farm Size (Acres)</Label>
                   <Input 
                      type="number" 
                      placeholder="e.g. 5.5"
                      value={farmSize} 
                      onChange={(e) => setFarmSize(Number(e.target.value))}
                      className="h-10 bg-slate-50 border-slate-200"
                   />
                </div>

                {/* Row 2 */}
                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Land Tenure</Label>
                   <Select value={landTenure} onValueChange={(v: any) => setLandTenure(v)}>
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-medium">
                         <SelectValue placeholder="Select tenure" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="Owned">Owned</SelectItem>
                         <SelectItem value="Leased">Leased</SelectItem>
                         <SelectItem value="Shared">Shared</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Irrigation Infrastructure</Label>
                   <Select value={irrigation} onValueChange={setIrrigation}>
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-medium">
                         <SelectValue placeholder="Select irrigation method" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="Drip">Drip Irrigation</SelectItem>
                         <SelectItem value="Sprinkler">Sprinkler Irrigation</SelectItem>
                         <SelectItem value="Flood">Flood / Manual</SelectItem>
                         <SelectItem value="Rain-fed">Rain-fed</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                {/* Row 3 */}
                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Predominant Soil Type</Label>
                   <Select value={soilType} onValueChange={setSoilType}>
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-medium">
                         <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="Black">Black Soil (Regur)</SelectItem>
                         <SelectItem value="Red">Red Soil</SelectItem>
                         <SelectItem value="Alluvial">Alluvial Soil</SelectItem>
                         <SelectItem value="Laterite">Laterite Soil</SelectItem>
                         <SelectItem value="Sandy">Sandy / Silt</SelectItem>
                         <SelectItem value="Clay">Clay Soil</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Previous Season Crop</Label>
                   <Input 
                      placeholder="e.g. Cotton, Wheat, Fallow"
                      value={previousCrop} 
                      onChange={(e) => setPreviousCrop(e.target.value)}
                      className="h-10 bg-slate-50 border-slate-200"
                   />
                </div>

                {/* Row 4 */}
                <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700">Available Working Capital (₹)</Label>
                   <Input 
                      type="number" 
                      placeholder="e.g. 50000"
                      value={workingCapital} 
                      onChange={(e) => setWorkingCapital(Number(e.target.value))}
                      className="h-10 bg-slate-50 border-slate-200 font-medium"
                   />
                </div>

                 <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Formal Credit Access (e.g., KCC)</Label>
                    <Select value={creditAccess ? "Yes" : "No"} onValueChange={(v) => setCreditAccess(v === "Yes")}>
                       <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-medium">
                          <SelectValue placeholder="Select access" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Strategic Goal</Label>
                    <Select value={target} onValueChange={(v: any) => setTarget(v)}>
                       <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-medium">
                          <SelectValue placeholder="Select primary goal" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="Maximum Yield">Maximum Yield</SelectItem>
                          <SelectItem value="Maximum Profit">Maximum Profit</SelectItem>
                          <SelectItem value="Soil Restoration">Soil Restoration</SelectItem>
                          <SelectItem value="Low-risk crop">Low-risk crop</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                {/* File Upload - Full Width */}
                <div className="md:col-span-2 space-y-3 pt-4">
                   <div className="flex flex-col gap-1">
                      <Label className="text-sm font-semibold text-slate-800">Upload Soil / Water Lab Report (Optional)</Label>
                      <p className="text-xs text-muted-foreground">Upload a PDF or PNG scan (Max 5 MB). AI will analyze it to suggest precise manure/fertilizer parameters.</p>
                   </div>
                   <div className="flex items-center justify-center w-full">
                      <label 
                        htmlFor="lab-report-upload"
                        className="flex flex-col items-center justify-center w-full h-12 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                           <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-200 transition-colors pointer-events-none">Choose File</div>
                           <span className={`text-sm ${selectedFileName ? 'text-emerald-600 font-medium truncate max-w-[200px]' : 'text-slate-500'}`}>
                             {selectedFileName || 'No file chosen'}
                           </span>
                        </div>
                        <input 
                          id="lab-report-upload"
                          type="file" 
                          className="sr-only" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               setSelectedFileName(file.name);
                               toast({ title: "File Selected", description: file.name });
                             }
                          }}
                        />
                      </label>
                   </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="bg-[#56A43B] hover:bg-[#4a8d33] text-white px-8 py-6 h-12 rounded-lg font-bold text-base transition-all shadow-md active:scale-95"
                  >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Compute Strategy Profile
                  </Button>
                </div>
              </div>
           </CardContent>
        </Card>
      )}      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
           <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20 animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-primary absolute top-6 left-6" />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">Computing Strategic Logic...</h3>
              <p className="text-slate-500 font-medium">Simulating biological outcomes and economic variance.</p>
           </div>
        </div>
      )}

      {currentStrategy && !isGenerating && !showSurvey && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Section 1: KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="p-6 border-none shadow-md bg-white flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                   <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Projected Yield Gain</p>
                  <div className="text-2xl font-bold text-slate-900">{currentStrategy.metrics.projectedYieldIncrease}</div>
                </div>
             </Card>
             <Card className="p-6 border-none shadow-md bg-white flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                   <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Est. Profit Margin</p>
                  <div className="text-2xl font-bold text-slate-900">{currentStrategy.metrics.estimatedProfitMargin}</div>
                </div>
             </Card>
             <Card className="p-6 border-none shadow-md bg-white flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                   <Droplets className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Water Reduction</p>
                  <div className="text-2xl font-bold text-slate-900">{currentStrategy.metrics.waterReduction}</div>
                </div>
             </Card>
          </div>

          {/* Section 2: Narrative Overview */}
          <div className="rounded-xl border-l-[6px] border-primary bg-white p-6 shadow-md flex items-start gap-4">
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="h-4 w-4 text-primary" />
             </div>
             <div className="space-y-1 text-sm">
                <strong className="text-primary font-bold uppercase tracking-tight flex items-center gap-2">
                   Agronomics Summary
                </strong>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {currentStrategy.agronomist_summary}
                </p>
             </div>
          </div>

          {/* Section 3: Ranked Recommendations (Triple Card) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {currentStrategy.crop_recommendations.map((crop, i) => {
                let imgSrc = '/images/default.png';
                const n = crop.name.toLowerCase();
                if (n.includes('black gram') || n.includes('urad')) imgSrc = '/images/urad.png';
                else if (n.includes('green gram') || n.includes('moong')) imgSrc = '/images/moong.png';
                else if (n.includes('pigeon pea') || n.includes('tur')) imgSrc = '/images/pigeon.png';
                else if (n.includes('jowar') || n.includes('sorghum')) imgSrc = '/images/jowar.png';

                return (
                 <Card key={i} className="border-none shadow-md bg-white overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                    <img 
                      src={imgSrc} 
                      alt={crop.name} 
                      className="w-full h-40 object-cover object-center border-b border-primary/10" 
                    />
                    <CardHeader className="pb-4 pt-6 px-6">
                       <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             {crop.name} 
                             {i === 0 && <Badge className="bg-[#56A43B] text-white text-[10px] uppercase font-bold px-1.5 h-4">#1 Fit</Badge>}
                          </h3>
                          <Badge variant="outline" className={`text-[9px] uppercase font-bold border-none px-2 ${
                             crop.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' : 
                             crop.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {crop.riskLevel} Risk
                          </Badge>
                       </div>
                       <p className="text-xs text-slate-500 italic mt-0.5">{crop.botanicalName}</p>
                    </CardHeader>
                   <CardContent className="px-6 pb-6 space-y-4 flex-1">
                      <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3">"{crop.rationale}"</p>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-2">
                         <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Expected Yield</p>
                            <p className="text-sm font-bold text-slate-800">{crop.keyNumbers.expectedYieldPerAcre}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Est. Profit</p>
                            <p className="text-sm font-bold text-emerald-600">{crop.keyNumbers.expectedNetProfitPerAcre}</p>
                         </div>
                      </div>

                      <div className="pt-4 space-y-2 border-t border-slate-50">
                         <p className="text-[9px] font-bold uppercase text-slate-400">3-Year Market & Profit Trend</p>
                         <div className="h-16 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={crop.marketTrend}>
                                  <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={i === 0 ? "#56A43B" : "#94a3b8"} 
                                    strokeWidth={2} 
                                    dot={false}
                                  />
                               </LineChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>{crop.marketTrend[0].year}</span>
                            <span className="text-slate-800">{crop.keyNumbers.marketPrice}</span>
                            <span>{crop.marketTrend[crop.marketTrend.length - 1].year}</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             );
             })}
          </div>

          {/* Bottom Grid: 2 Columns */}
          <div className="grid lg:grid-cols-2 gap-x-10 gap-y-10">
             
             {/* Column Left: Plans */}
             <div className="space-y-10">
                
                {/* Precision Input Plan */}
                <div className="space-y-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" /> Precision Input Plan
                   </h2>
                   <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                         <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Irrigation Plan (7 Days)</p>
                            <p className="text-xs font-semibold text-slate-700 mt-1">{currentStrategy.input_plan.irrigation_schedule.frequency}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1 italic">Critical: {currentStrategy.input_plan.irrigation_schedule.critical_stages.join(', ')}</p>
                         </div>
                         <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Basal Dosage Strategy</p>
                            <p className="text-xs font-semibold text-slate-700 mt-1">NPK balance based on soil pH solubility</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Fertilizer Schedule</p>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                               <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px]">
                                  <tr>
                                     <th className="px-3 py-2 rounded-l-md font-bold">Stage</th>
                                     <th className="px-3 py-2 font-bold">Product</th>
                                     <th className="px-3 py-2 rounded-r-md font-bold text-right">Dose / Acre</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {currentStrategy.input_plan.fertilizer_table.map((f, i) => (
                                     <tr key={i}>
                                        <td className="px-3 py-3 font-bold text-slate-700">{f.stage}</td>
                                        <td className="px-3 py-3 text-slate-500 font-medium">{f.fertilizer}</td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-600">{f.quantity}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Economic Projections */}
                <div className="space-y-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#56A43B]" /> Economic Projections (Per Acre)
                   </h2>
                   <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                      <div className="space-y-3 mb-6">
                         {currentStrategy.economics.cost_breakdown.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                               <span className="text-sm text-slate-600 font-medium">{item.item}</span>
                               <span className="text-sm font-bold text-slate-800">{item.cost}</span>
                            </div>
                         ))}
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg mb-4">
                         <span className="text-xs font-bold text-slate-500 uppercase">Total Input Cost</span>
                         <span className="text-lg font-bold text-red-500">{currentStrategy.economics.total_input_cost}</span>
                      </div>
                      <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                         <span className="text-xs font-bold text-emerald-700 uppercase">Net Profit</span>
                         <span className="text-xl font-bold text-emerald-600">{currentStrategy.economics.net_profit} (ROI {currentStrategy.economics.roi_percent})</span>
                      </div>
                   </div>
                </div>

             </div>

             {/* Column Right: Advisory */}
             <div className="space-y-10">
                
                {/* Action Checklist */}
                <div className="space-y-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListTodo className="h-5 w-5 text-primary" /> Immediate Action Checklist
                   </h2>
                   <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                      <div className="space-y-6">
                         {currentStrategy.action_checklist.map((act, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                               <div className={`h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                                  act.status ? 'bg-primary border-primary text-white' : 'border-slate-200 group-hover:border-primary/50'
                               }`}>
                                  {act.status && <CheckCircle2 className="h-3 w-3 text-white" />}
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{act.period}</p>
                                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{act.task}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* IPM Section */}
                <div className="space-y-4">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Bug className="h-5 w-5 text-red-500" /> Integrated Pest & Disease Management
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentStrategy.pest_management.map((p, i) => (
                         <div key={i} className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col gap-3 ${
                           p.risk === 'High' ? 'border-red-100 ring-1 ring-red-50' : 'border-slate-100'
                         }`}>
                            <div className="flex justify-between items-start">
                               <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  {p.risk === 'High' && <Flame className="h-3 w-3 text-red-500" />}
                                  {p.threat}
                               </h4>
                               <Badge className={`text-[8px] font-bold px-1 h-3.5 border-none ${
                                 p.risk === 'High' ? 'bg-red-500' : p.risk === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                               }`}>
                                 {p.risk} Risk
                               </Badge>
                            </div>
                            <div className="space-y-2">
                               <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Treatment</p>
                                  <p className="text-[10px] font-semibold text-slate-700">{p.chemical_control}</p>
                               </div>
                               <div className="pt-2 border-t border-slate-50">
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase">Organic Alternative</p>
                                  <p className="text-[10px] font-semibold text-slate-600">{p.organic_alternative}</p>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

             </div>
          </div>

          {/* Section 5: Thermal Cultivation Timeline */}
          <div className="space-y-6 pb-10">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Thermal Cultivation Timeline (GDD)
             </h2>
             <div className="relative pl-10 md:pl-0 md:flex md:justify-between items-start overflow-x-auto py-10">
                {/* Horizontal line for desktop */}
                <div className="hidden md:block absolute top-[53px] left-0 right-0 h-[2px] bg-slate-100 -z-10 mx-10" />
                
                {/* Vertical line for mobile */}
                <div className="md:hidden absolute top-0 bottom-0 left-[19px] w-[2px] bg-slate-100 -z-10" />

                {currentStrategy.cultivation_calendar.map((step, i) => (
                   <div key={i} className="relative flex flex-col md:items-center md:text-center shrink-0 md:w-48 mb-10 md:mb-0">
                      {/* Timeline Dot */}
                      <div className={`h-6 w-6 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center ${
                         step.status === 'completed' ? 'bg-primary' : 
                         step.status === 'current' ? 'bg-amber-400 animate-pulse ring-4 ring-amber-100' : 'bg-slate-200'
                      }`}>
                         {step.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>

                      <div className="mt-4 md:mt-6 bg-white p-4 rounded-xl shadow-md border border-slate-50 w-full md:w-44 mobile-timeline-card translate-x-4 md:translate-x-0">
                         <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400">{step.timeframe}</p>
                         </div>
                         <div className="mt-3 pt-3 border-t border-slate-50">
                            <ul className="text-[10px] text-slate-600 space-y-1 font-medium text-left">
                               {step.tasks.slice(0, 3).map((task, idx) => (
                                  <li key={idx} className="flex gap-1">
                                     <span className="text-primary mt-1 shrink-0">•</span>
                                     <span>{task}</span>
                                  </li>
                               ))}
                            </ul>
                         </div>
                      </div>
                      
                      <div className="absolute top-1/2 left-0 -translate-x-12 md:hidden group">
                         <Badge variant="outline" className="bg-slate-100 text-slate-500 text-[8px] font-bold hover:bg-slate-200 cursor-default">
                           {step.stage}
                         </Badge>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-center py-10 border-t border-slate-100">
             <p className="text-xs text-slate-400 font-medium italic">
                ⚠️ Your strategy is optimized for your local conditions. Please verify market price and chemical availability locally before execution.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
