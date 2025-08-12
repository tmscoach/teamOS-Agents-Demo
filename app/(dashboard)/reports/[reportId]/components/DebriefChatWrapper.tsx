'use client'

import { useState } from 'react'
import { UnifiedChat } from '@/src/components/unified-chat'

interface DebriefChatWrapperProps {
  user: {
    id: string
    name: string | null
    email: string
  }
  report: {
    id: string
    reportType: string
    subscriptionId: string
    createdAt: Date
  }
}

export function DebriefChatWrapper({ user, report }: DebriefChatWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <>
      {/* Always render UnifiedChat but control visibility */}
      <div style={{ display: isExpanded ? 'block' : 'none' }}>
        <UnifiedChat
          mode="debrief"
          agent="DebriefAgent"
          position="left-sidebar"
          defaultOpen={true}
          onClose={() => setIsExpanded(false)}
          initialContext={{
            user: {
              id: user.id,
              name: user.name || 'User',
              hasCompletedTMP: true,
              credits: 0
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
              // Include report summary for immediate context
              reportMetadata: report.metadata,
              processingStatus: report.processingStatus
            }
          }}
          proactiveMessage={{
            type: 'debrief_welcome',
            data: {
              reportType: report.reportType,
              reportId: report.id,
              subscriptionId: report.subscriptionId,
              autoLoadReport: true, // Signal to load report context immediately
              message: `I can see you're reviewing your ${report.reportType} assessment results. I have access to your complete report including all scores, recommendations, and visual elements.

Feel free to ask me about:
- Your work preferences and what they mean
- How to interpret specific scores or sections  
- Practical applications for your team
- Any terminology or concepts you'd like clarified

What would you like to explore first?`
            }
          }}
        />
      </div>
      
      {/* Collapsed state - matching dashboard style */}
      {!isExpanded && (
        <div className="fixed z-50" style={{ top: '10px', left: '300px' }}>
          <div className="p-6 rounded-[6px_6px_0px_0px] border border-gray-200 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[5px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(5px)_brightness(100%)] bg-[linear-gradient(158deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)]">
            <button
              onClick={() => setIsExpanded(true)}
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
                  <path 
                    d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" 
                    stroke="url(#searchGradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M19 19L14.65 14.65" 
                    stroke="url(#searchGradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-normal text-gray-500 text-sm">
                  Ask about your report
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  )
}