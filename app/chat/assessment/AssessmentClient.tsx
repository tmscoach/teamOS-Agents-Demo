"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AssessmentLayout from './components/AssessmentLayout';
import { WorkflowState, AssessmentSubscription } from './types';
import { AssessmentChatWrapper } from './components/AssessmentChatWrapper';
import { JourneyPhase } from '@/src/components/unified-chat/types';
import { VoiceModeEntry } from './components/voice/VoiceModeEntry';

export default function AssessmentClient() {
  const searchParams = useSearchParams();
  const directSubscriptionId = searchParams.get('subscriptionId');
  
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentSubscription[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSubscription | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [updatingQuestions, setUpdatingQuestions] = useState<Set<number>>(new Set());
  const [hasShownVoiceEntry, setHasShownVoiceEntry] = useState(false);

  // Check localStorage for voice entry dismissal
  useEffect(() => {
    const voicePreference = localStorage.getItem('voice-mode-dismissed');
    if (voicePreference) {
      setHasShownVoiceEntry(true);
    }
  }, []);

  // Handle voice mode start
  const handleVoiceStart = async () => {
    console.log('[AssessmentClient] Starting voice mode');
    setHasShownVoiceEntry(true);
    localStorage.setItem('voice-mode-shown', 'true');
    
    // First, expand the chat by clicking the AskOsmo button
    const askOsmoButton = document.querySelector('button[aria-label="Ask Osmo anything"]') || 
                          document.querySelector('.voice-toggle-wrapper button') ||
                          document.querySelector('button');
    if (askOsmoButton && askOsmoButton.textContent?.includes('Ask Osmo')) {
      console.log('[AssessmentClient] Clicking Ask Osmo button to expand chat');
      (askOsmoButton as HTMLButtonElement).click();
      
      // Wait for chat to expand
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Then dispatch event to trigger voice mode in the voice plugin
    if (selectedAssessment) {
      const event = new CustomEvent('start-voice-mode', {
        detail: {
          type: 'assessment',
          metadata: {
            subscriptionId: selectedAssessment._subscriptionId || selectedAssessment.SubscriptionID,
            assessmentType: selectedAssessment.AssessmentType
          }
        }
      });
      window.dispatchEvent(event);
    }
  };

  // Handle voice mode dismissal
  const handleVoiceDismiss = () => {
    console.log('[AssessmentClient] Voice mode dismissed');
    setHasShownVoiceEntry(true);
    localStorage.setItem('voice-mode-dismissed', 'true');
  };

  // Fetch available assessments from TMS
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/mock-tms/dashboard-subscriptions', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AssessmentClient] Fetched subscriptions:', data);
          
          const assessments: AssessmentSubscription[] = data.subscriptions || [];
          
          setAvailableAssessments(assessments);
          
          // Auto-select assessment if subscriptionId is provided
          if (directSubscriptionId) {
            const assessment = assessments.find(a => {
              // The subscription ID might have a user prefix
              const idStr = (a._subscriptionId || a.SubscriptionID)?.toString() || '';
              const idMatch = idStr === directSubscriptionId || 
                             idStr.endsWith(`-${directSubscriptionId}`) ||
                             idStr.includes(directSubscriptionId);
              console.log('[AssessmentClient] Checking assessment:', idStr, 'against:', directSubscriptionId, 'match:', idMatch);
              return idMatch;
            });
            if (assessment) {
              console.log('[AssessmentClient] Auto-selecting assessment:', assessment);
              handleSelectAssessment(assessment);
            } else {
              console.log('[AssessmentClient] No matching assessment found for subscriptionId:', directSubscriptionId);
            }
          }
        }
      } catch (error) {
        console.error('[AssessmentClient] Error fetching assessments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessments();
  }, [directSubscriptionId]);

  const handleSelectAssessment = async (assessment: AssessmentSubscription) => {
    setSelectedAssessment(assessment);
    
    // Start workflow by fetching the workflow state first
    try {
      // First, fetch the workflow state to get the actual workflowId
      const subscriptionId = assessment._subscriptionId || assessment.SubscriptionID;
      const workflowResponse = await fetch(`/api/mock-tms/workflow/process/${subscriptionId}/3/2/2`);
      
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        // The API returns the workflow state directly, not wrapped
        setWorkflowState(workflowData);
        console.log('[AssessmentClient] Loaded workflow state:', workflowData);
      } else {
        // Fallback to starting workflow
        const workflowId = assessment.WorkflowID || assessment.AssessmentType?.toLowerCase() + '-workflow';
        console.log('[AssessmentClient] Starting workflow:', workflowId, 'for assessment:', assessment);
        
        const response = await fetch('/api/mock-tms/start-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscriptionId: assessment._subscriptionId || assessment.SubscriptionID,
            workflowId: workflowId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Now fetch the actual workflow state
          const stateResponse = await fetch(`/api/mock-tms/workflow/process/${assessment._subscriptionId || assessment.SubscriptionID}/3/2/2`);
          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            setWorkflowState(stateData);
          }
        }
      }
    } catch (error) {
      console.error('[AssessmentClient] Error starting workflow:', error);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setCurrentAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitPage = async () => {
    if (!workflowState || !selectedAssessment) return;
    
    setIsCompleting(true);
    try {
      // Convert answers object to questions array format expected by API
      const questions = Object.entries(currentAnswers).map(([questionId, value]) => ({
        questionID: parseInt(questionId),
        value: value
      }));

      const response = await fetch('/api/mock-tms/workflow/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionID: selectedAssessment._subscriptionId || selectedAssessment.SubscriptionID, // Note: capital ID
          pageID: (workflowState as any).PageID || (workflowState as any).CurrentPageID,
          questions: questions
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Fetch the updated workflow state
        const workflowResponse = await fetch(`/api/mock-tms/workflow/process/${selectedAssessment._subscriptionId || selectedAssessment.SubscriptionID}/${(workflowState as any).BaseContentID}/${(workflowState as any).CurrentSectionID}/${(workflowState as any).NextPageID || (workflowState as any).CurrentPageID}`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          setWorkflowState(workflowData);
        }
        setCurrentAnswers({});
      }
    } catch (error) {
      console.error('[AssessmentClient] Error submitting page:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <AssessmentLayout
        availableAssessments={availableAssessments}
        selectedAssessment={selectedAssessment}
        onSelectAssessment={handleSelectAssessment}
        workflowState={workflowState}
        currentAnswers={currentAnswers}
        onAnswerChange={handleAnswerChange}
        onSubmitPage={handleSubmitPage}
        isCompleting={isCompleting}
        updatingQuestions={updatingQuestions}
      />
      
      {/* Voice Mode Entry Beta Popup - show when assessment is selected */}
      {selectedAssessment && !hasShownVoiceEntry && (
        <div className="fixed bottom-20 right-8 z-50 max-w-md">
          <VoiceModeEntry
            onStartVoice={handleVoiceStart}
            onDismiss={handleVoiceDismiss}
            hasShownBefore={hasShownVoiceEntry}
          />
        </div>
      )}
      
      {/* Ask Osmo Panel - wrapped with assessment tool handler */}
      <AssessmentChatWrapper
        selectedAssessment={selectedAssessment}
        workflowState={workflowState}
        onAnswerChange={handleAnswerChange}
        onSubmitPage={handleSubmitPage}
        updatingQuestions={updatingQuestions}
        setUpdatingQuestions={setUpdatingQuestions}
      />
    </>
  );
}