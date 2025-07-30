"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import AssessmentLayout from './components/AssessmentLayout';
import { Loader2 } from 'lucide-react';
import { WORKFLOW_ID_MAP, TEMPLATE_ID_MAP, DEFAULT_DEBRIEF_AGENT } from './constants';
import { AssessmentSubscription, WorkflowState, ToolInvocation } from './types';
// Remove direct mock client import - we'll use API routes instead


export default function AssessmentChatClient() {
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'AssessmentAgent';
  const assessmentType = searchParams.get('assessmentType');
  const directSubscriptionId = searchParams.get('subscriptionId');
  
  const [availableAssessments, setAvailableAssessments] = useState<AssessmentSubscription[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSubscription | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState('assessment');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Track answers for the current page
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});

  // Memoize the body object to prevent unnecessary re-renders
  const chatBody = useMemo(() => ({
    conversationId,
    agentName,
    selectedAssessment,
    workflowState,
    visibleSection,
    currentAnswers
  }), [conversationId, agentName, selectedAssessment, workflowState, visibleSection, currentAnswers]);

  // Use the useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat/assessment',
    body: chatBody,
    onResponse(response) {
      // Extract conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID');
      if (newConversationId) {
        currentConversationIdRef.current = newConversationId;
        if (newConversationId !== conversationId) {
          setConversationId(newConversationId);
        }
      }
    },
    onError(error) {
      console.error('Chat error:', error);
    },
    onFinish(message) {
      // Process tool calls from the assistant's response
      if (message.toolInvocations) {
        message.toolInvocations.forEach((invocation) => {
          if (invocation.state === 'result' && invocation.result?.action) {
            const action = invocation.result.action;
            
            switch (action.type) {
              case 'SET_ANSWER':
                // Update the answer for a specific question
                if (action.questionId !== undefined) {
                  handleAnswerChange(action.questionId, action.value);
                }
                break;
              case 'NAVIGATE':
                // Handle navigation
                if (action.direction === 'next') {
                  submitCurrentPage();
                } else if (action.pageNumber && workflowState) {
                  // Navigate to specific page
                  // This would require implementing page navigation logic
                  console.log('Navigate to page:', action.pageNumber);
                }
                break;
            }
          }
        });
      }
    }
  });

  // Load available assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        
        if (directSubscriptionId) {
          // If direct subscription ID provided, skip dashboard and start workflow
          // This would be implemented with actual API calls
          setError('Direct subscription start not yet implemented');
        } else {
          // Get available assessments from dashboard via API
          const response = await fetch('/api/mock-tms/dashboard-subscriptions');
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.subscriptions) {
              console.log('Raw subscriptions from API:', data.subscriptions);
              
              // Filter for assessments that can be started
              const startableAssessments = data.subscriptions.filter(
                (sub: AssessmentSubscription) => 
                  sub.Status === 'Not Started' || sub.Status === 'In Progress'
              );
              
              console.log('Filtered startable assessments:', startableAssessments);
              setAvailableAssessments(startableAssessments);
              
              // If assessment type specified, auto-select matching assessment
              if (assessmentType) {
                const matching = startableAssessments.find(
                  (sub: AssessmentSubscription) => sub.AssessmentType === assessmentType
                );
                if (matching) {
                  setSelectedAssessment(matching);
                }
              }
            }
          } else {
            throw new Error('Failed to load assessments');
          }
        }
      } catch (err) {
        console.error('Error loading assessments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, [directSubscriptionId, assessmentType]);

  // Start workflow when assessment is selected
  useEffect(() => {
    if (selectedAssessment && !workflowState) {
      startWorkflow(selectedAssessment);
    }
  }, [selectedAssessment]);

  // Send initial greeting when ready
  useEffect(() => {
    if (!loading && messages.length === 0 && !isLoading) {
      // Add a small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        // Send an empty message to trigger the agent's greeting
        append({
          role: 'user',
          content: ''
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, messages.length, isLoading, append]);

  const startWorkflow = async (assessment: AssessmentSubscription) => {
    try {
      // Use workflow ID map from constants
      
      const response = await fetch('/api/mock-tms/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: WORKFLOW_ID_MAP[assessment.AssessmentType] || assessment.WorkflowType.toLowerCase().replace(' ', '-') + '-workflow',
          subscriptionId: assessment.SubscriptionID.toString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.firstPageUrl) {
          // Parse the first page URL: /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
          const urlMatch = data.firstPageUrl.match(/\/Workflow\/Process\/(\d+)(?:\/(\d+))?(?:\/(\d+))?(?:\/(\d+))?/);
          
          if (urlMatch) {
            const [, subId, baseId, secId, pgId] = urlMatch;
            
            await getWorkflowPage(
              subId,
              baseId ? parseInt(baseId) : undefined,
              secId ? parseInt(secId) : undefined,
              pgId ? parseInt(pgId) : undefined
            );
          } else {
            // Fallback: just get the initial workflow
            await getWorkflowPage(assessment.SubscriptionID.toString());
          }
        }
      } else {
        throw new Error('Failed to start workflow');
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    }
  };

  const getWorkflowPage = async (
    subscriptionId: string,
    baseContentId?: number,
    sectionId?: number,
    pageId?: number
  ) => {
    try {
      // Build hierarchical URL
      let url = `/api/mock-tms/workflow/process/${subscriptionId}`;
      if (baseContentId !== undefined) {
        url += `/${baseContentId}`;
        if (sectionId !== undefined) {
          url += `/${sectionId}`;
          if (pageId !== undefined) {
            url += `/${pageId}`;
          }
        }
      }
      
      console.log('📍 Fetching workflow page:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('Workflow API response:', data);
        const questions = data.Questions || data.questions || [];
        console.log('Questions received:', questions);
        if (questions.length > 0) {
          console.log('First question details:', questions[0]);
          console.log('Question types:', questions.map((q: any) => ({ id: q.questionID, type: q.type })));
        }
        
        setWorkflowState({
          subscriptionId,
          workflowId: selectedAssessment?.WorkflowID?.toString() || '',
          currentPageId: data.PageID || data.pageId || pageId || 0,
          currentSectionId: data.CurrentSectionID || data.sectionId || sectionId || 0,
          baseContentId: data.BaseContentID || data.baseContentId || baseContentId || 0,
          questions: data.Questions || data.questions || [],
          navigationInfo: data.navigationInfo || {},
          completionPercentage: data.completionPercentage || 0,
          // Store navigation IDs
          nextPageId: data.NextPageID || data.nextPageId,
          nextSectionId: data.NextSectionID || data.nextSectionId,
          nextBaseContentId: data.NextBaseContentID || data.nextBaseContentId,
          pageDescription: data.Description || data.description,
          currentPageNumber: data.currentPageNumber,
          totalPages: data.totalPages
        });
        
        // Reset answers for new page
        setCurrentAnswers({});
      } else {
        throw new Error('Failed to load workflow page');
      }
    } catch (err) {
      console.error('Error getting workflow page:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    }
  };

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const submitCurrentPage = async () => {
    if (!workflowState) return;
    
    try {
      // Format answers for API
      const questions = Object.entries(currentAnswers).map(([questionId, value]) => ({
        questionID: parseInt(questionId),
        value
      }));
      
      const response = await fetch('/api/mock-tms/workflow/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionID: parseInt(workflowState.subscriptionId),
          pageID: workflowState.currentPageId,
          currentPageID: workflowState.currentPageId,
          currentSectionID: workflowState.currentSectionId,
          baseContentID: workflowState.baseContentId,
          nextPageID: workflowState.nextPageId,
          nextSectionID: workflowState.nextSectionId,
          nextBaseContentID: workflowState.nextBaseContentId,
          questions
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.workflow_updated) {
          if (result.workflow_complete) {
            // Assessment complete - show success message before generating report
            setIsCompleting(true);
            
            // Add completion message to chat
            append({
              role: 'assistant',
              content: '🎉 Congratulations! You have completed the assessment. Generating your report...'
            });
            
            // Give user time to see the message
            setTimeout(async () => {
              await generateReport();
            }, 2000);
          } else if (result.workflow_advanced) {
            // Got next page data directly from the update response
            setWorkflowState({
              subscriptionId: workflowState.subscriptionId,
              workflowId: workflowState.workflowId,
              currentPageId: result.PageID || result.pageId,
              currentSectionId: result.CurrentSectionID || result.sectionId,
              baseContentId: result.BaseContentID || result.baseContentId,
              questions: result.Questions || result.questions || [],
              navigationInfo: result.navigationInfo || {},
              completionPercentage: result.completionPercentage || 0,
              // Update navigation IDs
              nextPageId: result.NextPageID || result.nextPageId,
              nextSectionId: result.NextSectionID || result.nextSectionId,
              nextBaseContentId: result.NextBaseContentID || result.nextBaseContentId,
              pageDescription: result.Description || result.description,
              currentPageNumber: result.currentPageNumber,
              totalPages: result.totalPages
            });
            
            // Reset answers for new page
            setCurrentAnswers({});
            
            // Notify user via chat
            append({
              role: 'assistant',
              content: `✅ Progress saved! Moving to ${result.Description || 'next section'}.`
            });
          }
        }
      } else {
        throw new Error('Failed to submit answers');
      }
    } catch (err) {
      console.error('Error submitting page:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
    }
  };

  const generateReport = async () => {
    if (!selectedAssessment) return;
    
    try {
      // Update chat with report generation status
      append({
        role: 'assistant',
        content: '📊 Processing your responses and generating your personalized report...'
      });
      // Get template ID from constants
      const templateId = TEMPLATE_ID_MAP[selectedAssessment.AssessmentType] || '6';
      
      const response = await fetch('/api/mock-tms/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedAssessment.SubscriptionID.toString(),
          templateId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Report generated:', data);
        
        // Show final success message
        append({
          role: 'assistant',
          content: '✅ Report generated successfully! Redirecting to your debrief session...'
        });
        
        // Delay redirect to show success message
        setTimeout(() => {
          window.location.href = `/chat/debrief?agent=${DEFAULT_DEBRIEF_AGENT}&reportType=${selectedAssessment.AssessmentType}&subscriptionId=${selectedAssessment.SubscriptionID}&new=true`;
        }, 1500);
      } else {
        setIsCompleting(false);
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setIsCompleting(false);
      
      // Show error in chat
      append({
        role: 'assistant',
        content: '❌ Sorry, there was an error generating your report. Please try again or contact support.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentLayout
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      availableAssessments={availableAssessments}
      selectedAssessment={selectedAssessment}
      onSelectAssessment={setSelectedAssessment}
      workflowState={workflowState}
      currentAnswers={currentAnswers}
      onAnswerChange={handleAnswerChange}
      onSubmitPage={submitCurrentPage}
      onSectionChange={setVisibleSection}
      visibleSection={visibleSection}
      isCompleting={isCompleting}
    />
  );
}