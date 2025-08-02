'use client';

import { ReactNode } from 'react';
import { useChatContext } from './ChatProvider';
import type { PluginComponentProps } from '../types';

interface PluginRendererProps {
  type: 'header' | 'messageRenderer' | 'inputExtensions' | 'sidePanel';
  message?: any;
  fallback?: ReactNode;
}

export function PluginRenderer({ type, message, fallback }: PluginRendererProps) {
  const { context, plugins } = useChatContext();

  // Find plugins that provide this component type
  const relevantPlugins = plugins.filter(plugin => plugin.components?.[type]);

  if (relevantPlugins.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  // For message renderers, find the first plugin that can handle it
  if (type === 'messageRenderer' && message) {
    for (const plugin of relevantPlugins) {
      const Component = plugin.components![type];
      if (Component) {
        // In real implementation, plugins would have a canRender method
        // For now, just use the first one
        return <Component message={message} context={context} />;
      }
    }
    return fallback ? <>{fallback}</> : null;
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