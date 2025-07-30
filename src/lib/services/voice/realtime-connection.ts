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
  private workflowState: any = null;
  private onAnswerUpdate?: (questionId: number, value: string) => void;
  
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
          },
          instructions: `You are OSmos, the Team Assessment Assistant conducting a voice-based questionnaire.

CRITICAL: You are conducting a TMP (Team Management Profile) assessment with these exact questions:
${questionText}

Your role:
1. Start by saying: "Welcome to the Team Management Profile assessment. I'll guide you through ${questions.length} questions. For each question, I'll read both statements and you can answer with 2-0 for strongly preferring the left statement, 2-1 for slightly left, 1-2 for slightly right, or 0-2 for strongly right. Let's begin with question one."

2. Read each question exactly as provided above, pausing briefly between the left and right statements. Just read the question text, not the ID.

3. After the user answers, acknowledge briefly (e.g., "Got it" or "Thank you") and immediately move to the next question.

4. When they answer, be VERY flexible in understanding responses. Extract the answer value from any natural language:
   
   Core answer patterns (extract these and convert):
   - "2-0", "2 0", "two zero", "20", "strongly left", "strong left", "all the way left" → use value "20"
   - "2-1", "2 1", "two one", "21", "slightly left", "slight left", "a bit left", "somewhat left", "left" → use value "21"
   - "1-2", "1 2", "one two", "12", "slightly right", "slight right", "a bit right", "somewhat right", "right" → use value "12"
   - "0-2", "0 2", "zero two", "02", "strongly right", "strong right", "all the way right" → use value "02"
   
   IMPORTANT: Be flexible with phrasing. Extract the answer from ANY of these patterns:
   - "Enter X" / "Put X" / "Answer X" / "Select X" / "Choose X" / "Pick X" / "Go with X"
   - "X for this one" / "X for this question" / "X please" / "Let's go with X" / "I'll take X"
   - "I think X" / "I'd say X" / "Probably X" / "Definitely X" / "Make it X"
   - "The answer is X" / "Mark X" / "Record X" / "Set X"
   - Just saying the value alone: "2-0" or "slightly left" etc.
   
   When unclear which question they mean:
   - If they just give an answer without specifying, assume it's for the question you just read
   - "This one" / "That one" / "Current question" → current question
   - "Next" / "Next one" → move to next question
   - "Previous" / "Last one" / "Go back" → previous question

5. After all questions are answered, say "Great! You've completed all questions on this page. Would you like to continue to the next page?"

6. Keep your responses concise and professional. Focus on guiding them through the assessment efficiently.

IMPORTANT: Each question has an ID number shown in parentheses. Use this ID when calling the answer_question function.`,
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
              name: 'navigate_next',
              description: 'Navigate to the next page of questions',
              parameters: { type: 'object', properties: {} }
            }
          ]
        },
      });

      this.isConnected = true;
      this.config.onStateChange?.('ready');
      
      // Start the conversation immediately
      await this.startAssessmentConversation();
    } catch (error) {
      this.config.onStateChange?.('error');
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  async startAssessmentConversation(): Promise<void> {
    if (!this.rt || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    // Trigger the assistant to start the conversation
    await this.rt.send({
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.rt) return;

    // Handle transcription updates
    this.rt.on('conversation.item.input_audio_transcription.completed', (event) => {
      const transcript = event.transcript;
      if (transcript) {
        console.log('[Voice] User said:', transcript);
        this.config.onTranscript?.(transcript);
      }
    });

    // Handle function calls from the assistant
    this.rt.on('response.function_call_arguments.done', (event) => {
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
        this.rt.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ success: true, message: `Recorded answer ${mappedValue} for question ${questionId}` })
          }
        });
      } else if (name === 'navigate_next') {
        console.log('Navigation to next page requested');
        // Handle navigation if needed
        this.rt.send({
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
        this.config.onStateChange?.('speaking');
      }
    });

    // Handle response completion
    this.rt.on('response.done', () => {
      // Reset audio timing for next response
      this.nextStartTime = 0;
      this.config.onStateChange?.('ready');
    });

    // Handle errors
    this.rt.on('error', (error) => {
      console.error('Realtime API error:', error);
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

    await this.rt.send({ type: 'response.create' });
  }


  async disconnect(): Promise<void> {
    if (this.rt) {
      this.rt.socket.close();
      this.rt = null;
      this.isConnected = false;
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
    if (!this.isPlaying && this.audioQueue.length >= 2) {
      this.playNextAudioChunk();
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
    
    // Create and connect audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    // Schedule audio playback for seamless streaming
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);
    
    // Play the audio at the scheduled time
    source.start(startTime);
    
    // Update next start time to create continuous playback
    this.nextStartTime = startTime + audioBuffer.duration;
    
    // Queue next chunk when this one finishes
    source.onended = () => {
      this.playNextAudioChunk();
    };
  }


}