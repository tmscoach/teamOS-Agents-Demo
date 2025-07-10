"use client";

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { FlowDesigner } from './FlowDesigner';
import { FlowConfiguration } from '@/src/lib/agents/graph/types';

interface FlowDesignerWrapperProps {
  flowConfig: FlowConfiguration;
  onConfigChange: (config: FlowConfiguration) => void;
  readOnly?: boolean;
}

export function FlowDesignerWrapper(props: FlowDesignerWrapperProps) {
  return (
    <ReactFlowProvider>
      <div className="h-[600px] w-full">
        <FlowDesigner {...props} />
      </div>
    </ReactFlowProvider>
  );
}