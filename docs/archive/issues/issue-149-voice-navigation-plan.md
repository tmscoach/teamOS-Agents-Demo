# Issue #149: Voice-Based Conversation Navigation Implementation Plan

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/149

## Overview

Implement voice-based navigation for the assessment agent using OpenAI's Realtime API. This will allow users to interact with assessments through voice commands instead of typing, improving accessibility and user experience.

## Current State Analysis

### Existing Infrastructure
1. **Assessment Agent**: Fully implemented with text-based chat interface
   - Located at `/app/chat/assessment/`
   - Uses streaming responses via `useChat` hook
   - Supports natural language commands for navigation and bulk answers
   - Chat interface can collapse/expand

2. **Architecture Patterns**:
   - Client-side: `AssessmentChatClient.tsx` handles UI state
   - Server-side: `/api/chat/assessment/route.ts` processes requests
   - Agent: `assessment-agent.ts` implements logic with TMS tools
   - Streaming: Uses AI SDK for real-time responses

3. **No Voice Implementation**: Currently no voice/audio/WebRTC code exists

## Technical Implementation Plan

### Phase 1: Core Voice Infrastructure (Week 1-2)

#### 1. Install Dependencies
```bash
npm install @openai/realtime-api-beta
npm install --save-dev @types/webrtc
```

#### 2. Create Voice Service Layer
```
/src/lib/services/voice/
├── voice-navigation.service.ts    # Core voice service
├── realtime-connection.ts        # OpenAI Realtime API wrapper
├── audio-manager.ts              # WebRTC audio handling
├── voice-commands.ts             # Command recognition
└── types.ts                      # TypeScript interfaces
```

#### 3. Voice Hook Implementation
```
/app/chat/assessment/hooks/
└── useVoiceNavigation.ts         # React hook for voice features
```

### Phase 2: UI Components (Week 3-4)

#### 1. Voice Control Components
```
/app/chat/assessment/components/voice/
├── VoiceToggle.tsx               # Enable/disable voice
├── VoiceIndicator.tsx            # Visual feedback
├── TranscriptDisplay.tsx         # Show transcription
├── VoicePermissionDialog.tsx    # Permission request
└── VoiceCommandHelp.tsx          # Command reference
```

#### 2. Update Existing Components
- `AssessmentChatClient.tsx`: Integrate voice hook
- `ChatPanel.tsx`: Add voice indicators
- `AssessmentViewer.tsx`: Show transcription overlay
- `WorkflowQuestion.tsx`: Visual feedback during voice input

### Phase 3: API Integration (Week 5-6)

#### 1. Extend API Route
- Add WebSocket support for Realtime API
- Handle voice session management
- Process voice commands to tool calls

#### 2. Voice Command Processing
```typescript
interface VoiceCommand {
  type: 'navigation' | 'answer' | 'action';
  command: string;
  parameters?: any;
}

// Map voice to actions:
// "next question" → navigateToQuestion(next)
// "answer two zero" → updateAnswer(questionId, "20")
// "repeat question" → readQuestion(current)
```

#### 3. State Synchronization
- Sync voice state with chat messages
- Update UI based on voice navigation
- Handle interruptions gracefully

### Phase 4: Enhanced Features (Week 7-8)

#### 1. Advanced Voice Features
- Multi-language support
- Custom wake words
- Voice shortcuts for common actions
- Audio playback for questions

#### 2. Accessibility Enhancements
- Screen reader compatibility
- Keyboard shortcuts for voice commands
- Visual indicators for deaf users
- Fallback text mode

#### 3. Performance Optimization
- Audio compression
- Network resilience
- Offline queueing
- Battery optimization

### Implementation Details

#### 1. Voice Navigation Service
```typescript
class VoiceNavigationService {
  private realtimeConnection: RealtimeConnection;
  private audioManager: AudioManager;
  private commandProcessor: VoiceCommandProcessor;
  
  async startSession(config: VoiceConfig): Promise<void> {
    // Initialize WebRTC
    await this.audioManager.requestMicrophone();
    
    // Connect to OpenAI Realtime
    await this.realtimeConnection.connect({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o-realtime',
    });
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  processVoiceInput(transcript: string): VoiceCommand {
    return this.commandProcessor.parse(transcript);
  }
}
```

#### 2. React Hook Integration
```typescript
const useVoiceNavigation = (options: VoiceOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  
  const voiceService = useRef<VoiceNavigationService>();
  
  const startVoice = useCallback(async () => {
    voiceService.current = new VoiceNavigationService();
    await voiceService.current.startSession({
      onTranscript: setTranscript,
      onCommand: options.onCommand,
      onStateChange: setVoiceState,
    });
    setIsListening(true);
  }, [options]);
  
  return {
    isListening,
    transcript,
    voiceState,
    startVoice,
    stopVoice,
  };
};
```

#### 3. Command Processing
```typescript
const VOICE_COMMANDS = {
  navigation: {
    'next question': { action: 'navigate', target: 'next' },
    'previous question': { action: 'navigate', target: 'previous' },
    'go to question (\\d+)': { action: 'navigate', target: '$1' },
  },
  answers: {
    'answer (two zero|two one|one two|zero two)': { 
      action: 'answer', 
      valueMap: {
        'two zero': '20',
        'two one': '21',
        'one two': '12',
        'zero two': '02'
      }
    },
  },
  actions: {
    'repeat question': { action: 'repeat' },
    'pause assessment': { action: 'pause' },
    'save progress': { action: 'save' },
  }
};
```

## User Experience Flow

### 1. Voice Onboarding
```
User arrives → Voice icon appears → Click to enable
→ Permission dialog → Microphone test → Voice tutorial
→ "Say 'next question' to continue"
```

### 2. Voice Interaction
```
Agent reads question → User thinks → Says answer
→ Real-time transcription → Confirmation → Next question
```

### 3. Error Handling
```
Unrecognized command → "I didn't understand that"
→ Show command hints → Retry or type instead
```

## Testing Strategy

### 1. Unit Tests
- Voice command parser
- Audio manager functions
- State synchronization

### 2. Integration Tests
- Voice to tool call mapping
- End-to-end voice navigation
- Fallback scenarios

### 3. User Testing
- Different accents/dialects
- Background noise conditions
- Mobile vs desktop
- Accessibility compliance

## Security Considerations

1. **Audio Privacy**
   - No audio recording without consent
   - Clear data retention policy
   - Option to delete voice data

2. **API Security**
   - Secure WebSocket connections
   - Rate limiting for voice requests
   - Input validation

## Performance Metrics

1. **Technical Metrics**
   - Transcription accuracy: >95%
   - Command recognition: >90%
   - Latency: <500ms
   - Battery impact: <10% increase

2. **User Metrics**
   - Adoption rate: 60%
   - Completion rate: 80%
   - Time savings: 30%
   - Satisfaction: 4.5/5

## Rollout Plan

1. **Phase 1**: Internal testing with feature flag
2. **Phase 2**: Beta users (10% rollout)
3. **Phase 3**: Gradual rollout (25%, 50%, 100%)
4. **Phase 4**: Default enabled for new users

## Dependencies

- OpenAI Realtime API access
- SSL certificates for WebRTC
- Browser compatibility (Chrome, Edge, Safari)
- Microphone permissions

## Next Steps

1. Create feature branch: `feat/issue-149-voice-navigation`
2. Set up OpenAI Realtime API credentials
3. Implement core voice service
4. Build UI components
5. Integrate with assessment flow
6. Test thoroughly
7. Create PR for review