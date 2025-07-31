import { renderHook, act } from '@testing-library/react';
import { useVoiceNavigation } from '../useVoiceNavigation';
import { VoiceNavigationService } from '../../../../../src/lib/services/voice';

// Mock the VoiceNavigationService
jest.mock('../../../../../src/lib/services/voice', () => ({
  VoiceNavigationService: jest.fn(),
  AudioManager: jest.fn(),
  VoiceCommandProcessor: jest.fn(),
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
});

// Mock MediaStream
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];
  
  constructor(tracks?: MediaStreamTrack[]) {
    this.tracks = tracks || [];
  }
  
  getTracks() {
    return this.tracks;
  }
  
  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind: string;
  enabled: boolean = true;
  readyState: string = 'live';
  
  constructor(kind: string) {
    this.kind = kind;
  }
  
  stop() {
    this.readyState = 'ended';
  }
}

global.MediaStream = MockMediaStream as any;
global.MediaStreamTrack = MockMediaStreamTrack as any;

// Mock AudioContext
class MockAudioContext {
  state: string = 'suspended';
  sampleRate: number = 48000;
  
  createMediaStreamSource() {
    return { connect: jest.fn(), disconnect: jest.fn() };
  }
  
  createScriptProcessor() {
    return { 
      connect: jest.fn(), 
      disconnect: jest.fn(),
      onaudioprocess: null,
    };
  }
  
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext as any;

describe('useVoiceNavigation', () => {
  let mockVoiceNavigationService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockVoiceNavigationService = {
      startSession: jest.fn().mockResolvedValue(undefined),
      stopSession: jest.fn().mockResolvedValue(undefined),
      pauseListening: jest.fn().mockResolvedValue(undefined),
      resumeListening: jest.fn().mockResolvedValue(undefined),
      sendTextCommand: jest.fn().mockResolvedValue(undefined),
      getAudioLevel: jest.fn().mockReturnValue(0),
      getContextualHelp: jest.fn().mockReturnValue([
        'Say "answer 2-0" or "select strongly left"',
        'Say "answer all with 1-2" to answer all questions the same',
        'Say "next page" when ready to continue',
      ]),
      getCurrentSession: jest.fn().mockReturnValue(null),
      setWorkflowState: jest.fn(),
      setAnswerUpdateCallback: jest.fn(),
      setNavigateNextCallback: jest.fn(),
      setConversationContext: jest.fn(),
      getConversationContext: jest.fn(),
    };
    
    (VoiceNavigationService as jest.Mock).mockImplementation(() => mockVoiceNavigationService);
    
    // Mock successful media device enumeration
    mockEnumerateDevices.mockResolvedValue([
      { kind: 'audioinput', deviceId: 'default', label: 'Default Microphone' },
    ]);
    
    // Mock successful getUserMedia
    const mockTrack = new MockMediaStreamTrack('audio');
    const mockStream = new MockMediaStream([mockTrack as any]);
    mockGetUserMedia.mockResolvedValue(mockStream);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with voice disabled', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    expect(result.current.voiceState).toBe('idle');
    expect(result.current.transcript).toBe('');
    expect(result.current.lastCommand).toBeNull();
    expect(result.current.audioLevel).toBe(0);
  });
  
  it('should create VoiceNavigationService on mount', () => {
    renderHook(() => useVoiceNavigation());
    
    expect(VoiceNavigationService).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: undefined,
      onTranscript: expect.any(Function),
      onCommand: expect.any(Function),
      onStateChange: expect.any(Function),
      onError: expect.any(Function),
    }));
  });
  
  it('should start voice when startVoice is called', async () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    await act(async () => {
      await result.current.startVoice();
    });
    
    expect(mockVoiceNavigationService.startSession).toHaveBeenCalled();
  });
  
  it('should stop voice when stopVoice is called', async () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    // Start voice first
    await act(async () => {
      await result.current.startVoice();
    });
    
    // Now stop it
    await act(async () => {
      await result.current.stopVoice();
    });
    
    expect(mockVoiceNavigationService.stopSession).toHaveBeenCalled();
  });
  
  it('should handle connection errors gracefully', async () => {
    mockVoiceNavigationService.startSession.mockRejectedValue(new Error('Connection failed'));
    
    const onError = jest.fn();
    const { result } = renderHook(() => useVoiceNavigation({ onError }));
    
    await act(async () => {
      try {
        await result.current.startVoice();
      } catch (error) {
        // Expected error
      }
    });
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.voiceState).toBe('error');
  });
  
  it('should handle microphone permission denial', async () => {
    mockVoiceNavigationService.startSession.mockRejectedValue(new Error('Microphone permission denied'));
    
    const onError = jest.fn();
    const { result } = renderHook(() => useVoiceNavigation({ onError }));
    
    await act(async () => {
      try {
        await result.current.startVoice();
      } catch (error) {
        // Expected error
      }
    });
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.voiceState).toBe('error');
  });
  
  it('should handle transcript updates', () => {
    const onTranscript = jest.fn();
    renderHook(() => useVoiceNavigation({ onTranscript }));
    
    // Get the onTranscript callback that was passed to VoiceNavigationService
    const [[config]] = (VoiceNavigationService as jest.Mock).mock.calls;
    
    // Simulate a transcript update
    act(() => {
      config.onTranscript('Hello world');
    });
    
    expect(onTranscript).toHaveBeenCalledWith('Hello world');
  });
  
  it('should handle command updates', () => {
    const onCommand = jest.fn();
    renderHook(() => useVoiceNavigation({ onCommand }));
    
    // Get the onCommand callback that was passed to VoiceNavigationService
    const [[config]] = (VoiceNavigationService as jest.Mock).mock.calls;
    
    // Simulate a command
    const command = { type: 'answer', questionId: 1, value: '2-0' };
    act(() => {
      config.onCommand(command);
    });
    
    expect(onCommand).toHaveBeenCalledWith(command);
  });
  
  it('should handle state changes', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    // Get the onStateChange callback that was passed to VoiceNavigationService
    const [[config]] = (VoiceNavigationService as jest.Mock).mock.calls;
    
    // Simulate a state change
    act(() => {
      config.onStateChange('listening');
    });
    
    expect(result.current.voiceState).toBe('listening');
  });
  
  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useVoiceNavigation());
    
    unmount();
    
    expect(mockVoiceNavigationService.stopSession).toHaveBeenCalled();
  });
  
  it('should provide contextual help', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    const help = result.current.getContextualHelp('seesaw');
    
    expect(mockVoiceNavigationService.getContextualHelp).toHaveBeenCalledWith('seesaw');
    expect(help).toContain('Say "answer 2-0" or "select strongly left"');
    expect(help).toContain('Say "answer all with 1-2" to answer all questions the same');
    expect(help).toContain('Say "next page" when ready to continue');
  });
});