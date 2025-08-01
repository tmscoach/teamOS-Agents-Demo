'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { Loader2 } from 'lucide-react'
import { EmbeddedChat } from './EmbeddedChat'

interface AskOskarPanelProps {
  isExpanded: boolean
  onCollapse: () => void
  onExpand: () => void
  defaultAgent?: string
  testMode?: boolean
}

export function AskOskarPanel({ 
  isExpanded,
  onCollapse,
  onExpand,
  defaultAgent = 'OrchestratorAgent',
  testMode = false
}: AskOskarPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const initialPos = useRef({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = e.clientX - dragStart.current.x
      const deltaY = e.clientY - dragStart.current.y
      
      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'auto'
    }
  }, [isDragging])

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    initialPos.current = { ...position }
  }

  if (!isExpanded) {
    // Minimized state - positioned in header
    const hasBeenMoved = position.x !== 0 || position.y !== 0
    
    return (
      <div 
        ref={dragRef}
        className="fixed z-50"
        style={{
          top: hasBeenMoved ? `${10 + position.y}px` : '10px',
          left: hasBeenMoved ? `${300 + position.x}px` : '300px',
          transform: 'none',
        }}
      >
        <div 
          className="p-6 rounded-[6px_6px_0px_0px] border border-gray-200 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)] bg-[linear-gradient(158deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] cursor-grab select-none"
          onMouseDown={handleDragStart}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpand() // This will set isExpanded to true in parent
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex w-96 items-center gap-2 bg-white rounded-md"
          >
            <div className="flex w-[388px] items-center gap-2 pl-3 pr-14 py-2 relative self-stretch rounded-md border-[none] before:content-[''] before:absolute before:inset-0 before:p-0.5 before:rounded-md before:[background:linear-gradient(152deg,rgba(255,243,3,1)_0%,rgba(251,169,61,1)_15%,rgba(237,1,145,1)_30%,rgba(167,99,173,1)_45%,rgba(1,133,198,1)_60%,rgba(2,181,230,1)_75%,rgba(1,161,114,1)_90%,rgba(162,211,111,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFF303" />
                    <stop offset="14.29%" stopColor="#FBA93D" />
                    <stop offset="28.57%" stopColor="#ED0191" />
                    <stop offset="42.86%" stopColor="#A763AD" />
                    <stop offset="57.14%" stopColor="#0185C6" />
                    <stop offset="71.43%" stopColor="#02B5E6" />
                    <stop offset="85.71%" stopColor="#01A172" />
                    <stop offset="100%" stopColor="#A2D36F" />
                  </linearGradient>
                </defs>
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="url(#searchGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="url(#searchGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="relative w-fit font-normal text-gray-600 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Ask Oskar
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Expanded state - left sidebar (matching assessment page)
  return (
    <div className="fixed top-0 left-0 w-[399px] h-screen z-[100] flex flex-col bg-white border-r border-gray-200 shadow-xl animate-slideInLeft">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Oscar1 className="!w-10 !h-10" />
            <div>
              <h3 className="font-semibold text-lg">
                <span 
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #FFF303 0%, #FBA93D 15%, #ED0191 30%, #A763AD 45%, #0185C6 60%, #02B5E6 75%, #01A172 90%, #A2D36F 100%)'
                  }}
                >
                  OSmos
                </span>
              </h3>
              <p className="text-sm text-gray-500">Team Assistant</p>
            </div>
          </div>
          <button
            onClick={onCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Minimize chat"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          <EmbeddedChat 
            agentName={defaultAgent}
            testMode={testMode}
          />
        </div>
      </div>
    </div>
  )
}