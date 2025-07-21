/**
 * Mock Data Store
 * In-memory storage for mock TMS data
 */

import { TMSAuthResponse, TMSDashboardSubscription, TMSQuestion } from './types';

interface MockUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'Facilitator' | 'Respondent';
  organizationId: string;
  token?: string;
}

interface MockOrganization {
  id: string;
  name: string;
  facilitatorId: string;
  createdAt: Date;
}

interface MockSubscription {
  subscriptionId: string;
  userId: string;
  organizationId: string;
  workflowId: string;
  workflowName: string;
  assessmentType: 'TMP' | 'QO2' | 'WOW' | 'LLP' | 'TeamSignals';
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercentage: number;
  assignedDate: Date;
  completedDate?: Date;
  answers: Record<string, any>;
  currentPageId?: string;
}

interface MockWorkflow {
  workflowId: string;
  name: string;
  assessmentType: 'TMP' | 'QO2' | 'WOW' | 'LLP' | 'TeamSignals';
  pages: MockWorkflowPage[];
}

interface MockWorkflowPage {
  pageId: string;
  baseContentId: string;
  sectionId: string;
  pageNumber: number;
  questions: TMSQuestion[];
}

class MockDataStore {
  private users: Map<string, MockUser> = new Map();
  private organizations: Map<string, MockOrganization> = new Map();
  private subscriptions: Map<string, MockSubscription> = new Map();
  private workflows: Map<string, MockWorkflow> = new Map();
  private tokenToUser: Map<string, string> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some mock workflows based on TMS assessments
    this.initializeWorkflows();
  }

  private initializeWorkflows() {
    // Team Management Profile (TMP)
    this.workflows.set('tmp-workflow', {
      workflowId: 'tmp-workflow',
      name: 'Team Management Profile',
      assessmentType: 'TMP',
      pages: [
        {
          pageId: 'tmp-page-1',
          baseContentId: 'tmp-base',
          sectionId: 'tmp-section-1',
          pageNumber: 1,
          questions: [
            {
              questionId: 'tmp-q1',
              questionText: 'How would you describe your team\'s current performance level?',
              questionType: 'Scale',
              responseOptions: ['1', '2', '3', '4', '5'],
              required: true,
              conditionalLogic: false
            },
            {
              questionId: 'tmp-q2',
              questionText: 'What are your team\'s primary strengths?',
              questionType: 'Text',
              required: true,
              conditionalLogic: false
            }
          ]
        },
        {
          pageId: 'tmp-page-2',
          baseContentId: 'tmp-base',
          sectionId: 'tmp-section-1',
          pageNumber: 2,
          questions: [
            {
              questionId: 'tmp-q3',
              questionText: 'How effectively does your team communicate?',
              questionType: 'SingleChoice',
              responseOptions: ['Very Effectively', 'Effectively', 'Somewhat Effectively', 'Ineffectively', 'Very Ineffectively'],
              required: true,
              conditionalLogic: false
            }
          ]
        }
      ]
    });

    // Quality of Output 2 (QO2)
    this.workflows.set('qo2-workflow', {
      workflowId: 'qo2-workflow',
      name: 'Quality of Output Assessment',
      assessmentType: 'QO2',
      pages: [
        {
          pageId: 'qo2-page-1',
          baseContentId: 'qo2-base',
          sectionId: 'qo2-section-1',
          pageNumber: 1,
          questions: [
            {
              questionId: 'qo2-q1',
              questionText: 'How would you rate the quality of your team\'s deliverables?',
              questionType: 'Scale',
              responseOptions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
              required: true,
              conditionalLogic: false
            }
          ]
        }
      ]
    });

    // Add more mock workflows as needed
  }

  // User Management
  createUser(user: Omit<MockUser, 'id' | 'token'>): MockUser {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = `mock-jwt-${id}`;
    const newUser: MockUser = { ...user, id, token };
    this.users.set(id, newUser);
    this.tokenToUser.set(token, id);
    return newUser;
  }

  getUserByEmail(email: string): MockUser | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getUserByToken(token: string): MockUser | undefined {
    const userId = this.tokenToUser.get(token);
    return userId ? this.users.get(userId) : undefined;
  }

  // Organization Management
  createOrganization(name: string, facilitatorId: string): MockOrganization {
    const id = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const org: MockOrganization = {
      id,
      name,
      facilitatorId,
      createdAt: new Date()
    };
    this.organizations.set(id, org);
    return org;
  }

  getOrganization(id: string): MockOrganization | undefined {
    return this.organizations.get(id);
  }

  // Subscription Management
  createSubscription(userId: string, workflowId: string, organizationId: string): MockSubscription {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const subscription: MockSubscription = {
      subscriptionId,
      userId,
      organizationId,
      workflowId,
      workflowName: workflow.name,
      assessmentType: workflow.assessmentType,
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date(),
      answers: {},
      currentPageId: workflow.pages[0]?.pageId
    };
    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  getSubscription(subscriptionId: string): MockSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getUserSubscriptions(userId: string): MockSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.userId === userId);
  }

  updateSubscriptionProgress(subscriptionId: string, pageId: string, answers: Record<string, any>) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    const workflow = this.workflows.get(subscription.workflowId);
    if (!workflow) return;

    // Update answers
    Object.assign(subscription.answers, answers);

    // Update current page
    subscription.currentPageId = pageId;

    // Calculate completion percentage
    const totalQuestions = workflow.pages.reduce((sum, page) => sum + page.questions.length, 0);
    const answeredQuestions = Object.keys(subscription.answers).length;
    subscription.completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

    // Update status
    if (subscription.completionPercentage === 0) {
      subscription.status = 'not_started';
    } else if (subscription.completionPercentage < 100) {
      subscription.status = 'in_progress';
    } else {
      subscription.status = 'completed';
      subscription.completedDate = new Date();
    }
  }

  // Workflow Management
  getWorkflow(workflowId: string): MockWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowPage(workflowId: string, pageId: string): MockWorkflowPage | undefined {
    const workflow = this.workflows.get(workflowId);
    return workflow?.pages.find(p => p.pageId === pageId);
  }

  getAllWorkflows(): MockWorkflow[] {
    return Array.from(this.workflows.values());
  }

  // Generate mock report data
  generateMockReport(subscriptionId: string): any {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== 'completed') {
      return null;
    }

    return {
      subscriptionId,
      assessmentType: subscription.assessmentType,
      completedDate: subscription.completedDate,
      scores: {
        overall: Math.floor(Math.random() * 30) + 70, // 70-100
        communication: Math.floor(Math.random() * 30) + 70,
        collaboration: Math.floor(Math.random() * 30) + 70,
        innovation: Math.floor(Math.random() * 30) + 70
      },
      insights: [
        'Team shows strong communication patterns',
        'Opportunities for improvement in delegation',
        'High levels of trust among team members'
      ],
      recommendations: [
        'Continue regular team meetings',
        'Implement peer feedback sessions',
        'Focus on goal alignment exercises'
      ],
      htmlContent: '<h1>Team Assessment Report</h1><p>Your team is performing well...</p>'
    };
  }
}

// Export singleton instance
export const mockDataStore = new MockDataStore();