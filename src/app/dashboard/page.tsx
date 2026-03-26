import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { YieldOverviewChart } from "@/components/dashboard/yield-overview-chart";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome back, Anil</h1>
          <p className="text-muted-foreground">Here is what's happening on your farm today.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg border border-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">May 12, 2024</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Predicted Yield</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">4.2 Tons/ha</div>
            <p className="text-xs text-primary font-medium mt-1">+12% from last season</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Water Needs</p>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground mt-1">Next irrigation in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Soil Health</p>
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div className="text-2xl font-bold">Optimal</div>
            <p className="text-xs text-muted-foreground mt-1">N: 85 | P: 42 | K: 60</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold">Moderate</div>
            <p className="text-xs text-destructive font-medium mt-1">Heat wave expected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Yield History & Projection</CardTitle>
            <CardDescription>Comparison of historical yields vs AI-driven projections for Wheat.</CardDescription>
          </CardHeader>
          <CardContent>
            <YieldOverviewChart />
          </CardContent>
        </Card>

        {/* Actionable Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Smart Tasks</CardTitle>
            <CardDescription>Priority actions based on AI analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Apply Nitrogen Fertilizer", status: "High Priority", icon: SproutIcon },
              { title: "Schedule Drip Irrigation", status: "Medium Priority", icon: Droplets },
              { title: "Inspect Zone 4 for Pests", status: "Observation", icon: AlertTriangle }
            ].map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors">
                <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                  <task.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.status}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/advisory">View Full Advisory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SproutIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-3 5.5-13 0-16" />
      <path d="M14 20c-5.5-3-5.5-13 0-16" />
    </svg>
  )
}
