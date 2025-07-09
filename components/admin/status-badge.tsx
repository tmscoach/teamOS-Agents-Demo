import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  children,
  size = "md",
  className
}: StatusBadgeProps) {
  const statusClasses = {
    success: "bg-teams-accent-green/10 text-teams-accent-green border-teams-accent-green/20",
    warning: "bg-teams-accent-orange/10 text-teams-accent-orange border-teams-accent-orange/20",
    error: "bg-teams-accent-pink/10 text-teams-accent-pink border-teams-accent-pink/20",
    info: "bg-teams-accent-blue/10 text-teams-accent-blue border-teams-accent-blue/20",
    neutral: "bg-teams-ui-hover-bg text-teams-text-secondary border-teams-ui-border"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-teams-full border",
        statusClasses[status],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: "high" | "medium" | "low";
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const severityConfig = {
    high: { status: "error" as const, label: "High" },
    medium: { status: "warning" as const, label: "Medium" },
    low: { status: "info" as const, label: "Low" }
  };

  const config = severityConfig[severity];

  return (
    <StatusBadge status={config.status} size="sm" className={className}>
      {config.label}
    </StatusBadge>
  );
}