/**
 * TMS API Types
 * These types match the structure of the real TMS Global API
 */

// Auth Types
export interface TMSSignupRequest {
  Email: string;
  Password?: string; // Made optional for Clerk integration
  FirstName: string;
  LastName: string;
  OrganizationName: string;
  PhoneNumber?: string;
  ClerkUserId?: string; // For password-less signup
}

export interface TMSLoginRequest {
  Email: string;
  Password: string;
}

export interface TMSAuthResponse {
  token: string;
  userId: string;
  userType: 'Facilitator' | 'Respondent';
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TMSValidateResponse {
  valid: boolean;
  userId?: string;
  userType?: 'Facilitator' | 'Respondent';
  organizationId?: string;
}

// Workflow Types
export interface TMSWorkflowProcess {
  subscriptionId: string;
  baseContentId: string;
  sectionId: string;
  pageId: string;
  questionData: TMSQuestion[];
  progress: {
    currentPage: number;
    totalPages: number;
    completionPercentage: number;
  };
  navigationOptions: {
    canGoBack: boolean;
    canGoForward: boolean;
    previousPageId?: string;
    nextPageId?: string;
  };
}

export interface TMSQuestion {
  questionId: string;
  questionText: string;
  questionType: 'SingleChoice' | 'MultipleChoice' | 'Text' | 'Scale' | 'Matrix';
  responseOptions?: string[];
  required: boolean;
  conditionalLogic?: boolean;
  currentAnswer?: any;
}

export interface TMSWorkflowUpdateRequest {
  subscriptionId: string;
  pageId: string;
  answers: {
    questionId: string;
    answer: any;
  }[];
}

export interface TMSWorkflowUpdateResponse {
  success: boolean;
  nextPageId?: string;
  completionPercentage?: number;
}

// Subscription Types
export interface TMSDashboardSubscription {
  SubscriptionID: number;
  WorkflowID: number;
  WorkflowType: string;
  Status: string;
  Progress: number;
  AssignmentDate: string;
  CompletionDate: string | null;
  OrganisationID: number;
  OrganisationName: string;
  AssessmentType: string;
  AssessmentStatus: string;
}

// Report Types
export interface TMSReportSummary {
  subscriptionId: string;
  assessmentType: string;
  completedDate: string;
  scores: Record<string, number>;
  insights: string[];
  recommendations: string[];
  htmlContent: string;
}

export interface TMSReportTemplate {
  templateId: string;
  templateName: string;
  description: string;
  format: 'PDF' | 'Excel' | 'PowerPoint';
}

export interface TMSGenerateReportRequest {
  organizationId: string;
  reportType: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeTeams?: string[];
  format?: 'PDF' | 'Excel';
}

export interface TMSProductUsage {
  organizationId: string;
  activeUsers: number;
  totalAssessments: number;
  completionRate: number;
  averageTimeToComplete: number;
  mostUsedAssessments: {
    assessmentType: string;
    count: number;
  }[];
}

// Password-less Auth Types
export interface TMSCreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  clerkUserId: string;
  userType: 'Facilitator' | 'Respondent';
  respondentName?: string; // For display purposes
}

export interface TMSTokenExchangeRequest {
  clerkUserId: string;
}

// Error Response
export interface TMSErrorResponse {
  error: string;
  message: string;
  details?: any;
}

// JWT Token Claims
export interface TMSJWTClaims {
  sub: string; // userId
  UserType: 'Facilitator' | 'Respondent';
  respondentID?: string;
  nameid: string; // email
  organisationId: string;
  clerkUserId?: string; // Clerk integration
  exp: number;
  iat: number;
}