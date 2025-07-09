"use client";

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import StateNode from './state-node';
import TransitionEdge from './transition-edge';

const nodeTypes = {
  state: StateNode,
};

const edgeTypes = {
  transition: TransitionEdge,
};

interface FlowState {
  id: string;
  name: string;
  description?: string;
  prompts?: Record<string, string>;
  tools?: string[];
  extractionFields?: string[];
}

interface FlowTransition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  priority?: number;
}

interface FlowConfig {
  states: FlowState[];
  transitions: FlowTransition[];
  initialState: string;
}

interface FlowEditorProps {
  flowConfig: FlowConfig;
  onChange: (config: FlowConfig) => void;
  agentName: string;
}

export default function FlowEditor({ flowConfig, onChange, agentName }: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [editingState, setEditingState] = useState<FlowState | null>(null);
  const [editingTransition, setEditingTransition] = useState<FlowTransition | null>(null);
  const [stateForm, setStateForm] = useState<Partial<FlowState>>({});
  const [transitionForm, setTransitionForm] = useState<Partial<FlowTransition>>({});

  // Convert flow config to React Flow nodes and edges
  useEffect(() => {
    if (!flowConfig || !flowConfig.states) return;

    // Create nodes from states
    const flowNodes: Node[] = flowConfig.states.map((state, index) => ({
      id: state.id,
      type: 'state',
      position: { 
        x: 250 * (index % 3), 
        y: 150 * Math.floor(index / 3) 
      },
      data: {
        label: state.name,
        description: state.description,
        isInitial: state.id === flowConfig.initialState,
        state,
      },
    }));

    // Create edges from transitions
    const flowEdges: Edge[] = flowConfig.transitions.map(transition => ({
      id: transition.id,
      source: transition.from,
      target: transition.to,
      type: 'transition',
      animated: true,
      data: {
        condition: transition.condition,
        priority: transition.priority,
        transition,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowConfig, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const newTransition: FlowTransition = {
        id: `transition-${Date.now()}`,
        from: params.source,
        to: params.target,
        priority: 0,
      };

      setTransitionForm(newTransition);
      setShowTransitionDialog(true);
    },
    []
  );

  const handleAddState = () => {
    setEditingState(null);
    setStateForm({
      id: `state-${Date.now()}`,
      name: '',
      description: '',
      prompts: {},
      tools: [],
      extractionFields: [],
    });
    setShowStateDialog(true);
  };

  const handleEditState = (state: FlowState) => {
    setEditingState(state);
    setStateForm(state);
    setShowStateDialog(true);
  };

  const handleDeleteState = (stateId: string) => {
    const newStates = flowConfig.states.filter(s => s.id !== stateId);
    const newTransitions = flowConfig.transitions.filter(
      t => t.from !== stateId && t.to !== stateId
    );
    onChange({
      ...flowConfig,
      states: newStates,
      transitions: newTransitions,
    });
    toast.success('State deleted');
  };

  const handleEditTransition = (transition: FlowTransition) => {
    setEditingTransition(transition);
    setTransitionForm(transition);
    setShowTransitionDialog(true);
  };

  const handleDeleteTransition = (transitionId: string) => {
    const newTransitions = flowConfig.transitions.filter(t => t.id !== transitionId);
    onChange({
      ...flowConfig,
      transitions: newTransitions,
    });
    toast.success('Transition deleted');
  };

  const handleSaveState = () => {
    if (!stateForm.name) {
      toast.error('State name is required');
      return;
    }

    const newState: FlowState = {
      id: stateForm.id || `state-${Date.now()}`,
      name: stateForm.name,
      description: stateForm.description,
      prompts: stateForm.prompts || {},
      tools: stateForm.tools || [],
      extractionFields: stateForm.extractionFields || [],
    };

    let newStates: FlowState[];
    if (editingState) {
      newStates = flowConfig.states.map(s => s.id === editingState.id ? newState : s);
    } else {
      newStates = [...flowConfig.states, newState];
    }

    onChange({
      ...flowConfig,
      states: newStates,
    });

    setShowStateDialog(false);
    toast.success(editingState ? 'State updated' : 'State added');
  };

  const handleSaveTransition = () => {
    const newTransition: FlowTransition = {
      id: transitionForm.id || `transition-${Date.now()}`,
      from: transitionForm.from!,
      to: transitionForm.to!,
      condition: transitionForm.condition,
      priority: transitionForm.priority || 0,
    };

    let newTransitions: FlowTransition[];
    if (editingTransition) {
      newTransitions = flowConfig.transitions.map(t => 
        t.id === editingTransition.id ? newTransition : t
      );
    } else {
      newTransitions = [...flowConfig.transitions, newTransition];
    }

    onChange({
      ...flowConfig,
      transitions: newTransitions,
    });

    setShowTransitionDialog(false);
    toast.success(editingTransition ? 'Transition updated' : 'Transition added');
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.data.state) {
      handleEditState(node.data.state);
    }
  };

  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    if (edge.data?.transition) {
      handleEditTransition(edge.data.transition);
    }
  };

  const exportToJSON = () => {
    const json = JSON.stringify(flowConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName}-flow-config.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Visual Flow Editor</h3>
          <p className="text-sm text-muted-foreground">
            Design your agent's conversation flow using a visual state machine
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddState}>
            <Plus className="h-4 w-4 mr-2" />
            Add State
          </Button>
          <Button variant="outline" size="sm" onClick={exportToJSON}>
            <Save className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px' }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </CardContent>
      </Card>

      {/* State Dialog */}
      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingState ? 'Edit State' : 'Add New State'}</DialogTitle>
            <DialogDescription>
              Define the properties of this conversation state
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="state-name">State Name</Label>
              <Input
                id="state-name"
                value={stateForm.name || ''}
                onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                placeholder="e.g., greeting, context_discovery"
              />
            </div>
            <div>
              <Label htmlFor="state-description">Description</Label>
              <Textarea
                id="state-description"
                value={stateForm.description || ''}
                onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                placeholder="What happens in this state?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="state-tools">Available Tools (comma-separated)</Label>
              <Input
                id="state-tools"
                value={stateForm.tools?.join(', ') || ''}
                onChange={(e) => setStateForm({ 
                  ...stateForm, 
                  tools: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                })}
                placeholder="e.g., extractTeamInfo, searchKnowledge"
              />
            </div>
            <div>
              <Label htmlFor="state-fields">Extraction Fields (comma-separated)</Label>
              <Input
                id="state-fields"
                value={stateForm.extractionFields?.join(', ') || ''}
                onChange={(e) => setStateForm({ 
                  ...stateForm, 
                  extractionFields: e.target.value.split(',').map(f => f.trim()).filter(Boolean) 
                })}
                placeholder="e.g., team_size, primary_challenge"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveState}>
              {editingState ? 'Update' : 'Create'} State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransition ? 'Edit Transition' : 'Add New Transition'}</DialogTitle>
            <DialogDescription>
              Define when and how to move between states
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transition-condition">Condition (JavaScript expression)</Label>
              <Textarea
                id="transition-condition"
                value={transitionForm.condition || ''}
                onChange={(e) => setTransitionForm({ ...transitionForm, condition: e.target.value })}
                placeholder="e.g., capturedFields.team_size && capturedFields.primary_challenge"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="transition-priority">Priority</Label>
              <Input
                id="transition-priority"
                type="number"
                value={transitionForm.priority || 0}
                onChange={(e) => setTransitionForm({ 
                  ...transitionForm, 
                  priority: parseInt(e.target.value) || 0 
                })}
                placeholder="Higher priority transitions are evaluated first"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransitionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTransition}>
              {editingTransition ? 'Update' : 'Create'} Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}