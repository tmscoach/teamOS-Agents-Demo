// Assessment types with proper typing for subscription IDs

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

// Extended interface for internal use with string subscription ID
export interface AssessmentSubscriptionWithInternalId extends AssessmentSubscription {
  _subscriptionId?: string;
}

// Type guard to check if assessment has internal ID
export function hasInternalSubscriptionId(
  assessment: AssessmentSubscription | AssessmentSubscriptionWithInternalId
): assessment is AssessmentSubscriptionWithInternalId {
  return '_subscriptionId' in assessment && assessment._subscriptionId !== undefined;
}

// Helper to get subscription ID as string
export function getSubscriptionIdString(
  assessment: AssessmentSubscription | AssessmentSubscriptionWithInternalId
): string {
  if (hasInternalSubscriptionId(assessment)) {
    return assessment._subscriptionId;
  }
  return assessment.SubscriptionID.toString();
}