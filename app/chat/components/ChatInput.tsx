"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ArrowRightCircle1 } from "./icons/ArrowRightCircle1";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
  autoFocus = false
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    // Auto-focus when component mounts if autoFocus is true
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    // Focus when bot stops typing (disabled changes from true to false)
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-9 items-center gap-2 w-full">
      <div className="flex items-center gap-2 flex-1 bg-white rounded-[var(--shadcn-ui-radius-md)] border border-solid border-[color:var(--shadcn-ui-input)] shadow-[var(--shadow-md)] pl-3 pr-2 py-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none [font-family:'Inter',Helvetica] font-normal text-[color:var(--shadcn-ui-foreground)] text-sm tracking-[0] leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Submit"
        >
          <ArrowRightCircle1 className="!w-4 !h-4" />
        </button>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;