"use client";

import React from 'react';

interface Question {
  questionID: number;
  type: number;
  description: string;
  prompt: string;
  statementA?: string;
  statementB?: string;
  listOptions?: string[];
  listValues?: string[];
  isRequired: boolean;
  isEnabled: boolean;
  maxLength?: number;
  value?: any;
  useHorizontalLayout?: boolean;
}

interface WorkflowQuestionProps {
  question: Question;
  onAnswerChange: (questionId: number, value: string) => void;
  value?: string;
}

export default function WorkflowQuestion({ question, onAnswerChange, value }: WorkflowQuestionProps) {
  const handleChange = (newValue: string) => {
    onAnswerChange(question.questionID, newValue);
  };

  // Type 18: Seesaw (Forced-pair questions) - Used in TMP
  const renderSeesaw = () => {
    const options = ["20", "21", "12", "02"];
    const labels = ["2-0", "2-1", "1-2", "0-2"];
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {question.prompt} {question.description}
        </h3>
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 text-right">
            <span className="text-gray-700 font-medium">{question.statementA}</span>
          </div>
          <div className="flex items-center gap-4">
            {options.map((option, index) => (
              <label key={option} className="flex flex-col items-center cursor-pointer group">
                <input
                  type="radio"
                  name={`question-${question.questionID}`}
                  value={option}
                  checked={value === option}
                  onChange={() => handleChange(option)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  disabled={!question.isEnabled}
                />
                <span className="mt-1 text-sm text-gray-600 group-hover:text-gray-900">
                  {labels[index]}
                </span>
              </label>
            ))}
          </div>
          <div className="flex-1">
            <span className="text-gray-700 font-medium">{question.statementB}</span>
          </div>
        </div>
      </div>
    );
  };

  // Type 8: Yes/No
  const renderYesNo = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{question.prompt}</h3>
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={question.isRequired}
        disabled={!question.isEnabled}
      >
        <option value="">Select...</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>
  );

  // Type 4: Dropdown
  const renderDropdown = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{question.prompt}</h3>
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={question.isRequired}
        disabled={!question.isEnabled}
      >
        <option value="">Select...</option>
        {question.listOptions?.map((option, index) => (
          <option key={index} value={question.listValues?.[index] || option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  // Type 6: Text Field
  const renderTextField = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{question.prompt}</h3>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={question.maxLength}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your answer..."
        required={question.isRequired}
        disabled={!question.isEnabled}
      />
    </div>
  );

  // Type 7: Text Area
  const renderTextArea = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{question.prompt}</h3>
      <textarea
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={question.maxLength || 400}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Enter your response..."
        required={question.isRequired}
        disabled={!question.isEnabled}
      />
    </div>
  );

  // Type 14: Checkbox
  const renderCheckbox = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value === 'true' || value === true}
          onChange={(e) => handleChange(e.target.checked.toString())}
          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          required={question.isRequired}
          disabled={!question.isEnabled}
        />
        <span className="ml-3 text-gray-900">{question.prompt}</span>
      </label>
    </div>
  );

  // Type 16: Multiple Choice
  const renderMultipleChoice = () => {
    // Check if this should use horizontal layout (like QO2 questionnaire)
    const useHorizontalLayout = question.useHorizontalLayout;
    
    if (useHorizontalLayout) {
      // Horizontal layout for QO2-style questions
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Question text */}
            <div className="col-span-5">
              <p className="text-gray-900">{question.prompt}</p>
            </div>
            {/* Radio buttons in a row */}
            <div className="col-span-7 flex justify-around">
              {question.listOptions?.map((option, index) => (
                <label key={index} className="flex flex-col items-center cursor-pointer group">
                  <input
                    type="radio"
                    name={`question-${question.questionID}`}
                    value={question.listValues?.[index] || option}
                    checked={value === (question.listValues?.[index] || option)}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    required={question.isRequired}
                    disabled={!question.isEnabled}
                  />
                  <span className="mt-1 text-xs text-gray-600 text-center whitespace-nowrap group-hover:text-gray-900">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      // Vertical layout (default)
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{question.prompt}</h3>
          <div className="space-y-3">
            {question.listOptions?.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name={`question-${question.questionID}`}
                  value={question.listValues?.[index] || option}
                  checked={value === (question.listValues?.[index] || option)}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  required={question.isRequired}
                  disabled={!question.isEnabled}
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
  };

  // Type 0: Heading
  const renderHeading = () => (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-gray-900">{question.prompt}</h2>
    </div>
  );

  // Type 19/20: Paragraph/HTML
  const renderParagraph = () => (
    <div className="mb-4">
      <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: question.prompt }} />
    </div>
  );

  // Main render function based on question type
  switch (question.type) {
    case 18: return renderSeesaw();      // TMP seesaw questions
    case 8: return renderYesNo();
    case 4: return renderDropdown();
    case 6: return renderTextField();
    case 7: return renderTextArea();
    case 14: return renderCheckbox();
    case 16: return renderMultipleChoice();
    case 0: return renderHeading();
    case 19:
    case 20: return renderParagraph();
    default: 
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Unsupported question type: {question.type}</p>
          <p className="text-sm text-gray-600 mt-1">{question.prompt}</p>
        </div>
      );
  }
}