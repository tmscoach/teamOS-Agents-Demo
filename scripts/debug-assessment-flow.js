#!/usr/bin/env node

/**
 * Debug script for tracing assessment action flow
 * Run this in the browser console while on the assessment page
 */

console.log('🔍 Assessment Action Debugger Started');
console.log('=====================================');

// Global debug state
window.ASSESSMENT_DEBUG = {
  actionCount: 0,
  lastAction: null,
  messageCount: 0,
  events: []
};

// 1. Monitor Custom Events
const originalDispatchEvent = window.dispatchEvent;
window.dispatchEvent = function(event) {
  if (event.type === 'assessment-action-detected') {
    window.ASSESSMENT_DEBUG.actionCount++;
    window.ASSESSMENT_DEBUG.lastAction = event.detail;
    console.log(`📢 [${window.ASSESSMENT_DEBUG.actionCount}] Assessment Action Event:`, {
      action: event.detail.action,
      params: event.detail.params,
      timestamp: new Date().toISOString()
    });
    window.ASSESSMENT_DEBUG.events.push({
      type: 'action',
      detail: event.detail,
      timestamp: new Date().toISOString()
    });
  }
  return originalDispatchEvent.apply(this, arguments);
};

// 2. Monitor DOM for action tags
const observeMessages = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const text = node.textContent || '';
          if (text.includes('[ASSESSMENT_ACTION:')) {
            window.ASSESSMENT_DEBUG.messageCount++;
            const matches = text.match(/\[ASSESSMENT_ACTION:([^:]+):([^\]]+)\]/g);
            console.log(`💬 [${window.ASSESSMENT_DEBUG.messageCount}] Action Tag in DOM:`, {
              matches: matches,
              element: node.tagName,
              className: node.className,
              id: node.id
            });
          }
        }
      });
    });
  });

  // Start observing the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  console.log('✅ DOM Observer started');
  return observer;
};

// 3. Monitor fetch/XHR for API responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;
  
  try {
    const response = await originalFetch.apply(this, args);
    
    // Clone response to read it without consuming
    const clonedResponse = response.clone();
    
    if (url.includes('/api/agents/')) {
      const responseText = await clonedResponse.text();
      
      // Check for action tags in response
      if (responseText.includes('[ASSESSMENT_ACTION:')) {
        const matches = responseText.match(/\[ASSESSMENT_ACTION:([^:]+):([^\]]+)\]/g);
        console.log(`🌐 API Response contains actions:`, {
          url: url,
          actions: matches,
          timestamp: new Date().toISOString()
        });
        
        window.ASSESSMENT_DEBUG.events.push({
          type: 'api_response',
          url: url,
          actions: matches,
          timestamp: new Date().toISOString()
        });
      }
      
      // Log streaming chunks
      if (url.includes('chat-streaming')) {
        console.log(`📡 Streaming response from ${url}:`, {
          length: responseText.length,
          preview: responseText.substring(0, 200)
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error('🔴 Fetch error:', error);
    throw error;
  }
};

// 4. Monitor event listeners
const monitorEventListeners = () => {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'assessment-action-detected') {
      console.log('🎯 Event listener registered for assessment-action-detected:', {
        target: this.constructor.name,
        listener: listener.name || 'anonymous'
      });
    }
    return originalAddEventListener.apply(this, arguments);
  };
};

// 5. Test function to simulate an action
window.testAssessmentAction = (action = 'answer_question', params = '1:2') => {
  console.log('🧪 Simulating assessment action:', { action, params });
  const event = new CustomEvent('assessment-action-detected', {
    detail: { action, params }
  });
  window.dispatchEvent(event);
};

// 6. Function to send test message with action
window.sendTestMessage = async (message = 'Update all questions on this page and answer them with 2') => {
  console.log('📨 Sending test message:', message);
  
  // Find the chat input
  const input = document.querySelector('textarea[placeholder*="Type"], input[placeholder*="Type"], textarea[name="message"]');
  const button = document.querySelector('button[type="submit"], button:has(svg[class*="send"])');
  
  if (input && button) {
    // Set the input value
    input.value = message;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Click the send button
    button.click();
    console.log('✅ Message sent');
  } else {
    console.error('❌ Could not find chat input or send button');
    console.log('Available inputs:', document.querySelectorAll('textarea, input[type="text"]'));
    console.log('Available buttons:', document.querySelectorAll('button'));
  }
};

// 7. Function to check plugin registration
window.checkPlugins = () => {
  console.log('🔌 Checking plugin registration:');
  
  // Look for plugin-related data in React fiber
  const findReactProps = (element) => {
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber'));
    if (key) {
      let fiber = element[key];
      while (fiber) {
        if (fiber.memoizedProps && fiber.memoizedProps.plugins) {
          return fiber.memoizedProps.plugins;
        }
        fiber = fiber.return;
      }
    }
    return null;
  };
  
  // Find UnifiedChat components
  const chatElements = document.querySelectorAll('[class*="unified-chat"], [class*="UnifiedChat"]');
  chatElements.forEach((el, index) => {
    const plugins = findReactProps(el);
    if (plugins) {
      console.log(`  Chat ${index + 1} plugins:`, plugins.map(p => p.name));
    }
  });
};

// 8. Summary function
window.debugSummary = () => {
  console.log('\n📊 Debug Summary:');
  console.log('==================');
  console.log(`Actions dispatched: ${window.ASSESSMENT_DEBUG.actionCount}`);
  console.log(`Messages with actions: ${window.ASSESSMENT_DEBUG.messageCount}`);
  console.log(`Total events: ${window.ASSESSMENT_DEBUG.events.length}`);
  console.log(`Last action:`, window.ASSESSMENT_DEBUG.lastAction);
  console.log('\nRecent events:');
  window.ASSESSMENT_DEBUG.events.slice(-5).forEach(event => {
    console.log(`  - ${event.timestamp}: ${event.type}`, event.detail || event.actions);
  });
};

// Initialize everything
observeMessages();
monitorEventListeners();

console.log('\n📋 Available debug commands:');
console.log('  window.testAssessmentAction(action, params) - Simulate an action');
console.log('  window.sendTestMessage(message) - Send a test message');
console.log('  window.checkPlugins() - Check registered plugins');
console.log('  window.debugSummary() - Show debug summary');
console.log('  window.ASSESSMENT_DEBUG - Access debug state');

console.log('\n🎯 Quick test:');
console.log('  window.sendTestMessage("Update all questions and answer 2")');
console.log('  window.testAssessmentAction("answer_multiple_questions", "1,2,3:2")');