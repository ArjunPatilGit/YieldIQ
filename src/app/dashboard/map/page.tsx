import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Layers, Maximize2, ZoomIn, ZoomOut, Info } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function GISMapPage() {
  const mapImage = PlaceHolderImages.find(img => img.id === 'drone-view');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">GIS Visualization</h1>
          <p className="text-muted-foreground">Interactive field maps and satellite analysis powered by Google Earth Engine.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="gap-2">
             <Layers className="h-4 w-4" />
             Map Layers
           </Button>
           <Button variant="outline" size="sm" className="gap-2">
             <Maximize2 className="h-4 w-4" />
             Full Screen
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 overflow-hidden relative min-h-[500px] border-primary/10">
          <div className="absolute inset-0 z-0 bg-secondary/20">
             <Image 
                src={mapImage?.imageUrl || "https://picsum.photos/seed/farm4/1200/800"} 
                alt="Satellite view of farm" 
                fill 
                className="object-cover"
                data-ai-hint="aerial farmland"
             />
          </div>
          
          {/* Mock Map Controls */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="bg-background/80 backdrop-blur"><ZoomIn className="h-4 w-4" /></Button>
            <Button size="icon" variant="secondary" className="bg-background/80 backdrop-blur"><ZoomOut className="h-4 w-4" /></Button>
          </div>

          <div className="absolute left-4 bottom-4 z-10 bg-background/90 backdrop-blur p-4 rounded-lg border shadow-lg max-w-[240px]">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-primary">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Real-time Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">NDVI (Health Index):</span>
                <span className="font-semibold">0.78 (Healthy)</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[78%]" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Moisture Level:</span>
                <span className="font-semibold">Low (Zone B)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Map Insights</CardTitle>
            <CardDescription>Visual data points from last satellite pass.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-semibold text-primary uppercase mb-1">Observation</p>
                <p className="text-sm">Vigorous growth detected in North-East quadrant.</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-xs font-semibold text-accent-foreground uppercase mb-1">Attention Required</p>
                <p className="text-sm">Zone 4 (Southern edge) shows early moisture stress.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Legend</h4>
              {[
                { label: "Optimal Growth", color: "bg-primary" },
                { label: "Water Stress", color: "bg-orange-400" },
                { label: "Potential Pests", color: "bg-destructive" },
                { label: "Fallow Land", color: "bg-amber-100" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`h-3 w-3 rounded-sm ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full text-xs gap-2">
              <Info className="h-3 w-3" />
              How we calculate NDVI?
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
