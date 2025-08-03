'use client';

import { UnifiedChat } from '@/src/components/unified-chat';

export default function TestUnifiedChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8">Test Unified Chat</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Orchestrator Agent</h2>
          <UnifiedChat
            agent="OrchestratorAgent"
            position="right-sidebar"
            defaultOpen={true}
            initialContext={{
              user: {
                id: 'test_user',
                name: 'Test User',
                hasCompletedTMP: false,
                credits: 0,
              },
              journey: {
                phase: 'ASSESSMENT' as any,
                completedSteps: [],
                nextMilestone: 'Complete TMP',
              },
            }}
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Assessment Agent</h2>
          <UnifiedChat
            agent="AssessmentAgent"
            position="right-sidebar"
            defaultOpen={true}
            initialContext={{
              user: {
                id: 'test_user',
                name: 'Test User',
                hasCompletedTMP: false,
                credits: 0,
              },
              journey: {
                phase: 'ASSESSMENT' as any,
                completedSteps: [],
                nextMilestone: 'Complete TMP',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}