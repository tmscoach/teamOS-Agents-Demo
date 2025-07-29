"use client";

import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import AssessmentViewer from './AssessmentViewer';
import AssessmentSelector from './AssessmentSelector';
import { Message } from 'ai';

interface AssessmentSubscription {
  subscriptionId: string;
  workflowId: string;
  workflowName: string;
  assessmentType: string;
  status: string;
}

interface WorkflowState {
  subscriptionId: string;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  questions: any[];
  navigationInfo: any;
  completionPercentage: number;
  // Navigation tracking
  nextPageId?: number | null;
  nextSectionId?: number | null;
  nextBaseContentId?: number | null;
  pageDescription?: string;
}

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
  visibleSection
}: AssessmentLayoutProps) {
  const [chatExpanded, setChatExpanded] = useState(false);

  // If no assessment selected, show selector
  if (!selectedAssessment && availableAssessments.length > 0) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <AssessmentSelector
            assessments={availableAssessments}
            onSelect={onSelectAssessment}
          />
        </div>
        <ChatInterface
          agentName="AssessmentAgent"
          assessmentType={selectedAssessment?.assessmentType || ''}
          visibleSection={visibleSection}
          expanded={chatExpanded}
          onToggle={() => setChatExpanded(!chatExpanded)}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          workflowState={workflowState}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {selectedAssessment && workflowState && (
          <AssessmentViewer
            assessment={selectedAssessment}
            workflowState={workflowState}
            currentAnswers={currentAnswers}
            onAnswerChange={onAnswerChange}
            onSubmitPage={onSubmitPage}
          />
        )}
      </div>

      {/* Chat interface */}
      <ChatInterface
        agentName="AssessmentAgent"
        assessmentType={selectedAssessment?.assessmentType || ''}
        visibleSection={visibleSection}
        expanded={chatExpanded}
        onToggle={() => setChatExpanded(!chatExpanded)}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        workflowState={workflowState}
      />
    </div>
  );
}