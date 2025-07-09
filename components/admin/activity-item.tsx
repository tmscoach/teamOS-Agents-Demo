import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  meta: string;
  iconColor?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function ActivityItem({ 
  icon: Icon, 
  title, 
  meta, 
  iconColor = "default",
  className 
}: ActivityItemProps) {
  const iconColorClasses = {
    default: "bg-[#f3f4f6] text-[#6b7280]",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600"
  };

  return (
    <div className={cn(
      "flex items-start gap-3 py-4 border-b border-[#e5e7eb] last:border-b-0",
      className
    )}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        iconColorClasses[iconColor]
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#111827]">
          {title}
        </div>
        <div className="text-sm text-[#6b7280] mt-0.5">
          {meta}
        </div>
      </div>
    </div>
  );
}