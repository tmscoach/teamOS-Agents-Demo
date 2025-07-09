import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-6",
      className
    )}>
      <Icon className="w-12 h-12 mx-auto mb-4 text-[var(--teams-text-secondary)] opacity-30" />
      <p className="text-[var(--teams-text-secondary)] font-medium">
        {title}
      </p>
      {description && (
        <p className="text-sm text-[var(--teams-text-secondary)] mt-2 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button 
          onClick={action.onClick}
          className="mt-4 teams-btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}