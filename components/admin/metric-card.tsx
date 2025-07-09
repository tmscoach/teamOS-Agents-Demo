import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { AdminCard } from "./admin-card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: "green" | "orange" | "pink" | "purple" | "blue" | "yellow";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  className
}: MetricCardProps) {
  const colorClasses = {
    green: "bg-teams-accent-green text-white",
    orange: "bg-teams-accent-orange text-white",
    pink: "bg-teams-accent-pink text-white",
    purple: "bg-teams-accent-purple text-white",
    blue: "bg-teams-accent-blue text-white",
    yellow: "bg-teams-accent-yellow text-teams-text-primary"
  };

  const iconBgClasses = {
    green: "bg-teams-accent-green/10 text-teams-accent-green",
    orange: "bg-teams-accent-orange/10 text-teams-accent-orange",
    pink: "bg-teams-accent-pink/10 text-teams-accent-pink",
    purple: "bg-teams-accent-purple/10 text-teams-accent-purple",
    blue: "bg-teams-accent-blue/10 text-teams-accent-blue",
    yellow: "bg-teams-accent-yellow/10 text-teams-accent-yellow"
  };

  return (
    <AdminCard className={className} padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-teams-text-secondary">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-teams-text-primary">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-teams-text-secondary">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-teams-accent-green" : "text-destructive"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-teams-text-secondary">from last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-teams-sm p-3",
            iconBgClasses[color]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </AdminCard>
  );
}