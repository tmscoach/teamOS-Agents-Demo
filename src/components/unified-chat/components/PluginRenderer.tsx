'use client';

import { ReactNode } from 'react';
import { useChatContext } from './ChatProvider';
import type { PluginComponentProps } from '../types';

interface PluginRendererProps {
  type: 'header' | 'messageRenderer' | 'inputExtensions' | 'sidePanel' | 'messageHeader';
  message?: any;
  fallback?: ReactNode;
}

export function PluginRenderer({ type, message, fallback }: PluginRendererProps) {
  const { context, plugins } = useChatContext();

  // Find plugins that provide this component type
  const relevantPlugins = plugins.filter(plugin => plugin.components?.[type]);
  
  console.log(`[PluginRenderer] Type: ${type}, Found ${relevantPlugins.length} plugins with this component`);
  if (type === 'inputExtensions') {
    console.log('[PluginRenderer] Plugins:', plugins.map(p => ({ name: p.name, hasInputExtensions: !!p.components?.inputExtensions })));
  }

  if (relevantPlugins.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  // For message renderers, render all plugins and fallback
  if (type === 'messageRenderer' && message) {
    console.log(`[PluginRenderer] Found ${relevantPlugins.length} plugins for message rendering`);
    
    // Create a wrapper component that will handle the plugin rendering
    const PluginWrapper = () => {
      // Try each plugin
      for (const plugin of relevantPlugins) {
        const Component = plugin.components![type];
        if (Component) {
          console.log(`[PluginRenderer] Trying plugin ${plugin.name} for message rendering`);
          const rendered = <Component message={message} context={context} />;
          if (rendered !== null) {
            return <>{rendered}</>;
          }
        }
      }
      // If no plugin handled it, use fallback
      return fallback ? <>{fallback}</> : null;
    };
    
    return <PluginWrapper />;
  }

  // For other component types, render all of them
  return (
    <>
      {relevantPlugins.map(plugin => {
        const Component = plugin.components![type];
        if (!Component) return null;
        
        return (
          <Component
            key={plugin.name}
            context={context}
            message={message}
          />
        );
      })}
    </>
  );
}