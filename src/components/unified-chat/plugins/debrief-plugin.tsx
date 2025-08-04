import { ChatPlugin } from '../types';

// Debrief Plugin - handles report rendering and navigation
export const DebriefPlugin: ChatPlugin = {
  name: 'debrief',
  version: '1.0.0',
  
  config: {
    compatibleModes: ['debrief'],
    requiredFeatures: ['reports']
  },
  
  components: {
    // Will be implemented when migrating DebriefChatClient
    // messageRenderer: ReportMessageRenderer,
    // sidePanel: ReportNavigator
  },
  
  handlers: {
    onMessage: async (message, context) => {
      // Will handle debrief-specific messages
      // - Report navigation
      // - Section queries
      // - Insight generation
      return { handled: false };
    }
  },
  
  tools: [
    // Will include debrief-specific tools
    // - reportSearchTool
    // - imageAnalysisTool
    // - reportStorageTool
  ]
};