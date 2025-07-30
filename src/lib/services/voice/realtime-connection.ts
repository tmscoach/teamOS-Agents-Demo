import { OpenAIRealtimeWebSocket } from 'openai/beta/realtime/websocket';
import { VoiceConfig, VoiceState, RealtimeConnection } from './types';

export class RealtimeConnectionManager {
  private rt: OpenAIRealtimeWebSocket | null = null;
  private audioBuffer: Int16Array[] = [];
  private isConnected = false;
  private sessionToken: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  
  constructor(private config: VoiceConfig) {
    // Initialize Web Audio API for audio playback
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
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
        if (this.rt.socket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          this.rt.socket.addEventListener('open', () => resolve(), { once: true });
        }
      });
      
      // Configure session
      // Session configuration is already set on the server side when creating the token
      // We can still update it if needed
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
          instructions: `You are a minimal voice interface. Only respond with very brief acknowledgments:
- When user speaks a command: say "Okay" or "Got it"
- When user gives an answer: say "Noted" or "Received"
- Keep responses under 3 words
- Do NOT explain, elaborate, or provide any assessment information
- You are just acknowledging that you heard them`,
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
      if (event.delta && this.audioContext) {
        // Convert base64 audio to playable format
        const audioData = this.base64ToAudioData(event.delta);
        this.queueAudioForPlayback(audioData);
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
    
    if (!this.isPlaying) {
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
    
    // Play the audio
    source.start();
    
    // Queue next chunk when this one finishes
    source.onended = () => {
      this.playNextAudioChunk();
    };
  }


}