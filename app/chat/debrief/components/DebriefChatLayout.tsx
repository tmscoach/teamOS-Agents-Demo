"use client";

import React, { useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import MessageList from "@/app/chat/components/MessageList";
import ChatInput from "@/app/chat/components/ChatInput";
import RawReportViewer from './RawReportViewer';
import type { Message } from 'ai';
import type { ParsedReport } from '@/src/lib/utils/report-parser';

interface DebriefChatLayoutProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  reportHtml: string;
  reportData: ParsedReport;
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  onSectionChange?: (section: string) => void;
}

export default function DebriefChatLayout({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  reportHtml,
  reportData,
  reportType,
  onSectionChange
}: DebriefChatLayoutProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [messages, isLoading]);

  return (
    <div className="bg-white min-h-screen w-full flex overflow-auto">
      <div className="flex flex-col lg:flex-row w-full max-w-[1280px] mx-auto min-h-screen">
        {/* Left sidebar - Chat area */}
        <div className="w-full lg:w-[399px] lg:min-h-screen bg-white lg:bg-transparent flex-shrink-0">
          <div className="h-full min-h-[300px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-solid border-[color:var(--shadcn-ui-border)] shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] p-6 lg:p-0 lg:relative">
            {/* Logo */}
            <div className="mb-12 lg:mb-0 lg:absolute lg:top-[23px] lg:left-[19px]">
              <img
                className="w-[90px] h-[39px]"
                alt="teamOS"
                src="/img/teamos-logo.png"
              />
            </div>

            {/* Chat content container */}
            <div 
              ref={scrollAreaRef}
              className="lg:absolute lg:top-[126px] lg:left-[27px] lg:right-[27px] lg:bottom-[100px] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
              <MessageList 
                messages={messages} 
                agentName="OSmos" 
                loading={isLoading}
              />
            </div>

            {/* Input area - positioned at bottom */}
            <div className="lg:absolute lg:bottom-[27px] lg:left-[27px] lg:right-[27px]">
              <ChatInput
                value={input}
                onChange={onInputChange}
                onSubmit={onSubmit}
                disabled={isLoading}
                placeholder="Ask about your profile..."
                autoFocus={true}
              />
            </div>
          </div>
        </div>

        {/* Right content area - Report Viewer */}
        <div className="flex-1 relative">
          {/* Fixed Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-[var(--shadcn-ui-border,#e5e7eb)]">
            <div className="flex h-[108px] items-center justify-between px-6">
              <header className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-[-0.72px] text-gray-900">
                  {reportType === 'TMP' && 'Team Management Profile'}
                  {reportType === 'QO2' && 'QO² Assessment'}
                  {reportType === 'TeamSignals' && 'Team Signals Report'}
                </h1>
                <p className="text-sm text-gray-500">
                  Here's a summary of your {reportType} profile.
                </p>
              </header>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Done
                </button>
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </div>
          </div>

          {/* Scrollable Report Content */}
          <div className="h-[calc(100vh-108px)] overflow-y-auto bg-white">
            <div className="w-full max-w-[900px] mx-auto px-6 py-8">
              <RawReportViewer 
                html={reportHtml}
                onSectionChange={onSectionChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}