import { AudioConfig } from './types';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private isRecording = false;

  private readonly defaultConfig: AudioConfig = {
    sampleRate: 24000, // OpenAI Realtime API expects 24kHz
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  constructor(private config: AudioConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  async requestMicrophone(): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.mediaStream;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found');
        }
      }
      throw error;
    }
  }

  async startRecording(onAudioData: (data: Int16Array) => void): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('No media stream available. Call requestMicrophone first.');
    }

    this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Load audio worklet for processing
    await this.audioContext.audioWorklet.addModule(
      URL.createObjectURL(
        new Blob([this.getAudioWorkletProcessor()], { type: 'application/javascript' })
      )
    );

    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
    
    this.audioWorkletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio' && this.isRecording) {
        onAudioData(event.data.audio);
      }
    };

    source.connect(this.audioWorkletNode);
    this.audioWorkletNode.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stopRecording(): void {
    this.isRecording = false;
    
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  stopMicrophone(): void {
    this.stopRecording();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  getAudioLevel(): number {
    if (!this.audioContext || !this.mediaStream) return 0;
    
    const analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average / 255; // Normalize to 0-1
  }

  private getAudioWorkletProcessor(): string {
    return `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const samples = input[0];
            const pcm16 = new Int16Array(samples.length);
            
            for (let i = 0; i < samples.length; i++) {
              const s = Math.max(-1, Math.min(1, samples[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            this.port.postMessage({
              type: 'audio',
              audio: pcm16
            });
          }
          return true;
        }
      }
      
      registerProcessor('audio-processor', AudioProcessor);
    `;
  }
}