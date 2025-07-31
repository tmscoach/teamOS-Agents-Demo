// Question types
export interface WorkflowQuestion {
  id?: number;
  QuestionID?: number;
  questionID?: number;
  Type?: number;
  type?: number;
  Description?: string;
  description?: string;
  Prompt?: string;
  prompt?: string;
  Text?: string;
  text?: string;
  StatementA?: string;
  statementA?: string;
  StatementB?: string;
  statementB?: string;
  ListOptions?: string[];
  listOptions?: string[];
  ListValues?: string[];
  listValues?: string[];
  IsRequired?: boolean;
  isRequired?: boolean;
  IsEnabled?: boolean;
  isEnabled?: boolean;
  MaxLength?: number;
  maxLength?: number;
  Value?: string | boolean | number;
  value?: string | boolean | number;
  AnswerText?: string;
  answerText?: string;
  UseHorizontalLayout?: boolean;
  useHorizontalLayout?: boolean;
  SortOrder?: number;
  sortOrder?: number;
}

// Navigation info types
export interface NavigationInfo {
  totalPages?: number;
  currentPage?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sections?: NavigationSection[];
  nextPageUrl?: string;
}

export interface NavigationSection {
  id: number;
  name: string;
  pages: number[];
}

// Tool invocation types
export interface ToolInvocation {
  state: 'pending' | 'result' | 'error';
  result?: {
    action?: {
      type: string;
      questionId?: number;
      value?: string;
      direction?: string;
      pageNumber?: number;
    };
  };
  error?: Error;
}

// Workflow state type
export interface WorkflowState {
  subscriptionId: string;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  questions: WorkflowQuestion[];
  navigationInfo: NavigationInfo;
  completionPercentage: number;
  // Navigation tracking
  nextPageId?: number | null;
  nextSectionId?: number | null;
  nextBaseContentId?: number | null;
  pageDescription?: string;
  currentPageNumber?: number;
  totalPages?: number;
}

// Assessment subscription type
export interface AssessmentSubscription {
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