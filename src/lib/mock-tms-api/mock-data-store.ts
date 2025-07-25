/**
 * Mock Data Store
 * In-memory storage for mock TMS data
 */

import { TMSAuthResponse, TMSDashboardSubscription, TMSQuestion } from './types';
import { workflowStateManager } from './workflow-state-manager';
import { getAssessmentByWorkflow, ASSESSMENT_DEFINITIONS } from './assessment-definitions';

interface MockUser {
  id: string;
  email: string;
  password?: string; // Made optional for Clerk integration
  clerkUserId?: string; // Link to Clerk user
  firstName: string;
  lastName: string;
  userType: 'Facilitator' | 'Respondent';
  organizationId: string;
  token?: string;
  respondentName?: string; // Display name for respondents
  authSource?: 'password' | 'clerk'; // Track authentication source
}

interface MockOrganization {
  id: string;
  name: string;
  facilitatorId: string;
  createdAt: Date;
}

export interface MockSubscription {
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
  currentPageId?: number;
  baseContentId?: number;
}

// Use global to ensure singleton across Next.js hot reloads
declare global {
  var mockDataStoreInstance: MockDataStore | undefined;
}

class MockDataStore {
  users: Map<string, MockUser> = new Map();
  organizations: Map<string, MockOrganization> = new Map();
  subscriptions: Map<string, MockSubscription> = new Map();
  tokenToUser: Map<string, string> = new Map();
  clerkIdToUser: Map<string, string> = new Map(); // Map Clerk IDs to user IDs

  constructor() {
    // Don't initialize test data automatically - let seed endpoint handle it
  }
  
  static getInstance(): MockDataStore {
    if (!global.mockDataStoreInstance) {
      global.mockDataStoreInstance = new MockDataStore();
    }
    return global.mockDataStoreInstance;
  }

  private initializeTestSubscriptions() {
    // Check if test user already exists
    let testUser = this.getUserByEmail('facilitator@example.com');
    let testOrg;
    
    if (testUser) {
      // User exists, get their organization
      testOrg = this.organizations.get(testUser.organizationId);
      if (!testOrg) {
        // Create organization if user exists but organization doesn't
        testOrg = this.createOrganization('Test Organization', testUser.id);
        testUser.organizationId = testOrg.id;
      }
    } else {
      // Create new test organization and user
      testOrg = this.createOrganization('Test Organization', 'facilitator-1');
      testUser = this.createUser({
        email: 'facilitator@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Facilitator',
        userType: 'Facilitator',
        organizationId: testOrg.id
      });
    }

    // Create test subscriptions matching recorded IDs
    // TMP Subscription (from recorded data)
    const tmpSub: MockSubscription = {
      subscriptionId: '21989',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 3,
      currentPageId: 2
    };
    this.subscriptions.set('21989', tmpSub);

    // QO2 Subscription (from recorded data)
    const qo2Sub: MockSubscription = {
      subscriptionId: '21983',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'qo2-workflow',
      workflowName: 'Opportunities-Obstacles Quotient',
      assessmentType: 'QO2',
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 5,
      currentPageId: 408
    };
    this.subscriptions.set('21983', qo2Sub);

    // Team Signals Subscription (from recorded data)
    const teamSignalsSub: MockSubscription = {
      subscriptionId: '21988',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'team-signals-workflow',
      workflowName: 'Team Signals',
      assessmentType: 'TeamSignals',
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 12,
      currentPageId: 97
    };
    this.subscriptions.set('21988', teamSignalsSub);
  }

  // User Management
  createUser(user: Omit<MockUser, 'id' | 'token'>): MockUser {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = `mock-jwt-${id}`;
    
    // Set auth source based on presence of password or clerkUserId
    const authSource = user.clerkUserId ? 'clerk' : 'password';
    
    const newUser: MockUser = { 
      ...user, 
      id, 
      token,
      authSource 
    };
    
    this.users.set(id, newUser);
    this.tokenToUser.set(token, id);
    
    // Map Clerk ID if provided
    if (user.clerkUserId) {
      this.clerkIdToUser.set(user.clerkUserId, id);
    }
    
    return newUser;
  }

  getUserByEmail(email: string): MockUser | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getUserByToken(token: string): MockUser | undefined {
    // First try direct token lookup
    const userId = this.tokenToUser.get(token);
    if (userId) {
      return this.users.get(userId);
    }

    // If not found, try to decode JWT and find user by ID
    try {
      const mockClient = new (require('./mock-api-client').MockTMSAPIClient)();
      const claims = mockClient.decodeJWT(token);
      if (claims && claims.sub) {
        // Try to find user by ID from JWT sub claim
        const user = this.users.get(claims.sub);
        if (user) {
          // Cache this token for future lookups
          this.tokenToUser.set(token, user.id);
          return user;
        }
        
        // Try to find user by clerkUserId if sub is a clerk ID
        const userByClerk = this.getUserByClerkId(claims.sub);
        if (userByClerk) {
          this.tokenToUser.set(token, userByClerk.id);
          return userByClerk;
        }
      }
    } catch (error) {
      console.log('Failed to decode JWT:', error);
    }
    
    return undefined;
  }

  getUser(userId: string): MockUser | undefined {
    return this.users.get(userId);
  }

  getUserByClerkId(clerkUserId: string): MockUser | undefined {
    const userId = this.clerkIdToUser.get(clerkUserId);
    return userId ? this.users.get(userId) : undefined;
  }

  getAllSubscriptions(): MockSubscription[] {
    return Array.from(this.subscriptions.values());
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
    const assessment = getAssessmentByWorkflow(workflowId);
    if (!assessment) throw new Error('Workflow not found');

    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const firstPage = assessment.sections?.[0]?.pages[0] || 1;
    
    const subscription: MockSubscription = {
      subscriptionId,
      userId,
      organizationId,
      workflowId,
      workflowName: assessment.name,
      assessmentType: assessment.assessmentType,
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date(),
      baseContentId: assessment.baseContentId,
      currentPageId: firstPage
    };
    this.subscriptions.set(subscriptionId, subscription);
    
    // Initialize workflow state
    workflowStateManager.getOrCreateWorkflowState(
      subscriptionId,
      workflowId,
      assessment.baseContentId
    );
    
    return subscription;
  }

  getSubscription(subscriptionId: string): MockSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getUserSubscriptions(userId: string): MockSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.userId === userId);
  }

  updateSubscriptionProgress(subscriptionId: string, pageId: number, answers: Record<string, any>) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Update current page
    subscription.currentPageId = pageId;

    // Get workflow state from state manager
    const state = workflowStateManager.getOrCreateWorkflowState(
      subscriptionId,
      subscription.workflowId,
      subscription.baseContentId
    );

    // Update completion percentage from state manager
    subscription.completionPercentage = state.completionPercentage;

    // Update status based on completion
    if (subscription.completionPercentage === 0) {
      subscription.status = 'not_started';
    } else if (subscription.completionPercentage < 100) {
      subscription.status = 'in_progress';
    } else {
      subscription.status = 'completed';
      subscription.completedDate = new Date();
    }
  }

  // Workflow Management (using assessment definitions)
  getAvailableWorkflows(): string[] {
    return Object.keys(ASSESSMENT_DEFINITIONS);
  }

  getWorkflowName(workflowId: string): string {
    const assessment = getAssessmentByWorkflow(workflowId);
    return assessment?.name || workflowId;
  }

  // Generate mock report data
  generateMockReport(subscriptionId: string): any {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
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

// Export singleton instance using getInstance
export const mockDataStore = MockDataStore.getInstance();

// Export helper function to get the data store
export function getMockDataStore(): MockDataStore {
  return MockDataStore.getInstance();
}

// Export reset function
export function resetMockDataStore(): void {
  const store = MockDataStore.getInstance();
  
  // Clear all data
  store.users.clear();
  store.organizations.clear();
  store.subscriptions.clear();
  store.tokenToUser.clear();
  store.clerkIdToUser.clear();
  
  // Clear workflow states
  store.subscriptions.forEach((sub) => {
    workflowStateManager.clearState(sub.subscriptionId);
  });
}