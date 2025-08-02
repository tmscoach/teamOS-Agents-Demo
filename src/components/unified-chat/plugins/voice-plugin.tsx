import { ChatPlugin } from '../types';

// Voice Plugin - provides voice input capabilities for accessibility
export const VoicePlugin: ChatPlugin = {
  name: 'voice',
  version: '1.0.0',
  
  config: {
    requiredFeatures: ['microphone', 'webrtc']
  },
  
  components: {
    // Will be implemented when migrating voice functionality
    // inputExtensions: VoiceInputToggle,
    // header: VoiceStatusIndicator
  },
  
  handlers: {
    // Will handle voice-specific events
    // - Voice command processing
    // - Transcript updates
    // - Audio feedback
  },
  
  tools: [
    // Voice-related tools if needed
    // - startVoiceSession
    // - stopVoiceSession
    // - processVoiceCommand
  ]
};