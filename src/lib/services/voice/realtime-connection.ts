import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import { VoiceConfig } from './types';

export class RealtimeConnectionManager {
  private rt: OpenAIRealtimeWebSocket | null = null;
  private audioBuffer: Int16Array[] = [];
  private isConnected = false;
  private sessionToken: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private isSpeaking = false;
  private workflowState: any = null;
  private onAnswerUpdate?: (questionId: number, value: string) => void;
  private eventHandlersSetup = false;
  private isGeneratingResponse = false;
  
  constructor(private config: VoiceConfig) {
    // Initialize Web Audio API for audio playback
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  setWorkflowState(state: any) {
    this.workflowState = state;
  }

  setAnswerUpdateCallback(callback: (questionId: number, value: string) => void) {
    this.onAnswerUpdate = callback;
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
      
      if (!this.sessionToken) {
        throw new Error('No session token received from server');
      }
      
      console.log('Using ephemeral token:', this.sessionToken.substring(0, 10) + '...');
      
      // Initialize OpenAI Realtime WebSocket with ephemeral token
      // Create a client object with the ephemeral token
      const realtimeClient = {
        apiKey: this.sessionToken,
        baseURL: 'https://api.openai.com/v1' // Default OpenAI base URL
      };
      
      this.rt = new OpenAIRealtimeWebSocket({
        model: this.config.model || 'gpt-4o-realtime-preview-2024-12-17',
        dangerouslyAllowBrowser: true, // Safe because we're using ephemeral tokens
      }, realtimeClient);

      // Set up event handlers
      this.setupEventHandlers();

      // The WebSocket will connect automatically when we start sending messages
      // Wait for the socket to be ready
      await new Promise<void>((resolve) => {
        if (this.rt?.socket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          this.rt?.socket.addEventListener('open', () => resolve(), { once: true });
        }
      });
      
      // Build instructions with the actual questions
      const questions = this.workflowState?.questions?.filter((q: any) => q.Type === 18) || [];
      const questionMapping: Record<string, number> = {};
      
      const questionText = questions.map((q: any) => {
        const qId = q.questionID || q.QuestionID;
        const qNum = q.Number || q.Prompt?.replace(')', '') || 'Unknown';
        questionMapping[qNum] = qId;
        return `Question ${qNum} (ID: ${qId}): Left statement: "${q.StatementA || q.statementA}", Right statement: "${q.StatementB || q.statementB}"`;
      }).join('\n');
      
      console.log('Question mapping:', questionMapping);

      // Configure session with full assessment context
      await this.rt.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
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
            create_response: false,  // Disable automatic responses to prevent duplicates
          },
          instructions: `You are OSmos, the Team Assessment Assistant conducting a voice-based questionnaire.

CRITICAL: You are conducting a TMP (Team Management Profile) assessment with these exact questions:
${questionText}

Your role:
1. Start by saying: "Welcome to the Team Management Profile assessment. I'll guide you through ${questions.length} questions. For each question, I'll read both statements and you can answer with 2-0 for strongly preferring the left statement, 2-1 for slightly left, 1-2 for slightly right, or 0-2 for strongly right. Let's begin with question one."

2. Keep track of which question you're currently on. Start with question 1 and proceed sequentially.

3. For each question:
   - Read the question number and both statements clearly
   - Pause briefly between statements
   - Wait for the user's answer
   - Use answer_question function to record their response
   - After successfully recording, immediately read the next question

4. When they answer, be VERY flexible in understanding responses. Extract the answer value from any natural language:
   
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
   - "X for all" / "X for all questions" → Use answer_multiple_questions function
   
   Navigation commands (DO NOT use navigate_next for these):
   - "Next" / "Next question" / "Continue" → Just read the next question in sequence
   - "Skip" → Read the next question without recording current answer
   - "Previous" / "Go back" → Read the previous question
   - "Repeat" → Read the current question again
   
   Only use navigate_next when:
   - User explicitly says "next page" or "continue to next page"
   - All questions on current page are answered

5. After all questions on the page are answered, say "Great! You've completed all questions on this page. Would you like to continue to the next page?"

6. Keep your responses concise. Acknowledge answers with just "Got it" or "Thank you" then immediately read the next question.

IMPORTANT: 
- Each question has an ID number shown in parentheses. Use this ID when calling the answer_question function.
- For "answer all" or "X for all questions", collect all question IDs from the current page and use answer_multiple_questions
- The questions on this page have these IDs: ${questions.map(q => q.QuestionID || q.questionID).join(', ')}`,
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
            }
          ]
        },
      });

      this.isConnected = true;
      this.config.onStateChange?.('ready');
      
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

    // Mark that we're generating a response
    this.isGeneratingResponse = true;

    // Trigger the assistant to start the conversation
    await this.rt.send({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.rt || this.eventHandlersSetup) return;
    
    this.eventHandlersSetup = true;

    // Handle transcription updates
    this.rt.on('conversation.item.input_audio_transcription.completed', (event) => {
      const transcript = event.transcript;
      if (transcript) {
        console.log('[Voice] User said:', transcript);
        this.config.onTranscript?.(transcript);
      }
    });

    // Handle function calls from the assistant
    this.rt.on('response.function_call_arguments.done', async (event) => {
      console.log('Function call received:', event);
      const { name, arguments: args } = event;
      
      if (name === 'answer_question') {
        const { questionId, value } = JSON.parse(args);
        console.log(`Recording answer: Question ${questionId} = ${value}`);
        
        // Map the value format (20, 21, 12, 02) to display format
        const valueMap: Record<string, string> = {
          '20': '2-0',
          '21': '2-1',
          '12': '1-2',
          '02': '0-2'
        };
        const mappedValue = valueMap[value] || value;
        
        // Call the answer update callback if provided
        if (this.onAnswerUpdate) {
          this.onAnswerUpdate(questionId, value);
        }
        
        // Send function call result back
        await this.rt.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ 
              success: true, 
              message: `Recorded answer ${mappedValue} for question ${questionId}`,
              instruction: 'Now read the next question immediately'
            })
          }
        });
        
        // Small delay to ensure function result is processed before triggering response
        setTimeout(() => {
          if (!this.isGeneratingResponse) {
            this.isGeneratingResponse = true;
            // Manually trigger response since we disabled auto-response
            this.rt.send({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text'],
              }
            });
          }
        }, 100);
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
        
        // Call the answer update callback for each question
        if (this.onAnswerUpdate && questionIds.length > 0) {
          for (const questionId of questionIds) {
            this.onAnswerUpdate(questionId, value);
          }
        }
        
        // Send function call result back
        await this.rt.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ 
              success: true, 
              message: `Recorded answer ${mappedValue} for ${questionIds.length} questions`,
              instruction: 'Now read the next question or ask if they want to continue to the next page'
            })
          }
        });
        
        // Trigger response after a delay
        setTimeout(() => {
          if (!this.isGeneratingResponse) {
            this.isGeneratingResponse = true;
            this.rt.send({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text'],
              }
            });
          }
        }, 100);
      } else if (name === 'navigate_next') {
        console.log('Navigation to next page requested');
        // Handle navigation if needed
        await this.rt.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ success: true, message: 'Navigating to next page' })
          }
        });
      }
    });

    // Handle responses
    this.rt.on('response.text.delta', (event) => {
      // Handle text responses if needed
      console.log('Assistant text:', event.delta);
    });

    // Handle audio responses
    this.rt.on('response.audio_transcript.delta', (event) => {
      // Handle audio transcript if needed
      console.log('Assistant audio transcript:', event.delta);
    });

    // Handle audio playback
    this.rt.on('response.audio.delta', (event) => {
      if (event.delta && this.audioContext) {
        // Convert base64 audio to playable format
        const audioData = this.base64ToAudioData(event.delta);
        this.queueAudioForPlayback(audioData);
        
        // Only update state once when speaking starts
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.config.onStateChange?.('speaking');
        }
      }
    });

    // Handle response completion
    this.rt.on('response.done', () => {
      // Reset audio timing for next response
      this.nextStartTime = 0;
      this.isSpeaking = false;
      this.isGeneratingResponse = false;
      // Wait a bit for audio to finish playing before changing state
      setTimeout(() => {
        if (!this.isSpeaking) {
          this.config.onStateChange?.('ready');
        }
      }, 500);
    });

    // Handle errors
    this.rt.on('error', (error) => {
      console.error('Realtime API error:', error);
      this.isGeneratingResponse = false; // Reset on error
      this.config.onError?.(new Error(error.message));
      this.config.onStateChange?.('error');
    });

    // Handle socket events directly
    this.rt.socket.addEventListener('close', () => {
      this.isConnected = false;
      this.config.onStateChange?.('disconnected');
    });
    
    // Handle socket open event
    this.rt.socket.addEventListener('open', () => {
      this.isConnected = true;
      this.config.onStateChange?.('ready');
    });
  }

  async sendAudio(audioData: Int16Array): Promise<void> {
    if (!this.rt || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    // Buffer audio data
    this.audioBuffer.push(audioData);

    // Send in chunks to avoid overwhelming the connection
    if (this.audioBuffer.length >= 10) { // Send every ~100ms at 24kHz
      const combinedBuffer = this.combineAudioBuffers();
      
      await this.rt.send({
        type: 'input_audio_buffer.append',
        audio: this.encodeAudioToBase64(combinedBuffer),
      });

      this.audioBuffer = [];
      this.config.onStateChange?.('listening');
    }
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
    if (this.rt) {
      this.rt.socket.close();
      this.rt = null;
      this.isConnected = false;
      this.eventHandlersSetup = false;
      this.isSpeaking = false;
      this.isGeneratingResponse = false;
      this.audioQueue = [];
      this.isPlaying = false;
      this.nextStartTime = 0;
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
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM16 to Float32 for Web Audio API
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0; // Convert to -1.0 to 1.0 range
    }
    
    return float32;
  }

  private queueAudioForPlayback(audioData: Float32Array): void {
    this.audioQueue.push(audioData);
    
    // Start playback after we have a small buffer to prevent stuttering
    if (!this.isPlaying && this.audioQueue.length >= 3) {
      // Small delay to ensure smooth start
      setTimeout(() => {
        this.playNextAudioChunk();
      }, 50);
    }
  }

  private async playNextAudioChunk(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;
    
    // Create audio buffer
    const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 24000); // 24kHz mono
    audioBuffer.copyToChannel(audioData, 0);
    
    // Create and connect audio source with gain for smooth transitions
    const gainNode = this.audioContext.createGain();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Schedule audio playback for seamless streaming
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime + 0.01, this.nextStartTime); // Small buffer for safety
    
    // Smooth fade in to prevent clicks
    gainNode.gain.setValueAtTime(0.01, startTime);
    gainNode.gain.exponentialRampToValueAtTime(1, startTime + 0.02);
    
    // Play the audio at the scheduled time
    source.start(startTime);
    
    // Update next start time to create continuous playback with tiny overlap
    this.nextStartTime = startTime + audioBuffer.duration - 0.005;
    
    // Queue next chunk before this one finishes
    const preloadTime = Math.max(50, audioBuffer.duration * 1000 * 0.8);
    setTimeout(() => {
      if (this.audioQueue.length > 0) {
        this.playNextAudioChunk();
      }
    }, preloadTime);
    
    // Handle when audio ends
    source.onended = () => {
      if (this.audioQueue.length === 0) {
        this.isPlaying = false;
      }
    };
  }


}