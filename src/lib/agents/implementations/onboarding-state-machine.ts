/**
 * State machine for managing OnboardingAgent conversation flow
 * Extracted to follow Single Responsibility Principle
 */

import { ConversationState } from './onboarding-agent';
import { ConversationData } from '../types';

export interface StateTransition {
  from: ConversationState;
  to: ConversationState;
  condition: (data: ConversationData) => boolean;
}

export class OnboardingStateMachine {
  private currentState: ConversationState;
  private readonly transitions: StateTransition[] = [
    {
      from: ConversationState.GREETING,
      to: ConversationState.CONTEXT_DISCOVERY,
      condition: (data) => !!data.managerName
    },
    {
      from: ConversationState.CONTEXT_DISCOVERY,
      to: ConversationState.CHALLENGE_EXPLORATION,
      condition: (data) => !!data.teamSize && !!data.teamStructure
    },
    {
      from: ConversationState.CHALLENGE_EXPLORATION,
      to: ConversationState.TMS_EXPLANATION,
      condition: (data) => !!data.primaryChallenge
    },
    {
      from: ConversationState.TMS_EXPLANATION,
      to: ConversationState.GOAL_SETTING,
      condition: (data) => !!data.tmsUnderstanding
    },
    {
      from: ConversationState.GOAL_SETTING,
      to: ConversationState.RESOURCE_CONFIRMATION,
      condition: (data) => !!(data.goals && data.goals.length > 0)
    },
    {
      from: ConversationState.RESOURCE_CONFIRMATION,
      to: ConversationState.STAKEHOLDER_MAPPING,
      condition: (data) => data.resources !== undefined
    },
    {
      from: ConversationState.STAKEHOLDER_MAPPING,
      to: ConversationState.RECAP_AND_HANDOFF,
      condition: (data) => data.stakeholders && data.stakeholders.length > 0
    }
  ];

  constructor(initialState: ConversationState = ConversationState.GREETING) {
    this.currentState = initialState;
  }

  getState(): ConversationState {
    return this.currentState;
  }

  setState(state: ConversationState): void {
    this.currentState = state;
  }

  canTransition(data: ConversationData): boolean {
    const transition = this.transitions.find(t => t.from === this.currentState);
    return transition ? transition.condition(data) : false;
  }

  attemptTransition(data: ConversationData): boolean {
    const transition = this.transitions.find(t => t.from === this.currentState);
    
    if (transition && transition.condition(data)) {
      this.currentState = transition.to;
      return true;
    }
    
    return false;
  }

  getNextState(): ConversationState | null {
    const transition = this.transitions.find(t => t.from === this.currentState);
    return transition ? transition.to : null;
  }

  isComplete(): boolean {
    return this.currentState === ConversationState.RECAP_AND_HANDOFF;
  }

  getProgress(): number {
    const states = Object.values(ConversationState);
    const currentIndex = states.indexOf(this.currentState);
    return (currentIndex + 1) / states.length;
  }
}