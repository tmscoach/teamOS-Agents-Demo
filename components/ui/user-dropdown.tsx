"use client"

import React, { useState, useRef, useEffect } from 'react'
import { User, ChevronDown, LogOut, Shield } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface UserDropdownProps {
  userName?: string
  userEmail?: string
  isAdmin?: boolean
}

export function UserDropdown({ userName, userEmail, isAdmin }: UserDropdownProps) {
  const { signOut } = useClerk()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const userInitial = userName?.[0] || userEmail?.[0] || 'U'

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  const handleAdminDashboard = () => {
    router.push('/admin')
    setShowDropdown(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 h-10 px-1.5 rounded-lg border border-solid border-gray-200 shadow-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex w-7 h-7 items-center justify-center bg-gray-200 rounded-full">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute top-11 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail || 'user@example.com'}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <Shield className="w-4 h-4 text-gray-400" />
                Admin Dashboard
              </button>
            )}
            
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}