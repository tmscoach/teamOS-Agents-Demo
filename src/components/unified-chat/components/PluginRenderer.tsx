'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { useChatContext } from './ChatProvider';
import type { PluginComponentProps } from '../types';

interface PluginRendererProps {
  type: 'header' | 'messageRenderer' | 'inputExtensions' | 'sidePanel' | 'messageHeader';
  message?: any;
  fallback?: ReactNode;
}

// Wrapper component that tracks if its children render null
function PluginOrFallback({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode 
}) {
  // If children is explicitly null, use fallback
  if (children === null || children === undefined) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
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

  // For message renderers, render plugin or fallback
  if (type === 'messageRenderer' && message) {
    console.log(`[PluginRenderer] Found ${relevantPlugins.length} plugins for message rendering`);
    
    // For now, we'll render the first plugin if available, otherwise fallback
    // In the future, plugins could have a canHandle method to check
    if (relevantPlugins.length > 0) {
      const plugin = relevantPlugins[0];
      const Component = plugin.components![type];
      if (Component) {
        console.log(`[PluginRenderer] Using plugin ${plugin.name} for message rendering`);
        
        // Render the plugin component, it will return null if it doesn't handle the message
        const pluginContent = <Component message={message} context={context} />;
        
        // Use the wrapper to handle null returns with fallback
        return <PluginOrFallback fallback={fallback}>{pluginContent}</PluginOrFallback>;
      }
    }
    
    // No plugins available, use fallback
    console.log('[PluginRenderer] No plugins available, using fallback');
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