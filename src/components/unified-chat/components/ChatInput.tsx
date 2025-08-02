'use client';

import { FormEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { PluginRenderer } from './PluginRenderer';

export function ChatInput() {
  const { chat, context, plugins } = useChatContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const input = inputRef.current?.value.trim();
    if (!input) return;

    // Check if any plugin wants to handle this message first
    for (const plugin of plugins) {
      if (plugin.handlers?.onMessage) {
        const result = await plugin.handlers.onMessage(
          { id: '', role: 'user', content: input },
          context
        );
        
        if (result.handled) {
          // Plugin handled it, clear input and process side effects
          if (inputRef.current) inputRef.current.value = '';
          
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
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={chat.input}
            onChange={chat.handleInputChange}
            placeholder={
              context.agent === 'OrchestratorAgent' && !context.user.hasCompletedTMP
                ? "Type 'start TMP' to begin your journey..."
                : "Type a message..."
            }
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          
          {/* Plugin input extensions */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <PluginRenderer type="inputExtensions" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!chat.input.trim() || chat.isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}