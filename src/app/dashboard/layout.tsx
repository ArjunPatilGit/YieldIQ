import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Leaf, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight font-headline">YieldIQ</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto">
          <SidebarNav />
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Anil Kumar</p>
              <p className="text-xs text-muted-foreground truncate">Punjab Farm #1</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header - Mobile & Shared */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">YieldIQ</span>
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold font-headline">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-full">
               <User className="h-5 w-5" />
             </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
