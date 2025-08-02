import { ReactNode } from 'react';
import { Message } from 'ai';
import { AgentContext } from '@/src/lib/agents/types';

// Position modes for the chat
export type ChatPosition = 'left-sidebar' | 'right-sidebar' | 'overlay';

// Chat modes that determine behavior
export type ChatMode = 'standard' | 'assessment' | 'debrief' | 'embedded';

// Plugin component props
export interface PluginComponentProps {
  message?: Message;
  context: ChatContext;
  onAction?: (action: ChatAction) => void;
}

// Plugin configuration
export interface ChatPlugin {
  name: string;
  version: string;
  
  // UI components that can be injected
  components?: {
    header?: React.ComponentType<PluginComponentProps>;
    messageRenderer?: React.ComponentType<PluginComponentProps>;
    inputExtensions?: React.ComponentType<PluginComponentProps>;
    sidePanel?: React.ComponentType<PluginComponentProps>;
  };
  
  // Event handlers
  handlers?: {
    onMessage?: (message: Message, context: ChatContext) => Promise<MessageHandlerResult>;
    onAction?: (action: ChatAction, context: ChatContext) => Promise<ActionResult>;
    onStateChange?: (state: ChatState, context: ChatContext) => void;
  };
  
  // Tools the plugin provides
  tools?: PluginTool[];
  
  // Styles the plugin wants to inject
  styles?: {
    className?: string;
    css?: string;
  };
  
  // Configuration
  config?: {
    compatibleModes?: ChatMode[];
    requiredFeatures?: string[];
  };
}

// Chat context that's passed around
export interface ChatContext {
  mode: ChatMode;
  position: ChatPosition;
  agent: string;
  user: {
    id: string;
    name: string;
    hasCompletedTMP: boolean;
    credits: number;
  };
  journey: {
    phase: JourneyPhase;
    completedSteps: string[];
    nextMilestone: string;
  };
  conversation: {
    id: string;
    messages: Message[];
  };
  metadata?: Record<string, any>;
}

// Journey phases
export enum JourneyPhase {
  ASSESSMENT = 'Assessment Phase',
  DEBRIEF = 'Debrief Phase',
  TEAM_ASSESSMENT = 'Team Assessment',
  ALIGNMENT = 'Alignment Phase',
  IMPLEMENTATION = 'Implementation',
  MONITORING = 'Monitoring Phase',
  REPORTING = 'Reporting Phase'
}

// Chat state
export interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  error?: string;
  activePlugins: string[];
}

// Actions that can be triggered
export interface ChatAction {
  type: string;
  payload?: any;
  metadata?: Record<string, any>;
}

// Results from handlers
export interface MessageHandlerResult {
  handled: boolean;
  response?: Message;
  sideEffects?: Array<{
    type: string;
    payload: any;
  }>;
}

export interface ActionResult {
  success: boolean;
  type?: 'redirect' | 'modal' | 'inline' | 'message';
  data?: any;
  error?: string;
}

// Plugin tools
export interface PluginTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any, context: ChatContext) => Promise<any>;
}

// Unified chat props
export interface UnifiedChatProps {
  mode?: ChatMode;
  position?: ChatPosition;
  agent?: string;
  plugins?: ChatPlugin[];
  initialContext?: Partial<ChatContext>;
  defaultOpen?: boolean;
  proactiveMessage?: {
    type: string;
    data?: any;
  };
  onClose?: () => void;
  className?: string;
}