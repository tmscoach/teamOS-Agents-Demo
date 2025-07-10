/**
 * CheckpointManager: Handles state persistence and recovery
 */

import { FlowCheckpoint, StateHistoryEntry } from './types';
import { prisma } from '@/lib/prisma';

export class CheckpointManager {
  private conversationId: string;
  private flowConfigId: string;
  
  constructor(conversationId: string, flowConfigId: string) {
    this.conversationId = conversationId;
    this.flowConfigId = flowConfigId;
  }
  
  /**
   * Save a checkpoint for the current state
   */
  async saveCheckpoint(
    state: string,
    data: Record<string, any>,
    stateHistory: StateHistoryEntry[]
  ): Promise<void> {
    try {
      const checkpoint: FlowCheckpoint = {
        conversationId: this.conversationId,
        flowConfigId: this.flowConfigId,
        state,
        data,
        stateHistory,
        timestamp: new Date()
      };
      
      // Save to database
      await prisma.$transaction(async (tx) => {
        // Delete old checkpoints for this conversation (keep only latest)
        await tx.flowCheckpoint.deleteMany({
          where: {
            conversationId: this.conversationId,
            flowConfigId: this.flowConfigId
          }
        });
        
        // Create new checkpoint
        await tx.flowCheckpoint.create({
          data: {
            conversationId: this.conversationId,
            flowConfigId: this.flowConfigId,
            state,
            data,
            createdAt: checkpoint.timestamp
          }
        });
        
        // Update conversation metadata
        try {
          await tx.conversation.update({
            where: { id: this.conversationId },
            data: {
              metadata: {
                lastCheckpoint: state,
                lastCheckpointTime: checkpoint.timestamp.toISOString(),
                hasCheckpoint: true
              }
            }
          });
        } catch (updateError: any) {
          // If metadata column doesn't exist, skip the update
          if (updateError?.code === 'P2022' && updateError.message?.includes('metadata')) {
            console.warn('Metadata column not found in Conversation table, skipping metadata update');
          } else {
            throw updateError;
          }
        }
      });
    } catch (error) {
      console.error('Error saving checkpoint:', error);
      throw new Error('Failed to save checkpoint');
    }
  }
  
  /**
   * Load the latest checkpoint for a conversation
   */
  async loadCheckpoint(): Promise<FlowCheckpoint | null> {
    try {
      const checkpoint = await prisma.flowCheckpoint.findFirst({
        where: {
          conversationId: this.conversationId,
          flowConfigId: this.flowConfigId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (!checkpoint) {
        return null;
      }
      
      return {
        conversationId: checkpoint.conversationId,
        flowConfigId: checkpoint.flowConfigId,
        state: checkpoint.state,
        data: checkpoint.data as Record<string, any>,
        stateHistory: (checkpoint.data as any).stateHistory || [],
        timestamp: checkpoint.createdAt
      };
    } catch (error) {
      console.error('Error loading checkpoint:', error);
      return null;
    }
  }
  
  /**
   * Check if a checkpoint exists for the conversation
   */
  async hasCheckpoint(): Promise<boolean> {
    try {
      const count = await prisma.flowCheckpoint.count({
        where: {
          conversationId: this.conversationId,
          flowConfigId: this.flowConfigId
        }
      });
      
      return count > 0;
    } catch (error) {
      console.error('Error checking checkpoint:', error);
      return false;
    }
  }
  
  /**
   * Delete all checkpoints for a conversation
   */
  async clearCheckpoints(): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.flowCheckpoint.deleteMany({
          where: {
            conversationId: this.conversationId,
            flowConfigId: this.flowConfigId
          }
        });
        
        try {
          await tx.conversation.update({
            where: { id: this.conversationId },
            data: {
              metadata: {
                hasCheckpoint: false,
                lastCheckpoint: null,
                lastCheckpointTime: null
              }
            }
          });
        } catch (updateError: any) {
          // If metadata column doesn't exist, skip the update
          if (updateError?.code === 'P2022' && updateError.message?.includes('metadata')) {
            console.warn('Metadata column not found in Conversation table, skipping metadata update');
          } else {
            throw updateError;
          }
        }
      });
    } catch (error) {
      console.error('Error clearing checkpoints:', error);
      throw new Error('Failed to clear checkpoints');
    }
  }
  
  /**
   * Get checkpoint statistics
   */
  async getCheckpointStats(): Promise<{
    totalCheckpoints: number;
    lastCheckpointTime: Date | null;
    lastCheckpointState: string | null;
  }> {
    try {
      const checkpoints = await prisma.flowCheckpoint.findMany({
        where: {
          conversationId: this.conversationId,
          flowConfigId: this.flowConfigId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      });
      
      const totalCheckpoints = await prisma.flowCheckpoint.count({
        where: {
          conversationId: this.conversationId,
          flowConfigId: this.flowConfigId
        }
      });
      
      return {
        totalCheckpoints,
        lastCheckpointTime: checkpoints[0]?.createdAt || null,
        lastCheckpointState: checkpoints[0]?.state || null
      };
    } catch (error) {
      console.error('Error getting checkpoint stats:', error);
      return {
        totalCheckpoints: 0,
        lastCheckpointTime: null,
        lastCheckpointState: null
      };
    }
  }
  
  /**
   * Create a recovery checkpoint (for error recovery)
   */
  async createRecoveryCheckpoint(
    state: string,
    data: Record<string, any>,
    stateHistory: StateHistoryEntry[],
    error: Error
  ): Promise<void> {
    try {
      const recoveryData = {
        ...data,
        _recovery: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          previousState: stateHistory[stateHistory.length - 1]?.state
        }
      };
      
      await this.saveCheckpoint(state, recoveryData, stateHistory);
    } catch (saveError) {
      console.error('Error creating recovery checkpoint:', saveError);
    }
  }
  
  /**
   * Validate checkpoint data integrity
   */
  validateCheckpoint(checkpoint: FlowCheckpoint): boolean {
    if (!checkpoint.conversationId || !checkpoint.flowConfigId) {
      return false;
    }
    
    if (!checkpoint.state || typeof checkpoint.state !== 'string') {
      return false;
    }
    
    if (!checkpoint.data || typeof checkpoint.data !== 'object') {
      return false;
    }
    
    if (!Array.isArray(checkpoint.stateHistory)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get checkpoint age in milliseconds
   */
  getCheckpointAge(checkpoint: FlowCheckpoint): number {
    return Date.now() - checkpoint.timestamp.getTime();
  }
  
  /**
   * Check if checkpoint is expired based on max age
   */
  isCheckpointExpired(checkpoint: FlowCheckpoint, maxAgeMs: number): boolean {
    return this.getCheckpointAge(checkpoint) > maxAgeMs;
  }
}