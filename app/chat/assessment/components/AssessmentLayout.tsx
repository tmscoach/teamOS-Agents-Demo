"use client";

import React, { useState } from 'react';
import { ChatPanelWrapper } from './ChatPanelWrapper';
import AssessmentViewer from './AssessmentViewer';
import AssessmentSelector from './AssessmentSelector';
import { Message } from 'ai';
import { AssessmentSubscription, WorkflowState } from '../types';
import { VoiceState } from '@/src/lib/services/voice';


interface AssessmentLayoutProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  availableAssessments: AssessmentSubscription[];
  selectedAssessment: AssessmentSubscription | null;
  onSelectAssessment: (assessment: AssessmentSubscription) => void;
  workflowState: WorkflowState | null;
  currentAnswers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onSubmitPage: () => void;
  onSectionChange: (section: string) => void;
  visibleSection: string;
  isCompleting?: boolean;
  updatingQuestions?: Set<number>;
  voiceState?: VoiceState;
  onVoiceToggle?: () => void;
  audioLevel?: number;
}

export default function AssessmentLayout({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  availableAssessments,
  selectedAssessment,
  onSelectAssessment,
  workflowState,
  currentAnswers,
  onAnswerChange,
  onSubmitPage,
  onSectionChange,
  visibleSection,
  isCompleting = false,
  updatingQuestions = new Set(),
  voiceState,
  onVoiceToggle,
  audioLevel
}: AssessmentLayoutProps) {
  const [chatExpanded, setChatExpanded] = useState(false);

  // If no assessment selected, show selector
  if (!selectedAssessment && availableAssessments.length > 0) {
    return (
      <div className="bg-gray-50 min-h-screen w-full flex justify-center relative">
        <div className="w-[1280px] min-h-screen bg-white shadow-xl flex items-center justify-center">
          <AssessmentSelector
            assessments={availableAssessments}
            onSelect={onSelectAssessment}
          />
        </div>
        <ChatPanelWrapper
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full flex justify-center relative">
      <div className="w-[1280px] min-h-screen bg-white shadow-xl">
        {/* Main content area */}
        {selectedAssessment && workflowState && (
          <AssessmentViewer
            key={`page-${workflowState.currentPageId}-${Object.keys(currentAnswers).length}`}
            assessment={selectedAssessment}
            workflowState={workflowState}
            currentAnswers={currentAnswers}
            onAnswerChange={onAnswerChange}
            onSubmitPage={onSubmitPage}
            isCompleting={isCompleting}
            updatingQuestions={updatingQuestions}
          />
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanelWrapper
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        voiceState={voiceState}
        onVoiceToggle={onVoiceToggle}
        audioLevel={audioLevel}
      />
    </div>
  );
}