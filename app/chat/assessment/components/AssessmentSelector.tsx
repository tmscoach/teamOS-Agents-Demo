"use client";

import React from 'react';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AssessmentSubscription {
  subscriptionId: string;
  workflowId: string;
  workflowName: string;
  assessmentType: string;
  status: string;
}

interface AssessmentSelectorProps {
  assessments: AssessmentSubscription[];
  onSelect: (assessment: AssessmentSubscription) => void;
}

export default function AssessmentSelector({ assessments, onSelect }: AssessmentSelectorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'not_started':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAssessmentColor = (type: string) => {
    switch (type) {
      case 'TMP':
        return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
      case 'QO2':
        return 'bg-green-50 hover:bg-green-100 border-green-200';
      case 'Team Signals':
        return 'bg-purple-50 hover:bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl w-full p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select an Assessment
        </h1>
        <p className="text-gray-600">
          Choose an assessment to begin or continue
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment) => (
          <button
            key={assessment.subscriptionId}
            onClick={() => onSelect(assessment)}
            className={`p-6 rounded-lg border-2 transition-all ${getAssessmentColor(
              assessment.assessmentType
            )}`}
            disabled={assessment.status === 'completed'}
          >
            <div className="flex items-start justify-between mb-4">
              <FileText className="w-8 h-8 text-gray-600" />
              {getStatusIcon(assessment.status)}
            </div>
            
            <h3 className="font-semibold text-lg text-gray-900 mb-1 text-left">
              {assessment.assessmentType}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3 text-left">
              {assessment.workflowName}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                ID: {assessment.subscriptionId}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                assessment.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : assessment.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {assessment.status.replace('_', ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No assessments available</p>
        </div>
      )}
    </div>
  );
}