import { AudioManager } from './audio-manager';
import { RealtimeConnectionManager } from './realtime-connection';
import { VoiceCommandProcessor } from './voice-commands';
import { VoiceConfig, VoiceState, VoiceSession } from './types';

export class VoiceNavigationService {
  private audioManager: AudioManager;
  private realtimeConnection: RealtimeConnectionManager;
  private commandProcessor: VoiceCommandProcessor;
  private currentSession: VoiceSession | null = null;
  private isActive = false;

  constructor(private config: VoiceConfig) {
    this.audioManager = new AudioManager();
    this.realtimeConnection = new RealtimeConnectionManager({
      ...config,
      onTranscript: this.handleTranscript.bind(this),
      onStateChange: this.handleStateChange.bind(this),
      onError: this.handleError.bind(this),
    });
    this.commandProcessor = new VoiceCommandProcessor();
  }

  setWorkflowState(state: any) {
    this.realtimeConnection.setWorkflowState(state);
  }

  setAnswerUpdateCallback(callback: (questionId: number, value: string) => void) {
    this.realtimeConnection.setAnswerUpdateCallback(callback);
  }
  
  setNavigateNextCallback(callback: () => void) {
    this.realtimeConnection.setNavigateNextCallback(callback);
  }

  getConversationContext() {
    return this.realtimeConnection.getConversationContext();
  }

  setConversationContext(context: any) {
    this.realtimeConnection.setConversationContext(context);
  }

  async startSession(): Promise<void> {
    try {
      // Initialize session
      this.currentSession = {
        id: this.generateSessionId(),
        startTime: new Date(),
        transcripts: [],
        commands: [],
      };

      // Request microphone access
      console.log('[VoiceNavigationService] Requesting microphone access...');
      await this.audioManager.requestMicrophone();
      console.log('[VoiceNavigationService] Microphone access granted');

      // Connect to Realtime API
      console.log('[VoiceNavigationService] Connecting to Realtime API...');
      await this.realtimeConnection.connect();
      console.log('[VoiceNavigationService] Connected to Realtime API');

      // Start audio recording
      console.log('[VoiceNavigationService] Starting audio recording...');
      await this.audioManager.startRecording((audioData) => {
        if (this.isActive) {
          this.realtimeConnection.sendAudio(audioData).catch(console.error);
        }
      });
      console.log('[VoiceNavigationService] Audio recording started');

      this.isActive = true;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async stopSession(): Promise<void> {
    this.isActive = false;

    // Stop audio recording
    this.audioManager.stopRecording();
    this.audioManager.stopMicrophone();

    // Disconnect from Realtime API
    await this.realtimeConnection.disconnect();

    // Finalize session
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
    }

    this.config.onStateChange?.('idle');
  }

  async pauseListening(): Promise<void> {
    this.isActive = false;
    this.audioManager.stopRecording();
    this.config.onStateChange?.('ready');
  }

  async resumeListening(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.audioManager.startRecording((audioData) => {
      if (this.isActive) {
        this.realtimeConnection.sendAudio(audioData).catch(console.error);
      }
    });

    this.isActive = true;
    this.config.onStateChange?.('listening');
  }

  async sendTextCommand(text: string): Promise<void> {
    await this.realtimeConnection.sendText(text);
    this.handleTranscript(text);
  }



  getAudioLevel(): number {
    return this.audioManager.getAudioLevel();
  }

  getContextualHelp(questionType: string): string[] {
    return this.commandProcessor.getContextualHelp(questionType);
  }

  getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  private handleTranscript(transcript: string): void {
    console.log('[VoiceNavigationService] ==== TRANSCRIPT RECEIVED ====');
    console.log('[VoiceNavigationService] Transcript:', transcript);
    console.log('[VoiceNavigationService] Has session:', !!this.currentSession);
    
    if (!this.currentSession) {
      console.log('[VoiceNavigationService] No current session, ignoring transcript');
      return;
    }

    // Add to session transcripts
    this.currentSession.transcripts.push({
      transcript,
      isFinal: true,
      timestamp: Date.now(),
    });

    // Process command
    console.log('[VoiceNavigationService] Processing command...');
    const command = this.commandProcessor.parse(transcript);
    console.log('[VoiceNavigationService] Parsed command:', {
      type: command.type,
      parameters: command.parameters,
      confidence: command.confidence,
      rawTranscript: command.rawTranscript
    });
    
    this.currentSession.commands.push(command);

    // Notify listeners
    this.config.onTranscript?.(transcript);
    this.config.onCommand?.(command);
  }

  private handleStateChange(state: VoiceState): void {
    this.config.onStateChange?.(state);
  }

  private handleError(error: Error): void {
    console.error('Voice navigation error:', error);
    this.config.onError?.(error);
    this.config.onStateChange?.('error');
  }

  private generateSessionId(): string {
    return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}