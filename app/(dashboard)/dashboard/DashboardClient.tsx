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

export function DashboardClient({ 
  userPhase, 
  completedAssessments,
  showAssessmentModal = false
}: DashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { openWidget: openAskOskar } = useAskOskar()
  
  // Check if user should see assessment modal on first visit
  useEffect(() => {
    if (showAssessmentModal || 
        (userPhase === JourneyPhase.ASSESSMENT && 
         Object.keys(completedAssessments).length === 0)) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setIsModalOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [userPhase, completedAssessments, showAssessmentModal])
  
  const handleAssessmentSelect = (assessment: 'TMP' | 'TeamSignals') => {
    console.log('[DashboardClient] Assessment selected:', assessment)
    
    // Close modal
    setIsModalOpen(false)
    
    // Open Ask Oskar with AssessmentAgent
    setTimeout(() => {
      openAskOskar()
      // The AssessmentAgent will be triggered via the orchestrator
      // with the selected assessment in context
      window.dispatchEvent(new CustomEvent('assessment-selected', { 
        detail: { assessment } 
      }))
    }, 300)
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