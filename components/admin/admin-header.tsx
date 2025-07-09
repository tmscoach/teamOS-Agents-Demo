"use client";

import React from 'react';
import { Bell, MessageCircle, DollarSign } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export function AdminHeader() {
  const { user } = useUser();
  const userInitial = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'A';

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          Welcome back, {user?.firstName || 'Admin'}!
        </h1>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Notification Bell */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <Bell style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '10px',
            height: '10px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid white'
          }}></div>
        </div>

        {/* Ask Oskar Button */}
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#111827'
        }}>
          <MessageCircle style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          Ask Oskar
        </button>

        {/* Credits */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <DollarSign style={{ width: '20px', height: '20px' }} />
          8,000 Credits
        </div>

        {/* User Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#4b5563',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '500',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          {userInitial.toUpperCase()}
        </div>
      </div>
    </header>
  );
}