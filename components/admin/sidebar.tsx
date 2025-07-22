"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Shield,
  Database,
  Settings,
  FlaskConical,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Conversations", href: "/admin/conversations", icon: MessageSquare },
  { name: "Guardrails", href: "/admin/guardrails", icon: Shield },
  { name: "Variables", href: "/admin/variables", icon: Database },
  { name: "Agent Config", href: "/admin/agents/config", icon: Settings },
  { name: "TMS API Test", href: "/admin/tms-api-test", icon: FlaskConical },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '32px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '32px', height: '32px' }}
        >
          <rect width="32" height="32" rx="8" fill="#fbbf24"/>
          <circle cx="11" cy="16" r="4" fill="#1f2937"/>
          <circle cx="21" cy="16" r="4" fill="#1f2937"/>
          <path d="M11 16L21 16" stroke="#1f2937" strokeWidth="2"/>
        </svg>
        <span>teamOS Admin</span>
      </div>
      
      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? '#111827' : '#6b7280',
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                fontWeight: isActive ? '500' : '400',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              <item.icon 
                style={{ 
                  width: '20px', 
                  height: '20px',
                  color: isActive ? '#111827' : '#6b7280'
                }} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}