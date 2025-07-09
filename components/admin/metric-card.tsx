import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
  className
}: MetricCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        color: '#6b7280',
        fontSize: '14px',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#111827'
      }}>
        {value}
      </div>
      {change && (
        <div style={{
          fontSize: '14px',
          color: changeType === "positive" ? '#10b981' : 
                changeType === "negative" ? '#ef4444' : 
                '#6b7280'
        }}>
          {changeType === "positive" && "↑ "}
          {changeType === "negative" && "↓ "}
          {change}
        </div>
      )}
    </div>
  );
}