import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';

export default function StateNode({ data }: NodeProps) {
  const isInitial = data.isInitial;
  
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-background ${
      isInitial ? 'border-primary' : 'border-border'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
      />
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm">{data.label}</div>
          {isInitial && (
            <Badge variant="secondary" className="text-xs">
              Initial
            </Badge>
          )}
        </div>
        
        {data.description && (
          <div className="text-xs text-muted-foreground max-w-[200px]">
            {data.description}
          </div>
        )}
        
        {data.state?.tools && data.state.tools.length > 0 && (
          <div className="flex gap-1 mt-1">
            {data.state.tools.map((tool: string) => (
              <Badge key={tool} variant="outline" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
      />
    </div>
  );
}