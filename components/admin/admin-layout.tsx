"use client";

import React from 'react';
import { AdminSidebar } from './sidebar';
import { AdminHeader } from './admin-header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh'
    }}>
      <AdminSidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        <AdminHeader />
        <div style={{
          padding: '32px'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}