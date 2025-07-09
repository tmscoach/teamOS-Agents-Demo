import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function AdminCard({ 
  children, 
  className,
  padding = "md" 
}: AdminCardProps) {
  const paddingClasses = {
    sm: "p-teams-md",
    md: "p-teams-lg",
    lg: "p-teams-xl"
  };

  return (
    <div 
      className={cn(
        "bg-teams-bg rounded-teams-md border border-teams-ui-border",
        "shadow-teams-card",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function AdminCardHeader({ children, className }: AdminCardHeaderProps) {
  return (
    <div className={cn("mb-teams-md pb-teams-md border-b border-teams-ui-border", className)}>
      {children}
    </div>
  );
}

interface AdminCardTitleProps {
  children: ReactNode;
  className?: string;
}

export function AdminCardTitle({ children, className }: AdminCardTitleProps) {
  return (
    <h3 className={cn("text-xl font-medium text-teams-text-primary", className)}>
      {children}
    </h3>
  );
}

interface AdminCardContentProps {
  children: ReactNode;
  className?: string;
}

export function AdminCardContent({ children, className }: AdminCardContentProps) {
  return (
    <div className={cn("text-teams-text-secondary", className)}>
      {children}
    </div>
  );
}