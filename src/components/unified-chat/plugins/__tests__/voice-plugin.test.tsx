import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatPlugin } from '../../types';
import { createVoicePlugin } from '../voice-plugin';

// Mock dependencies
jest.mock('@/app/chat/assessment/hooks/useVoiceNavigation', () => ({
  useVoiceNavigation: jest.fn(() => ({
    voiceState: 'idle',
    transcript: '',
    lastCommand: null,
    audioLevel: 0,
    startVoice: jest.fn(),
    stopVoice: jest.fn(),
    setWorkflowState: jest.fn(),
    setAnswerUpdateCallback: jest.fn(),
    setNavigateNextCallback: jest.fn()
  }))
}));

jest.mock('@/app/chat/assessment/hooks/useVoiceSessionPrefetch', () => ({
  useVoiceSessionPrefetch: jest.fn(() => ({
    sessionToken: 'test-token',
    isLoading: false,
    error: null
  }))
}));

jest.mock('../../components/ChatProvider', () => ({
  useChatContext: jest.fn(() => ({
    context: {
      agent: 'AssessmentAgent',
      metadata: {
        selectedAssessment: { id: 'test-assessment', type: 'TMP' },
        workflowState: { questions: [], currentPageId: 1 }
      }
    },
    chat: {
      messages: [],
      setMessages: jest.fn()
    }
  }))
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock media devices
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })
} as any;

describe('Voice Plugin', () => {
  let plugin: ChatPlugin;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    plugin = createVoicePlugin();
  });

  describe('Plugin Configuration', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('voice');
      expect(plugin.displayName).toBe('Voice Features');
      expect(plugin.description).toContain('voice interaction');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should be enabled for AssessmentAgent', () => {
      const isEnabled = plugin.isEnabled?.({
        agent: 'AssessmentAgent',
        mode: 'standard',
        metadata: {}
      });
      
      expect(isEnabled).toBe(true);
    });

    it('should be disabled for other agents', () => {
      const isEnabled = plugin.isEnabled?.({
        agent: 'OrchestratorAgent',
        mode: 'standard',
        metadata: {}
      });
      
      expect(isEnabled).toBe(false);
    });
  });

  describe('Voice Mode Entry', () => {
    it('should show voice mode entry on first visit', () => {
      const { HeaderComponent } = plugin.components!;
      
      if (HeaderComponent) {
        render(<HeaderComponent />);
        
        expect(screen.getByText(/Complete this assessment using voice/i)).toBeInTheDocument();
        expect(screen.getByText('Start Voice Assessment')).toBeInTheDocument();
        expect(screen.getByText('Maybe Later')).toBeInTheDocument();
      }
    });

    it('should not show voice mode entry if previously dismissed', () => {
      localStorage.setItem('voiceEntryDismissed', 'true');
      
      const { HeaderComponent } = plugin.components!;
      
      if (HeaderComponent) {
        const { container } = render(<HeaderComponent />);
        expect(container.firstChild).toBeNull();
      }
    });

    it('should dismiss voice entry and save preference', () => {
      const { HeaderComponent } = plugin.components!;
      
      if (HeaderComponent) {
        render(<HeaderComponent />);
        
        const dismissButton = screen.getByText('Maybe Later');
        fireEvent.click(dismissButton);
        
        expect(localStorage.getItem('voiceEntryDismissed')).toBe('true');
      }
    });
  });

  describe('Voice Toggle Integration', () => {
    it('should render voice toggle in input area', () => {
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        // Voice toggle should be present
        expect(screen.getByRole('button', { name: /voice/i })).toBeInTheDocument();
      }
    });

    it('should handle voice start from external event', async () => {
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        // Dispatch start voice event
        const event = new CustomEvent('start-voice-mode', {
          detail: {
            type: 'assessment',
            metadata: { subscriptionId: 'test-id', assessmentType: 'TMP' }
          }
        });
        window.dispatchEvent(event);
        
        // Wait for async operations
        await waitFor(() => {
          // Voice should attempt to start
          const { useVoiceNavigation } = require('@/app/chat/assessment/hooks/useVoiceNavigation');
          const mock = useVoiceNavigation();
          expect(mock.startVoice).toHaveBeenCalled();
        });
      }
    });

    it('should handle voice permission denial', async () => {
      // Mock getUserMedia to reject
      global.navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(
        new Error('Permission denied')
      );
      
      const { InputComponent } = plugin.components!;
      const { toast } = require('sonner');
      
      if (InputComponent) {
        render(<InputComponent />);
        
        const voiceButton = screen.getByRole('button', { name: /voice/i });
        fireEvent.click(voiceButton);
        
        await waitFor(() => {
          // Should show permission dialog or error
          expect(toast.info).toHaveBeenCalledWith('Voice features require microphone access');
        });
      }
    });
  });

  describe('Assessment Action Integration', () => {
    it('should dispatch assessment action for answer_question command', () => {
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        // Mock voice command
        const { useVoiceNavigation } = require('@/app/chat/assessment/hooks/useVoiceNavigation');
        const mockHook = useVoiceNavigation();
        
        // Simulate voice command callback
        const onCommand = mockHook.mock.calls[0][0].onCommand;
        
        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
        
        onCommand({
          type: 'answer_question',
          questionId: 1,
          value: '2-0'
        });
        
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'assessment-action-detected',
            detail: {
              action: 'answer_question',
              params: '1:2-0'
            }
          })
        );
      }
    });

    it('should dispatch assessment action for navigate command', () => {
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        const { useVoiceNavigation } = require('@/app/chat/assessment/hooks/useVoiceNavigation');
        const mockHook = useVoiceNavigation();
        const onCommand = mockHook.mock.calls[0][0].onCommand;
        
        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
        
        onCommand({
          type: 'navigate',
          direction: 'next'
        });
        
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'assessment-action-detected',
            detail: {
              action: 'navigate_page',
              params: 'next'
            }
          })
        );
      }
    });

    it('should dispatch assessment action for bulk answer command', () => {
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        const { useVoiceNavigation } = require('@/app/chat/assessment/hooks/useVoiceNavigation');
        const mockHook = useVoiceNavigation();
        const onCommand = mockHook.mock.calls[0][0].onCommand;
        
        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
        
        onCommand({
          type: 'answer_multiple',
          questionIds: [1, 2, 3],
          value: '1-1'
        });
        
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'assessment-action-detected',
            detail: {
              action: 'answer_multiple_questions',
              params: '1,2,3:1-1'
            }
          })
        );
      }
    });
  });

  describe('Workflow State Synchronization', () => {
    it('should update workflow state when metadata changes', () => {
      const { useChatContext } = require('../../components/ChatProvider');
      const { useVoiceNavigation } = require('@/app/chat/assessment/hooks/useVoiceNavigation');
      
      const mockSetWorkflowState = jest.fn();
      useVoiceNavigation.mockReturnValue({
        voiceState: 'idle',
        transcript: '',
        lastCommand: null,
        audioLevel: 0,
        startVoice: jest.fn(),
        stopVoice: jest.fn(),
        setWorkflowState: mockSetWorkflowState,
        setAnswerUpdateCallback: jest.fn(),
        setNavigateNextCallback: jest.fn()
      });
      
      const workflowState = {
        questions: [{ id: 1, text: 'Test' }],
        currentPageId: 2
      };
      
      useChatContext.mockReturnValue({
        context: {
          agent: 'AssessmentAgent',
          metadata: {
            selectedAssessment: { id: 'test-assessment', type: 'TMP' },
            workflowState
          }
        },
        chat: {
          messages: [],
          setMessages: jest.fn()
        }
      });
      
      const { InputComponent } = plugin.components!;
      
      if (InputComponent) {
        render(<InputComponent />);
        
        expect(mockSetWorkflowState).toHaveBeenCalledWith(workflowState);
      }
    });
  });
});