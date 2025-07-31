import { renderHook, act } from '@testing-library/react';
import { useVoiceNavigation } from '../useVoiceNavigation';
import { VoiceService } from '../../../../../src/lib/services/voice';

// Mock the VoiceService
jest.mock('../../../../../src/lib/services/voice', () => ({
  VoiceService: {
    getInstance: jest.fn(),
  },
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
  let mockVoiceService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockVoiceService = {
      isConnected: false,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      setWorkflowState: jest.fn(),
      setAnswerUpdateCallback: jest.fn(),
      setNavigateNextCallback: jest.fn(),
      startMicrophoneInput: jest.fn().mockResolvedValue(undefined),
      stopMicrophoneInput: jest.fn(),
      setAudioFeedbackEnabled: jest.fn(),
      stopAudioManager: jest.fn(),
    };
    
    (VoiceService.getInstance as jest.Mock).mockReturnValue(mockVoiceService);
    
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
    
    expect(result.current.isVoiceEnabled).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.transcripts).toEqual([]);
  });
  
  it('should check microphone permission on mount', async () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    // Wait for permission check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(mockEnumerateDevices).toHaveBeenCalled();
    expect(result.current.hasMicrophonePermission).toBe(true);
  });
  
  it('should enable voice when toggleVoice is called', async () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockVoiceService.connect).toHaveBeenCalled();
    expect(mockVoiceService.startMicrophoneInput).toHaveBeenCalled();
    expect(result.current.isVoiceEnabled).toBe(true);
  });
  
  it('should disable voice when toggleVoice is called while enabled', async () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    // Enable voice first
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    expect(result.current.isVoiceEnabled).toBe(true);
    
    // Now disable it
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    expect(mockVoiceService.stopMicrophoneInput).toHaveBeenCalled();
    expect(mockVoiceService.disconnect).toHaveBeenCalled();
    expect(result.current.isVoiceEnabled).toBe(false);
  });
  
  it('should handle connection errors gracefully', async () => {
    mockVoiceService.connect.mockRejectedValue(new Error('Connection failed'));
    
    const { result } = renderHook(() => useVoiceNavigation());
    
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    expect(result.current.error).toBe('Failed to connect voice service');
    expect(result.current.isVoiceEnabled).toBe(false);
    expect(mockVoiceService.disconnect).toHaveBeenCalled();
  });
  
  it('should handle microphone permission denial', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
    
    const { result } = renderHook(() => useVoiceNavigation());
    
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    expect(result.current.error).toBe('Microphone permission denied');
    expect(result.current.isVoiceEnabled).toBe(false);
  });
  
  it('should update workflow state when provided', () => {
    const workflowState = { currentPageId: 1, questions: [] };
    const { rerender } = renderHook(
      ({ state }) => useVoiceNavigation(state),
      { initialProps: { state: undefined } }
    );
    
    rerender({ state: workflowState });
    
    expect(mockVoiceService.setWorkflowState).toHaveBeenCalledWith(workflowState);
  });
  
  it('should set answer update callback when provided', () => {
    const onAnswerUpdate = jest.fn();
    renderHook(() => useVoiceNavigation(undefined, onAnswerUpdate));
    
    expect(mockVoiceService.setAnswerUpdateCallback).toHaveBeenCalledWith(onAnswerUpdate);
  });
  
  it('should set navigate next callback when provided', () => {
    const onNavigateNext = jest.fn();
    renderHook(() => useVoiceNavigation(undefined, undefined, onNavigateNext));
    
    expect(mockVoiceService.setNavigateNextCallback).toHaveBeenCalledWith(onNavigateNext);
  });
  
  it('should clean up on unmount', async () => {
    const { result, unmount } = renderHook(() => useVoiceNavigation());
    
    // Enable voice first
    await act(async () => {
      await result.current.toggleVoice();
    });
    
    unmount();
    
    expect(mockVoiceService.stopMicrophoneInput).toHaveBeenCalled();
    expect(mockVoiceService.disconnect).toHaveBeenCalled();
    expect(mockVoiceService.stopAudioManager).toHaveBeenCalled();
  });
  
  it('should handle voice preferences', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    expect(result.current.voicePreferences).toEqual({
      audioFeedback: true,
      autoStart: false,
      voiceSpeed: 'normal',
    });
    
    act(() => {
      result.current.updateVoicePreferences({ audioFeedback: false });
    });
    
    expect(result.current.voicePreferences.audioFeedback).toBe(false);
    expect(mockVoiceService.setAudioFeedbackEnabled).toHaveBeenCalledWith(false);
  });
});