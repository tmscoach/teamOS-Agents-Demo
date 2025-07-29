"use client";

import React from 'react';
import { X } from 'lucide-react';
import WorkflowQuestion from './WorkflowQuestion';
import NavigationMenu from './NavigationMenu';

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

interface AssessmentViewerProps {
  assessment: AssessmentSubscription;
  workflowState: WorkflowState;
  currentAnswers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onSubmitPage: () => void;
}

export default function AssessmentViewer({
  assessment,
  workflowState,
  currentAnswers,
  onAnswerChange,
  onSubmitPage
}: AssessmentViewerProps) {
  const allQuestionsAnswered = workflowState.questions
    .filter(q => q.isRequired && q.isEnabled)
    .every(q => currentAnswers[q.questionID]);

  const handleClose = () => {
    // Navigate back to dashboard or home
    window.location.href = '/dashboard';
  };

  const getAssessmentTitle = () => {
    switch (assessment.assessmentType) {
      case 'TMP':
        return 'Team Management Profile';
      case 'QO2':
        return 'Opportunities-Obstacles Quotient';
      case 'Team Signals':
        return 'Team Signals Assessment';
      default:
        return `${assessment.assessmentType} Assessment`;
    }
  };

  const getAssessmentDescription = () => {
    switch (assessment.assessmentType) {
      case 'TMP':
        return 'Reveal work preferences and clarify how team roles impact organisational success.';
      case 'QO2':
        return 'Discover how you perceive opportunities and obstacles in your work environment.';
      case 'Team Signals':
        return 'Assess team dynamics and identify areas for improvement.';
      default:
        return `Complete your ${assessment.assessmentType} assessment`;
    }
  };

  return (
    <div className="relative">
      {/* Fixed header - matching Figma design */}
      <div className="absolute w-full h-[108px] top-0 left-0 bg-white border-b border-gray-200 z-10">
        <div className="flex w-full h-full items-center justify-between px-8">
          <header className="flex flex-col gap-1">
            <h1 className="font-semibold text-gray-900 text-2xl">
              {getAssessmentTitle()}
            </h1>
            <p className="font-normal text-gray-500 text-sm">
              {getAssessmentDescription()}
            </p>
          </header>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main content area with fixed header offset */}
      <div className="flex items-start gap-8 px-10 pt-[140px] pb-10">
        {/* Navigation sidebar */}
        <div className="w-[280px] flex-shrink-0">
          <NavigationMenu
            assessmentType={assessment.assessmentType}
            currentPage={workflowState.currentPageId}
            totalPages={workflowState.navigationInfo?.totalPages || 12}
            completionPercentage={workflowState.completionPercentage}
          />
        </div>

        {/* Questions area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Page description if available */}
          {workflowState.pageDescription && (
            <p className="text-lg font-medium text-gray-800 mb-2">
              {workflowState.pageDescription}
            </p>
          )}

          {/* Questions */}
          <div className="flex flex-col gap-4">
            {workflowState.questions.map((question) => (
              <WorkflowQuestion
                key={question.questionID}
                question={question}
                value={currentAnswers[question.questionID]}
                onAnswerChange={onAnswerChange}
              />
            ))}
          </div>

          {/* Submit button - matching Figma style */}
          <button
            onClick={onSubmitPage}
            disabled={!allQuestionsAnswered}
            className="self-start px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}