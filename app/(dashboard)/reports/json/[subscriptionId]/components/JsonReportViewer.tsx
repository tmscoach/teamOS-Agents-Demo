'use client'

import { useState, useEffect, useRef } from 'react'
import { ReportSection } from './ReportSection'
import { ReportNavigation } from './ReportNavigation'
import { ReportHeader } from './ReportHeader'

interface JsonReportViewerProps {
  reportData: any
  subscriptionId: string
}

export function JsonReportViewer({ reportData, subscriptionId }: JsonReportViewerProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  console.log('[JsonReportViewer] reportData:', reportData)
  
  // Extract sections from report data
  const sections = reportData?.sections || []
  const metadata = reportData?.metadata || {}
  
  console.log('[JsonReportViewer] sections:', sections)
  console.log('[JsonReportViewer] metadata:', metadata)

  useEffect(() => {
    // Expand first few sections by default
    if (sections.length > 0) {
      const initialExpanded = new Set(
        sections.slice(0, 3).map((s: any) => s.id)
      )
      setExpandedSections(initialExpanded)
    }
  }, [])

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSectionId(sectionId)
      // Ensure section is expanded when navigated to
      setExpandedSections(prev => new Set(prev).add(sectionId))
    }
  }

  // Set up intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id')
            if (sectionId) {
              setActiveSectionId(sectionId)
            }
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    )

    // Observe all section elements
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <div className="flex h-full">
      {/* Navigation Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
        <ReportNavigation
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionClick={scrollToSection}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Report Header */}
          <ReportHeader
            title={metadata.reportType || reportData.workflowType || 'Assessment Report'}
            metadata={metadata}
            subscriptionId={subscriptionId}
          />

          {/* Report Sections */}
          <div className="space-y-6 mt-8">
            {sections.map((section: any) => (
              <div
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
                data-section-id={section.id}
              >
                <ReportSection
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => handleSectionToggle(section.id)}
                  isActive={activeSectionId === section.id}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pb-8 text-center text-sm text-gray-500">
            <p>Report generated on {new Date(reportData.completedAt || Date.now()).toLocaleDateString()}</p>
            <p>Subscription ID: {subscriptionId}</p>
          </div>
        </div>
      </div>
    </div>
  )
}