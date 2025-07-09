import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "neutral" | "active" | "pending" | "abandoned";
  children?: React.ReactNode;
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
    success: "bg-[#dcfce7] text-[#14532d]",
    warning: "bg-[#fef3c7] text-[#78350f]",
    error: "bg-[#fee2e2] text-[#7f1d1d]",
    info: "bg-[#dbeafe] text-[#1e3a8a]",
    neutral: "bg-[#f3f4f6] text-[#6b7280]",
    active: "bg-[#dcfce7] text-[#14532d]",
    pending: "bg-[#fef3c7] text-[#78350f]",
    abandoned: "bg-[#fee2e2] text-[#7f1d1d]"
  };

  const statusLabels = {
    active: "Active",
    pending: "Pending",
    abandoned: "Abandoned"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-[13px]"
  };

  const displayText = children || statusLabels[status as keyof typeof statusLabels] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        statusClasses[status],
        sizeClasses[size],
        className
      )}
    >
      {displayText}
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