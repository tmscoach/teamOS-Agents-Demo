"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowState } from '@/lib/agents/graph/types';
import { Activity, CheckCircle, Flag, Save } from 'lucide-react';

interface FlowNodeData {
  state: FlowState;
  isInitial?: boolean;
  isFinal?: boolean;
  isCheckpoint?: boolean;
}

export const FlowNode = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
  const { state, isInitial, isFinal, isCheckpoint } = data;
  
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
        ${isInitial ? 'ring-2 ring-green-400' : ''}
        ${isFinal ? 'ring-2 ring-purple-400' : ''}
        min-w-[200px]
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
          {isInitial && <Flag className="w-3 h-3 text-green-500" />}
          {state.name}
          {isFinal && <CheckCircle className="w-3 h-3 text-purple-500" />}
        </h3>
        {isCheckpoint && <Save className="w-3 h-3 text-blue-500" />}
      </div>
      
      <p className="text-xs text-gray-600 mb-2">{state.description}</p>
      
      {state.parallel && (
        <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
          <Activity className="w-3 h-3" />
          Parallel Execution
        </div>
      )}
      
      <div className="text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Required:</span>
          <span className="font-medium">{state.dataRequirements.required.length}</span>
        </div>
        {state.maxDuration && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Max time:</span>
            <span className="font-medium">{state.maxDuration}m</span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
});

FlowNode.displayName = 'FlowNode';