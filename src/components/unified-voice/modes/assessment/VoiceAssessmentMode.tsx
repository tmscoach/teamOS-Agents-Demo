'use client';

import React, { useEffect } from 'react';
import { useVoiceNavigation } from '@/app/chat/assessment/hooks/useVoiceNavigation';

interface VoiceAssessmentModeProps {
  workflowState: any;
  onAnswerUpdate?: (questionId: number, value: string) => void;
  onNavigateNext?: () => void;
}

/**
 * Voice Assessment Mode
 * 
 * Handles voice interactions for assessment questionnaire sessions.
 * Uses AssessmentAgent configuration for consistent behavior.
 */
export function VoiceAssessmentMode({
  workflowState,
  onAnswerUpdate,
  onNavigateNext,
}: VoiceAssessmentModeProps) {
  const {
    voiceState,
    transcript,
    startVoice,
    stopVoice,
    setWorkflowState,
    setAnswerUpdateCallback,
    setNavigateNextCallback,
  } = useVoiceNavigation();

  // Set workflow state
  useEffect(() => {
    console.log('[VoiceAssessmentMode] Setting workflow state');
    setWorkflowState(workflowState);
  }, [workflowState, setWorkflowState]);

  // Set callbacks
  useEffect(() => {
    if (onAnswerUpdate) {
      console.log('[VoiceAssessmentMode] Setting answer update callback');
      setAnswerUpdateCallback(onAnswerUpdate);
    }
    if (onNavigateNext) {
      console.log('[VoiceAssessmentMode] Setting navigate next callback');
      setNavigateNextCallback(onNavigateNext);
    }
  }, [onAnswerUpdate, onNavigateNext, setAnswerUpdateCallback, setNavigateNextCallback]);

  const handleStartVoice = async () => {
    try {
      await startVoice();
    } catch (err) {
      console.error('[VoiceAssessmentMode] Failed to start voice:', err);
    }
  };

  const questions = workflowState?.questions?.filter((q: any) => q.Type === 18) || [];
  const answeredCount = questions.filter((q: any) => q.Value || q.value).length;

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Voice Assessment Mode</h3>
        <p className="text-sm text-gray-600 mt-1">
          {questions.length} questions • {answeredCount} answered
        </p>
      </div>

      <div className="flex justify-center">
        {voiceState === 'idle' ? (
          <button
            onClick={handleStartVoice}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Voice Assessment
          </button>
        ) : (
          <button
            onClick={stopVoice}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Voice Assessment
          </button>
        )}
      </div>

      {voiceState !== 'idle' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            <strong>Status:</strong> {voiceState}
          </div>
          {transcript && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Transcript:</strong> {transcript}
            </div>
          )}
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Questions:</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            {questions.slice(0, 3).map((q: any) => (
              <li key={q.QuestionID || q.questionID}>
                Q{q.Number}: {q.Value || q.value || 'Not answered'}
              </li>
            ))}
            {questions.length > 3 && (
              <li className="text-blue-600">...and {questions.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}