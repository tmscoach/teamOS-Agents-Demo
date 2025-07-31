"use client";

import React from 'react';
import DOMPurify from 'dompurify';
import { Question } from './Question';
import { SimpleRadioGroup } from './simple-radio';
import { WorkflowQuestion } from '../types';

interface QuestionRendererProps {
  question: WorkflowQuestion;
  value?: string;
  onValueChange: (value: string) => void;
  isUpdating?: boolean;
}

export function QuestionRenderer({ question, value, onValueChange, isUpdating = false }: QuestionRendererProps) {
  // Debug logging
  const questionId = question.QuestionID || question.questionID || question.id || 0;
  const questionType = question.Type || question.type || 0;
  console.log(`[QuestionRenderer] Question ${questionId}: value="${value}", type=${typeof value}`);
  
  // Type 18: Seesaw (Forced-pair questions) - TMP style
  if (questionType === 18) {
    // Map API values to display labels
    const apiToDisplay: Record<string, string> = {
      "20": "2-0",
      "21": "2-1", 
      "12": "1-2",
      "02": "0-2"
    };
    
    return (
      <Question
        id={`q${questionId}`}
        number={`${question.Prompt || question.prompt || question.Description || question.description || ''}`}
        leftWord={question.StatementA || question.statementA || ''}
        rightWord={question.StatementB || question.statementB || ''}
        selectedValue={value || ''}
        onValueChange={onValueChange}
        isUpdating={isUpdating}
      />
    );
  }

  // Type 8: Yes/No
  if (questionType === 8) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt || question.prompt || ''}</h3>
        <SimpleRadioGroup
          value={value || ''}
          onChange={onValueChange}
          options={['Yes', 'No']}
        />
      </div>
    );
  }

  // Type 4: Dropdown
  if (questionType === 4) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt || question.prompt || ''}</h3>
        <select
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={question.IsRequired || question.isRequired || false}
        >
          <option value="">Select...</option>
          {(question.ListOptions || question.listOptions)?.map((option, index) => (
            <option key={index} value={(question.ListValues || question.listValues)?.[index] || option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Type 1 or 6: Text Field
  if (questionType === 1 || questionType === 6) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt || question.prompt || ''}</h3>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          maxLength={question.MaxLength || question.maxLength}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your answer..."
          required={question.IsRequired || question.isRequired || false}
        />
      </div>
    );
  }

  // Type 7: Text Area
  if (questionType === 7) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt || question.prompt || ''}</h3>
        <textarea
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          maxLength={question.MaxLength || question.maxLength || 400}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Enter your response..."
          required={question.IsRequired || question.isRequired || false}
        />
      </div>
    );
  }

  // Type 16: Multiple Choice
  if (questionType === 16) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt || question.prompt || ''}</h3>
        <div className="space-y-3">
          {(question.ListOptions || question.listOptions)?.map((option, index) => (
            <label key={index} className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
              <input
                type="radio"
                name={`question-${questionId}`}
                value={(question.ListValues || question.listValues)?.[index] || option}
                checked={value === ((question.ListValues || question.listValues)?.[index] || option)}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required={question.IsRequired || question.isRequired || false}
              />
              <span className="ml-3 text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Type 0: Heading
  if (questionType === 0) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{question.Prompt || question.prompt || ''}</h2>
      </div>
    );
  }

  // Type 19/20: Paragraph/HTML
  if (questionType === 19 || questionType === 20) {
    return (
      <div className="mb-4">
        <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.Prompt || question.prompt || '') }} />
      </div>
    );
  }

  // Default: Unsupported type
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800">Unsupported question type: {questionType}</p>
      <p className="text-sm text-yellow-600 mt-1">{question.Prompt || question.prompt || ''}</p>
    </div>
  );
}