'use client'

import { useState } from 'react'
import { UnifiedChat } from '@/src/components/unified-chat'

interface ReportChatWrapperProps {
  user: {
    id: string
    name: string | null
    email: string
    journeyPhase: string
    completedSteps: any[]
  }
  report: {
    id: string
    reportType: string
    subscriptionId: string
    createdAt: Date
    metadata?: any
  }
}

export function ReportChatWrapper({ user, report }: ReportChatWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <>
      {/* Always render UnifiedChat but control visibility */}
      <div style={{ display: isExpanded ? 'block' : 'none' }}>
        <UnifiedChat
          mode="debrief"
          agent="DebriefAgent"
          position="right-sidebar"
          defaultOpen={true}
          onClose={() => setIsExpanded(false)}
          initialContext={{
            user: {
              id: user.id,
              name: user.name || 'User',
            },
            journey: {
              phase: user.journeyPhase,
              completedSteps: user.completedSteps,
              nextMilestone: 'Report Debrief'
            },
            metadata: {
              reportId: report.id,
              subscriptionId: report.subscriptionId,
              assessmentType: report.reportType,
              userId: user.id,
              userEmail: user.email,
              reportCreatedAt: report.createdAt.toISOString(),
              isDebriefMode: true,
              agent: 'DebriefAgent',
              reportMetadata: report.metadata,
              source: 'json-report-viewer'
            }
          }}
          proactiveMessage={{
            type: 'debrief_welcome',
            data: {
              reportType: report.reportType,
              reportId: report.id,
              subscriptionId: report.subscriptionId,
              autoLoadReport: true,
              message: `I can see you're reviewing your ${report.reportType} assessment report. I have access to all the sections and data in your report.

Feel free to ask me about:
- Your major role and what it means
- How your related roles complement your major role
- Specific scores or sections you'd like explained
- Practical applications for your team
- Any concepts or terminology

What aspect of your report would you like to explore?`
            }
          }}
        />
      </div>
      
      {/* Collapsed state - fixed position button */}
      {!isExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative"
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-500 blur opacity-75 group-hover:opacity-100 transition duration-200" />
            
            {/* Main button */}
            <div className="relative flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              {/* Chat icon with gradient */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF303" />
                    <stop offset="25%" stopColor="#FBA93D" />
                    <stop offset="50%" stopColor="#ED0191" />
                    <stop offset="75%" stopColor="#0185C6" />
                    <stop offset="100%" stopColor="#01A172" />
                  </linearGradient>
                </defs>
                <path 
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="url(#chatGradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              
              <span className="font-medium text-gray-700">
                Ask about your report
              </span>
            </div>
          </button>
        </div>
      )}
    </>
  )
}