'use client'

import { useEffect } from 'react'

interface CompleteProfileButtonProps {
  showButton: boolean
}

export function CompleteProfileButton({ showButton }: CompleteProfileButtonProps) {
  if (!showButton) return null
  
  const handleClick = () => {
    // Trigger the assessment modal event
    window.dispatchEvent(new CustomEvent('show-assessment-modal'))
  }
  
  return (
    <button 
      onClick={handleClick}
      className="inline-flex items-center gap-2.5 py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors mt-3"
    >
      <span className="font-medium text-white text-sm">
        Complete Your First Profile
      </span>
    </button>
  )
}