"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import AssessmentLayout from './components/AssessmentLayout';
import { Loader2 } from 'lucide-react';
import { WORKFLOW_ID_MAP, TEMPLATE_ID_MAP, DEFAULT_DEBRIEF_AGENT } from './constants';
import { AssessmentSubscription, WorkflowState, ToolInvocation } from './types';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';
import { useVoiceSessionPrefetch } from './hooks/useVoiceSessionPrefetch';
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
  const [isTogglingVoice, setIsTogglingVoice] = useState(false);

  // Track answers for the current page
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({});
  
  // Debug effect to monitor currentAnswers changes
  useEffect(() => {
    console.log('[Assessment] currentAnswers changed:', currentAnswers);
    console.log('[Assessment] currentAnswers keys:', Object.keys(currentAnswers));
    console.log('[Assessment] currentAnswers values:', Object.values(currentAnswers));
  }, [currentAnswers]);

  // Create a stable reference for the chat body that updates via ref
  const chatBodyRef = useRef({
    conversationId,
    agentName,
    selectedAssessment,
    workflowState,
    visibleSection,
    currentAnswers
  });
  
  // Update the ref without causing re-renders
  useEffect(() => {
    chatBodyRef.current = {
      conversationId,
      agentName,
      selectedAssessment,
      workflowState,
      visibleSection,
      currentAnswers
    };
  }, [conversationId, agentName, selectedAssessment, workflowState, visibleSection, currentAnswers]);
  
  // Use a stable object for useChat that doesn't change
  const chatBody = useMemo(() => chatBodyRef.current, []);

  // Track which questions are being updated for visual feedback
  const [updatingQuestions, setUpdatingQuestions] = useState<Set<number>>(new Set());
  
  // Create refs to avoid dependency issues
  const handleVoiceCommandRef = useRef<(command: VoiceCommand) => void>(null!);
  const stopVoiceRef = useRef<() => Promise<void>>(null!);
  
  // Prefetch voice session for faster startup
  const { sessionToken: prefetchedSessionToken } = useVoiceSessionPrefetch(
    // Only prefetch if we have selected an assessment
    !!selectedAssessment
  );
  
  // Initialize voice navigation hook early
  const {
    voiceState,
    transcript,
    lastCommand,
    audioLevel,
    startVoice,
    stopVoice,
    getContextualHelp,
    setWorkflowState: setVoiceWorkflowState,
    setAnswerUpdateCallback: setVoiceAnswerCallback,
    setNavigateNextCallback: setVoiceNavigateNextCallback
  } = useVoiceNavigation({
    onCommand: (command) => handleVoiceCommandRef.current?.(command),
    onTranscript: (text) => {
      console.log('Voice transcript:', text);
      // Don't send voice transcripts to text chat - let the voice agent handle everything
    },
    onError: (error) => {
      console.error('Voice error:', error);
      setError(error.message);
    },
    prefetchedSessionToken
  });

  // Track if we're currently speaking to avoid overlaps
  const isSpeakingRef = useRef(false);
  
  // Helper to speak text - disabled since we use OpenAI Realtime API
  const speakTextHelper = useCallback((text: string) => {
    // Disabled - OpenAI Realtime API handles all voice output
    console.log('[Voice] Text that would be spoken:', text);
  }, [voiceModeEnabled]);

  // Debug: Log when useChat is initialized (only on mount)
  useEffect(() => {
    console.log('[AssessmentChat] useChat initialized with body:', {
      hasConversationId: !!conversationId,
      hasSelectedAssessment: !!selectedAssessment,
      hasWorkflowState: !!workflowState,
      currentAnswersCount: Object.keys(currentAnswers).length
    });
  }, []); // Empty deps = only on mount
  
  // Use the useChat hook for streaming with a stable ID
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    id: 'assessment-chat', // Stable ID prevents re-initialization
    api: '/api/chat/assessment',
    body: chatBodyRef.current, // Use the current value from ref
    initialMessages: [],
    // Prevent automatic retries
    sendExtraMessageFields: true,
    // Custom fetcher to always use the latest body values
    fetch: async (input, init) => {
      const bodyString = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(bodyString);
      return fetch(input, {
        ...init,
        body: JSON.stringify({
          ...body,
          ...chatBodyRef.current // Always use latest values
        })
      });
    },
    onResponse(response) {
      console.log('[AssessmentChat] Got response:', {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers.get('content-type'),
          'x-conversation-id': response.headers.get('X-Conversation-ID')
        }
      });
      
      // Extract conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID');
      if (newConversationId && newConversationId !== currentConversationIdRef.current) {
        console.log('[AssessmentChat] Updating conversation ID:', currentConversationIdRef.current, '->', newConversationId);
        currentConversationIdRef.current = newConversationId;
        setConversationId(newConversationId);
      }
    },
    onError(error) {
      console.error('[AssessmentChat] Chat error details:', {
        error,
        message: error.message,
        stack: error.stack,
        currentMessagesCount: messages.length,
        isLoading,
        hasConversationId: !!conversationId
      });
    },
    onFinish(message) {
      // Voice responses are handled by OpenAI Realtime API, not Web Speech
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

  // Debug: Log component mount
  useEffect(() => {
    console.log('[AssessmentChat] Component mounted');
    return () => {
      console.log('[AssessmentChat] Component unmounting');
    };
  }, []);
  
  // Load available assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      console.log('[AssessmentChat] Loading assessments...');
      try {
        setLoading(true);
        
        if (directSubscriptionId) {
          // If direct subscription ID provided, fetch all subscriptions and find the matching one
          console.log('[AssessmentChat] Using direct subscription ID:', directSubscriptionId);
          
          // Get available assessments from dashboard via API
          const response = await fetch('/api/mock-tms/dashboard-subscriptions');
          
          if (!response.ok) {
            throw new Error('Failed to fetch assessments');
          }
          
          const data = await response.json();
          console.log('[AssessmentChat] Fetched subscriptions:', data.subscriptions);
          
          // Find the specific subscription
          const targetSubscription = data.subscriptions?.find(
            (sub: AssessmentSubscription) => sub.SubscriptionID.toString() === directSubscriptionId
          );
          
          if (targetSubscription) {
            console.log('[AssessmentChat] Found target subscription:', targetSubscription);
            setAvailableAssessments([targetSubscription]);
            setSelectedAssessment(targetSubscription);
          } else {
            console.error('[AssessmentChat] Subscription not found:', directSubscriptionId);
            setError(`Assessment subscription ${directSubscriptionId} not found`);
          }
          
          setLoading(false);
          return;
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
                  console.log('[AssessmentChat] Auto-selecting assessment:', matching);
                  setSelectedAssessment(matching);
                } else {
                  console.log('[AssessmentChat] No matching assessment found for type:', assessmentType);
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
    console.log('[AssessmentChat] Workflow check:', {
      hasSelectedAssessment: !!selectedAssessment,
      hasWorkflowState: !!workflowState,
      selectedAssessmentId: selectedAssessment?.SubscriptionID
    });
    
    if (selectedAssessment && !workflowState) {
      console.log('[AssessmentChat] Starting workflow for assessment:', selectedAssessment.SubscriptionID);
      startWorkflow(selectedAssessment);
    }
  }, [selectedAssessment]);

  // Track if we've sent the initial greeting
  const hasInitializedRef = useRef(false);
  
  // Auto-start assessment if there's only one available
  useEffect(() => {
    console.log('[AssessmentChat] Auto-start check:', {
      loading,
      availableAssessmentsLength: availableAssessments.length,
      hasSelectedAssessment: !!selectedAssessment,
      hasInitialized: hasInitializedRef.current
    });
    
    // If there's only one assessment and nothing selected yet, auto-select it
    if (!loading && availableAssessments.length === 1 && !selectedAssessment && !hasInitializedRef.current) {
      console.log('[AssessmentChat] Auto-selecting single assessment:', availableAssessments[0]);
      hasInitializedRef.current = true;
      
      // Auto-select the assessment after a small delay
      setTimeout(() => {
        setSelectedAssessment(availableAssessments[0]);
        startWorkflow(availableAssessments[0]);
      }, 500);
    }
  }, [loading, availableAssessments, selectedAssessment]);

  const startWorkflow = async (assessment: AssessmentSubscription) => {
    console.log('[AssessmentChat] startWorkflow called for:', assessment);
    const subscriptionIdToUse = (assessment as any)._subscriptionId || assessment.SubscriptionID.toString();
    console.log('[AssessmentChat] Using subscription ID:', {
      original: assessment.SubscriptionID,
      _subscriptionId: (assessment as any)._subscriptionId,
      using: subscriptionIdToUse,
      type: typeof subscriptionIdToUse
    });
    
    try {
      // Use workflow ID map from constants
      
      const response = await fetch('/api/mock-tms/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: WORKFLOW_ID_MAP[assessment.AssessmentType] || assessment.WorkflowType.toLowerCase().replace(' ', '-') + '-workflow',
          subscriptionId: subscriptionIdToUse
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.firstPageUrl) {
          // Parse the first page URL: /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
          // Updated regex to handle both numeric and string subscription IDs
          const urlMatch = data.firstPageUrl.match(/\/Workflow\/Process\/([^\/]+)(?:\/(\d+))?(?:\/(\d+))?(?:\/(\d+))?/);
          
          if (urlMatch) {
            const [, subId, baseId, secId, pgId] = urlMatch;
            console.log('[Assessment] Parsed URL match:', {
              fullMatch: urlMatch[0],
              subId,
              baseId,
              secId,
              pgId
            });
            
            await getWorkflowPage(
              subId,
              baseId ? parseInt(baseId) : undefined,
              secId ? parseInt(secId) : undefined,
              pgId ? parseInt(pgId) : undefined
            );
          } else {
            // Fallback: use the subscription ID from the assessment
            const subId = (assessment as any)._subscriptionId || assessment.SubscriptionID.toString();
            console.log('[Assessment] Using fallback subscription ID:', subId);
            await getWorkflowPage(subId);
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
        
        const newWorkflowState = {
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
        };
        
        console.log('[Assessment] Setting workflow state for page:', {
          pageId: newWorkflowState.currentPageId,
          description: newWorkflowState.pageDescription,
          questionCount: newWorkflowState.questions.length
        });
        
        setWorkflowState(newWorkflowState);
        
        // Reset answers for new page, but populate with existing values if any
        const existingAnswers: Record<number, string> = {};
        newWorkflowState.questions.forEach((q: any) => {
          const questionId = q.QuestionID || q.questionID || q.id;
          const existingValue = q.Value || q.value;
          if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
            // Normalize value format: "20" -> "2-0"
            const normalizedValue = String(existingValue).replace(/^(\d)(\d)$/, '$1-$2');
            existingAnswers[questionId] = normalizedValue;
            console.log('[Assessment] Pre-existing answer found:', {
              questionId,
              existingValue,
              normalizedValue
            });
          }
        });
        console.log('[Assessment] Setting currentAnswers with existing values:', existingAnswers);
        setCurrentAnswers(existingAnswers);
      } else {
        throw new Error('Failed to load workflow page');
      }
    } catch (err) {
      console.error('Error getting workflow page:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    }
  };

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    console.log(`[Assessment] Answer change: Question ${questionId} = ${value}, current voice mode: ${voiceModeEnabled}`);
    
    // The voice agent already sends values in "2-0" format, so we don't need to convert
    // Only convert if it's in "20" format (2 digits without dash)
    const normalizedValue = /^\d\d$/.test(value) ? value.replace(/^(\d)(\d)$/, '$1-$2') : value;
    console.log(`[Assessment] Normalized value: ${value} -> ${normalizedValue}`);
    
    setCurrentAnswers(prev => {
      // Create a completely new object to ensure React detects the change
      const newAnswers = Object.assign({}, prev, {
        [questionId]: normalizedValue
      });
      console.log('[Assessment] Updated answers:', newAnswers);
      console.log('[Assessment] Current answers state:', prev);
      console.log('[Assessment] New answers state:', newAnswers);
      
      // Force a re-render by returning a new object reference
      return { ...newAnswers };
    });
  }, [voiceModeEnabled]);

  const submitCurrentPage = async (triggeredByAgent = false) => {
    if (!workflowState) return;
    
    try {
      // Format answers for API
      const questions = Object.entries(currentAnswers).map(([questionId, value]) => {
        // Convert format back for API: "2-0" -> "20"
        const apiValue = value.replace(/^(\d)-(\d)$/, '$1$2');
        return {
          questionID: parseInt(questionId),
          value: apiValue
        };
      });
      
      const response = await fetch('/api/mock-tms/workflow/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionID: workflowState.subscriptionId,
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
            const newWorkflowState = {
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
            };
            
            console.log('[Assessment] Navigation to new page:', {
              pageId: newWorkflowState.currentPageId,
              description: newWorkflowState.pageDescription,
              questionCount: newWorkflowState.questions.length
            });
            
            setWorkflowState(newWorkflowState);
            
            // Reset answers for new page, but populate with existing values if any
            const existingAnswers: Record<number, string> = {};
            newWorkflowState.questions.forEach((q: any) => {
              const questionId = q.QuestionID || q.questionID || q.id;
              const existingValue = q.Value || q.value;
              if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
                // Normalize value format: "20" -> "2-0"
                const normalizedValue = String(existingValue).replace(/^(\d)(\d)$/, '$1-$2');
                existingAnswers[questionId] = normalizedValue;
                console.log('[Assessment] Pre-existing answer found on navigation:', {
                  questionId,
                  existingValue,
                  normalizedValue
                });
              }
            });
            console.log('[Assessment] Setting currentAnswers with existing values on navigation:', existingAnswers);
            setCurrentAnswers(existingAnswers);
            
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
          subscriptionId: (selectedAssessment as any)._subscriptionId || selectedAssessment.SubscriptionID.toString(),
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
          window.location.href = `/chat/debrief?agent=${DEFAULT_DEBRIEF_AGENT}&reportType=${selectedAssessment.AssessmentType}&subscriptionId=${(selectedAssessment as any)._subscriptionId || selectedAssessment.SubscriptionID}&new=true`;
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
    
    // In voice mode, the OpenAI Realtime API handles all conversations
    // We only need to handle specific UI actions, not send transcripts to text chat
    if (command.type === 'unknown') {
      // Let the voice agent handle unknown commands - don't send to text chat
      return;
    }
    
    // Handle specific recognized commands for quick actions
    switch (command.type) {
      case 'navigation':
        if (command.parameters?.target === 'next') {
          submitCurrentPage();
        } else if (command.parameters?.target === 'previous') {
          // Voice agent handles navigation - don't send to text chat
          console.log('Voice navigation: previous page requested');
        } else if (command.parameters?.target === 'skip') {
          // Voice agent handles skipping - don't send to text chat
          console.log('Voice navigation: skip requested');
        }
        break;
        
      case 'answer':
        if (command.parameters?.value && workflowState) {
          // Voice agent handles answers - don't send to text chat
          console.log('Voice answer:', command.parameters.value);
        }
        break;
        
      case 'action':
        switch (command.parameters?.target) {
          case 'repeat':
            // Voice agent handles repeat - don't send to text chat
            console.log('Voice action: repeat requested');
            break;
            
          case 'help':
            setShowVoiceHelp(true);
            break;
            
          case 'exitVoice':
            stopVoiceRef.current?.();
            setVoiceModeEnabled(false);
            const exitMessage = '🔇 Voice mode disabled. You can now type your responses in the chat.';
            append({
              role: 'assistant',
              content: exitMessage
            });
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
  
  // Create a stable answer callback reference
  const voiceAnswerCallback = useCallback((questionId: number, value: string) => {
    console.log(`[Voice Callback] Answer update: Question ${questionId} = "${value}" (type: ${typeof value}), currentPage: ${workflowState?.currentPageId}`);
    // Debug: Log available questions to see if questionId matches
    const availableQuestions = workflowState?.questions?.filter((q: any) => q.Type === 18).map((q: any) => q.QuestionID || q.questionID);
    console.log('[Voice Callback] Available question IDs on page:', availableQuestions);
    console.log('[Voice Callback] Question ID matches available questions:', availableQuestions?.includes(questionId));
    handleAnswerChange(questionId, value);
  }, [handleAnswerChange, workflowState?.currentPageId, workflowState?.questions]);
  
  // Create a stable navigation callback reference
  const voiceNavigateNextCallback = useCallback(() => {
    console.log('[Voice Callback] Navigate next requested');
    submitCurrentPage();
  }, [submitCurrentPage]);

  // Handle voice mode toggling
  const handleVoiceToggle = useCallback(async () => {
    // Prevent multiple toggles
    if (isTogglingVoice) {
      console.log('[VoiceToggle] Already toggling, ignoring...');
      return;
    }
    
    setIsTogglingVoice(true);
    console.log('[VoiceToggle] Current state:', { voiceModeEnabled, voiceState });
    
    try {
      // If voice is enabled in any state, turn it off
      if (voiceModeEnabled || voiceState !== 'idle') {
        console.log('[VoiceToggle] Stopping voice...');
        setVoiceModeEnabled(false);  // Set this first to prevent re-enabling
        await stopVoice();
        console.log('[VoiceToggle] Voice stopped');
      } else {
        // Start voice mode
        // Show permission dialog first time
        if (!hasShownVoiceEntry) {
          setShowVoicePermission(true);
        } else {
          try {
            console.log('[VoiceToggle] Starting voice...');
            // Ensure callbacks are set before starting
            if (workflowState) {
              setVoiceWorkflowState(workflowState);
              setVoiceAnswerCallback(voiceAnswerCallback);
              setVoiceNavigateNextCallback(voiceNavigateNextCallback);
            }
            await startVoice();
            setVoiceModeEnabled(true);
            console.log('[VoiceToggle] Voice started');
          } catch (error) {
            console.error('Failed to start voice:', error);
          }
        }
      }
    } finally {
      // Allow toggling again after a short delay
      setTimeout(() => {
        setIsTogglingVoice(false);
      }, 500);
    }
  }, [voiceState, voiceModeEnabled, hasShownVoiceEntry, isTogglingVoice, startVoice, stopVoice, workflowState, voiceAnswerCallback, voiceNavigateNextCallback, setVoiceWorkflowState, setVoiceAnswerCallback, setVoiceNavigateNextCallback]);
  
  // Handle voice permission response
  const handleVoicePermissionAllow = useCallback(async () => {
    setShowVoicePermission(false);
    setHasShownVoiceEntry(true);
    
    try {
      // Voice mode can now start without any messages
      
      // Set up the voice service with workflow state before starting
      if (workflowState) {
        setVoiceWorkflowState(workflowState);
        setVoiceAnswerCallback(voiceAnswerCallback);
        setVoiceNavigateNextCallback(voiceNavigateNextCallback);
      }
      
      // Wait for voice session to start
      await startVoice();
      setVoiceModeEnabled(true);
      
      console.log('[AssessmentChat] Voice mode started, messages count:', messages.length);
      // Don't append any message - let the voice agent handle all communication
    } catch (error) {
      console.error('Failed to start voice mode:', error);
      setVoiceModeEnabled(false);
    }
  }, [startVoice, workflowState, voiceAnswerCallback, voiceNavigateNextCallback, setVoiceWorkflowState, setVoiceAnswerCallback, setVoiceNavigateNextCallback, messages.length, append]);
  
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
  
  // Debug effect to monitor messages changes
  useEffect(() => {
    console.log('[AssessmentChat] Messages changed:', {
      count: messages.length,
      lastMessage: messages[messages.length - 1]
    });
  }, [messages]);
  
  // Update voice workflow state when page changes (not on every render)
  const previousPageId = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (workflowState && workflowState.currentPageId !== previousPageId.current) {
      previousPageId.current = workflowState.currentPageId;
      
      console.log('[Voice] Updating workflow state for voice service:', {
        pageId: workflowState.currentPageId,
        pageDescription: workflowState.pageDescription,
        questionCount: workflowState.questions?.length,
        // Debug: Log all question IDs to identify mismatch
        seesawQuestions: workflowState.questions?.filter((q: any) => q.Type === 18).map((q: any) => ({
          number: q.Number,
          questionID: q.QuestionID || q.questionID,
          prompt: q.Prompt,
          statementA: q.StatementA || q.statementA,
          statementB: q.StatementB || q.statementB
        }))
      });
      
      // Always set the workflow state, even if voice mode is not enabled yet
      setVoiceWorkflowState(workflowState);
      
      // Always ensure callbacks are connected
      setVoiceAnswerCallback(voiceAnswerCallback);
      setVoiceNavigateNextCallback(voiceNavigateNextCallback);
    }
  }, [workflowState?.currentPageId, setVoiceWorkflowState, setVoiceAnswerCallback, setVoiceNavigateNextCallback, voiceAnswerCallback, voiceNavigateNextCallback]);
  
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
      {/* Voice mode entry banner - Disabled for now to prevent automatic prompts */}
      {/* {selectedAssessment && !hasShownVoiceEntry && (
        <VoiceModeEntry
          onStartVoice={() => {
            setHasShownVoiceEntry(true);
            setShowVoicePermission(true);
          }}
          onDismiss={handleVoiceEntryDismiss}
        />
      )} */}
      
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