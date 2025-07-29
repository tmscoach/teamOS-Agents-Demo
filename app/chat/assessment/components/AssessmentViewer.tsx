"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  return (
    <div className="flex h-full">
      {/* Navigation sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <NavigationMenu
          assessmentType={assessment.assessmentType}
          currentPage={workflowState.currentPageId}
          totalPages={workflowState.navigationInfo?.totalPages || 12}
          completionPercentage={workflowState.completionPercentage}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {assessment.assessmentType} Assessment
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Page {workflowState.currentPageId} of {workflowState.navigationInfo?.totalPages || '?'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Progress:</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${workflowState.completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {workflowState.completionPercentage}%
                </span>
              </div>
            </div>
            {workflowState.pageDescription && (
              <p className="mt-2 text-lg font-medium text-gray-800">
                {workflowState.pageDescription}
              </p>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-6 mb-8">
            {workflowState.questions.map((question) => (
              <WorkflowQuestion
                key={question.questionID}
                question={question}
                value={currentAnswers[question.questionID]}
                onAnswerChange={onAnswerChange}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!workflowState.navigationInfo?.canGoBack}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={onSubmitPage}
              disabled={!allQuestionsAnswered}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {workflowState.navigationInfo?.isLastPage ? 'Complete Assessment' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}