import { ChatPlugin } from '../types';
import { AssessmentPlugin } from './assessment-plugin';
import { VoicePlugin } from './voice-plugin';
import { DebriefPlugin } from './debrief-plugin';
import { ActionPlugin } from './action-plugin';
import { assessmentActionsPlugin } from './assessment-actions';

// Plugin registry - all available plugins
export const CHAT_PLUGINS: Record<string, ChatPlugin> = {
  assessment: AssessmentPlugin,
  voice: VoicePlugin,
  debrief: DebriefPlugin,
  action: ActionPlugin,
  assessmentActions: assessmentActionsPlugin,
};

// Agent to plugin mapping
export const AGENT_PLUGIN_MAP: Record<string, string[]> = {
  AssessmentAgent: ['assessment', 'voice', 'action', 'assessmentActions'],
  DebriefAgent: ['debrief', 'voice', 'action'],
  OrchestratorAgent: ['action'],
  OnboardingAgent: ['action'],
  TeamManagementAgent: ['action'],
  // Default plugins for any agent not listed
  default: ['action'],
};

// Get plugins for a specific agent
export function getPluginsForAgent(agentName: string): ChatPlugin[] {
  const pluginNames = AGENT_PLUGIN_MAP[agentName] || AGENT_PLUGIN_MAP.default;
  return pluginNames
    .map(name => CHAT_PLUGINS[name])
    .filter(Boolean);
}

// Check if a plugin is compatible with a mode
export function isPluginCompatible(plugin: ChatPlugin, mode: string): boolean {
  if (!plugin.config?.compatibleModes) {
    return true; // No restrictions, compatible with all modes
  }
  return plugin.config.compatibleModes.includes(mode as any);
}

// Get active plugins for a context
export function getActivePlugins(
  agent: string,
  mode: string,
  customPlugins?: ChatPlugin[]
): ChatPlugin[] {
  // Start with agent's default plugins
  let plugins = getPluginsForAgent(agent);
  
  // Add any custom plugins
  if (customPlugins) {
    plugins = [...plugins, ...customPlugins];
  }
  
  // Filter by compatibility
  return plugins.filter(plugin => isPluginCompatible(plugin, mode));
}