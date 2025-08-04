'use client';

import React, { useEffect, useRef } from 'react';
import { ChatPlugin, PluginComponentProps } from '../types';
import { Message } from 'ai';

// Track processed actions to avoid duplicates
const processedActions = new Set<string>();

// Custom event for assessment actions
const dispatchAssessmentAction = (action: string, params: string, messageId: string) => {
  const actionKey = `${messageId}-${action}-${params}`;
  
  // Skip if already processed
  if (processedActions.has(actionKey)) {
    console.log('[AssessmentActionsPlugin] Skipping already processed action:', actionKey);
    return;
  }
  
  processedActions.add(actionKey);
  console.log('[AssessmentActionsPlugin] Dispatching action:', action, params);
  
  const event = new CustomEvent('assessment-action-detected', {
    detail: { action, params }
  });
  window.dispatchEvent(event);
};

// Message renderer component
const AssessmentMessageRenderer: React.ComponentType<PluginComponentProps> = ({ message, context }) => {
  const processedRef = useRef(false);
  
  // Only process assistant messages
  if (!message || message.role !== 'assistant') {
    return null;
  }
  
  const content = message.content;
  const messageId = message.id || `msg-${Date.now()}`;
  
  // Process actions only once per message
  useEffect(() => {
    if (processedRef.current) return;
    
    const actionRegex = /\[ASSESSMENT_ACTION:([^:]+):([^\]]+)\]/g;
    let match;
    let foundActions = false;
    
    while ((match = actionRegex.exec(content)) !== null) {
      foundActions = true;
      const [fullMatch, action, params] = match;
      console.log('[AssessmentActionsPlugin] Detected action in message:', action, params);
      
      // Dispatch with message ID to track duplicates
      dispatchAssessmentAction(action, params, messageId);
    }
    
    if (foundActions) {
      processedRef.current = true;
    }
  }, [content, messageId]);
  
  // Check if message contains actions for rendering
  if (content.includes('[ASSESSMENT_ACTION:')) {
    // Remove the action tags from the display
    const cleanContent = content.replace(/\[ASSESSMENT_ACTION:[^\]]+\]/g, '').trim();
    
    // Return the cleaned message if there's content left
    if (cleanContent) {
      return (
        <p>
          {cleanContent.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < cleanContent.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    }
    // If the message was ONLY the action tag, return null
    return null;
  }
  
  // No actions found, render the content as-is
  // This ensures regular messages like "hi" are displayed
  return (
    <p>
      {content.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      ))}
    </p>
  );
};

export const assessmentActionsPlugin: ChatPlugin = {
  name: 'assessmentActions',
  version: '1.0.0',
  
  components: {
    messageRenderer: AssessmentMessageRenderer
  }
};