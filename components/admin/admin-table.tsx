import { cn } from "@/lib/utils";
import React from "react";

interface AdminTableProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full", className)}>
        {children}
      </table>
    </div>
  );
}

interface AdminTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableHeader({ children, className }: AdminTableHeaderProps) {
  return (
    <thead className={className}>
      <tr>{children}</tr>
    </thead>
  );
}

interface AdminTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableBody({ children, className }: AdminTableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

interface AdminTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AdminTableRow({ children, className, onClick }: AdminTableRowProps) {
  return (
    <tr 
      className={cn(
        "border-b border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface AdminTableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableHead({ children, className }: AdminTableHeadProps) {
  return (
    <th className={cn(
      "text-left px-3 py-3 font-medium text-[#6b7280] border-b border-[#e5e7eb] text-sm",
      className
    )}>
      {children}
    </th>
  );
}

interface AdminTableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableCell({ children, className }: AdminTableCellProps) {
  return (
    <td className={cn("px-3 py-4", className)}>
      {children}
    </td>
  );
}