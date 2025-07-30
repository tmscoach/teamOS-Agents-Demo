/**
 * Workflow State Manager
 * Manages the stateful progression through TMS assessments
 */

import { 
  AssessmentDefinition, 
  AssessmentType, 
  getAssessmentByWorkflow,
  ASSESSMENT_DEFINITIONS 
} from './assessment-definitions';
import { mockDataStore } from './mock-data-store';

export interface WorkflowState {
  subscriptionId: string;
  workflowType: AssessmentType;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  answers: Record<number, string>; // questionId -> answer value
  completionPercentage: number;
  startedAt: Date;
  completedAt?: Date;
  lastUpdated: Date;
}

export interface NavigationInfo {
  currentPageId: number;
  currentSectionId: number;
  nextPageId?: number;
  previousPageId?: number;
  nextSectionId?: number;
  previousSectionId?: number;
  nextBaseContentId?: number;
  previousBaseContentId?: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isLastPage: boolean;
}

export class WorkflowStateManager {
  private static instance: WorkflowStateManager;

  private constructor() {}

  static getInstance(): WorkflowStateManager {
    if (!WorkflowStateManager.instance) {
      WorkflowStateManager.instance = new WorkflowStateManager();
    }
    return WorkflowStateManager.instance;
  }

  // Use mockDataStore for persistence across API calls
  private get workflowStates(): Map<string, WorkflowState> {
    return mockDataStore.workflowStates as Map<string, WorkflowState>;
  }

  /**
   * Initialize or get workflow state for a subscription
   */
  getOrCreateWorkflowState(
    subscriptionId: string, 
    workflowId: string,
    baseContentId?: number
  ): WorkflowState {
    const existingState = this.workflowStates.get(subscriptionId);
    if (existingState) {
      return existingState;
    }

    const assessment = getAssessmentByWorkflow(workflowId) || 
                      (baseContentId ? Object.values(ASSESSMENT_DEFINITIONS).find(def => def.baseContentId === baseContentId) : undefined);
    
    if (!assessment) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }

    const firstSection = assessment.sections?.[0];
    const firstPage = firstSection?.pages[0] || 1;

    const newState: WorkflowState = {
      subscriptionId,
      workflowType: assessment.assessmentType,
      workflowId: assessment.workflowId,
      currentPageId: firstPage,
      currentSectionId: firstSection?.sectionId || 1,
      baseContentId: assessment.baseContentId,
      answers: {},
      completionPercentage: 0,
      startedAt: new Date(),
      lastUpdated: new Date()
    };

    this.workflowStates.set(subscriptionId, newState);
    return newState;
  }

  /**
   * Update workflow state with answers
   */
  updateWorkflowState(
    subscriptionId: string,
    pageId: number,
    answers: Array<{ questionID: number; value: string }>
  ): WorkflowState {
    const state = this.workflowStates.get(subscriptionId);
    if (!state) {
      throw new Error(`No workflow state found for subscription: ${subscriptionId}`);
    }

    // Update answers
    answers.forEach(answer => {
      state.answers[answer.questionID] = answer.value;
    });

    // Update current page
    state.currentPageId = pageId;
    state.lastUpdated = new Date();

    // Calculate completion percentage
    const assessment = getAssessmentByWorkflow(state.workflowId);
    if (assessment) {
      const totalQuestions = assessment.totalPages * assessment.questionsPerPage;
      const answeredQuestions = Object.keys(state.answers).length;
      state.completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

      // Check if completed
      if (state.completionPercentage >= 100) {
        state.completedAt = new Date();
      }
    }

    return state;
  }

  /**
   * Get navigation info for current state
   */
  getNavigationInfo(subscriptionId: string): NavigationInfo {
    const state = this.workflowStates.get(subscriptionId);
    if (!state) {
      throw new Error(`No workflow state found for subscription: ${subscriptionId}`);
    }

    const assessment = getAssessmentByWorkflow(state.workflowId);
    if (!assessment) {
      throw new Error(`No assessment definition found for workflow: ${state.workflowId}`);
    }

    // Find current section and page index
    let currentSectionIndex = -1;
    let currentPageIndexInSection = -1;
    let totalPagesBeforeSection = 0;

    assessment.sections?.forEach((section, sIndex) => {
      const pageIndex = section.pages.indexOf(state.currentPageId);
      if (pageIndex !== -1) {
        currentSectionIndex = sIndex;
        currentPageIndexInSection = pageIndex;
      } else {
        totalPagesBeforeSection += section.pages.length;
      }
    });

    const currentSection = assessment.sections?.[currentSectionIndex];
    const nextSection = assessment.sections?.[currentSectionIndex + 1];
    const prevSection = assessment.sections?.[currentSectionIndex - 1];

    // Calculate navigation
    const hasNextPageInSection = currentPageIndexInSection < (currentSection?.pages.length || 0) - 1;
    const hasPrevPageInSection = currentPageIndexInSection > 0;

    const nextPageId = hasNextPageInSection 
      ? currentSection?.pages[currentPageIndexInSection + 1]
      : nextSection?.pages[0];

    const previousPageId = hasPrevPageInSection
      ? currentSection?.pages[currentPageIndexInSection - 1]
      : prevSection?.pages[prevSection.pages.length - 1];

    const isLastPage = currentSectionIndex === (assessment.sections?.length || 0) - 1 && 
                      currentPageIndexInSection === (currentSection?.pages.length || 0) - 1;

    return {
      currentPageId: state.currentPageId,
      currentSectionId: state.currentSectionId,
      nextPageId,
      previousPageId,
      nextSectionId: !hasNextPageInSection ? nextSection?.sectionId : undefined,
      previousSectionId: !hasPrevPageInSection ? prevSection?.sectionId : undefined,
      nextBaseContentId: isLastPage ? this.getNextBaseContentId(state.baseContentId) : undefined,
      previousBaseContentId: state.currentPageId === assessment.sections?.[0]?.pages[0] 
        ? this.getPreviousBaseContentId(state.baseContentId) : undefined,
      canGoBack: !!previousPageId,
      canGoForward: !!nextPageId,
      isLastPage
    };
  }

  /**
   * Navigate to specific page
   */
  navigateToPage(
    subscriptionId: string,
    pageId: number,
    sectionId?: number,
    baseContentId?: number
  ): WorkflowState {
    const state = this.workflowStates.get(subscriptionId);
    if (!state) {
      throw new Error(`No workflow state found for subscription: ${subscriptionId}`);
    }

    state.currentPageId = pageId;
    if (sectionId) {
      state.currentSectionId = sectionId;
    }
    if (baseContentId) {
      state.baseContentId = baseContentId;
    }
    state.lastUpdated = new Date();

    return state;
  }

  /**
   * Get next base content ID (for navigation between assessments)
   */
  private getNextBaseContentId(currentBaseContentId: number): number | undefined {
    // Based on recorded flows:
    // TMP (3) -> QO2 (79)
    // QO2 (5) -> Team Signals (97)
    const navigationMap: Record<number, number> = {
      3: 79,   // TMP to next
      5: 97,   // QO2 to next
      12: 0    // Team Signals - end
    };
    return navigationMap[currentBaseContentId];
  }

  /**
   * Get previous base content ID
   */
  private getPreviousBaseContentId(currentBaseContentId: number): number | undefined {
    // Based on recorded flows:
    const navigationMap: Record<number, number> = {
      3: 85,   // TMP previous
      5: 71,   // QO2 previous
      12: 90   // Team Signals previous
    };
    return navigationMap[currentBaseContentId];
  }

  /**
   * Clear workflow state (for testing)
   */
  clearState(subscriptionId: string): void {
    this.workflowStates.delete(subscriptionId);
  }

  /**
   * Get all workflow states (for debugging)
   */
  getAllStates(): Map<string, WorkflowState> {
    return new Map(this.workflowStates);
  }
}

// Export singleton instance
export const workflowStateManager = WorkflowStateManager.getInstance();