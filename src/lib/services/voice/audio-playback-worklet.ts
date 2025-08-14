/**
 * AudioWorklet processor for smooth audio playback with proper buffering and resampling
 */
export function getAudioPlaybackWorklet(): string {
  return `
    class AudioPlaybackProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        
        // Jitter buffer to store incoming audio chunks
        this.audioBuffer = [];
        this.isPlaying = false;
        this.targetBufferDuration = 0.1; // 100ms jitter buffer
        this.sourceSampleRate = 24000; // OpenAI's output rate
        
        // Resampling state
        this.resampleRatio = sampleRate / this.sourceSampleRate;
        this.lastSample = 0;
        
        // Statistics
        this.totalSamplesReceived = 0;
        this.totalSamplesPlayed = 0;
        this.underrunCount = 0;
        
        this.port.onmessage = (event) => {
          if (event.data.type === 'audio') {
            // Receive audio data from main thread
            this.addAudioToBuffer(event.data.audio);
          } else if (event.data.type === 'clear') {
            // Clear the buffer
            this.audioBuffer = [];
            this.isPlaying = false;
            this.lastSample = 0;
          } else if (event.data.type === 'config') {
            // Update configuration
            if (event.data.sourceSampleRate) {
              this.sourceSampleRate = event.data.sourceSampleRate;
              this.resampleRatio = sampleRate / this.sourceSampleRate;
            }
            if (event.data.targetBufferDuration) {
              this.targetBufferDuration = event.data.targetBufferDuration;
            }
          }
        };
        
        // Track time for statistics
        this.lastStatsTime = currentTime;
        this.statsInterval = 1.0; // Send stats every 1 second
      }
      
      addAudioToBuffer(audioData) {
        // Convert Float32Array to individual samples
        for (let i = 0; i < audioData.length; i++) {
          this.audioBuffer.push(audioData[i]);
        }
        this.totalSamplesReceived += audioData.length;
        
        // Start playing once we have enough buffered
        if (!this.isPlaying && this.getBufferDuration() >= this.targetBufferDuration) {
          this.isPlaying = true;
          this.port.postMessage({ type: 'playback-started' });
        }
      }
      
      getBufferDuration() {
        return this.audioBuffer.length / this.sourceSampleRate;
      }
      
      process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || output.length === 0) return true;
        
        const outputChannel = output[0];
        const outputLength = outputChannel.length;
        
        // Send statistics periodically (currentTime is available in process)
        if (currentTime - this.lastStatsTime >= this.statsInterval) {
          if (this.totalSamplesReceived > 0) {
            this.port.postMessage({
              type: 'stats',
              bufferSize: this.getBufferDuration(),
              underruns: this.underrunCount,
              samplesReceived: this.totalSamplesReceived,
              samplesPlayed: this.totalSamplesPlayed
            });
          }
          this.lastStatsTime = currentTime;
        }
        
        // If not playing yet or buffer is empty, output silence
        if (!this.isPlaying || this.audioBuffer.length === 0) {
          for (let i = 0; i < outputLength; i++) {
            outputChannel[i] = 0;
          }
          
          // Check for underrun
          if (this.isPlaying && this.audioBuffer.length === 0) {
            this.underrunCount++;
            this.isPlaying = false;
            this.port.postMessage({ type: 'underrun' });
          }
          
          return true;
        }
        
        // Resample from source rate (24kHz) to output rate (usually 48kHz)
        for (let i = 0; i < outputLength; i++) {
          // Calculate source position with sub-sample precision
          const sourcePos = i / this.resampleRatio;
          const sourcePosFloor = Math.floor(sourcePos);
          const sourceFraction = sourcePos - sourcePosFloor;
          
          if (sourcePosFloor >= this.audioBuffer.length - 1) {
            // Not enough samples in buffer
            outputChannel[i] = this.lastSample * 0.9; // Fade out to prevent clicks
            this.lastSample = outputChannel[i];
          } else {
            // Linear interpolation between samples
            const sample1 = this.audioBuffer[sourcePosFloor];
            const sample2 = this.audioBuffer[sourcePosFloor + 1] || sample1;
            outputChannel[i] = sample1 * (1 - sourceFraction) + sample2 * sourceFraction;
            this.lastSample = outputChannel[i];
          }
        }
        
        // Remove consumed samples from buffer
        const samplesConsumed = Math.floor(outputLength / this.resampleRatio);
        if (samplesConsumed > 0) {
          this.audioBuffer.splice(0, samplesConsumed);
          this.totalSamplesPlayed += samplesConsumed;
        }
        
        return true;
      }
    }
    
    registerProcessor('audio-playback-processor', AudioPlaybackProcessor);
  `;
}