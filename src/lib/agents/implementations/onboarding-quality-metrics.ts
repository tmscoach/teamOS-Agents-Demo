/**
 * Quality metrics calculator for OnboardingAgent conversations
 * Extracted to follow Single Responsibility Principle
 */

import { ConversationData } from '../types';

export interface QualityMetrics {
  completionPercentage: number;
  rapportScore: number;
  managerConfidenceLevel: number;
}

export class OnboardingQualityCalculator {
  private static readonly REQUIRED_FIELDS = [
    'managerName',
    'teamSize',
    'teamStructure',
    'primaryChallenge',
    'goals',
    'timeline',
    'resources',
    'stakeholders'
  ];

  private static readonly ENGAGEMENT_INDICATORS = [
    'positive',
    'engaged',
    'interested',
    'excited',
    'collaborative',
    'open'
  ];

  calculateMetrics(data: ConversationData, messageHistory: Array<{ role: string; content: string }>): QualityMetrics {
    return {
      completionPercentage: this.calculateCompletionPercentage(data),
      rapportScore: this.calculateRapportScore(messageHistory),
      managerConfidenceLevel: this.calculateConfidenceLevel(data, messageHistory)
    };
  }

  private calculateCompletionPercentage(data: ConversationData): number {
    const completedFields = OnboardingQualityCalculator.REQUIRED_FIELDS.filter(field => {
      const value = data[field as keyof ConversationData];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });

    return (completedFields.length / OnboardingQualityCalculator.REQUIRED_FIELDS.length) * 100;
  }

  private calculateRapportScore(messageHistory: Array<{ role: string; content: string }>): number {
    if (messageHistory.length === 0) return 0;

    const userMessages = messageHistory.filter(m => m.role === 'user');
    let engagementScore = 0;
    let totalScore = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // Check message length (longer messages indicate engagement)
      if (content.length > 50) engagementScore += 1;
      if (content.length > 100) engagementScore += 1;
      
      // Check for engagement indicators
      OnboardingQualityCalculator.ENGAGEMENT_INDICATORS.forEach(indicator => {
        if (content.includes(indicator)) engagementScore += 2;
      });
      
      // Check for questions (indicates curiosity)
      if (content.includes('?')) engagementScore += 1;
      
      totalScore += 10; // Max possible score per message
    });

    return Math.min((engagementScore / totalScore) * 100, 100);
  }

  private calculateConfidenceLevel(
    data: ConversationData, 
    messageHistory: Array<{ role: string; content: string }>
  ): number {
    let confidence = 50; // Start at neutral

    // Increase confidence for detailed responses
    if (data.teamStructure && data.teamStructure.length > 20) confidence += 10;
    if (data.primaryChallenge && data.primaryChallenge.length > 30) confidence += 10;
    if (data.goals && data.goals.length > 2) confidence += 10;
    
    // Check for uncertainty indicators in messages
    const uncertaintyPhrases = ['not sure', 'maybe', 'i think', 'possibly', 'might be'];
    const userMessages = messageHistory.filter(m => m.role === 'user');
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      uncertaintyPhrases.forEach(phrase => {
        if (content.includes(phrase)) confidence -= 5;
      });
    });

    return Math.max(0, Math.min(100, confidence));
  }

  isReadyForHandoff(data: ConversationData, metrics: QualityMetrics): boolean {
    return metrics.completionPercentage >= 80 && 
           metrics.rapportScore >= 60 && 
           metrics.managerConfidenceLevel >= 70;
  }
}