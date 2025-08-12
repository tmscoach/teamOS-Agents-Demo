import { RealtimeConnectionManager } from '../realtime-connection';
import { VoiceConfig } from '../types';

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
class MockWebSocket {
  readyState = WebSocket.CONNECTING;
  close = jest.fn();
  send = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

(global as any).WebSocket = MockWebSocket;

// Mock OpenAIRealtimeWebSocket
jest.mock('openai/beta/realtime/websocket', () => ({
  OpenAIRealtimeWebSocket: jest.fn().mockImplementation(() => ({
    socket: new MockWebSocket(),
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

describe('RealtimeConnectionManager', () => {
  let manager: RealtimeConnectionManager;
  const mockConfig: VoiceConfig = {
    onTranscript: jest.fn(),
    onCommand: jest.fn(),
    onStateChange: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        session: {
          id: 'session-123',
          token: 'ephemeral-token-123',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }
      })
    });
  });

  describe('Voice Mode Detection', () => {
    it('detects debrief mode from agent metadata', async () => {
      const debriefConfig: VoiceConfig = {
        ...mockConfig,
        metadata: {
          agent: 'DebriefAgent',
          reportId: 'report-123',
          assessmentType: 'TMP'
        }
      };
      
      manager = new RealtimeConnectionManager(debriefConfig);
      
      // Spy on console.log to verify mode detection
      const consoleSpy = jest.spyOn(console, 'log');
      
      await manager.connect();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Voice] Mode detection:'),
        expect.objectContaining({
          agent: 'DebriefAgent',
          finalMode: 'DEBRIEF'
        })
      );
    });

    it('detects assessment mode when not in debrief', async () => {
      const assessmentConfig: VoiceConfig = {
        ...mockConfig,
        metadata: {
          agent: 'AssessmentAgent'
        }
      };
      
      manager = new RealtimeConnectionManager(assessmentConfig);
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      await manager.connect();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Voice] Mode detection:'),
        expect.objectContaining({
          agent: 'AssessmentAgent',
          finalMode: 'ASSESSMENT'
        })
      );
    });

    it('uses debrief instructions when in debrief mode', async () => {
      const { OpenAIRealtimeWebSocket } = require('openai/beta/realtime/websocket');
      const mockInstance = {
        socket: new MockWebSocket(),
        send: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      OpenAIRealtimeWebSocket.mockImplementationOnce(() => mockInstance);

      const debriefConfig: VoiceConfig = {
        ...mockConfig,
        metadata: {
          agent: 'DebriefAgent',
          reportId: 'report-123',
          assessmentType: 'TMP'
        }
      };
      
      manager = new RealtimeConnectionManager(debriefConfig);
      
      // Mock WebSocket as open
      mockInstance.socket.readyState = WebSocket.OPEN;
      
      await manager.connect();
      
      // Verify session update was sent with debrief instructions
      expect(mockInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session.update',
          session: expect.objectContaining({
            instructions: expect.stringContaining('Welcome to your TMP debrief session')
          })
        })
      );
    });

    it('uses assessment instructions when in assessment mode', async () => {
      const { OpenAIRealtimeWebSocket } = require('openai/beta/realtime/websocket');
      const mockInstance = {
        socket: new MockWebSocket(),
        send: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      OpenAIRealtimeWebSocket.mockImplementationOnce(() => mockInstance);

      const assessmentConfig: VoiceConfig = {
        ...mockConfig,
        metadata: {
          agent: 'AssessmentAgent'
        }
      };
      
      manager = new RealtimeConnectionManager(assessmentConfig);
      
      // Set workflow state with questions
      manager.setWorkflowState({
        questions: [
          { Type: 18, QuestionID: 1, StatementA: 'Test A', StatementB: 'Test B' }
        ]
      });
      
      // Mock WebSocket as open
      mockInstance.socket.readyState = WebSocket.OPEN;
      
      await manager.connect();
      
      // Verify session update was sent with assessment instructions
      expect(mockInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session.update',
          session: expect.objectContaining({
            instructions: expect.stringContaining('Team Assessment Assistant conducting a voice-based questionnaire')
          })
        })
      );
    });

    it('includes debrief tools in debrief mode', async () => {
      const { OpenAIRealtimeWebSocket } = require('openai/beta/realtime/websocket');
      const mockInstance = {
        socket: new MockWebSocket(),
        send: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
      OpenAIRealtimeWebSocket.mockImplementationOnce(() => mockInstance);

      const debriefConfig: VoiceConfig = {
        ...mockConfig,
        metadata: {
          agent: 'DebriefAgent',
          isDebriefMode: true
        }
      };
      
      manager = new RealtimeConnectionManager(debriefConfig);
      
      // Mock WebSocket as open
      mockInstance.socket.readyState = WebSocket.OPEN;
      
      await manager.connect();
      
      // Verify no assessment tools are included in debrief mode
      expect(mockInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session.update',
          session: expect.objectContaining({
            tools: []
          })
        })
      );
    });
  });
});