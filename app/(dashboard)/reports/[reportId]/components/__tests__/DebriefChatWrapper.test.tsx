import React from 'react';
import { render, screen } from '@testing-library/react';
import { DebriefChatWrapper } from '../DebriefChatWrapper';

// Mock UnifiedChat component
jest.mock('@/src/components/unified-chat', () => ({
  UnifiedChat: ({ initialContext, proactiveMessage }: any) => (
    <div data-testid="unified-chat">
      <div data-testid="agent">{initialContext?.metadata?.agent}</div>
      <div data-testid="report-id">{initialContext?.metadata?.reportId}</div>
      <div data-testid="subscription-id">{initialContext?.metadata?.subscriptionId}</div>
      <div data-testid="is-debrief-mode">{String(initialContext?.metadata?.isDebriefMode)}</div>
      <div data-testid="auto-load-report">{String(proactiveMessage?.data?.autoLoadReport)}</div>
    </div>
  )
}));

describe('DebriefChatWrapper', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    journeyPhase: 'DEBRIEF' as const
  };

  const mockReport = {
    id: 'report-123',
    reportType: 'TMP',
    subscriptionId: 'sub-123',
    templateId: '6',
    rawHtml: '<p>Test Report</p>',
    metadata: { scores: { Introvert: 75 } },
    processingStatus: 'COMPLETED' as const,
    createdAt: new Date('2024-01-06')
  };

  it('renders UnifiedChat with correct debrief context', () => {
    render(<DebriefChatWrapper user={mockUser} report={mockReport} />);
    
    expect(screen.getByTestId('unified-chat')).toBeInTheDocument();
    expect(screen.getByTestId('agent')).toHaveTextContent('DebriefAgent');
    expect(screen.getByTestId('report-id')).toHaveTextContent('report-123');
    expect(screen.getByTestId('subscription-id')).toHaveTextContent('sub-123');
    expect(screen.getByTestId('is-debrief-mode')).toHaveTextContent('true');
  });

  it('includes autoLoadReport flag in proactive message', () => {
    render(<DebriefChatWrapper user={mockUser} report={mockReport} />);
    
    expect(screen.getByTestId('auto-load-report')).toHaveTextContent('true');
  });

  it('shows collapsed chat button by default', () => {
    render(<DebriefChatWrapper user={mockUser} report={mockReport} />);
    
    const collapsedButton = screen.getByText('Ask about your report');
    expect(collapsedButton).toBeInTheDocument();
  });

  it('includes report metadata in context', () => {
    render(<DebriefChatWrapper user={mockUser} report={mockReport} />);
    
    const unifiedChat = screen.getByTestId('unified-chat');
    expect(unifiedChat).toBeInTheDocument();
    
    // Verify report metadata is passed
    const reportId = screen.getByTestId('report-id');
    expect(reportId).toHaveTextContent(mockReport.id);
  });
});