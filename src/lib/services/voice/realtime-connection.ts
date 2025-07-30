import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import { VoiceConfig, VoiceState, RealtimeConnection } from './types';

export class RealtimeConnectionManager {
  private rt: OpenAIRealtimeWebSocket | null = null;
  private audioBuffer: Int16Array[] = [];
  private isConnected = false;
  
  constructor(private config: VoiceConfig) {}

  async connect(): Promise<void> {
    try {
      this.config.onStateChange?.('connecting');
      
      // Initialize OpenAI Realtime WebSocket
      this.rt = new OpenAIRealtimeWebSocket({
        model: this.config.model || 'gpt-4o-realtime-preview-2024-12-17',
      });

      // Set up event handlers
      this.setupEventHandlers();

      // The WebSocket will connect automatically when we start sending messages
      // Wait for the socket to be ready
      await new Promise<void>((resolve) => {
        if (this.rt.socket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          this.rt.socket.addEventListener('open', () => resolve(), { once: true });
        }
      });
      
      // Configure session
      await this.rt.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.getSystemInstructions(),
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
        },
      });

      this.isConnected = true;
      this.config.onStateChange?.('ready');
    } catch (error) {
      this.config.onStateChange?.('error');
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.rt) return;

    // Handle transcription updates
    this.rt.on('conversation.item.input_audio_transcription.completed', (event) => {
      const transcript = event.transcript;
      if (transcript) {
        this.config.onTranscript?.(transcript);
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
      if (event.delta) {
        // Convert base64 to audio data if needed
        // This would be played through speakers
        this.config.onStateChange?.('speaking');
      }
    });

    // Handle response completion
    this.rt.on('response.done', () => {
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

  private getSystemInstructions(): string {
    return `You are OSmos, the Team Assessment Assistant. You are conducting a voice-based assessment.

Your role is to:
1. Read assessment questions clearly and at a comfortable pace
2. For seesaw questions, read both statements and ask which one the user prefers more
3. Accept natural language responses and map them to the appropriate answer values
4. Provide confirmation of answers before moving to the next question
5. Be encouraging and supportive throughout the assessment

For seesaw questions:
- "Strongly prefer left/first" = 2-0
- "Slightly prefer left/first" = 2-1  
- "Slightly prefer right/second" = 1-2
- "Strongly prefer right/second" = 0-2

Always maintain a warm, conversational tone and help users feel comfortable with the voice interface.`;
  }
}