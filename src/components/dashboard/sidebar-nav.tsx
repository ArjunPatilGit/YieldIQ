"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UserCircle, 
  LineChart, 
  MessageSquare, 
  Map as MapIcon, 
  Bell, 
  FileText 
} from "lucide-react";

const items = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Farm Profile",
    href: "/dashboard/farm-profile",
    icon: UserCircle,
  },
  {
    title: "Yield Analysis",
    href: "/dashboard/analysis",
    icon: LineChart,
  },
  {
    title: "Advisory Reports",
    href: "/dashboard/advisory",
    icon: FileText,
  },
  {
    title: "YieldIQ Assistant",
    href: "/dashboard/assistant",
    icon: MessageSquare,
  },
  {
    title: "GIS Visualization",
    href: "/dashboard/map",
    icon: MapIcon,
  },
  {
    title: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname === item.href 
              ? "bg-sidebar-accent text-sidebar-primary font-semibold" 
              : "text-sidebar-foreground/70"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
