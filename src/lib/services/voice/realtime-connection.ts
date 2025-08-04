import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import { VoiceConfig } from './types';
import { AudioFeedback } from './audio-feedback';

export class RealtimeConnectionManager {
  private rt: any | null = null; // Using any to avoid type issues
  private audioBuffer: Int16Array[] = [];
  private isConnected = false;
  private sessionToken: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private isSpeaking = false;
  private audioQueueLimit = 1000; // Very high limit to never drop audio
  private hasPlayedAudio = false; // Track if we've played any audio yet
  private pcm16Buffer = new Uint8Array(0); // Buffer for incomplete PCM16 samples
  private workflowState: any = null;
  private onAnswerUpdate?: (questionId: number, value: string) => void;
  private onNavigateNext?: () => void;
  private eventHandlersSetup = false;
  private isGeneratingResponse = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private sessionExpiresAt: number | null = null;
  private sessionRefreshTimer: NodeJS.Timeout | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private playbackTimeout: NodeJS.Timeout | null = null;
  private audioFeedback: AudioFeedback;
  private isIntentionalDisconnect = false;
  private conversationContext: {
    currentPage: number;
    answeredQuestions: Set<number>;
    lastQuestionId: number | null;
    conversationHistory: Array<{ role: string; content: string; timestamp: number }>;
  } = {
    currentPage: 1,
    answeredQuestions: new Set(),
    lastQuestionId: null,
    conversationHistory: []
  };
  
  constructor(private config: VoiceConfig) {
    // Initialize Web Audio API for audio playback
    // Note: This is separate from the recording AudioContext in AudioManager
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
    
    // Initialize audio feedback
    this.audioFeedback = new AudioFeedback();
  }

  setWorkflowState(state: any) {
    const previousPageId = this.workflowState?.currentPageId;
    this.workflowState = state;
    
    // If we're connected and the page has changed, update the session
    if (this.isConnected && this.rt && state && previousPageId !== state.currentPageId && previousPageId !== undefined) {
      console.log('[Voice] Page changed from', previousPageId, 'to', state.currentPageId);
      console.log('[Voice] New page description:', state.pageDescription);
      console.log('[Voice] New questions count:', state.questions?.length);
      
      // Clear any ongoing audio to prevent overlap
      this.stopAllAudio();
      
      // Update the session with new page info
      this.updateSessionForNewPage();
    }
  }

  setAnswerUpdateCallback(callback: (questionId: number, value: string) => void) {
    console.log('[Voice] Setting answer update callback');
    this.onAnswerUpdate = callback;
  }
  
  setNavigateNextCallback(callback: () => void) {
    console.log('[Voice] Setting navigate next callback');
    this.onNavigateNext = callback;
  }
  
  setAudioFeedbackEnabled(enabled: boolean) {
    this.audioFeedback.setEnabled(enabled);
  }

  getConversationContext() {
    return {
      currentPage: this.conversationContext.currentPage,
      answeredQuestions: Array.from(this.conversationContext.answeredQuestions),
      lastQuestionId: this.conversationContext.lastQuestionId,
      conversationHistory: [...this.conversationContext.conversationHistory]
    };
  }

  setConversationContext(context: {
    currentPage?: number;
    answeredQuestions?: number[];
    lastQuestionId?: number | null;
    conversationHistory?: Array<{ role: string; content: string; timestamp: number }>;
  }) {
    if (context.currentPage !== undefined) {
      this.conversationContext.currentPage = context.currentPage;
    }
    if (context.answeredQuestions) {
      this.conversationContext.answeredQuestions = new Set(context.answeredQuestions);
    }
    if (context.lastQuestionId !== undefined) {
      this.conversationContext.lastQuestionId = context.lastQuestionId;
    }
    if (context.conversationHistory) {
      this.conversationContext.conversationHistory = [...context.conversationHistory];
    }
  }

  async connect(): Promise<void> {
    try {
      this.config.onStateChange?.('connecting');
      
      // First, get an ephemeral session token from our API
      const sessionResponse = await fetch('/api/voice/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowState: this.workflowState, // Pass workflow state to server
        }),
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to create voice session');
      }
      
      const sessionData = await sessionResponse.json();
      console.log('Session data received:', sessionData);
      this.sessionToken = sessionData.session.token;
      
      // Store session expiration time
      if (sessionData.session.expires_at) {
        this.sessionExpiresAt = new Date(sessionData.session.expires_at).getTime();
        this.scheduleSessionRefresh();
      }
      
      if (!this.sessionToken) {
        throw new Error('No session token received from server');
      }
      
      console.log('Using ephemeral token:', this.sessionToken.substring(0, 10) + '...');
      
      try {
        // Initialize OpenAI Realtime WebSocket with ephemeral token
        console.log('[Voice] About to create WebSocket...');
        console.log('[Voice] Model:', this.config.model || 'gpt-4o-realtime-preview-2024-12-17');
        console.log('[Voice] Token exists:', !!this.sessionToken);
        console.log('[Voice] OpenAIRealtimeWebSocket exists:', typeof OpenAIRealtimeWebSocket);
        
        // Try the simplest possible creation
        this.rt = new OpenAIRealtimeWebSocket({
          model: this.config.model || 'gpt-4o-realtime-preview-2024-12-17',
          dangerouslyAllowBrowser: true,
        }, {
          apiKey: this.sessionToken,
          baseURL: 'wss://api.openai.com/v1'
        });

        console.log('[Voice] WebSocket instance created:', !!this.rt);
        console.log('[Voice] WebSocket socket exists:', !!this.rt?.socket);
        console.log('[Voice] WebSocket type:', this.rt?.constructor?.name);
        
        // Log socket details if available
        if (this.rt?.socket) {
          console.log('[Voice] Socket readyState:', this.rt.socket.readyState);
          console.log('[Voice] Socket url:', this.rt.socket.url);
        }
      } catch (error) {
        console.error('[Voice] Failed to create WebSocket:', error);
        console.error('[Voice] Error stack:', error instanceof Error ? error.stack : 'No stack');
        console.error('[Voice] Error details:', error);
        throw error;
      }
      
      // Set up event handlers BEFORE the socket connects
      this.setupEventHandlers();

      // The WebSocket connects automatically on creation
      // Wait for the socket to be ready
      console.log('[Voice] Waiting for WebSocket to open...');
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('[Voice] WebSocket connection timeout after 10s');
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        // Check if already open
        if (this.rt?.socket?.readyState === WebSocket.OPEN) {
          console.log('[Voice] WebSocket already open');
          clearTimeout(timeout);
          resolve();
          return;
        }

        // Wait for open event
        if (this.rt?.socket) {
          console.log('[Voice] WebSocket state:', this.rt.socket.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
          
          this.rt.socket.addEventListener('open', () => {
            console.log('[Voice] WebSocket opened successfully!');
            clearTimeout(timeout);
            resolve();
          }, { once: true });
          
          this.rt.socket.addEventListener('error', (error: any) => {
            console.error('[Voice] WebSocket error:', error);
            clearTimeout(timeout);
            reject(new Error('WebSocket connection error'));
          }, { once: true });
          
          this.rt.socket.addEventListener('close', (event: any) => {
            console.error('[Voice] WebSocket closed unexpectedly:', event.code, event.reason);
            clearTimeout(timeout);
            reject(new Error(`WebSocket closed: ${event.code} ${event.reason}`));
          }, { once: true });
        } else {
          clearTimeout(timeout);
          reject(new Error('No WebSocket object available'));
        }
      });
      
      // Build instructions with the actual questions
      const questions = this.workflowState?.questions?.filter((q: any) => q.Type === 18 || q.type === 18) || [];
      const questionMapping: Record<string, number> = {};
      
      const questionText = questions.map((q: any, index: number) => {
        const qId = q.questionID || q.QuestionID || q.questionId;
        const qNum = q.Number || q.number || q.Prompt?.replace(')', '') || (index + 1).toString();
        questionMapping[qNum] = qId;
        const statementA = q.StatementA || q.statementA || '[Statement A not found]';
        const statementB = q.StatementB || q.statementB || '[Statement B not found]';
        return `Question ${qNum} (ID: ${qId}): Left statement: "${statementA}", Right statement: "${statementB}"`;
      }).join('\n');
      
      console.log('Question mapping:', questionMapping);

      // Configure session with full assessment context
      console.log('[Voice] Sending session update...');
      await this.rt.send({
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],  // Audio first for voice-first experience
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
            create_response: true,  // Enable automatic responses when user stops speaking
          },
          instructions: `You are OSmos, the Team Assessment Assistant conducting a voice-based questionnaire.

CRITICAL: You are conducting a TMP (Team Management Profile) assessment with these exact questions:
${questionText}

${(() => {
  const preAnswered = questions
    .filter((q: any) => {
      const value = q.Value || q.value;
      return value !== undefined && value !== null && value !== '';
    })
    .map((q: any) => {
      const qId = q.QuestionID || q.questionID || q.questionId;
      const qNum = q.Number || q.number || q.Prompt?.replace(')', '');
      const value = q.Value || q.value;
      return `Question ${qNum} (ID: ${qId}) already answered: ${value}`;
    });
  
  if (preAnswered.length > 0) {
    return `IMPORTANT: Some questions already have answers from a previous session:\n${preAnswered.join('\n')}\n\nThese are NOT new answers - they were saved from before. Skip these questions when reading through.`;
  }
  return '';
})()}

Your role:
1. Start by saying: "Welcome to the Team Management Profile assessment. I'll guide you through ${questions.length} questions. For each question, I'll read both statements and you can answer with 2-0 for strongly preferring the left statement, 2-1 for slightly left, 1-2 for slightly right, or 0-2 for strongly right. ${questions.some((q: any) => q.Value || q.value) ? 'I see you\'ve already answered some questions. Let me continue from where you left off.' : 'Let\'s begin with question one.'}"

2. Be conversational and helpful. If users ask general questions:
   - About their name: "I don't have access to your personal information for privacy reasons, but I'm here to help guide you through the assessment."
   - About the assessment: Provide brief, helpful information
   - Off-topic questions: Politely redirect to the assessment: "That's an interesting question! Let's focus on completing your assessment first. We're currently on question [X]."

3. Keep track of which question you're currently on. Start with question 1 and proceed sequentially.

4. For each question:
   - Read the question number and both statements clearly
   - Pause briefly between statements
   - Wait for the user's answer
   - Use answer_question function to record their response
   - CRITICAL: After the answer_question function completes, you MUST immediately continue by either:
     a) Reading the next question if there are more questions on this page, OR
     b) Saying "Great! You've completed all questions on this page. Would you like to continue to the next page?" if all questions are answered

5. When they answer, be VERY flexible in understanding responses. Extract the answer value from any natural language:
   
   Core answer patterns (extract these and convert):
   - "2-0", "2 0", "two zero", "20", "strongly left", "strong left", "all the way left" → use value "20"
   - "2-1", "2 1", "two one", "21", "slightly left", "slight left", "a bit left", "somewhat left", "left" → use value "21"
   - "1-2", "1 2", "one two", "12", "slightly right", "slight right", "a bit right", "somewhat right", "right" → use value "12"
   - "0-2", "0 2", "zero two", "02", "zero 2", "strongly right", "strong right", "all the way right" → use value "02"
   
   CRITICAL: When user says "02" or "zero two", this means 0-2 (strongly right), NOT 2-0!
   
   Multiple answers in sequence:
   - If user provides multiple values like "2 0 2 1 1 2 0 2 2 1", parse each pair as an answer for questions in order
   - "2 0" = first question gets "20", "2 1" = second question gets "21", etc.
   - Apply answers to questions in the order they appear on the current page
   
   IMPORTANT: Be flexible with phrasing. Extract the answer from ANY of these patterns:
   - "Enter X" / "Put X" / "Answer X" / "Select X" / "Choose X" / "Pick X" / "Go with X"
   - "X for this one" / "X for this question" / "X please" / "Let's go with X" / "I'll take X"
   - "I think X" / "I'd say X" / "Probably X" / "Definitely X" / "Make it X"
   - "The answer is X" / "Mark X" / "Record X" / "Set X"
   - Just saying the value alone: "2-0" or "slightly left" etc.
   - "X for all" / "X for all questions" / "Answer all X" / "All X" → Use answer_multiple_questions function
   - "Answer all 2-0" / "All 2-0" / "2-0 for all" → Apply 2-0 to all required questions
   
   Navigation commands:
   - "Next" / "Next question" / "Continue" → Just read the next question in sequence
   - "Skip" → Read the next question without recording current answer
   - "Previous" / "Go back" / "Change my last answer" → Use go_to_previous_question function
   - "Repeat" / "Say that again" → Read the current question again
   - "What question are we on?" → Tell them the current question number
   
   Only use navigate_next when:
   - User explicitly says "next page" or "continue to next page"
   - All questions on current page are answered

6. After all questions on the page are answered, say "Great! You've completed all questions on this page. Would you like to continue to the next page?"

7. Keep your responses concise. Acknowledge answers with just "Got it" or "Thank you" then immediately read the next question.

IMPORTANT: 
- Each question has an ID number shown in parentheses. Use this ID when calling the answer_question function.
- For "answer all" or "X for all questions", collect all question IDs from the current page and use answer_multiple_questions
- The questions on this page have these IDs: ${questions.map((q: any) => q.QuestionID || q.questionID).join(', ')}
- Required questions (Type 18 - seesaw questions) that must be answered: ${questions.filter((q: any) => q.Type === 18).map((q: any) => `Question ${q.Number} (ID: ${q.QuestionID || q.questionID})`).join(', ')}
- When all required questions have been answered, ask if the user wants to continue to the next page`,
          tools: [
            {
              type: 'function',
              name: 'answer_question',
              description: 'Record the user\'s answer to a question',
              parameters: {
                type: 'object',
                properties: {
                  questionId: { type: 'integer', description: 'The ID of the question' },
                  value: { type: 'string', description: 'The answer value (20, 21, 12, or 02)' }
                },
                required: ['questionId', 'value']
              }
            },
            {
              type: 'function',
              name: 'answer_multiple_questions',
              description: 'Record the same answer for multiple questions at once',
              parameters: {
                type: 'object',
                properties: {
                  questionIds: { 
                    type: 'array', 
                    items: { type: 'integer' },
                    description: 'Array of question IDs to answer'
                  },
                  value: { type: 'string', description: 'The answer value (20, 21, 12, or 02) to apply to all questions' }
                },
                required: ['questionIds', 'value']
              }
            },
            {
              type: 'function', 
              name: 'navigate_next',
              description: 'Navigate to the next page of questions',
              parameters: { type: 'object', properties: {} }
            },
            {
              type: 'function',
              name: 'go_to_previous_question',
              description: 'Go back to the previous question when user wants to change their answer',
              parameters: { type: 'object', properties: {} }
            }
          ]
        },
      });

      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.config.onStateChange?.('ready');
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      // Small delay to ensure session configuration is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start the conversation
      await this.startAssessmentConversation();
    } catch (error) {
      this.isGeneratingResponse = false; // Reset on connection error
      this.config.onStateChange?.('error');
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  async startAssessmentConversation(): Promise<void> {
    if (!this.rt || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    // Prevent duplicate responses
    if (this.isGeneratingResponse) {
      console.log('[Voice] Skipping initial conversation - already generating response');
      return;
    }

    // Wait a moment to ensure audio system is fully ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mark that we're generating a response
    this.isGeneratingResponse = true;

    // Trigger the assistant to start the conversation
    console.log('[Voice] Sending response.create to start conversation...');
    try {
      await this.rt.send({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
        }
      });
      console.log('[Voice] response.create sent successfully');
    } catch (error) {
      console.error('[Voice] Failed to send response.create:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.rt || this.eventHandlersSetup) return;
    
    this.eventHandlersSetup = true;
    
    // Debug - check if event handlers are working
    console.log('[Voice] Setting up event handlers, rt exists:', !!this.rt);
    
    // The OpenAI beta SDK uses raw WebSocket messages
    // We need to intercept at the WebSocket level
    if (this.rt && this.rt.socket) {
      const originalOnMessage = this.rt.socket.onmessage;
      this.rt.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Voice Debug] WebSocket message:', data.type || 'unknown', data);
          
          // Check for specific events we care about
          if (data.type === 'response.audio.delta') {
            console.log('[Voice] Audio delta received!');
          } else if (data.type === 'response.audio_transcript.delta') {
            console.log('[Voice] Transcript delta:', data.delta);
          } else if (data.type === 'input_audio_buffer.speech_started') {
            console.log('[Voice] User started speaking');
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            console.log('[Voice] User stopped speaking');
          } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
            console.log('[Voice] User transcript:', data.transcript);
          }
        } catch (e) {
          console.error('[Voice] Failed to parse WebSocket message:', e);
        }
        
        // Call original handler
        if (originalOnMessage) {
          originalOnMessage.call(this.rt.socket, event);
        }
      };
      
      console.log('[Voice] WebSocket message interceptor installed');
    } else {
      console.error('[Voice] Cannot setup handlers - no socket!');
    }

    // Handle speech detection events
    this.rt.on('input_audio_buffer.speech_started', (event: any) => {
      console.log('[Voice] Speech started - interrupting any playing audio');
      
      // Stop any currently playing audio to allow interruption
      this.stopAllAudio();
      
      this.config.onStateChange?.('listening');
    });

    this.rt.on('input_audio_buffer.speech_stopped', (event: any) => {
      console.log('[Voice] Speech stopped');
      // Server will automatically create response with create_response: true
      // Mark that we're expecting a response to prevent duplicate response creation
      if (!this.isGeneratingResponse) {
        this.isGeneratingResponse = true;
        // Show thinking state while processing
        this.config.onStateChange?.('thinking');
      }
    });

    // Handle transcription updates - in progress (for real-time display)
    this.rt.on('conversation.item.input_audio_transcription.in_progress', (event: any) => {
      const partialTranscript = event.transcript;
      if (partialTranscript) {
        console.log('[Voice] User saying (partial):', partialTranscript);
        // Update the transcript display in real-time
        this.config.onTranscript?.(partialTranscript);
      }
    });

    // Handle transcription updates - completed
    this.rt.on('conversation.item.input_audio_transcription.completed', (event: any) => {
      const transcript = event.transcript;
      if (transcript) {
        console.log('[Voice] User said:', transcript);
        // Add to conversation history
        this.conversationContext.conversationHistory.push({
          role: 'user',
          content: transcript,
          timestamp: Date.now()
        });
        this.config.onTranscript?.(transcript);
      }
    });

    // Handle function calls from the assistant
    this.rt.on('response.function_call_arguments.done', async (event: any) => {
      console.log('Function call received:', event);
      const name = (event as any).name;
      const args = (event as any).arguments;
      
      if (name === 'answer_question') {
        const { questionId, value } = JSON.parse(args);
        console.log(`[Voice] Recording answer: Question ${questionId} = ${value}`);
        // Debug: Log workflow state to check question mapping
        if (this.workflowState) {
          console.log('[Voice] Current page ID:', this.workflowState.currentPageId);
          const seesawQuestions = this.workflowState.questions?.filter((q: any) => q.Type === 18);
          console.log('[Voice] Seesaw questions on page:', seesawQuestions?.map((q: any) => ({
            number: q.Number,
            id: q.QuestionID || q.questionID,
            prompt: q.Prompt
          })));
        }
        
        // Map the value format (20, 21, 12, 02) to display format
        const valueMap: Record<string, string> = {
          '20': '2-0',
          '21': '2-1',
          '12': '1-2',
          '02': '0-2'
        };
        const mappedValue = valueMap[value] || value;
        
        // Update conversation context
        this.conversationContext.answeredQuestions.add(questionId);
        this.conversationContext.lastQuestionId = questionId;
        
        // Call the answer update callback if provided
        console.log('[Voice] Checking answer callback:', {
          hasCallback: !!this.onAnswerUpdate,
          questionId,
          mappedValue,
          workflowPageId: this.workflowState?.currentPageId
        });
        
        if (this.onAnswerUpdate) {
          // Pass the mapped display value instead of the raw value
          this.onAnswerUpdate(questionId, mappedValue);
          // Play success sound for answer recording
          this.audioFeedback.playSuccess();
        } else {
          console.warn('[Voice] No answer update callback set');
        }
        
        // Send function call result back
        if (this.rt) {
          await this.rt.send({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: (event as any).call_id,
              output: JSON.stringify({ 
                success: true, 
                message: `Successfully recorded answer ${mappedValue} for question ${questionId}. Continue immediately by reading the next question or asking to proceed to next page if all questions are answered.`
              })
            }
          });
        }
        
        // Trigger a response to continue the conversation
        await this.rt.send({
          type: 'response.create'
        });
      } else if (name === 'answer_multiple_questions') {
        const { questionIds, value } = JSON.parse(args);
        console.log(`Recording ${questionIds.length} answers with value ${value}`);
        
        // Map the value format
        const valueMap: Record<string, string> = {
          '20': '2-0',
          '21': '2-1',
          '12': '1-2',
          '02': '0-2'
        };
        const mappedValue = valueMap[value] || value;
        
        // Update conversation context for all questions
        for (const questionId of questionIds) {
          this.conversationContext.answeredQuestions.add(questionId);
        }
        if (questionIds.length > 0) {
          this.conversationContext.lastQuestionId = questionIds[questionIds.length - 1];
        }
        
        // Call the answer update callback for each question
        if (this.onAnswerUpdate && questionIds.length > 0) {
          for (const questionId of questionIds) {
            // Pass the mapped display value instead of the raw value
            this.onAnswerUpdate(questionId, mappedValue);
          }
        } else if (!this.onAnswerUpdate) {
          console.warn('[Voice] No answer update callback set');
        }
        
        // Send function call result back
        if (this.rt) {
          await this.rt.send({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: (event as any).call_id,
              output: JSON.stringify({ 
                success: true, 
                message: `Successfully recorded answer ${mappedValue} for ${questionIds.length} questions. Continue immediately by reading the next question or asking to proceed to next page if all questions are answered.`
              })
            }
          });
        }
        
        // Trigger a response to continue the conversation
        await this.rt.send({
          type: 'response.create'
        });
      } else if (name === 'navigate_next') {
        console.log('Navigation to next page requested');
        
        // Call the navigation callback if available
        if (this.onNavigateNext) {
          this.onNavigateNext();
        } else {
          console.warn('[Voice] No navigate next callback set');
        }
        
        // Send function call result
        if (this.rt) {
          await this.rt.send({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: (event as any).call_id,
              output: JSON.stringify({ 
                success: true, 
                message: 'Navigating to next page. Please wait...' 
              })
            }
          });
        }
      } else if (name === 'go_to_previous_question') {
        console.log('Go to previous question requested');
        
        // Find the previous question ID
        const lastQuestionId = this.conversationContext.lastQuestionId;
        let instruction = 'Going back to the previous question.';
        
        if (lastQuestionId && this.workflowState?.questions) {
          const questions = this.workflowState.questions.filter((q: any) => q.Type === 18);
          const currentIndex = questions.findIndex((q: any) => q.QuestionID === lastQuestionId || q.questionID === lastQuestionId);
          
          if (currentIndex > 0) {
            const prevQuestion = questions[currentIndex - 1];
            instruction = `Going back to question ${prevQuestion.Number}. ${prevQuestion.StatementA} OR ${prevQuestion.StatementB}`;
          } else {
            instruction = "You're already at the first question. Let me read it again.";
          }
        }
        
        if (this.rt) {
          await this.rt.send({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: (event as any).call_id,
              output: JSON.stringify({ 
                success: true, 
                instruction: instruction
              })
            }
          });
        }
      }
    });

    // Track when response generation starts
    this.rt.on('response.created', (event: any) => {
      console.log('[Voice] Response created');
      this.isGeneratingResponse = true;
    });
    
    // Handle responses
    this.rt.on('response.text.delta', (event: any) => {
      // Handle text responses if needed
      console.log('Assistant text:', event.delta);
    });

    // Handle audio responses
    this.rt.on('response.audio_transcript.delta', (event: any) => {
      // Handle audio transcript if needed
      console.log('Assistant audio transcript:', event.delta);
    });
    
    // Track complete assistant responses
    this.rt.on('response.audio_transcript.done', (event: any) => {
      if (event.transcript) {
        // Add to conversation history
        this.conversationContext.conversationHistory.push({
          role: 'assistant',
          content: event.transcript,
          timestamp: Date.now()
        });
      }
    });

    // Handle audio playback
    let audioChunkIndex = 0;
    this.rt.on('response.audio.delta', (event: any) => {
      if (event.delta && this.audioContext) {
        const chunkId = audioChunkIndex++;
        
        // Don't use circuit breaker - let audio accumulate and play naturally
        
        // Convert base64 audio to playable format
        const audioData = this.base64ToAudioData(event.delta);
        
        // Log every 10th chunk to reduce noise
        if (chunkId % 10 === 0) {
          console.log(`[Voice] Audio chunk ${chunkId} received: ${audioData.length} samples, queue: ${this.audioQueue.length} chunks`);
        }
        
        this.queueAudioForPlayback(audioData, chunkId);
        
        // Only update state once when speaking starts
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.config.onStateChange?.('speaking');
        }
      }
    });

    // Handle response creation to prevent duplicates
    this.rt.on('response.created', () => {
      console.log('[Voice] Response created, marking as generating');
      // Don't clear audio here - let it finish naturally
      this.isGeneratingResponse = true;
    });
    
    // Handle response completion
    this.rt.on('response.done', () => {
      console.log('[Voice] Response completed:', {
        audioQueueLength: this.audioQueue.length,
        isPlaying: this.isPlaying,
        isSpeaking: this.isSpeaking,
        totalChunksReceived: audioChunkIndex
      });
      // Reset generation state
      this.isGeneratingResponse = false;
      
      // Note: Don't reset isSpeaking here as audio might still be playing
      // It will be reset when audio playback completes
      
      // Wait a bit for audio to finish playing before changing state
      setTimeout(() => {
        if (!this.isSpeaking && !this.isPlaying) {
          this.config.onStateChange?.('ready');
        }
      }, 500);
    });

    // Handle errors
    this.rt.on('error', (error: any) => {
      console.error('Realtime API error:', error);
      this.isGeneratingResponse = false; // Reset on error
      this.config.onError?.(new Error(error.message));
      this.config.onStateChange?.('error');
    });

    // Handle socket events directly
    this.rt.socket.addEventListener('close', (event: any) => {
      this.isConnected = false;
      console.log('[Voice] WebSocket closed:', event.code, event.reason);
      
      // Check if this was an intentional disconnection
      if (this.isIntentionalDisconnect) {
        console.log('[Voice] Intentional disconnection, not reconnecting');
        this.isIntentionalDisconnect = false; // Reset flag
        this.config.onStateChange?.('disconnected');
        return;
      }
      
      // If not a normal closure and we haven't exceeded reconnect attempts, try to reconnect
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('[Voice] Unexpected closure, attempting reconnection...');
        this.handleReconnection();
      } else {
        this.config.onStateChange?.('disconnected');
      }
    });
    
    // Handle socket open event
    this.rt.socket.addEventListener('open', () => {
      this.isConnected = true;
      this.config.onStateChange?.('ready');
    });
  }

  async sendAudio(audioData: Int16Array): Promise<void> {
    if (!this.rt || !this.isConnected) {
      console.warn('[Voice] Cannot send audio - not connected');
      return;
    }

    // Buffer audio data
    this.audioBuffer.push(audioData);

    // Send in chunks to avoid overwhelming the connection
    if (this.audioBuffer.length >= 10) { // Send every ~100ms at 24kHz
      const combinedBuffer = this.combineAudioBuffers();
      // Debug: Log audio sending
      const chunkNumber = Math.floor(this.audioBuffer.length / 10);
      console.log(`[Voice] Sending audio chunk #${chunkNumber}, size: ${combinedBuffer.length} samples`);
      
      // Check if we're getting silence
      const maxValue = Math.max(...Array.from(combinedBuffer).map(Math.abs));
      if (maxValue < 100) {
        console.log('[Voice] Warning: Audio appears to be silence or very quiet');
      }
      
      try {
        await this.rt.send({
          type: 'input_audio_buffer.append',
          audio: this.encodeAudioToBase64(combinedBuffer),
        });
        
        this.audioBuffer = [];
        this.config.onStateChange?.('listening');
      } catch (error) {
        console.error('[Voice] Failed to send audio:', error);
      }
    }
  }

  async commitAudio(): Promise<void> {
    if (!this.rt || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    // Send any remaining buffered audio
    if (this.audioBuffer.length > 0) {
      const combinedBuffer = this.combineAudioBuffers();
      
      await this.rt.send({
        type: 'input_audio_buffer.append',
        audio: this.encodeAudioToBase64(combinedBuffer),
      });

      this.audioBuffer = [];
    }

    // Commit the audio buffer to trigger response
    await this.rt.send({
      type: 'input_audio_buffer.commit',
    });
  }

  async sendText(text: string): Promise<void> {
    if (!this.rt || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    await this.rt.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'text', text }],
      },
    });

    // Don't create response here - let the conversation flow naturally
  }


  async disconnect(): Promise<void> {
    // Set flag to indicate intentional disconnection
    this.isIntentionalDisconnect = true;
    
    // Stop heartbeat monitoring
    this.stopHeartbeat();
    
    // Clear session refresh timer
    if (this.sessionRefreshTimer) {
      clearTimeout(this.sessionRefreshTimer);
      this.sessionRefreshTimer = null;
    }
    
    // Stop any playing audio
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch (e) {
        // Ignore errors from already stopped sources
      }
      this.currentAudioSource = null;
    }
    
    // Clear playback timeout
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    
    if (this.rt) {
      this.rt.socket.close(1000, 'Intentional disconnect');
      this.rt = null;
      this.isConnected = false;
      this.eventHandlersSetup = false;
      this.isSpeaking = false;
      this.isGeneratingResponse = false;
      this.audioQueue = [];
      this.isPlaying = false;
      this.nextStartTime = 0;
      this.sessionExpiresAt = null;
    }
    
    // Reset audio state
    this.resetAudioSystem();
  }
  
  private resetAudioSystem(): void {
    // Stop all audio
    this.stopAllAudio();
    
    // Close existing AudioContext if having issues
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
    }
    
    // Create fresh AudioContext
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
    
    // Clear all audio state
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
    this.isSpeaking = false;
  }
  
  private async updateSessionForNewPage(): Promise<void> {
    if (!this.rt || !this.workflowState) return;
    
    try {
      const questions = this.workflowState.questions || [];
      
      console.log('[Voice] Updating session for new page:', {
        pageId: this.workflowState.currentPageId,
        pageDescription: this.workflowState.pageDescription,
        questionCount: questions.length,
        firstQuestion: questions[0]
      });
      
      // Build question list with full details for seesaw questions
      const seesawQuestions = questions
        .filter((q: any) => q.Type === 18 || q.type === 18)
        .map((q: any, index: number) => {
          // Handle different property name cases
          const qNum = q.Number || q.number || q.Prompt?.replace(')', '') || (index + 1).toString();
          const qId = q.QuestionID || q.questionID || q.questionId;
          const statementA = q.StatementA || q.statementA || '[Statement A not found]';
          const statementB = q.StatementB || q.statementB || '[Statement B not found]';
          
          // Format the question text - simplified to reduce verbosity
          return `Question ${qNum}: ${statementA} OR ${statementB}`;
        });
      
      if (seesawQuestions.length === 0) {
        console.warn('[Voice] No seesaw questions found on new page, questions:', questions);
        return;
      }
      
      const questionText = seesawQuestions.join('\n');
      const pageDescription = this.workflowState.pageDescription || 
                             `page ${this.workflowState.currentPageNumber || this.workflowState.currentPageId}`;
      
      // Check for pre-existing answers on this page
      const preAnswered = questions
        .filter((q: any) => {
          const value = q.Value || q.value;
          return value !== undefined && value !== null && value !== '';
        })
        .map((q: any) => {
          const qId = q.QuestionID || q.questionID || q.questionId;
          const qNum = q.Number || q.number || q.Prompt?.replace(')', '');
          const value = q.Value || q.value;
          return `Question ${qNum} (ID: ${qId}) already has answer: ${value}`;
        });
      
      let systemMessage = `[SYSTEM] You are now on ${pageDescription}. Here are the questions:\n${questionText}`;
      
      if (preAnswered.length > 0) {
        systemMessage += `\n\nNOTE: The following questions already have answers from a previous session:\n${preAnswered.join('\n')}\n\nThese are NOT new answers - do not acknowledge them or process them. Simply skip these questions and continue with any unanswered questions, or ask if the user wants to continue to the next page if all questions are answered.`;
      } else {
        systemMessage += `\n\nPlease read the first question.`;
      }
      
      // Don't wait or add delays - just send the update immediately
      // The OpenAI API will handle queueing appropriately
      await this.rt.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: systemMessage
          }]
        }
      });
      
      // Don't immediately trigger response.create - let the natural flow continue
      // The AI will respond when it's ready
      
      // Reset conversation context for new page
      this.conversationContext.currentPage = this.workflowState.currentPageId;
      this.conversationContext.answeredQuestions.clear();
      this.conversationContext.lastQuestionId = null;
      
    } catch (error) {
      console.error('[Voice] Error updating session for new page:', error);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.rt && this.rt.socket.readyState === WebSocket.OPEN) {
        // Connection is healthy
        console.log('[Voice] Connection healthy');
      } else if (this.rt && this.rt.socket.readyState !== WebSocket.CONNECTING) {
        // Connection lost, attempt reconnection
        console.log('[Voice] Connection lost, attempting reconnection...');
        this.handleReconnection();
      }
    }, 30000); // Check every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Voice] Max reconnection attempts reached');
      this.config.onStateChange?.('error');
      this.config.onError?.(new Error('Connection lost and could not reconnect'));
      return;
    }

    this.reconnectAttempts++;
    this.config.onStateChange?.('reconnecting');
    
    // Clean up current connection
    if (this.rt) {
      this.rt.socket.close();
      this.rt = null;
      this.eventHandlersSetup = false;
    }
    
    try {
      // Wait with exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Attempt to reconnect
      await this.connect();
      console.log('[Voice] Successfully reconnected');
    } catch (error) {
      console.error('[Voice] Reconnection failed:', error);
      // Will retry on next heartbeat
    }
  }

  private combineAudioBuffers(): Int16Array {
    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;
    
    for (const buffer of this.audioBuffer) {
      combined.set(buffer, offset);
      offset += buffer.length;
    }
    
    return combined;
  }

  private encodeAudioToBase64(audioData: Int16Array): string {
    const bytes = new Uint8Array(audioData.buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  private base64ToAudioData(base64: string): Float32Array {
    // Decode base64 to binary
    const binaryString = atob(base64);
    const newBytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      newBytes[i] = binaryString.charCodeAt(i);
    }
    
    // Combine with any leftover bytes from previous chunk
    const combinedBytes = new Uint8Array(this.pcm16Buffer.length + newBytes.length);
    combinedBytes.set(this.pcm16Buffer);
    combinedBytes.set(newBytes, this.pcm16Buffer.length);
    
    // Calculate how many complete 16-bit samples we have
    const numCompleteSamples = Math.floor(combinedBytes.length / 2);
    const bytesToProcess = numCompleteSamples * 2;
    
    // Save any leftover bytes for next chunk
    if (combinedBytes.length > bytesToProcess) {
      this.pcm16Buffer = combinedBytes.slice(bytesToProcess);
    } else {
      this.pcm16Buffer = new Uint8Array(0);
    }
    
    // Process only complete samples - create new buffer to avoid alignment issues
    const alignedBuffer = new ArrayBuffer(bytesToProcess);
    new Uint8Array(alignedBuffer).set(combinedBytes.subarray(0, bytesToProcess));
    const pcm16 = new Int16Array(alignedBuffer);
    const float32 = new Float32Array(numCompleteSamples);
    
    // Convert to float32 with proper byte order handling
    for (let i = 0; i < numCompleteSamples; i++) {
      // PCM16 is little-endian, ensure proper conversion
      float32[i] = pcm16[i] / 32768.0;
    }
    
    return float32;
  }

  private queueAudioForPlayback(audioData: Float32Array, chunkId?: number): void {
    // Simply add to queue without dropping
    this.audioQueue.push(audioData);
    
    // Start playback if not already playing
    if (!this.isPlaying && this.audioQueue.length > 0) {
      this.playNextAudioChunk();
    }
  }

  private stopAllAudio(): void {
    const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`[Voice] stopAllAudio called from: ${caller}`);
    
    // Stop current audio source
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
        console.log('[Voice] Stopped current audio source');
      } catch (e) {
        // Ignore errors from already stopped sources
      }
      this.currentAudioSource = null;
    }
    
    // Clear audio queue
    const queueSize = this.audioQueue.length;
    const queueDuration = this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0) / 24000;
    if (queueSize > 0) {
      console.log(`[Voice] Clearing ${queueSize} audio chunks (${queueDuration.toFixed(2)}s) from queue`);
      this.audioQueue = [];
    }
    
    // Clear any pending playback
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    
    // Reset playback state
    this.isPlaying = false;
    this.isSpeaking = false;
    this.pcm16Buffer = new Uint8Array(0); // Clear any partial audio data
    
    // Reset audio context timing to prevent audio drift
    if (this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      this.nextStartTime = currentTime + 0.01;
      console.log(`[Voice] Reset audio timing. Current time: ${currentTime.toFixed(3)}, Next start: ${this.nextStartTime.toFixed(3)}`);
    } else {
      this.nextStartTime = 0;
    }
    
    // Note: We don't send response.cancel here because:
    // 1. It only works for responses being generated, not audio already received
    // 2. The interrupt_response setting in turn_detection handles interruption automatically
    // 3. Trying to cancel when there's no active generation causes errors
  }

  private async playNextAudioChunk(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.currentAudioSource = null;
      return;
    }
    
    // Resume AudioContext if it's suspended (e.g., due to browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      try {
        console.log('[Voice] Resuming suspended AudioContext');
        await this.audioContext.resume();
        // Give it a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('[Voice] Failed to resume AudioContext:', error);
        return; // Don't try to play if we can't resume
      }
    }
    
    // Stop any existing audio source to prevent overlapping
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch (e) {
        // Ignore errors from already stopped sources
      }
      this.currentAudioSource = null;
    }
    
    // Clear any pending playback timeout
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    
    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;
    const playbackId = Date.now();
    
    // Log playback details only periodically
    if (playbackId % 10 === 0) {
      console.log(`[Voice] Playing chunk: queue=${this.audioQueue.length}, duration=${(audioData.length / 24000).toFixed(2)}s`);
    }
    
    // Create audio buffer at the source sample rate (24kHz)
    // The Web Audio API will automatically resample to the AudioContext's sample rate
    const sourceSampleRate = 24000; // OpenAI's output rate
    const audioBuffer = this.audioContext.createBuffer(1, audioData.length, sourceSampleRate);
    audioBuffer.copyToChannel(audioData, 0);
    
    // Create and connect audio source with gain for smooth transitions
    const gainNode = this.audioContext.createGain();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Store current source for cleanup
    this.currentAudioSource = source;
    
    // Schedule audio playback for seamless streaming
    const currentTime = this.audioContext.currentTime;
    
    // For the first audio, start immediately
    // For subsequent audio, ensure seamless continuation
    let startTime: number;
    if (this.nextStartTime === 0) {
      // First audio chunk - start with small delay to ensure buffer is ready
      startTime = currentTime + 0.05;
    } else {
      // Subsequent chunks - ensure no gap
      startTime = Math.max(currentTime, this.nextStartTime);
    }
    
    // Set initial gain
    gainNode.gain.setValueAtTime(1, startTime);
    
    // Play the audio at the scheduled time
    source.start(startTime);
    
    // Update next start time for seamless playback
    this.nextStartTime = startTime + audioBuffer.duration;
    
    // Only log if queue is getting problematic
    const queueLength = this.audioQueue.length;
    if (queueLength > 20) {
      const queueDuration = this.audioQueue.reduce((sum, chunk) => sum + chunk.length, 0) / 24000;
      console.warn(`[Voice] Audio queue high: ${queueLength} chunks (${queueDuration.toFixed(2)}s)`);
    }
    
    // Handle when audio ends
    source.onended = () => {
      if (source === this.currentAudioSource) {
        this.currentAudioSource = null;
      }
      
      // Play next chunk immediately if available
      if (this.audioQueue.length > 0) {
        this.playNextAudioChunk();
      } else {
        // No more audio to play
        this.isPlaying = false;
        this.isSpeaking = false;
        this.nextStartTime = 0; // Reset timing for next audio stream
        
        // Update state to ready if not generating a new response
        if (!this.isGeneratingResponse) {
          this.config.onStateChange?.('ready');
        }
        
        // Clear any remaining timeout
        if (this.playbackTimeout) {
          clearTimeout(this.playbackTimeout);
          this.playbackTimeout = null;
        }
      }
    };
  }

  private scheduleSessionRefresh(): void {
    if (!this.sessionExpiresAt) return;
    
    // Clear any existing timer
    if (this.sessionRefreshTimer) {
      clearTimeout(this.sessionRefreshTimer);
    }
    
    const now = Date.now();
    const expiresIn = this.sessionExpiresAt - now;
    
    // Refresh 1 minute before expiration
    const refreshIn = Math.max(0, expiresIn - 60000);
    
    console.log(`[Voice] Session expires in ${Math.round(expiresIn / 1000)}s, scheduling refresh in ${Math.round(refreshIn / 1000)}s`);
    
    this.sessionRefreshTimer = setTimeout(() => {
      this.refreshSession();
    }, refreshIn);
  }

  private async refreshSession(): Promise<void> {
    console.log('[Voice] Refreshing session...');
    
    try {
      // Get a new session token
      const sessionResponse = await fetch('/api/voice/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowState: this.workflowState,
        }),
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to refresh voice session');
      }
      
      const sessionData = await sessionResponse.json();
      const newToken = sessionData.session.token;
      
      if (!newToken) {
        throw new Error('No session token received from server');
      }
      
      // Store new expiration time
      if (sessionData.session.expires_at) {
        this.sessionExpiresAt = new Date(sessionData.session.expires_at).getTime();
      }
      
      // We need to reconnect with the new token
      console.log('[Voice] Got new session token, reconnecting...');
      this.sessionToken = newToken;
      
      // Disconnect current session
      if (this.rt) {
        this.rt.socket.close();
        this.rt = null;
        this.eventHandlersSetup = false;
      }
      
      // Reconnect with new token
      await this.connect();
      
      console.log('[Voice] Session refreshed successfully');
    } catch (error) {
      console.error('[Voice] Failed to refresh session:', error);
      this.config.onError?.(error as Error);
      this.config.onStateChange?.('error');
    }
  }


}