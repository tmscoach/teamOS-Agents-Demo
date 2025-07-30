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
  updatingQuestions?: Set<number>;
}

export default function AssessmentViewer({
  assessment,
  workflowState,
  currentAnswers,
  onAnswerChange,
  onSubmitPage,
  isCompleting = false,
  updatingQuestions = new Set()
}: AssessmentViewerProps) {
  // Pre-populate organization field if it exists and is empty
  React.useEffect(() => {
    const orgQuestion = workflowState.questions.find(
      (q: WorkflowQuestion) => (q.QuestionID || q.questionID) === 1041
    );
    if (orgQuestion && !currentAnswers[1041] && assessment.OrganisationName) {
      onAnswerChange(1041, assessment.OrganisationName);
    }
  }, [workflowState.questions, assessment.OrganisationName]);
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

      {/* Main content area with fixed header offset - matches Figma layout */}
      <div className="flex flex-col lg:flex-row items-start gap-4 px-4 sm:px-6 lg:px-10 pt-[140px] pb-6 w-full h-[calc(100vh-109px)]">
        {/* Left Navigation/Instructions - matches Figma NavigationMenu */}
        <div className="flex flex-col w-full lg:w-[250px] lg:flex-shrink-0 items-start gap-2">
          {/* Progress bar */}
          <div className="w-full lg:w-[234px] h-2 bg-[#55637d33] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#a7c0e3] transition-all duration-300"
              style={{ width: `${(((workflowState.currentPageNumber || 1) - 1) / ((workflowState.totalPages || 12) - 1)) * 100}%` }}
            />
          </div>
          <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Page {workflowState.currentPageNumber || 1} of {workflowState.totalPages || 12}
          </div>
          
          {/* Instructions - hidden on small screens */}
          <div className="hidden sm:flex flex-col items-start gap-2 pt-4">
            <h3 className="text-base font-medium text-gray-900 leading-5">
              Which word in each pair bests describes you?
            </h3>
            <div className="text-sm text-gray-600 leading-5">
              • If you definitely prefer the statement on the left, select 2-0<br/>
              • If you definitely prefer the statement on the right, select 0-2<br/>
              • If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement
            </div>
          </div>
        </div>

        {/* Right Questions area - matches Figma Frame */}
        <div className="flex flex-col flex-1 items-start gap-8 lg:pl-[30px] w-full max-w-full lg:max-w-[900px]">

          {/* Questions */}
          <div className="flex flex-col gap-4 self-stretch w-full">
            {workflowState.questions
              .sort((a: WorkflowQuestion, b: WorkflowQuestion) => {
                const sortA = a.SortOrder ?? a.sortOrder ?? 0;
                const sortB = b.SortOrder ?? b.sortOrder ?? 0;
                return sortA - sortB;
              })
              .map((question: WorkflowQuestion) => {
                const questionId = question.QuestionID || question.questionID || 0;
                return (
                  <QuestionRenderer
                    key={questionId}
                    question={question}
                    value={currentAnswers[questionId]}
                    onValueChange={(value) => onAnswerChange(questionId, value)}
                    isUpdating={updatingQuestions.has(questionId)}
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