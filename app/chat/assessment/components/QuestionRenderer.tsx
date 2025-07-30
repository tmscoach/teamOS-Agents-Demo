"use client";

import React from 'react';
import DOMPurify from 'dompurify';
import { Question } from './Question';
import { SimpleRadioGroup } from './simple-radio';

interface WorkflowQuestion {
  QuestionID: number;
  Type: number;
  Description: string;
  Prompt: string;
  StatementA?: string;
  StatementB?: string;
  ListOptions?: string[];
  ListValues?: string[];
  IsRequired: boolean;
  IsEnabled: boolean;
  MaxLength?: number;
  Value?: any;
  AnswerText?: string;
}

interface QuestionRendererProps {
  question: WorkflowQuestion;
  value?: string;
  onValueChange: (value: string) => void;
}

export function QuestionRenderer({ question, value, onValueChange }: QuestionRendererProps) {
  // Type 18: Seesaw (Forced-pair questions) - TMP style
  if (question.Type === 18) {
    // Map API values to display labels
    const apiToDisplay: Record<string, string> = {
      "20": "2-0",
      "21": "2-1", 
      "12": "1-2",
      "02": "0-2"
    };
    
    return (
      <Question
        id={`q${question.QuestionID}`}
        number={`${question.Prompt || question.Description}`}
        leftWord={question.StatementA || ''}
        rightWord={question.StatementB || ''}
        selectedValue={value || ''}
        onValueChange={onValueChange}
      />
    );
  }

  // Type 8: Yes/No
  if (question.Type === 8) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt}</h3>
        <SimpleRadioGroup
          value={value || ''}
          onChange={onValueChange}
          options={['Yes', 'No']}
        />
      </div>
    );
  }

  // Type 4: Dropdown
  if (question.Type === 4) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt}</h3>
        <select
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={question.IsRequired}
        >
          <option value="">Select...</option>
          {question.ListOptions?.map((option, index) => (
            <option key={index} value={question.ListValues?.[index] || option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Type 1 or 6: Text Field
  if (question.Type === 1 || question.Type === 6) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt}</h3>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          maxLength={question.MaxLength}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your answer..."
          required={question.IsRequired}
        />
      </div>
    );
  }

  // Type 7: Text Area
  if (question.Type === 7) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt}</h3>
        <textarea
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          maxLength={question.MaxLength || 400}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Enter your response..."
          required={question.IsRequired}
        />
      </div>
    );
  }

  // Type 16: Multiple Choice
  if (question.Type === 16) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question.Prompt}</h3>
        <div className="space-y-3">
          {question.ListOptions?.map((option, index) => (
            <label key={index} className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
              <input
                type="radio"
                name={`question-${question.QuestionID}`}
                value={question.ListValues?.[index] || option}
                checked={value === (question.ListValues?.[index] || option)}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required={question.IsRequired}
              />
              <span className="ml-3 text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Type 0: Heading
  if (question.Type === 0) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">{question.Prompt}</h2>
      </div>
    );
  }

  // Type 19/20: Paragraph/HTML
  if (question.Type === 19 || question.Type === 20) {
    return (
      <div className="mb-4">
        <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.Prompt) }} />
      </div>
    );
  }

  // Default: Unsupported type
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800">Unsupported question type: {question.Type}</p>
      <p className="text-sm text-yellow-600 mt-1">{question.Prompt}</p>
    </div>
  );
}