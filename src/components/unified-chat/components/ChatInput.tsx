'use client';

import { FormEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { PluginRenderer } from './PluginRenderer';

export function ChatInput() {
  const { chat, context, plugins, state } = useChatContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount and when chat opens
  useEffect(() => {
    if (state.isOpen) {
      inputRef.current?.focus();
    }
  }, [state.isOpen]);

  // Focus input after receiving a message
  useEffect(() => {
    if (chat.messages.length > 0 && !chat.isLoading) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [chat.messages.length, chat.isLoading]);

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const input = chat.input.trim();
    if (!input) return;

    // Check if any plugin wants to handle this message first
    console.log('[ChatInput] Checking plugins:', plugins.length, 'for input:', input);
    for (const plugin of plugins) {
      if (plugin.handlers?.onMessage) {
        console.log('[ChatInput] Testing plugin:', plugin.name);
        const result = await plugin.handlers.onMessage(
          { id: '', role: 'user', content: input },
          context
        );
        
        console.log('[ChatInput] Plugin result:', plugin.name, result);
        if (result.handled) {
          // Plugin handled it, clear input and process side effects
          chat.setInput('');
          
          if (result.response) {
            chat.append(result.response);
          }
          
          if (result.sideEffects) {
            // Process side effects (like navigation)
            result.sideEffects.forEach(effect => {
              if (effect.type === 'navigate') {
                window.location.href = effect.payload.url;
              }
            });
          }
          
          return;
        }
      }
    }

    // No plugin handled it, send to chat
    chat.handleSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex h-9 items-center gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 bg-white rounded-[var(--shadcn-ui-radius-md)] border border-solid border-[color:var(--shadcn-ui-input)] shadow-[var(--shadow-md)] pl-3 pr-2 py-2">
          <input
            ref={inputRef as any}
            type="text"
            value={chat.input}
            onChange={(e) => chat.setInput(e.target.value)}
            placeholder={
              context.agent === 'OrchestratorAgent' && !context.user.hasCompletedTMP
                ? "Type 'start TMP' to begin your journey..."
                : "Type your message..."
            }
            className="flex-1 bg-transparent outline-none [font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={chat.isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          
          {/* Plugin input extensions */}
          <div className="flex items-center gap-2">
            <PluginRenderer type="inputExtensions" />
            <button
              type="submit"
              disabled={!chat.input.trim() || chat.isLoading}
              className="hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}