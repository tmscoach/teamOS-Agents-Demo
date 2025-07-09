"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExtractionField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
  extraction?: {
    states?: string[];
    keywords?: string[];
    confidence?: number;
  };
}

interface ExtractionRules {
  fields: ExtractionField[];
  globalSettings?: {
    minConfidence?: number;
    fallbackStrategy?: string;
  };
}

interface ExtractionEditorProps {
  extractionRules: ExtractionRules;
  onChange: (rules: ExtractionRules) => void;
  availableStates?: string[];
}

export default function ExtractionEditor({ 
  extractionRules, 
  onChange, 
  availableStates = [] 
}: ExtractionEditorProps) {
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<ExtractionField | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<ExtractionField>>({});

  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({
      id: `field-${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
      extraction: {
        states: [],
        keywords: [],
        confidence: 70,
      },
    });
    setShowFieldDialog(true);
  };

  const handleEditField = (field: ExtractionField) => {
    setEditingField(field);
    setFieldForm(field);
    setShowFieldDialog(true);
  };

  const handleDeleteField = (fieldId: string) => {
    const newFields = extractionRules.fields.filter(f => f.id !== fieldId);
    onChange({
      ...extractionRules,
      fields: newFields,
    });
    toast.success('Field deleted');
  };

  const handleSaveField = () => {
    if (!fieldForm.name) {
      toast.error('Field name is required');
      return;
    }

    const newField: ExtractionField = {
      id: fieldForm.id || `field-${Date.now()}`,
      name: fieldForm.name,
      type: fieldForm.type || 'string',
      description: fieldForm.description,
      required: fieldForm.required || false,
      validation: fieldForm.validation,
      extraction: fieldForm.extraction,
    };

    let newFields: ExtractionField[];
    if (editingField) {
      newFields = extractionRules.fields.map(f => 
        f.id === editingField.id ? newField : f
      );
    } else {
      newFields = [...extractionRules.fields, newField];
    }

    onChange({
      ...extractionRules,
      fields: newFields,
    });

    setShowFieldDialog(false);
    toast.success(editingField ? 'Field updated' : 'Field added');
  };

  const updateGlobalSettings = (key: string, value: any) => {
    onChange({
      ...extractionRules,
      globalSettings: {
        ...extractionRules.globalSettings,
        [key]: value,
      },
    });
  };

  const getFieldTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      string: 'Aa',
      number: '12',
      boolean: '⊤⊥',
      array: '[]',
      object: '{}',
    };
    return icons[type] || '?';
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Extraction Settings</CardTitle>
          <CardDescription>
            Configure default settings for all extraction rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-confidence">Minimum Confidence Threshold</Label>
              <Input
                id="min-confidence"
                type="number"
                min={0}
                max={100}
                value={extractionRules.globalSettings?.minConfidence || 70}
                onChange={(e) => updateGlobalSettings('minConfidence', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum confidence score required for successful extraction (0-100)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback-strategy">Fallback Strategy</Label>
              <Select
                value={extractionRules.globalSettings?.fallbackStrategy || 'prompt'}
                onValueChange={(value) => updateGlobalSettings('fallbackStrategy', value)}
              >
                <SelectTrigger id="fallback-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prompt">Prompt for missing fields</SelectItem>
                  <SelectItem value="skip">Skip missing fields</SelectItem>
                  <SelectItem value="default">Use default values</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Definitions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Field Definitions</CardTitle>
              <CardDescription>
                Define the fields to extract from conversations
              </CardDescription>
            </div>
            <Button onClick={handleAddField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {extractionRules.fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No extraction fields defined. Add a field to get started.
              </div>
            ) : (
              extractionRules.fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-mono">
                      {getFieldTypeIcon(field.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.name}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                      </div>
                      {field.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {field.description}
                        </p>
                      )}
                      {field.extraction?.states && field.extraction.states.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {field.extraction.states.map((state) => (
                            <Badge key={state} variant="secondary" className="text-xs">
                              {state}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
            <DialogDescription>
              Define how to extract this field from conversations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  value={fieldForm.name || ''}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="e.g., team_size"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-type">Data Type</Label>
                <Select
                  value={fieldForm.type || 'string'}
                  onValueChange={(value) => setFieldForm({ 
                    ...fieldForm, 
                    type: value as ExtractionField['type'] 
                  })}
                >
                  <SelectTrigger id="field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-description">Description</Label>
              <Textarea
                id="field-description"
                value={fieldForm.description || ''}
                onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                placeholder="What information should this field capture?"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={fieldForm.required || false}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, required: checked })}
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            <div className="space-y-2">
              <Label>Extraction Settings</Label>
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="extraction-states">Extract from States</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const currentStates = fieldForm.extraction?.states || [];
                      if (!currentStates.includes(value)) {
                        setFieldForm({
                          ...fieldForm,
                          extraction: {
                            ...fieldForm.extraction,
                            states: [...currentStates, value],
                          },
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="extraction-states">
                      <SelectValue placeholder="Select states where this field is extracted" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {fieldForm.extraction?.states?.map((state) => (
                      <Badge
                        key={state}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setFieldForm({
                            ...fieldForm,
                            extraction: {
                              ...fieldForm.extraction,
                              states: fieldForm.extraction?.states?.filter(s => s !== state) || [],
                            },
                          });
                        }}
                      >
                        {state} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraction-keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="extraction-keywords"
                    value={fieldForm.extraction?.keywords?.join(', ') || ''}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      extraction: {
                        ...fieldForm.extraction,
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                      },
                    })}
                    placeholder="e.g., team, size, people, members"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraction-confidence">Confidence Threshold</Label>
                  <Input
                    id="extraction-confidence"
                    type="number"
                    min={0}
                    max={100}
                    value={fieldForm.extraction?.confidence || 70}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      extraction: {
                        ...fieldForm.extraction,
                        confidence: parseInt(e.target.value),
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            {fieldForm.type === 'string' && (
              <div className="space-y-2">
                <Label>Validation Rules</Label>
                <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="validation-pattern">Regex Pattern</Label>
                    <Input
                      id="validation-pattern"
                      value={fieldForm.validation?.pattern || ''}
                      onChange={(e) => setFieldForm({
                        ...fieldForm,
                        validation: {
                          ...fieldForm.validation,
                          pattern: e.target.value,
                        },
                      })}
                      placeholder="e.g., ^[0-9]+$"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {fieldForm.type === 'number' && (
              <div className="space-y-2">
                <Label>Validation Rules</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="validation-min">Minimum Value</Label>
                    <Input
                      id="validation-min"
                      type="number"
                      value={fieldForm.validation?.min || ''}
                      onChange={(e) => setFieldForm({
                        ...fieldForm,
                        validation: {
                          ...fieldForm.validation,
                          min: parseInt(e.target.value),
                        },
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validation-max">Maximum Value</Label>
                    <Input
                      id="validation-max"
                      type="number"
                      value={fieldForm.validation?.max || ''}
                      onChange={(e) => setFieldForm({
                        ...fieldForm,
                        validation: {
                          ...fieldForm.validation,
                          max: parseInt(e.target.value),
                        },
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              {editingField ? 'Update' : 'Create'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}