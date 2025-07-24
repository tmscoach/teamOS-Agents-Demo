import { createTMSTool } from '../tms-tool-factory';
import { unifiedTMSClient } from '@/src/lib/tms-api/unified-client';
import { tmsAuthService } from '../tms-auth-service';
import { AgentContext } from '../../types';

jest.mock('@/src/lib/tms-api/unified-client');
jest.mock('../tms-auth-service');

describe('TMS Tool Format - Dashboard Subscriptions', () => {
  const mockContext: AgentContext = {
    managerId: 'test-manager',
    conversationId: 'test-conv',
    messageCount: 1,
    timestamp: new Date(),
    metadata: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth service to return a token
    (tmsAuthService.getOrCreateToken as jest.Mock).mockResolvedValue('mock-jwt-token');
  });

  it('should format empty dashboard subscriptions correctly', async () => {
    const tool = createTMSTool('tms_get_dashboard_subscriptions');
    expect(tool).toBeDefined();

    // Mock API response - empty array
    (unifiedTMSClient.request as jest.Mock).mockResolvedValue([]);

    const result = await tool!.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.output.formatted).toBe('No assessments assigned.');
  });

  it('should format single subscription correctly', async () => {
    const tool = createTMSTool('tms_get_dashboard_subscriptions');
    
    // Mock API response - single subscription
    const mockSubscription = {
      SubscriptionID: 21989,
      WorkflowID: 0,
      WorkflowType: 'TMP',
      Status: 'Completed',
      Progress: 100,
      AssignmentDate: '2024-01-15',
      CompletionDate: '2024-01-16',
      OrganisationID: 0,
      OrganisationName: 'Test Organization',
      AssessmentType: 'TMP',
      AssessmentStatus: 'Completed'
    };
    
    (unifiedTMSClient.request as jest.Mock).mockResolvedValue([mockSubscription]);

    const result = await tool!.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.output.formatted).toBe('Found 1 assessment(s):\nTMP: Completed (100% complete)');
  });

  it('should format multiple subscriptions correctly', async () => {
    const tool = createTMSTool('tms_get_dashboard_subscriptions');
    
    // Mock API response - multiple subscriptions
    const mockSubscriptions = [
      {
        SubscriptionID: 21989,
        WorkflowType: 'TMP',
        Status: 'Completed',
        Progress: 100,
        AssessmentType: 'TMP'
      },
      {
        SubscriptionID: 21983,
        WorkflowType: 'QO2',
        Status: 'In Progress',
        Progress: 60,
        AssessmentType: 'QO2'
      },
      {
        SubscriptionID: 21988,
        WorkflowType: 'TeamSignals',
        Status: 'Not Started',
        Progress: 0,
        AssessmentType: 'TeamSignals'
      }
    ];
    
    (unifiedTMSClient.request as jest.Mock).mockResolvedValue(mockSubscriptions);

    const result = await tool!.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.output.formatted).toContain('Found 3 assessment(s):');
    expect(result.output.formatted).toContain('TMP: Completed (100% complete)');
    expect(result.output.formatted).toContain('QO2: In Progress (60% complete)');
    expect(result.output.formatted).toContain('TeamSignals: Not Started (0% complete)');
  });

  it('should handle undefined or null response gracefully', async () => {
    const tool = createTMSTool('tms_get_dashboard_subscriptions');
    
    // Mock API response - null
    (unifiedTMSClient.request as jest.Mock).mockResolvedValue(null);

    const result = await tool!.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.output.formatted).toBe('No assessments assigned.');
  });

  it('should use AssessmentType when WorkflowType is missing', async () => {
    const tool = createTMSTool('tms_get_dashboard_subscriptions');
    
    // Mock API response - missing WorkflowType
    const mockSubscription = {
      SubscriptionID: 21989,
      AssessmentType: 'TMP',
      Status: 'Completed',
      Progress: 100
    };
    
    (unifiedTMSClient.request as jest.Mock).mockResolvedValue([mockSubscription]);

    const result = await tool!.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.output.formatted).toBe('Found 1 assessment(s):\nTMP: Completed (100% complete)');
  });
});