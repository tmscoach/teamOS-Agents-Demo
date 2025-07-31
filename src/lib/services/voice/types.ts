export interface VoiceConfig {
  apiKey?: string;
  model?: string;
  onTranscript?: (transcript: string) => void;
  onCommand?: (command: VoiceCommand) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: Error) => void;
}

export type VoiceState = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'disconnected'
  | 'reconnecting';

export interface VoiceCommand {
  type: 'navigation' | 'answer' | 'action' | 'unknown';
  command: string;
  parameters?: {
    target?: string;
    value?: string;
    questionId?: number;
  };
  confidence?: number;
}

export interface RealtimeConnection {
  ws: WebSocket;
  pc: RTCPeerConnection;
  audioStream: MediaStream;
  sessionId?: string;
}

export interface AudioConfig {
  sampleRate?: number;
  channels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface TranscriptionEvent {
  transcript: string;
  isFinal: boolean;
  timestamp: number;
}

export interface VoiceSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  transcripts: TranscriptionEvent[];
  commands: VoiceCommand[];
}