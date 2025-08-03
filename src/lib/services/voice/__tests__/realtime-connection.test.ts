import { RealtimeConnectionManager } from '../realtime-connection';
import { VoiceConfig } from '../types';

// Mock WebSocket
class MockWebSocket {
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  
  readyState = this.CONNECTING;
  url: string;
  listeners: Map<string, Function[]> = new Map();
  
  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = this.OPEN;
      this.dispatchEvent('open', {});
    }, 0);
  }
  
  addEventListener(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }
  
  removeEventListener(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  dispatchEvent(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  send(data: any) {
    // Mock send
  }
  
  close(code?: number, reason?: string) {
    this.readyState = this.CLOSED;
    this.dispatchEvent('close', { code: code || 1005, reason });
  }
}

// Mock OpenAI SDK
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    beta: {
      realtime: {
        RealtimeWebSocket: class {
          socket: MockWebSocket;
          constructor({ model, sessionToken }: any) {
            this.socket = new MockWebSocket(`wss://api.openai.com/v1/realtime?model=${model}`);
          }
          updateSession(config: any) {
            return Promise.resolve();
          }
          send(event: any, data: any) {
            this.socket.send({ event, data });
          }
        }
      }
    }
  }))
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ 
    session: {
      token: 'test-ephemeral-token',
      expires_at: Date.now() + 3600000
    }
  })
}) as any;

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    disconnect: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    length,
    sampleRate,
    numberOfChannels: channels,
    getChannelData: jest.fn(() => new Float32Array(length))
  })),
  currentTime: 0,
  sampleRate: 48000,
  destination: {},
  close: jest.fn().mockResolvedValue(undefined)
})) as any;

describe('RealtimeConnectionManager', () => {
  let manager: RealtimeConnectionManager;
  let config: VoiceConfig;
  let onStateChangeMock: jest.Mock;
  let onTranscriptMock: jest.Mock;
  let onErrorMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    onStateChangeMock = jest.fn();
    onTranscriptMock = jest.fn();
    onErrorMock = jest.fn();
    
    config = {
      apiKey: 'test-api-key',
      onStateChange: onStateChangeMock,
      onTranscript: onTranscriptMock,
      onError: onErrorMock
    };
    
    manager = new RealtimeConnectionManager(config);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Connection Management', () => {
    it('should connect successfully with a session token', async () => {
      const sessionToken = 'test-session-token';
      
      await manager.connect(sessionToken);
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(onStateChangeMock).toHaveBeenCalledWith('connecting');
      expect(onStateChangeMock).toHaveBeenCalledWith('ready');
    });

    it('should handle intentional disconnection without reconnecting', async () => {
      const sessionToken = 'test-session-token';
      
      // Connect first
      await manager.connect(sessionToken);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear previous state change calls
      onStateChangeMock.mockClear();
      
      // Disconnect intentionally
      await manager.disconnect();
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should call disconnected state but not attempt reconnection
      expect(onStateChangeMock).toHaveBeenCalledWith('disconnected');
      expect(onStateChangeMock).not.toHaveBeenCalledWith('connecting');
      
      // Verify no error was reported for intentional disconnect
      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should attempt reconnection on unexpected disconnection', async () => {
      const sessionToken = 'test-session-token';
      
      // Connect first
      await manager.connect(sessionToken);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear previous state change calls
      onStateChangeMock.mockClear();
      
      // Simulate unexpected disconnection by directly accessing the WebSocket
      const rt = (manager as any).rt;
      if (rt && rt.socket) {
        rt.socket.close(1006, 'Unexpected close'); // Abnormal closure code
      }
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should attempt reconnection
      expect(onStateChangeMock).toHaveBeenCalledWith('connecting');
    });

    it('should not reconnect after maximum attempts', async () => {
      const sessionToken = 'test-session-token';
      
      // Set max reconnect attempts to 1 for faster testing
      (manager as any).maxReconnectAttempts = 1;
      
      // Connect first
      await manager.connect(sessionToken);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate multiple unexpected disconnections
      for (let i = 0; i < 3; i++) {
        const rt = (manager as any).rt;
        if (rt && rt.socket) {
          rt.socket.close(1006, 'Unexpected close');
          await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for reconnect delay
        }
      }
      
      // After max attempts, should stay disconnected
      expect(onStateChangeMock).toHaveBeenLastCalledWith('disconnected');
    });
  });

  describe('Audio Management', () => {
    it('should handle audio buffer processing', () => {
      const audioData = new Int16Array([100, 200, 300, 400]);
      
      // Use the correct method name
      manager.sendAudioChunk(audioData);
      
      // Audio should be added to buffer
      const buffer = (manager as any).audioBuffer;
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should clean up audio resources on disconnect', async () => {
      const sessionToken = 'test-session-token';
      
      // Connect and set up audio
      await manager.connect(sessionToken);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create mock audio source
      const mockAudioSource = {
        stop: jest.fn(),
        disconnect: jest.fn()
      };
      (manager as any).currentAudioSource = mockAudioSource;
      
      // Disconnect
      await manager.disconnect();
      
      // Verify audio cleanup
      expect(mockAudioSource.stop).toHaveBeenCalled();
      expect(mockAudioSource.disconnect).toHaveBeenCalled();
      expect((manager as any).currentAudioSource).toBeNull();
      expect((manager as any).audioQueue).toEqual([]);
    });
  });

  describe('Workflow State Management', () => {
    it('should update workflow state', () => {
      const workflowState = {
        questions: [
          { id: 1, text: 'Question 1' },
          { id: 2, text: 'Question 2' }
        ],
        currentPageId: 1
      };
      
      manager.setWorkflowState(workflowState);
      
      expect((manager as any).workflowState).toEqual(workflowState);
    });

    it('should handle answer update callback', () => {
      const answerCallback = jest.fn();
      
      manager.setAnswerUpdateCallback(answerCallback);
      
      // Simulate answer update
      (manager as any).onAnswerUpdate?.(1, '2-0');
      
      expect(answerCallback).toHaveBeenCalledWith(1, '2-0');
    });

    it('should handle navigate next callback', () => {
      const navigateCallback = jest.fn();
      
      manager.setNavigateNextCallback(navigateCallback);
      
      // Simulate navigation
      (manager as any).onNavigateNext?.();
      
      expect(navigateCallback).toHaveBeenCalled();
    });
  });

  describe('Conversation Context', () => {
    it('should get conversation context', () => {
      const context = manager.getConversationContext();
      
      expect(context).toHaveProperty('currentPage', 1);
      expect(context).toHaveProperty('answeredQuestions');
      expect(context).toHaveProperty('conversationHistory');
    });

    it('should set conversation context', () => {
      const newContext = {
        currentPage: 2,
        answeredQuestions: new Set([1, 2, 3]),
        lastQuestionId: 3,
        conversationHistory: [
          { role: 'user', content: 'Test', timestamp: Date.now() }
        ]
      };
      
      manager.setConversationContext(newContext);
      
      const context = manager.getConversationContext();
      expect(context.currentPage).toBe(2);
      expect(Array.from(context.answeredQuestions)).toEqual([1, 2, 3]);
      expect(context.lastQuestionId).toBe(3);
    });
  });
});