"use client";

import React from 'react';
import { Plus, Maximize2, Download, Upload } from 'lucide-react';

interface FlowToolbarProps {
  onAddNode: () => void;
  onFitView: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function FlowToolbar({ onAddNode, onFitView, onExport, onImport }: FlowToolbarProps) {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 flex gap-2">
      <button
        onClick={onAddNode}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Add State"
      >
        <Plus className="w-5 h-5 text-gray-700" />
      </button>
      
      <button
        onClick={onFitView}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        title="Fit View"
      >
        <Maximize2 className="w-5 h-5 text-gray-700" />
      </button>
      
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Export Flow"
        >
          <Download className="w-5 h-5 text-gray-700" />
        </button>
      )}
      
      {onImport && (
        <button
          onClick={onImport}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Import Flow"
        >
          <Upload className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}