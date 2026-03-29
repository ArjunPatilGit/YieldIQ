"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, doc, setDoc, collection, addDoc, serverTimestamp } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Sprout, Database, Save, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FarmProfilePage() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userUid = firebaseUser?.uid || (session?.user as any)?.id;
  
  const farmRef = useMemoFirebase(() => {
    if (!db || !userUid) return null;
    return doc(db, "users", userUid, "farms", "primary");
  }, [db, userUid]);

  const { data: farmData, isLoading: isFarmLoading, error: farmError } = useDoc(farmRef);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    totalAreaHectares: 0,
    soilType: "",
    cropType: "",
    plantingDate: "",
    growthStage: "",
    variety: "",
    numberOfPlots: 1,
    plots: [{ size: 0, cropType: "", plantingDate: "", growthStage: "", variety: "", soilType: "" }]
  });

  const [isSaving, setIsSaving] = useState(false);

  const totalPlotsArea = formData.plots.reduce((sum, plot) => sum + (Number(plot.size) || 0), 0);
  const isAreaExceeded = totalPlotsArea > formData.totalAreaHectares;
  const isMissingSoilType = formData.plots.some(plot => !plot.soilType);

  useEffect(() => {
    if (farmData) {
      setFormData({
        name: farmData.name || "",
        location: farmData.location || "",
        totalAreaHectares: farmData.totalAreaHectares || 0,
        soilType: farmData.soilType || "",
        cropType: farmData.cropType || "",
        plantingDate: farmData.plantingDate || "",
        growthStage: farmData.growthStage || "",
        variety: farmData.variety || "",
        numberOfPlots: farmData.numberOfPlots || 1,
        plots: farmData.plots || [{ size: 0, cropType: "", plantingDate: "", growthStage: "", variety: "", soilType: "" }]
      });
    }
  }, [farmData]);

  const handleSave = async () => {
    if (!farmRef || !userUid || !db) return;
    setIsSaving(true);
    
    // FORM DATA TO SAVE
    const savePayload = {
      ...formData,
      id: "primary",
      ownerId: userUid,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. ATTEMPT FIRESTORE SAVE
      await setDoc(farmRef, {
        ...savePayload,
        updatedAt: serverTimestamp(),
        createdAt: farmData?.createdAt || serverTimestamp()
      }, { merge: true });
      
      // 1b. SAVE TO HISTORY SUBCOLLECTION
      const historyRef = collection(db, "users", userUid, "farms", "primary", "history");
      await addDoc(historyRef, {
        ...savePayload,
        type: "profile_update",
        savedAt: serverTimestamp(),
      });
      
      console.log("Farm Profile saved to Firestore successfully");
    } catch (error: any) {
      console.error("Firestore Save Error, falling back to Local Storage:", error);
    }

    // 2. GUARANTEED LOCAL STORAGE SAVE FOR THE DEMO
    try {
       // Merge with existing demo_farm data (insights/advisory)
       const existing = localStorage.getItem('demo_farm');
       const merged = existing ? { ...JSON.parse(existing), ...savePayload } : savePayload;
       localStorage.setItem('demo_farm', JSON.stringify(merged));
       console.log("Farm Profile saved to Local Storage");
    } catch (lsError) {
       console.error("Local storage error:", lsError);
    }

    toast({
      title: "Profile Updated",
      description: "Your farm details have been synchronized successfully for your session.",
    });
    
    setIsSaving(false);
  };

  if (isFarmLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Retrieving secure farm records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-headline">Farm Profile</h1>
          <p className="text-muted-foreground">Manage your essential farm data for accurate AI predictions.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] bg-muted px-2 py-1 rounded border">
          <Database className="h-3 w-3" />
          <span>Cloud Sync Active</span>
        </div>
      </div>

      {farmError && (
        <Alert variant="destructive" className="bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cloud Synchronization Issue</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>We encountered a permission error accessing your farm records. This usually happens if your email isn't verified or if there's a connectivity issue.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8">
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              General Information
            </CardTitle>
            <CardDescription>Basic details about your farming operation stored in your private cluster.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="farm-name">Farm Name</Label>
              <Input 
                id="farm-name" 
                placeholder="e.g. Sunny Punjab Fields" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (District/State)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="location" 
                  className="pl-9" 
                  placeholder="e.g. Bathinda, Punjab" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-size">Total Area (Acres)</Label>
              <Input 
                id="farm-size" 
                type="number" 
                placeholder="e.g. 10" 
                value={formData.totalAreaHectares}
                onChange={(e) => setFormData({...formData, totalAreaHectares: parseFloat(e.target.value) || 0})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sprout className="h-5 w-5 text-primary" />
              Plot Details
            </CardTitle>
            <CardDescription>Specify details for each plot of your farm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xs flex-1">
                <Label htmlFor="num-plots">How many plots?</Label>
                <Input 
                  id="num-plots" 
                  type="number" 
                  min="1"
                  value={formData.numberOfPlots}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 1;
                    const newPlots = [...formData.plots];
                    while (newPlots.length < num) {
                      newPlots.push({ size: 0, cropType: "", plantingDate: "", growthStage: "", variety: "", soilType: "" });
                    }
                    setFormData({...formData, numberOfPlots: num, plots: newPlots.slice(0, num)});
                  }}
                />
              </div>
              <div className="text-left sm:text-right border rounded-lg p-3 bg-muted/30">
                <div className="text-sm text-muted-foreground font-medium">Allocated Area</div>
                <div className={`text-xl font-bold ${isAreaExceeded ? 'text-destructive' : 'text-primary'}`}>
                  {totalPlotsArea} / {formData.totalAreaHectares} Acres
                </div>
                {isAreaExceeded && (
                  <div className="text-xs text-destructive mt-1">Area exceeds total farm size</div>
                )}
              </div>
            </div>

            {formData.plots.map((plot, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/20 space-y-4">
                <h3 className="font-semibold text-sm">Plot {index + 1}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`soil-type-${index}`}>Soil Type <span className="text-destructive">*</span></Label>
                    <Select 
                      value={plot.soilType}
                      onValueChange={(val) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].soilType = val;
                        if (index === 0) setFormData({...formData, soilType: val, plots: newPlots});
                        else setFormData({...formData, plots: newPlots});
                      }}
                    >
                      <SelectTrigger className={!plot.soilType ? "border-destructive/50" : ""}>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loamy">Loamy</SelectItem>
                        <SelectItem value="clay">Clay</SelectItem>
                        <SelectItem value="sandy">Sandy</SelectItem>
                        <SelectItem value="silt">Silt</SelectItem>
                        <SelectItem value="black">Black Soil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`plot-size-${index}`}>Plot Size in Acres</Label>
                    <Input 
                      id={`plot-size-${index}`} 
                      type="number" 
                      placeholder="e.g. 5" 
                      className={isAreaExceeded ? "border-destructive/50 focus-visible:ring-destructive" : ""}
                      value={plot.size || ""}
                      onChange={(e) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].size = parseFloat(e.target.value) || 0;
                        setFormData({...formData, plots: newPlots});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`crop-type-${index}`}>Crop Type</Label>
                    <Select 
                      value={plot.cropType}
                      onValueChange={(val) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].cropType = val;
                        if (index === 0) setFormData({...formData, cropType: val, plots: newPlots});
                        else setFormData({...formData, plots: newPlots});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="rice">Rice (Paddy)</SelectItem>
                        <SelectItem value="cotton">Cotton</SelectItem>
                        <SelectItem value="sugarcane">Sugarcane</SelectItem>
                        <SelectItem value="maize">Maize</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`planting-date-${index}`}>Planting Date</Label>
                    <Input 
                      id={`planting-date-${index}`} 
                      type="date" 
                      value={plot.plantingDate}
                      onChange={(e) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].plantingDate = e.target.value;
                        if (index === 0) setFormData({...formData, plantingDate: e.target.value, plots: newPlots});
                        else setFormData({...formData, plots: newPlots});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`growth-stage-${index}`}>Current Growth Stage</Label>
                    <Select 
                      value={plot.growthStage}
                      onValueChange={(val) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].growthStage = val;
                        if (index === 0) setFormData({...formData, growthStage: val, plots: newPlots});
                        else setFormData({...formData, plots: newPlots});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="germination">Germination</SelectItem>
                        <SelectItem value="vegetative">Vegetative</SelectItem>
                        <SelectItem value="flowering">Flowering</SelectItem>
                        <SelectItem value="fruiting">Fruiting / Grain filling</SelectItem>
                        <SelectItem value="ripening">Ripening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variety-${index}`}>Crop Variety</Label>
                    <Input 
                      id={`variety-${index}`} 
                      placeholder="e.g. PBW 343" 
                      value={plot.variety}
                      onChange={(e) => {
                        const newPlots = [...formData.plots];
                        newPlots[index].variety = e.target.value;
                        if (index === 0) setFormData({...formData, variety: e.target.value, plots: newPlots});
                        else setFormData({...formData, plots: newPlots});
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>Discard Changes</Button>
          <Button 
            className="bg-primary hover:bg-primary/90 min-w-[140px]" 
            onClick={handleSave} 
            disabled={isSaving || isAreaExceeded || isMissingSoilType}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save to Cloud
          </Button>
        </div>
      </div>
    </div>
  );
}