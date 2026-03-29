import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, Sprout, TrendingUp, Languages, Map as MapIcon, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-farm');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight font-headline">YieldIQ</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#impact" className="text-sm font-medium hover:text-primary transition-colors">Impact</Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                  Powered by Google AI & Firebase
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-headline text-foreground leading-tight">
                  Maximize Your Harvest with <span className="text-primary">YieldIQ</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-[600px]">
                  An intelligent agricultural platform providing high-accuracy yield predictions,
                  resource optimization, and expert advisory in local languages.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="h-12 px-8 text-lg" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={heroImage?.imageUrl || "/assets/hero-strawberry.png"}
                  alt="Lush strawberry plantation with mountains"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">Intelligent Features for Every Farmer</h2>
              <p className="text-muted-foreground max-w-[700px] mx-auto">
                YieldIQ combines multi-source data including weather, soil to provide high-accuracy insights.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Yield Prediction",
                  desc: "Utilize Vertex AI to predict crop yields based on historical data and real-time conditions.",
                  icon: TrendingUp
                },
                {
                  title: "Resource Optimization",
                  desc: "Get precise suggestions for water, fertilizer, and preventive measures to reduce costs.",
                  icon: Sprout
                },
                {
                  title: "Local Language AI",
                  desc: "Converse with our assistant in Hindi, Marathi, or English for immediate expert advice.",
                  icon: Languages
                },
                {
                  title: "GIS Visualizatio",
                  desc: "Interactive field maps powered by Google Earth Engine for visual farm health analysis.",
                  icon: MapIcon
                },
                {
                  title: "Personalized Reports",
                  desc: "Generate comprehensive advisory reports tailored specifically to your farm's data.",
                  icon: ShieldCheck
                },
                {
                  title: "Cultivation",
                  desc: "Receive suggestion which crop to be harvest next to gain more profit.",
                  icon: Leaf
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card p-8 rounded-xl border hover:shadow-lg transition-all border-border/50 group">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section id="impact" className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 lg:p-20 text-white overflow-hidden relative">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-headline">Creating a Sustainable Future for Agriculture</h2>
                <div className="space-y-6 text-primary-foreground/90">
                  <p className="text-lg">
                    YieldIQ helps farmers adapt to climate changes and improves planning for markets and storage.
                    By reducing losses and optimizing inputs, we contribute to long-term agricultural resilience.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      Higher Profitability
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      Sustainable Farming
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      Market Stability
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      High Accuracy
                    </li>
                  </ul>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-20 transform translate-y-1/4 translate-x-1/4">
                <Leaf className="w-[500px] h-[500px]" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold font-headline">YieldIQ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 YieldIQ. Empowerment through Agricultural Intelligence.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}