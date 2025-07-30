"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import AssessmentLayout from './components/AssessmentLayout';
import { Loader2 } from 'lucide-react';
import { WORKFLOW_ID_MAP, TEMPLATE_ID_MAP, DEFAULT_DEBRIEF_AGENT } from './constants';
import { AssessmentSubscription, WorkflowState, ToolInvocation } from './types';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';
import { VoiceCommand } from '@/src/lib/services/voice';
import { VoiceModeEntry, VoiceIndicator, TranscriptDisplay, VoicePermissionDialog, VoiceCommandHelp } from './components/voice';
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
  
  // Voice mode state
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [hasShownVoiceEntry, setHasShownVoiceEntry] = useState(false);

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

  // Track which questions are being updated for visual feedback
  const [updatingQuestions, setUpdatingQuestions] = useState<Set<number>>(new Set());
  
  // Create refs to avoid dependency issues
  const handleVoiceCommandRef = useRef<(command: VoiceCommand) => void>(null!);
  const stopVoiceRef = useRef<() => Promise<void>>(null!);
  
  // Initialize voice navigation hook early
  const {
    voiceState,
    transcript,
    lastCommand,
    audioLevel,
    startVoice,
    stopVoice,
    getContextualHelp,
    sendAssistantMessage
  } = useVoiceNavigation({
    onCommand: (command) => handleVoiceCommandRef.current?.(command),
    onTranscript: (text) => console.log('Voice transcript:', text),
    onError: (error) => {
      console.error('Voice error:', error);
      setError(error.message);
    }
  });

  // Helper to speak text using OpenAI Realtime API
  const speakTextHelper = useCallback(async (text: string) => {
    if (voiceModeEnabled && sendAssistantMessage) {
      try {
        await sendAssistantMessage(text);
      } catch (error) {
        console.error('Failed to speak text via Realtime API:', error);
      }
    }
  }, [voiceModeEnabled, sendAssistantMessage]);

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
      // If voice mode is enabled, speak the assistant's response
      if (message.role === 'assistant' && message.content) {
        speakTextHelper(message.content);
      }
    },
    onToolCall: async ({ toolCall }) => {
      console.log('[Assessment] Tool called:', toolCall.toolName, toolCall.args);
      
      try {
        switch (toolCall.toolName) {
          case 'answer_question': {
            const { questionId, value } = toolCall.args as { questionId: number; value: string };
            
            // Add visual feedback
            setUpdatingQuestions(prev => new Set(prev).add(questionId));
            
            // Small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update the answer
            handleAnswerChange(questionId, value);
            
            // Remove visual feedback
            setTimeout(() => {
              setUpdatingQuestions(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
              });
            }, 300);
            
            return { success: true, message: `Set answer for question ${questionId} to ${value}` };
          }
          
          case 'answer_multiple_questions': {
            const { questionIds, value } = toolCall.args as { questionIds: number[]; value: string };
            
            // Update all questions with visual feedback
            for (const qId of questionIds) {
              setUpdatingQuestions(prev => new Set(prev).add(qId));
              
              // Stagger updates for visual effect
              await new Promise(resolve => setTimeout(resolve, 100));
              
              handleAnswerChange(qId, value);
              
              // Remove visual feedback after a delay
              setTimeout(() => {
                setUpdatingQuestions(prev => {
                  const next = new Set(prev);
                  next.delete(qId);
                  return next;
                });
              }, 300);
            }
            
            return { 
              success: true, 
              message: `Updated ${questionIds.length} questions with answer ${value}` 
            };
          }
          
          case 'navigate_page': {
            const { direction, pageNumber } = toolCall.args as { direction?: string; pageNumber?: number };
            
            if (direction === 'next') {
              await submitCurrentPage(true); // Pass true to indicate agent triggered
              return { success: true, message: 'Navigating to next page' };
            } else if (direction === 'previous' && workflowState) {
              // TODO: Implement previous page navigation
              return { success: false, message: 'Previous page navigation not yet implemented' };
            } else if (pageNumber && workflowState) {
              // TODO: Implement specific page navigation
              return { success: false, message: `Navigation to page ${pageNumber} not yet implemented` };
            }
            
            return { success: false, message: 'Invalid navigation parameters' };
          }
          
          case 'explain_question': {
            // This is handled by the agent's response, just acknowledge
            return { success: true, message: 'Question explanation provided' };
          }
          
          default:
            console.warn('[Assessment] Unknown tool:', toolCall.toolName);
            return { success: false, message: `Unknown tool: ${toolCall.toolName}` };
        }
      } catch (error) {
        console.error('[Assessment] Error in tool execution:', error);
        return { 
          success: false, 
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
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

  const submitCurrentPage = async (triggeredByAgent = false) => {
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
            const completionMessage = '🎉 Congratulations! You have completed the assessment. Generating your report...';
            append({
              role: 'assistant',
              content: completionMessage
            });
            speakTextHelper(completionMessage);
            
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
            
            // Only notify via chat if not triggered by agent tool
            // The agent will provide its own message when using navigate_page tool
            if (!triggeredByAgent) {
              const progressMessage = `✅ Progress saved! Moving to ${result.Description || 'next section'}.`;
              append({
                role: 'assistant',
                content: progressMessage
              });
              speakTextHelper(progressMessage);
            }
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
      const processingMessage = '📊 Processing your responses and generating your personalized report...';
      append({
        role: 'assistant',
        content: processingMessage
      });
      speakTextHelper(processingMessage);
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
        const successMessage = '✅ Report generated successfully! Redirecting to your debrief session...';
        append({
          role: 'assistant',
          content: successMessage
        });
        speakTextHelper(successMessage);
        
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
      const errorMessage = '❌ Sorry, there was an error generating your report. Please try again or contact support.';
      append({
        role: 'assistant',
        content: errorMessage
      });
      speakTextHelper(errorMessage);
    }
  };
  
  // Handle voice commands
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    console.log('Voice command received:', command);
    
    // For voice commands, we should send the raw transcript to the assessment agent
    // The agent has its own natural language understanding and tools
    if (command.type === 'unknown' && command.command) {
      // Send the raw voice input as a user message to the assessment agent
      append({
        role: 'user',
        content: command.command
      });
      return;
    }
    
    // Handle specific recognized commands for quick actions
    switch (command.type) {
      case 'navigation':
        if (command.parameters?.target === 'next') {
          submitCurrentPage();
        } else if (command.parameters?.target === 'previous') {
          // Send to agent to handle
          append({
            role: 'user',
            content: 'Go to the previous page'
          });
        } else if (command.parameters?.target === 'skip') {
          // Send to agent to handle
          append({
            role: 'user',
            content: 'Skip this question'
          });
        }
        break;
        
      case 'answer':
        if (command.parameters?.value && workflowState) {
          // Instead of handling directly, send to the agent
          // This allows the agent to use its tools properly
          const value = command.parameters.value;
          append({
            role: 'user',
            content: `Answer ${value}`
          });
        }
        break;
        
      case 'action':
        switch (command.parameters?.target) {
          case 'repeat':
            // Send to agent
            append({
              role: 'user',
              content: 'Repeat the current question'
            });
            break;
            
          case 'help':
            setShowVoiceHelp(true);
            break;
            
          case 'exitVoice':
            stopVoiceRef.current?.();
            setVoiceModeEnabled(false);
            const exitMessage = 'Voice mode disabled. You can type your responses.';
            append({
              role: 'assistant',
              content: exitMessage
            });
            speakTextHelper(exitMessage);
            break;
        }
        break;
    }
  }, [workflowState, append, submitCurrentPage, speakTextHelper]);
  
  // Helper to format answer values for display
  const formatAnswerValue = (value: string): string => {
    const valueMap: Record<string, string> = {
      '20': '2-0 (Strongly left)',
      '21': '2-1 (Slightly left)', 
      '12': '1-2 (Slightly right)',
      '02': '0-2 (Strongly right)',
      'yes': 'Yes',
      'no': 'No'
    };
    return valueMap[value] || value;
  };

  // Handle voice mode toggling
  const handleVoiceToggle = useCallback(async () => {
    if (voiceState === 'idle' && !voiceModeEnabled) {
      // Show permission dialog first time
      if (!hasShownVoiceEntry) {
        setShowVoicePermission(true);
      } else {
        try {
          await startVoice();
          setVoiceModeEnabled(true);
        } catch (error) {
          console.error('Failed to start voice:', error);
        }
      }
    } else if (voiceModeEnabled) {
      await stopVoice();
      setVoiceModeEnabled(false);
    }
  }, [voiceState, voiceModeEnabled, hasShownVoiceEntry, startVoice, stopVoice]);
  
  // Handle voice permission response
  const handleVoicePermissionAllow = useCallback(async () => {
    setShowVoicePermission(false);
    setHasShownVoiceEntry(true);
    
    try {
      // Wait for voice session to start
      await startVoice();
      setVoiceModeEnabled(true);
      
      // Small delay to ensure session is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // When voice mode starts, ask the agent to read the current questions
      if (workflowState && workflowState.questions.length > 0) {
        // Ask the agent to announce voice mode and read questions
        append({
          role: 'user',
          content: 'Voice mode is now active. Please read out the current questions on this page'
        });
      }
    } catch (error) {
      console.error('Failed to start voice mode:', error);
      setVoiceModeEnabled(false);
    }
  }, [startVoice, workflowState, append]);
  
  const handleVoicePermissionDeny = useCallback(() => {
    setShowVoicePermission(false);
    setHasShownVoiceEntry(true);
  }, []);
  
  // Handle voice entry dismissal
  const handleVoiceEntryDismiss = useCallback(() => {
    setHasShownVoiceEntry(true);
  }, []);
  
  // Update the refs when functions change
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);
  
  // Update stopVoice ref when it's available
  useEffect(() => {
    stopVoiceRef.current = stopVoice;
  }, [stopVoice]);
  
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
    <>
      {/* Voice mode entry banner */}
      {selectedAssessment && !hasShownVoiceEntry && (
        <VoiceModeEntry
          onStartVoice={() => {
            setHasShownVoiceEntry(true);
            setShowVoicePermission(true);
          }}
          onDismiss={handleVoiceEntryDismiss}
        />
      )}
      
      {/* Voice indicator */}
      {voiceModeEnabled && (
        <div className="fixed top-4 right-4 z-50">
          <VoiceIndicator 
            voiceState={voiceState} 
            transcript={transcript}
          />
        </div>
      )}
      
      {/* Voice transcript display */}
      {voiceModeEnabled && transcript && (
        <div className="fixed bottom-24 right-4 z-40 max-w-md">
          <TranscriptDisplay
            transcript={transcript}
            lastCommand={lastCommand}
            isListening={voiceState === 'listening'}
          />
        </div>
      )}
      
      {/* Voice permission dialog */}
      <VoicePermissionDialog
        isOpen={showVoicePermission}
        onAllow={handleVoicePermissionAllow}
        onDeny={handleVoicePermissionDeny}
      />
      
      {/* Voice command help */}
      <VoiceCommandHelp
        isOpen={showVoiceHelp}
        onClose={() => setShowVoiceHelp(false)}
        questionType={workflowState?.questions[0]?.type === 18 ? 'seesaw' : 'general'}
      />
      
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
        updatingQuestions={updatingQuestions}
        voiceState={voiceState}
        onVoiceToggle={handleVoiceToggle}
        audioLevel={audioLevel}
      />
    </>
  );
}