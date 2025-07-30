"use client";

import React from 'react';
import { DbHeader } from './DbHeader';
import { QuestionRenderer } from './QuestionRenderer';
import NavigationMenu from './NavigationMenu';
import { ASSESSMENT_DISPLAY_NAMES, ASSESSMENT_DESCRIPTIONS } from '../constants';
import { AssessmentSubscription, WorkflowState, WorkflowQuestion } from '../types';


interface AssessmentViewerProps {
  assessment: AssessmentSubscription;
  workflowState: WorkflowState;
  currentAnswers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onSubmitPage: () => void;
  isCompleting?: boolean;
}

export default function AssessmentViewer({
  assessment,
  workflowState,
  currentAnswers,
  onAnswerChange,
  onSubmitPage,
  isCompleting = false
}: AssessmentViewerProps) {
  const allQuestionsAnswered = workflowState.questions
    .filter((q: WorkflowQuestion) => (q.IsRequired || q.isRequired) && (q.IsEnabled !== false))
    .every((q: WorkflowQuestion) => currentAnswers[q.QuestionID || q.questionID || 0]);

  const handleClose = () => {
    // Navigate back to dashboard or home
    window.location.href = '/dashboard';
  };

  const getAssessmentTitle = () => {
    return ASSESSMENT_DISPLAY_NAMES[assessment.AssessmentType] || `${assessment.AssessmentType} Assessment`;
  };

  const getAssessmentDescription = () => {
    return ASSESSMENT_DESCRIPTIONS[assessment.AssessmentType] || `Complete your ${assessment.AssessmentType} assessment`;
  };

  return (
    <div className="relative">
      {/* Header */}
      <DbHeader onClose={handleClose} />

      {/* Main content area with fixed header offset */}
      <div className="flex items-start gap-8 px-10 pt-[140px] pb-10">
        {/* Navigation sidebar */}
        <div className="w-[280px] flex-shrink-0">
          <NavigationMenu
            assessmentType={assessment.AssessmentType}
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
            {workflowState.questions.map((question: WorkflowQuestion) => (
              <QuestionRenderer
                key={question.QuestionID || question.questionID}
                question={question}
                value={currentAnswers[question.QuestionID || question.questionID]}
                onValueChange={(value) => onAnswerChange(question.QuestionID || question.questionID, value)}
              />
            ))}
          </div>

          {/* Submit button - matching Figma style */}
          <button
            onClick={onSubmitPage}
            disabled={!allQuestionsAnswered || isCompleting}
            className="self-start px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isCompleting ? 'Completing...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}