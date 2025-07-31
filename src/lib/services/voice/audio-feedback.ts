export class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async playBeep(frequency: number = 440, duration: number = 100, volume: number = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Failed to play audio feedback:', error);
    }
  }

  // Different beep patterns for different states
  async playListeningStart() {
    await this.playBeep(600, 100, 0.1);
  }

  async playListeningStop() {
    await this.playBeep(400, 100, 0.1);
  }

  async playSuccess() {
    await this.playBeep(800, 50, 0.1);
    setTimeout(() => this.playBeep(1000, 50, 0.1), 60);
  }

  async playError() {
    await this.playBeep(300, 200, 0.15);
  }

  async playThinking() {
    // Gentle pulsing sound
    for (let i = 0; i < 3; i++) {
      await this.playBeep(500, 150, 0.05);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  cleanup() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}