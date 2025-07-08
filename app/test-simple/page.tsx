export default function SimpleTestPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">OnboardingAgent Test Instructions</h1>
      
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">How to Test the OnboardingAgent</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Current Setup Status:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>✅ OnboardingAgent implemented with 8 conversation states</li>
                <li>✅ Information extraction tools created</li>
                <li>✅ Admin dashboard for monitoring</li>
                <li>❌ Clerk authentication not configured (need API keys)</li>
                <li>❌ OpenAI API key not set (agent won't generate real responses)</li>
                <li>❌ Database not initialized</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">2. To Complete Setup:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Add to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:
                  <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_postgres_url`}
                  </pre>
                </li>
                <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm run db:push</code> to create database tables</li>
                <li>Restart the dev server</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold">3. Testing Flow:</h3>
              <div className="bg-blue-50 p-4 rounded">
                <p className="mb-2">Once configured, the conversation flow works like this:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>User signs in → System creates conversation → OnboardingAgent starts</li>
                  <li>Agent: "Welcome to TMS! I'm your onboarding guide..."</li>
                  <li>User: "Hi, I'm Sarah Johnson"</li>
                  <li>Agent extracts name, moves to Context Discovery state</li>
                  <li>User: "I manage a team of 15 people"</li>
                  <li>Agent extracts team size, asks about challenges</li>
                  <li>Continues through all 8 states...</li>
                  <li>Hands off to AssessmentAgent when complete</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">4. What You Can Test Now:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><a href="/test-onboarding" className="text-blue-600 hover:underline">Test UI at /test-onboarding</a> - Shows the chat interface (mock responses)</li>
                <li>Unit tests: <code className="bg-gray-100 px-2 py-1 rounded">npm test src/lib/agents/__tests__/onboarding-agent.test.ts</code></li>
                <li>Information extraction logic in <code className="bg-gray-100 px-2 py-1 rounded">src/lib/agents/tools/onboarding-tools.ts</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">5. Admin Dashboard:</h3>
              <p className="text-gray-700">Once auth is configured, visit <code className="bg-gray-100 px-2 py-1 rounded">/admin/conversations</code> to see:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Real-time conversation monitoring</li>
                <li>Captured variables display</li>
                <li>State transition timeline</li>
                <li>Quality metrics (rapport score, completion %)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Key Files Created</h2>
          <ul className="space-y-2 text-sm font-mono">
            <li>src/lib/agents/implementations/onboarding-agent.ts</li>
            <li>src/lib/agents/tools/onboarding-tools.ts</li>
            <li>src/lib/agents/guardrails/onboarding-guardrails.ts</li>
            <li>app/admin/conversations/page.tsx</li>
            <li>app/admin/conversations/[id]/page.tsx</li>
            <li>app/api/admin/conversations/route.ts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}