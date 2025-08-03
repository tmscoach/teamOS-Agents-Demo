"use client";

import React from 'react';
import AssessmentViewer from './AssessmentViewer';
import AssessmentSelector from './AssessmentSelector';
import { WorkflowState } from '../types';

interface AssessmentSubscription {
  id: string | number;
  type: string;
  name: string;
  status: string;
  progress: number;
  workflowId?: string;
}

interface AssessmentLayoutProps {
  availableAssessments: AssessmentSubscription[];
  selectedAssessment: AssessmentSubscription | null;
  onSelectAssessment: (assessment: AssessmentSubscription) => void;
  workflowState: WorkflowState | null;
  currentAnswers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onSubmitPage: () => void;
  isCompleting?: boolean;
  updatingQuestions?: Set<number>;
}

export default function AssessmentLayout({
  availableAssessments,
  selectedAssessment,
  onSelectAssessment,
  workflowState,
  currentAnswers,
  onAnswerChange,
  onSubmitPage,
  isCompleting = false,
  updatingQuestions = new Set()
}: AssessmentLayoutProps) {
  // If no assessment selected, show selector
  if (!selectedAssessment && availableAssessments.length > 0) {
    return (
      <div className="h-screen w-full overflow-hidden bg-white flex items-center justify-center">
        <AssessmentSelector
          assessments={availableAssessments}
          onSelect={onSelectAssessment}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-white">
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
  );
}