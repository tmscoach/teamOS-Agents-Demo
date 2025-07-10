"use client";

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { FlowState, ExitCondition } from '@/src/lib/agents/graph/types';

interface NodeConfigPanelProps {
  nodeId: string;
  state: FlowState;
  onUpdate: (updates: Partial<FlowState>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function NodeConfigPanel({ nodeId, state, onUpdate, onDelete, readOnly }: NodeConfigPanelProps) {
  const [localState, setLocalState] = useState(state);

  useEffect(() => {
    setLocalState(state);
  }, [state]);

  const handleChange = (field: keyof FlowState, value: any) => {
    const updated = { ...localState, [field]: value };
    setLocalState(updated);
    onUpdate({ [field]: value });
  };

  const handleRequiredFieldChange = (fields: string[]) => {
    const updated = {
      ...localState,
      dataRequirements: {
        ...localState.dataRequirements,
        required: fields
      }
    };
    setLocalState(updated);
    onUpdate({
      dataRequirements: updated.dataRequirements
    });
  };

  const handleOptionalFieldChange = (fields: string[]) => {
    const updated = {
      ...localState,
      dataRequirements: {
        ...localState.dataRequirements,
        optional: fields
      }
    };
    setLocalState(updated);
    onUpdate({
      dataRequirements: updated.dataRequirements
    });
  };

  const addExitCondition = () => {
    const newCondition: ExitCondition = {
      id: `condition_${Date.now()}`,
      type: 'data_complete',
      config: { fields: [] }
    };
    
    const updated = {
      ...localState,
      exitConditions: [...(localState.exitConditions || []), newCondition]
    };
    setLocalState(updated);
    onUpdate({ exitConditions: updated.exitConditions });
  };

  const removeExitCondition = (index: number) => {
    const updated = {
      ...localState,
      exitConditions: localState.exitConditions.filter((_, i) => i !== index)
    };
    setLocalState(updated);
    onUpdate({ exitConditions: updated.exitConditions });
  };

  return (
    <div className="w-96 bg-white border-l shadow-lg p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Configure State</h2>
        {!readOnly && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-md transition-colors"
            title="Delete State"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State Name
          </label>
          <input
            type="text"
            value={localState.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={localState.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={readOnly}
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Duration (minutes)
          </label>
          <input
            type="number"
            value={localState.maxDuration || ''}
            onChange={(e) => handleChange('maxDuration', parseInt(e.target.value) || undefined)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* System Prompt Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Prompt Override (Optional)
          </label>
          <textarea
            value={localState.systemPromptOverride || ''}
            onChange={(e) => handleChange('systemPromptOverride', e.target.value)}
            disabled={readOnly}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="Override the agent's system prompt for this state..."
          />
        </div>

        {/* Data Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Fields
          </label>
          <FieldList
            fields={localState.dataRequirements.required}
            onChange={handleRequiredFieldChange}
            readOnly={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Optional Fields
          </label>
          <FieldList
            fields={localState.dataRequirements.optional}
            onChange={handleOptionalFieldChange}
            readOnly={readOnly}
          />
        </div>

        {/* Exit Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Exit Conditions
            </label>
            {!readOnly && (
              <button
                onClick={addExitCondition}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {localState.exitConditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <select
                  value={condition.type}
                  onChange={(e) => {
                    const updated = [...localState.exitConditions];
                    updated[index] = { ...condition, type: e.target.value as any };
                    setLocalState({ ...localState, exitConditions: updated });
                    onUpdate({ exitConditions: updated });
                  }}
                  disabled={readOnly}
                  className="flex-1 px-2 py-1 text-sm border rounded"
                >
                  <option value="data_complete">Data Complete</option>
                  <option value="time_elapsed">Time Elapsed</option>
                  <option value="user_intent">User Intent</option>
                  <option value="custom">Custom</option>
                </select>
                {!readOnly && (
                  <button
                    onClick={() => removeExitCondition(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Minus className="w-3 h-3 text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Parallel Execution */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="parallel"
            checked={localState.parallel || false}
            onChange={(e) => handleChange('parallel', e.target.checked)}
            disabled={readOnly}
            className="mr-2"
          />
          <label htmlFor="parallel" className="text-sm font-medium text-gray-700">
            Enable Parallel Execution
          </label>
        </div>

        {localState.parallel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parallel Nodes
            </label>
            <FieldList
              fields={localState.nodes || []}
              onChange={(nodes) => handleChange('nodes', nodes)}
              readOnly={readOnly}
              placeholder="Enter node IDs..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldListProps {
  fields: string[];
  onChange: (fields: string[]) => void;
  readOnly?: boolean;
  placeholder?: string;
}

function FieldList({ fields, onChange, readOnly, placeholder = "Enter field name..." }: FieldListProps) {
  const [newField, setNewField] = useState('');

  const addField = () => {
    if (newField && !fields.includes(newField)) {
      onChange([...fields, newField]);
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    onChange(fields.filter(f => f !== field));
  };

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <div key={field} className="flex items-center gap-2">
          <span className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm">
            {field}
          </span>
          {!readOnly && (
            <button
              onClick={() => removeField(field)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Minus className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addField()}
            placeholder={placeholder}
            className="flex-1 px-3 py-1 text-sm border rounded"
          />
          <button
            onClick={addField}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}