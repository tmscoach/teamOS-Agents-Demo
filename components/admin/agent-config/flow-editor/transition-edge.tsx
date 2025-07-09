import React from 'react';
import { getBezierPath, EdgeProps, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export default function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      {data?.condition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-2 py-1 text-xs bg-secondary rounded-md border shadow-sm">
              {data.condition.length > 30 
                ? `${data.condition.substring(0, 30)}...` 
                : data.condition
              }
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}