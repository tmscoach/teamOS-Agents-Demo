'use client';

import { useEffect } from 'react';
import { AskOsmoInput } from '@/components/dashboard/AskOsmoInput';
import { JourneyPhase } from '@/src/components/unified-chat/types';

interface AssessmentChatWrapperProps {
  selectedAssessment: any;
  workflowState: any;
  onAnswerChange: (questionId: number, value: string) => void;
  onSubmitPage: () => void;
  updatingQuestions: Set<number>;
  setUpdatingQuestions: (fn: (prev: Set<number>) => Set<number>) => void;
}

export function AssessmentChatWrapper({
  selectedAssessment,
  workflowState,
  onAnswerChange,
  onSubmitPage,
  updatingQuestions,
  setUpdatingQuestions
}: AssessmentChatWrapperProps) {
  // Normalize workflow state to handle both uppercase and lowercase field names
  const normalizedWorkflowState = workflowState ? {
    questions: workflowState.Questions || workflowState.questions || [],
    currentPageId: workflowState.CurrentPageID || workflowState.currentPageId || 0,
    pageId: workflowState.PageID || workflowState.pageId || 0,
    baseContentId: workflowState.BaseContentID || workflowState.baseContentId || 0,
    currentSectionId: workflowState.CurrentSectionID || workflowState.currentSectionId || 0,
    completionPercentage: workflowState.completionPercentage || 0,
    totalPages: workflowState.totalPages || 0,
    currentPageNumber: workflowState.currentPageNumber || 0
  } : null;
  
  // Debug log to check what's in workflowState
  console.log('[AssessmentChatWrapper] Received workflowState:', {
    hasWorkflowState: !!workflowState,
    hasNormalizedState: !!normalizedWorkflowState,
    questions: normalizedWorkflowState?.questions?.length || 0,
    currentPageId: normalizedWorkflowState?.currentPageId,
    seesawQuestions: normalizedWorkflowState?.questions?.filter((q: any) => q.Type === 18)?.length || 0,
    rawFields: workflowState ? Object.keys(workflowState) : []
  });
  
  useEffect(() => {
    console.log('[AssessmentChatWrapper] Setting up message detection');
    console.log('[AssessmentChatWrapper] Current questions on page:', normalizedWorkflowState?.questions?.map((q: any) => ({
      id: q.ID || q.id,
      number: q.Number || q.number,
      type: q.Type || q.type
    })));
    
    // Listen for assessment actions from the plugin
    const handleAssessmentAction = (event: CustomEvent) => {
      const { action, params } = event.detail;
      console.log('[AssessmentChatWrapper] Received assessment action:', action, params);
      
      // Helper function to map question number to the actual question ID
      const mapQuestionNumberToId = (questionNumber: number) => {
        const questions = normalizedWorkflowState?.questions || [];
        
        // Filter to only seesaw questions
        const seesawQuestions = questions.filter((q: any) => 
          q.Type === 18 || q.type === 18
        );
        
        // Map by position: "question 1" means the first question on the page
        // "question 2" means the second question on the page, etc.
        const questionIndex = questionNumber - 1; // Convert 1-based to 0-based index
        
        if (questionIndex >= 0 && questionIndex < seesawQuestions.length) {
          const question = seesawQuestions[questionIndex];
          const id = question.ID || question.id || question.QuestionID || question.questionID;
          console.log(`[AssessmentChatWrapper] Mapped question position ${questionNumber} to ID ${id} (${questionIndex}th in array)`);
          return id;
        } else {
          // Fallback: Try to find by actual Number field
          const question = questions.find((q: any) => 
            (q.Number === questionNumber || q.number === questionNumber) && 
            (q.Type === 18 || q.type === 18)
          );
          
          if (question) {
            const id = question.ID || question.id || question.QuestionID || question.questionID;
            console.log(`[AssessmentChatWrapper] Mapped question number ${questionNumber} to ID ${id} (by Number field)`);
            return id;
          }
          
          console.log(`[AssessmentChatWrapper] Could not map question ${questionNumber}, using as-is`);
          return questionNumber;
        }
      };
      
      switch (action) {
        case 'answer_question': {
          const [questionNumber, value] = params.split(':');
          const qNum = parseInt(questionNumber);
          const qId = mapQuestionNumberToId(qNum);
          
          console.log('[AssessmentChatWrapper] Executing answer_question:', {
            receivedNumber: qNum,
            mappedId: qId,
            value: value
          });
              
          // Add visual feedback
          setUpdatingQuestions(prev => new Set(prev).add(qId));
          
          // Update the answer
          onAnswerChange(qId, value);
          
          // Remove visual feedback after a delay
          setTimeout(() => {
            setUpdatingQuestions(prev => {
              const next = new Set(prev);
              next.delete(qId);
              return next;
            });
          }, 300);
          break;
        }
        
        case 'answer_multiple_questions': {
          const parts = params.split(':');
          const value = parts.pop()!;
          const questionNumbers = parts.join(':').split(',').map((id: string) => parseInt(id));
          const questionIds = questionNumbers.map(mapQuestionNumberToId);
              
          console.log('[AssessmentChatWrapper] Executing answer_multiple_questions:', {
            receivedNumbers: questionNumbers,
            mappedIds: questionIds,
            value: value
          });
          
          // Update all questions with visual feedback
          questionIds.forEach((qId: number) => {
            setUpdatingQuestions(prev => new Set(prev).add(qId));
            onAnswerChange(qId, value);
            
            setTimeout(() => {
              setUpdatingQuestions(prev => {
                const next = new Set(prev);
                next.delete(qId);
                return next;
              });
            }, 300);
          });
          break;
        }
        
        case 'navigate_page': {
          if (params === 'next') {
            console.log('[AssessmentChatWrapper] Executing navigate_page: next');
            onSubmitPage();
          }
          break;
        }
      }
    };
    
    // Listen for custom events from the assessment actions plugin
    window.addEventListener('assessment-action-detected', handleAssessmentAction as EventListener);
    console.log('[AssessmentChatWrapper] Event listener added for assessment-action-detected');
    
    return () => {
      window.removeEventListener('assessment-action-detected', handleAssessmentAction as EventListener);
    };
  }, [onAnswerChange, onSubmitPage, setUpdatingQuestions, normalizedWorkflowState]);
  
  // Always use the unified chat interface
  return (
    <AskOsmoInput 
        defaultAgent="AssessmentAgent"
        testMode={false}
        userId={`assessment-${selectedAssessment?._subscriptionId || selectedAssessment?.SubscriptionID || 'default'}`}
        userName="Assessment User"
        hasCompletedTMP={false}
        credits={5000}
        journeyPhase={JourneyPhase.ASSESSMENT}
        completedSteps={[]}
        metadata={{
          subscriptionId: selectedAssessment?._subscriptionId || selectedAssessment?.SubscriptionID,
          assessmentType: selectedAssessment?.AssessmentType,
          workflowId: selectedAssessment?.WorkflowID,
          workflowState: normalizedWorkflowState,
          selectedAssessment: selectedAssessment ? {
            type: selectedAssessment.AssessmentType,
            subscriptionId: selectedAssessment._subscriptionId || selectedAssessment.SubscriptionID
          } : undefined
        }}
    />
  );
}