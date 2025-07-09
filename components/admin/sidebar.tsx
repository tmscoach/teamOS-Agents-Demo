"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  Settings,
  BarChart,
  Shield,
  Database,
  Cog,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { name: "Guardrails", href: "/admin/guardrails", icon: Shield },
  { name: "Variables", href: "/admin/variables", icon: Database },
  { name: "Agent Config", href: "/admin/agents/config", icon: Cog },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-teams-ui-sidebar-bg border-r border-teams-ui-border">
      <div className="flex h-16 items-center px-6 border-b border-teams-ui-border">
        <h2 className="text-xl font-semibold text-teams-text-primary">teamOS Admin</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-teams-sm px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-teams-ui-hover-bg text-teams-primary"
                  : "text-teams-text-secondary hover:bg-teams-ui-hover-bg hover:text-teams-text-primary"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                isActive ? "text-teams-primary" : "text-teams-text-secondary"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}