/**
 * Input validation utilities for API endpoints
 */

import { z } from 'zod';

// Common schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(5000, 'Message too long'),
  role: z.enum(['user', 'assistant', 'system']).optional(),
});

export const conversationIdSchema = z.string().uuid('Invalid conversation ID');

export const agentNameSchema = z.enum([
  'OnboardingAgent',
  'AssessmentAgent',
  'TransformationAgent',
  'SystemAgent'
]);

// API request schemas
export const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  agentName: agentNameSchema.optional(),
});

export const onboardingRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().optional(),
  metadata: z.object({
    sessionId: z.string().optional(),
    userId: z.string().optional(),
  }).optional(),
});

export const ragQuerySchema = z.object({
  question: z.string()
    .min(3, 'Question too short')
    .max(1000, 'Question too long')
    .transform(val => val.trim()),
  maxResults: z.number().int().min(1).max(50).default(20).optional(),
  includeMetadata: z.boolean().default(true).optional(),
});

export const adminFilterSchema = z.object({
  status: z.enum(['active', 'completed', 'failed', 'abandoned']).optional(),
  agentName: agentNameSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  managerId: z.string().optional(),
  teamId: z.string().optional(),
});

// Validation helper
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Invalid request data' };
  }
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeForLog(data: any): any {
  if (typeof data === 'string') {
    // Remove potential sensitive data patterns
    return data
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3,4}[- ]?\d{3,4}[- ]?\d{3,4}[- ]?\d{3,4}\b/g, '[CARD]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys
      if (['password', 'token', 'apiKey', 'secret'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  return data;
}