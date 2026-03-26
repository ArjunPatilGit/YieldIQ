"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Sprout, Database, Save, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FarmProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const farmRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "farms", "primary");
  }, [db, user]);

  const { data: farmData, isLoading: isFarmLoading, error: farmError } = useDoc(farmRef);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    totalAreaHectares: 0,
    soilType: "",
    cropType: "",
    plantingDate: "",
    growthStage: "",
    variety: ""
  });

  const [isSaving, setIsSaving] = useState(false);

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
        variety: farmData.variety || ""
      });
    }
  }, [farmData]);

  const handleSave = async () => {
    if (!farmRef || !user) return;
    setIsSaving(true);
    try {
      await setDoc(farmRef, {
        ...formData,
        id: "primary",
        ownerId: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: farmData?.createdAt || serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Profile Saved",
        description: "Your farm details have been updated successfully in the cloud.",
      });
    } catch (error: any) {
      console.error("Save Error:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: error.message || "Insufficient permissions to write to database. Ensure email is verified.",
      });
    } finally {
      setIsSaving(false);
    }
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
            <div className="space-y-2">
              <Label htmlFor="soil-type">Soil Type</Label>
              <Select 
                value={formData.soilType}
                onValueChange={(val) => setFormData({...formData, soilType: val})}
              >
                <SelectTrigger>
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
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sprout className="h-5 w-5 text-primary" />
              Current Crop Cycle
            </CardTitle>
            <CardDescription>Details of the crops currently in the field for AI yield estimation.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="crop-type">Crop Type</Label>
              <Select 
                value={formData.cropType}
                onValueChange={(val) => setFormData({...formData, cropType: val})}
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
              <Label htmlFor="planting-date">Planting Date</Label>
              <Input 
                id="planting-date" 
                type="date" 
                value={formData.plantingDate}
                onChange={(e) => setFormData({...formData, plantingDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="growth-stage">Current Growth Stage</Label>
              <Select 
                value={formData.growthStage}
                onValueChange={(val) => setFormData({...formData, growthStage: val})}
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
              <Label htmlFor="variety">Crop Variety</Label>
              <Input 
                id="variety" 
                placeholder="e.g. PBW 343" 
                value={formData.variety}
                onChange={(e) => setFormData({...formData, variety: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>Discard Changes</Button>
          <Button className="bg-primary hover:bg-primary/90 min-w-[140px]" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save to Cloud
          </Button>
        </div>
      </div>
    </div>
  );
}