import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioPlaybackManager } from '../audio-playback-manager';

// Mock AudioContext and AudioWorklet
class MockAudioContext {
  sampleRate = 48000;
  state = 'running';
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined)
  };
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
}

class MockAudioWorkletNode {
  port = {
    postMessage: vi.fn(),
    onmessage: null
  };
  connect = vi.fn();
  disconnect = vi.fn();
}

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

describe('AudioPlaybackManager', () => {
  let manager: AudioPlaybackManager;
  let mockAudioContext: MockAudioContext;
  let mockWorkletNode: MockAudioWorkletNode;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    mockAudioContext = new MockAudioContext();
    mockWorkletNode = new MockAudioWorkletNode();
    
    (global as any).AudioContext = vi.fn(() => mockAudioContext);
    (global as any).AudioWorkletNode = vi.fn(() => mockWorkletNode);
    
    manager = new AudioPlaybackManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize AudioContext and AudioWorklet', async () => {
      await manager.initialize();

      expect(global.AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith('blob:mock-url');
      expect(global.AudioWorkletNode).toHaveBeenCalledWith(
        mockAudioContext,
        'audio-playback-processor'
      );
    });

    it('should connect worklet node to destination', async () => {
      await manager.initialize();

      expect(mockWorkletNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('should handle stats callback', async () => {
      const statsCallback = vi.fn();
      await manager.initialize(statsCallback);

      // Simulate stats message from worklet
      const statsMessage = {
        data: {
          type: 'stats',
          bufferSize: 0.1,
          underruns: 0,
          samplesReceived: 1000,
          samplesPlayed: 900
        }
      };

      mockWorkletNode.port.onmessage!(statsMessage as any);
      expect(statsCallback).toHaveBeenCalledWith(statsMessage.data);
    });
  });

  describe('audio queueing', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should queue audio data to worklet', () => {
      const audioData = new Float32Array([0.1, 0.2, 0.3]);
      manager.queueAudio(audioData);

      expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({
        type: 'audio',
        audio: audioData
      });
    });

    it('should handle multiple audio chunks', () => {
      const chunk1 = new Float32Array([0.1, 0.2]);
      const chunk2 = new Float32Array([0.3, 0.4]);
      
      manager.queueAudio(chunk1);
      manager.queueAudio(chunk2);

      expect(mockWorkletNode.port.postMessage).toHaveBeenCalledTimes(2);
      expect(mockWorkletNode.port.postMessage).toHaveBeenNthCalledWith(1, {
        type: 'audio',
        audio: chunk1
      });
      expect(mockWorkletNode.port.postMessage).toHaveBeenNthCalledWith(2, {
        type: 'audio',
        audio: chunk2
      });
    });
  });

  describe('buffer clearing', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should clear audio buffer', () => {
      manager.clearBuffer();

      expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({
        type: 'clear'
      });
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should disconnect and clean up resources', () => {
      manager.cleanup();

      expect(mockWorkletNode.disconnect).toHaveBeenCalled();
    });

    it('should handle cleanup when not initialized', () => {
      const newManager = new AudioPlaybackManager();
      
      // Should not throw
      expect(() => newManager.cleanup()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle AudioContext creation failure', async () => {
      (global as any).AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported');
      });

      await expect(manager.initialize()).rejects.toThrow('AudioContext not supported');
    });

    it('should handle AudioWorklet module loading failure', async () => {
      mockAudioContext.audioWorklet.addModule = vi.fn().mockRejectedValue(
        new Error('Failed to load worklet')
      );

      await expect(manager.initialize()).rejects.toThrow('Failed to load worklet');
    });
  });
});