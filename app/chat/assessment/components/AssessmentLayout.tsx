"use client";

import React, { useState } from 'react';
import { ChatPanelWrapper } from './ChatPanelWrapper';
import AssessmentViewer from './AssessmentViewer';
import AssessmentSelector from './AssessmentSelector';
import { Message } from 'ai';
import { AssessmentSubscription, WorkflowState } from '../types';


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
  isCompleting = false
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
            assessment={selectedAssessment}
            workflowState={workflowState}
            currentAnswers={currentAnswers}
            onAnswerChange={onAnswerChange}
            onSubmitPage={onSubmitPage}
            isCompleting={isCompleting}
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
      />
    </div>
  );
}