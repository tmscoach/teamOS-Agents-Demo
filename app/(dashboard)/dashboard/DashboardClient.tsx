'use client'

import { useState, useEffect } from 'react'
import { AssessmentSelectorModal } from '@/components/dashboard/AssessmentSelectorModal'
import { JourneyPhase } from '@/lib/orchestrator/journey-phases'
import { useAskOskar } from '@/contexts/AskOskarContext'

interface DashboardClientProps {
  userPhase: JourneyPhase
  completedAssessments: string[]
  showAssessmentModal?: boolean
}

interface TMSSubscription {
  SubscriptionID: number
  WorkflowID: number
  WorkflowType: string
  Status: string
  Progress: number
  AssessmentType: string
  AssessmentStatus: string
}

export function DashboardClient({ 
  userPhase, 
  completedAssessments,
  showAssessmentModal = false
}: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableAssessments, setAvailableAssessments] = useState<TMSSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const { openWidget: openAskOskar } = useAskOskar()
  
  // Fetch available assessments from TMS when component mounts
  useEffect(() => {
    const fetchAvailableAssessments = async () => {
      setLoading(true)
      try {
        // Call tms_get_dashboard_subscriptions to get available assessments
        const response = await fetch('/api/mock-tms/dashboard-subscriptions')
        console.log('[DashboardClient] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[DashboardClient] Full response data:', JSON.stringify(data, null, 2))
          console.log('[DashboardClient] Available subscriptions from TMS:', data.subscriptions)
          
          // Check if we got any subscriptions
          if (!data.subscriptions || data.subscriptions.length === 0) {
            console.warn('[DashboardClient] No subscriptions returned from TMS')
            console.warn('[DashboardClient] Response data structure:', JSON.stringify(data, null, 2))
          }
          
          // Filter for assessments that are not started or in progress
          const startableAssessments = data.subscriptions?.filter(
            (sub: TMSSubscription) => sub.Status === 'Not Started' || sub.Status === 'In Progress'
          ) || []
          
          console.log('[DashboardClient] Filtered startable assessments:', startableAssessments)
          setAvailableAssessments(startableAssessments)
        } else {
          const errorText = await response.text()
          console.error('[DashboardClient] Error response:', response.status, errorText)
        }
      } catch (error) {
        console.error('[DashboardClient] Error fetching assessments:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAvailableAssessments()
  }, [])
  
  // Check if user should see assessment modal on first visit
  useEffect(() => {
    if (showAssessmentModal) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setIsModalOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showAssessmentModal])
  
  const handleAssessmentSelect = async (assessmentType: string, subscriptionId: number) => {
    console.log('[DashboardClient] Assessment selected:', assessmentType, 'Subscription ID:', subscriptionId)
    
    // Close modal
    setIsModalOpen(false)
    
    // Navigate directly to assessment page with the subscription ID from TMS
    setTimeout(() => {
      window.location.href = `/chat/assessment?agent=AssessmentAgent&subscriptionId=${subscriptionId}`;
    }, 300);
  }
  
  const handleModalClose = () => {
    setIsModalOpen(false)
  }
  
  // Listen for events from OrchestratorAgent to show modal
  useEffect(() => {
    const handleShowAssessmentModal = () => {
      setIsModalOpen(true)
    }
    
    window.addEventListener('show-assessment-modal', handleShowAssessmentModal)
    return () => {
      window.removeEventListener('show-assessment-modal', handleShowAssessmentModal)
    }
  }, [])
  
  return (
    <>
      {/* Assessment Selector Modal */}
      <AssessmentSelectorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSelect={handleAssessmentSelect}
        userPhase={userPhase}
        completedAssessments={completedAssessments}
        availableAssessments={availableAssessments}
        loading={loading}
      />
      
      
      {/* Button to manually trigger assessment modal (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 z-40 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm"
        >
          Show Assessment Modal
        </button>
      )}
    </>
  )
}