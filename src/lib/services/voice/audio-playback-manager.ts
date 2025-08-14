import { getAudioPlaybackWorklet } from './audio-playback-worklet';

/**
 * Manages audio playback using AudioWorklet for smooth, glitch-free playback
 */
export class AudioPlaybackManager {
  private audioContext: AudioContext | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private isInitialized = false;
  private statsCallback?: (stats: any) => void;
  
  constructor() {}
  
  async initialize(statsCallback?: (stats: any) => void): Promise<void> {
    if (this.isInitialized) return;
    
    this.statsCallback = statsCallback;
    
    // Create AudioContext with default sample rate (usually 48kHz)
    this.audioContext = new AudioContext();
    console.log(`[AudioPlayback] Initialized with sample rate: ${this.audioContext.sampleRate}Hz`);
    
    // Load the audio worklet
    const workletCode = getAudioPlaybackWorklet();
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    
    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
      
      // Create the worklet node
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-playback-processor'
      );
      
      // Connect to speakers
      this.audioWorkletNode.connect(this.audioContext.destination);
      
      // Listen for messages from the worklet
      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'stats' && this.statsCallback) {
          this.statsCallback(event.data);
        } else if (event.data.type === 'underrun') {
          console.warn('[AudioPlayback] Buffer underrun detected');
        } else if (event.data.type === 'playback-started') {
          console.log('[AudioPlayback] Playback started');
        }
      };
      
      // Configure the worklet
      this.audioWorkletNode.port.postMessage({
        type: 'config',
        sourceSampleRate: 24000, // OpenAI's output rate
        targetBufferDuration: 0.1 // 100ms jitter buffer
      });
      
      this.isInitialized = true;
      console.log('[AudioPlayback] AudioWorklet initialized successfully');
    } finally {
      URL.revokeObjectURL(workletUrl);
    }
  }
  
  /**
   * Queue audio data for playback
   * @param audioData PCM audio data as Float32Array (already converted from PCM16)
   */
  queueAudio(audioData: Float32Array): void {
    if (!this.isInitialized || !this.audioWorkletNode) {
      console.error('[AudioPlayback] Not initialized');
      return;
    }
    
    // Send audio data to the worklet
    this.audioWorkletNode.port.postMessage({
      type: 'audio',
      audio: audioData
    });
  }
  
  /**
   * Clear the audio buffer
   */
  clearBuffer(): void {
    if (!this.audioWorkletNode) return;
    
    this.audioWorkletNode.port.postMessage({
      type: 'clear'
    });
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.clearBuffer();
    
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('[AudioPlayback] Disposed');
  }
}