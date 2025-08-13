'use client'

import { useState, useEffect } from 'react'
import { JsonReportViewer } from './components/JsonReportViewer'
import { ReportChatWrapper } from './components/ReportChatWrapper'
import { VoiceDebriefModal } from './components/VoiceDebriefModal'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface JsonReportClientProps {
  user: {
    id: string
    name: string | null
    email: string
    journeyPhase: string
    completedSteps: any[]
  }
  report: {
    id: string
    subscriptionId: string
    reportType: string
    templateId: string | null
    jsonData: any
    metadata: any
    processingStatus: string
    createdAt: Date
  }
}

export function JsonReportClient({ user, report }: JsonReportClientProps) {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        
        console.log('[JsonReportClient] Report prop:', report)
        console.log('[JsonReportClient] JsonData:', report.jsonData)
        
        // If we already have jsonData, use it
        if (report.jsonData) {
          console.log('[JsonReportClient] Using jsonData from props')
          // Check if the data is wrapped in success/data structure
          const jsonData = report.jsonData as any
          if (jsonData.success && jsonData.data) {
            console.log('[JsonReportClient] Unwrapping success/data structure')
            setReportData(jsonData.data)
          } else {
            setReportData(report.jsonData)
          }
          setLoading(false)
          return
        }

        // Otherwise, fetch from API
        const response = await fetch(`/api/reports/json/${report.subscriptionId}`)
        
        if (!response.ok) {
          throw new Error('Failed to load report data')
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          setReportData(data.data)
        } else {
          throw new Error('Invalid report data format')
        }
      } catch (err) {
        console.error('Error loading report:', err)
        setError(err instanceof Error ? err.message : 'Failed to load report')
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [report.subscriptionId, report.jsonData])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Report</h1>
          <p className="text-gray-600 mb-4">{error || 'Report data not available'}</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex bg-gray-50">
      {/* Voice Debrief Modal - Always shown for testing */}
      <VoiceDebriefModal
        reportId={report.id}
        reportType={report.reportType || reportData.workflowType || 'TMP'}
        subscriptionId={report.subscriptionId}
        userId={user.id}
      />
      
      {/* Main Report Viewer */}
      <div className="flex-1 overflow-auto">
        <JsonReportViewer 
          reportData={reportData}
          subscriptionId={report.subscriptionId}
        />
      </div>

      {/* Chat Integration */}
      <ReportChatWrapper
        user={user}
        report={{
          id: report.id,
          reportType: report.reportType || reportData.workflowType,
          subscriptionId: report.subscriptionId,
          createdAt: report.createdAt,
          metadata: {
            ...report.metadata,
            ...reportData.metadata
          }
        }}
      />
    </div>
  )
}