"use client";

import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowNode } from './FlowNode';
import { FlowToolbar } from './FlowToolbar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { FlowConfiguration, FlowState } from '@/src/lib/agents/graph/types';
import { toast } from 'sonner';

const nodeTypes = {
  flowNode: FlowNode,
};

interface FlowDesignerProps {
  flowConfig: FlowConfiguration;
  onConfigChange: (config: FlowConfiguration) => void;
  readOnly?: boolean;
}

export function FlowDesigner({ flowConfig, onConfigChange, readOnly = false }: FlowDesignerProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  // Convert flow config to React Flow nodes and edges
  useEffect(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    
    // Calculate positions for nodes (simple grid layout)
    const nodePositions = calculateNodePositions(flowConfig);
    
    // Create nodes
    Object.entries(flowConfig.states).forEach(([stateId, state]) => {
      const position = nodePositions[stateId] || { x: 0, y: 0 };
      
      flowNodes.push({
        id: stateId,
        type: 'flowNode',
        position,
        data: {
          state,
          isInitial: flowConfig.settings.initialState === stateId,
          isFinal: flowConfig.settings.finalStates.includes(stateId),
          isCheckpoint: flowConfig.settings.checkpointStates?.includes(stateId),
        }
      });
    });
    
    // Create edges
    flowConfig.transitions.forEach((transition) => {
      flowEdges.push({
        id: transition.id,
        source: transition.from,
        target: transition.to,
        label: transition.condition.type,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: transition,
        style: {
          strokeWidth: 2,
          stroke: transition.priority > 10 ? '#ef4444' : '#6b7280',
        }
      });
    });
    
    setNodes(flowNodes);
    setEdges(flowEdges);
    
    // Fit view after nodes are rendered
    setTimeout(() => fitView({ padding: 0.1 }), 100);
  }, [flowConfig, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (readOnly) return;
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [readOnly]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (readOnly) return;
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [readOnly]);

  const onConnect = useCallback((params: Connection) => {
    if (readOnly) return;
    
    if (params.source && params.target) {
      const newTransition = {
        id: `${params.source}_to_${params.target}_${Date.now()}`,
        from: params.source,
        to: params.target,
        condition: {
          type: 'all' as const,
          rules: []
        },
        priority: 10
      };
      
      const updatedConfig: FlowConfiguration = {
        ...flowConfig,
        transitions: [...flowConfig.transitions, newTransition]
      };
      
      onConfigChange(updatedConfig);
      toast.success('Transition added');
    }
  }, [flowConfig, onConfigChange, readOnly]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onNodeUpdate = useCallback((nodeId: string, updates: Partial<FlowState>) => {
    if (readOnly) return;
    
    const updatedConfig: FlowConfiguration = {
      ...flowConfig,
      states: {
        ...flowConfig.states,
        [nodeId]: {
          ...flowConfig.states[nodeId],
          ...updates
        }
      }
    };
    
    onConfigChange(updatedConfig);
    toast.success('Node updated');
  }, [flowConfig, onConfigChange, readOnly]);

  const onAddNode = useCallback(() => {
    if (readOnly) return;
    
    const newStateId = `state_${Date.now()}`;
    const newState: FlowState = {
      id: newStateId,
      name: 'New State',
      description: 'Configure this state',
      dataRequirements: {
        required: [],
        optional: []
      },
      exitConditions: [],
      maxDuration: 5
    };
    
    const updatedConfig: FlowConfiguration = {
      ...flowConfig,
      states: {
        ...flowConfig.states,
        [newStateId]: newState
      }
    };
    
    onConfigChange(updatedConfig);
    toast.success('State added');
  }, [flowConfig, onConfigChange, readOnly]);

  const onDeleteNode = useCallback((nodeId: string) => {
    if (readOnly) return;
    
    // Remove state
    const { [nodeId]: deletedState, ...remainingStates } = flowConfig.states;
    
    // Remove related transitions
    const remainingTransitions = flowConfig.transitions.filter(
      t => t.from !== nodeId && t.to !== nodeId
    );
    
    const updatedConfig: FlowConfiguration = {
      ...flowConfig,
      states: remainingStates,
      transitions: remainingTransitions
    };
    
    onConfigChange(updatedConfig);
    setSelectedNode(null);
    toast.success('State deleted');
  }, [flowConfig, onConfigChange, readOnly]);

  return (
    <div className="h-full flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
        
        {!readOnly && (
          <FlowToolbar 
            onAddNode={onAddNode}
            onFitView={() => fitView({ padding: 0.1 })}
          />
        )}
      </div>
      
      {selectedNode && (
        <NodeConfigPanel
          nodeId={selectedNode}
          state={flowConfig.states[selectedNode]}
          onUpdate={(updates) => onNodeUpdate(selectedNode, updates)}
          onDelete={() => onDeleteNode(selectedNode)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

// Helper function to calculate node positions
function calculateNodePositions(flowConfig: FlowConfiguration): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
  const levels: string[][] = [];
  
  // BFS to determine levels
  const queue: [string, number][] = [[flowConfig.settings.initialState, 0]];
  visited.add(flowConfig.settings.initialState);
  
  while (queue.length > 0) {
    const [stateId, level] = queue.shift()!;
    
    if (!levels[level]) levels[level] = [];
    levels[level].push(stateId);
    
    // Find transitions from this state
    flowConfig.transitions
      .filter(t => t.from === stateId)
      .forEach(t => {
        if (!visited.has(t.to)) {
          visited.add(t.to);
          queue.push([t.to, level + 1]);
        }
      });
  }
  
  // Calculate positions
  const horizontalSpacing = 250;
  const verticalSpacing = 150;
  
  levels.forEach((level, levelIndex) => {
    const levelWidth = level.length * horizontalSpacing;
    const startX = -levelWidth / 2 + horizontalSpacing / 2;
    
    level.forEach((stateId, nodeIndex) => {
      positions[stateId] = {
        x: startX + nodeIndex * horizontalSpacing,
        y: levelIndex * verticalSpacing
      };
    });
  });
  
  // Handle any unpositioned nodes
  Object.keys(flowConfig.states).forEach(stateId => {
    if (!positions[stateId]) {
      positions[stateId] = {
        x: Math.random() * 500,
        y: Math.random() * 500
      };
    }
  });
  
  return positions;
}