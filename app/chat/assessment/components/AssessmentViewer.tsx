"use client";

import React from 'react';
import { DbHeader } from './DbHeader';
import { QuestionRenderer } from './QuestionRenderer';
// Removed NavigationMenu import - using inline progress bar instead
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
    .every((q: WorkflowQuestion) => {
      const questionId = q.QuestionID || q.questionID || 0;
      return currentAnswers[questionId];
    });

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
      <div className="flex flex-col px-10 pt-[140px] pb-10 max-w-4xl mx-auto w-full">
        {/* Progress bar section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mr-4">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(((workflowState.currentPageNumber || 1) - 1) / ((workflowState.totalPages || 12) - 1)) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Page {workflowState.currentPageNumber || 1} of {workflowState.totalPages || 12}
            </span>
          </div>
          
          {/* Instructions */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Which word in each pair bests describes you?
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• If you definitely prefer the statement on the left, select 2-0</li>
              <li>• If you definitely prefer the statement on the right, select 0-2</li>
              <li>• If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</li>
            </ul>
          </div>
        </div>

        {/* Questions area */}
        <div className="flex flex-col gap-6">

          {/* Questions */}
          <div className="flex flex-col gap-4">
            {workflowState.questions.map((question: WorkflowQuestion) => {
              const questionId = question.QuestionID || question.questionID || 0;
              return (
                <QuestionRenderer
                  key={questionId}
                  question={question}
                  value={currentAnswers[questionId]}
                  onValueChange={(value) => onAnswerChange(questionId, value)}
                />
              );
            })}
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