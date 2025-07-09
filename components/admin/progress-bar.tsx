import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  showLabel = true,
  className,
  barClassName 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="text-sm font-medium text-[var(--teams-text-primary)] mb-1">
          {percentage.toFixed(0)}%
        </div>
      )}
      <div className="h-2 bg-[var(--teams-ui-border)] rounded-[var(--teams-radius-sm)] overflow-hidden">
        <div 
          className={cn(
            "h-full bg-[var(--teams-success)] rounded-[var(--teams-radius-sm)] transition-all duration-300",
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}