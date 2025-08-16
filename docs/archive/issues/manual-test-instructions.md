# Manual Test Instructions for DebriefAgent Fixes

## Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/admin/agents/config`

## Test 1: Disable Report Access Check

1. Select "DebriefAgent" from the dropdown
2. Go to the "Guardrails" tab
3. Under "Content Moderation", you'll see:
   - "Enable report access check (verify user owns the report)" checkbox
   - Uncheck this box to disable the access check
4. Click "Save Configuration"
5. Test in Chat:
   - Click "Test in Chat"
   - Try: "load subscription id 21989"
   - It should now load the report without access errors

## Test 2: Test Knowledge Base Search

With the DebriefAgent still open in chat:
1. Ask: "What is ICAF?"
2. The agent should:
   - Use the `search_tms_knowledge` tool
   - Return results from the knowledge base
   - NOT say "I couldn't find information about ICAF"

## Test 3: Generate Report with Your User ID

If you want to test with proper ownership:

1. Go to `/admin/tms-api-test`
2. Instead of clicking "Seed", manually generate a report:
   - Use "tms_generate_html_report"
   - Enter your own subscription ID
   - Select assessment type (e.g., "TMP")
3. Then test debrief with that subscription ID

## Expected Results

✅ With report access check disabled:
- Can load any subscription ID without ownership errors
- Knowledge base searches return results
- Can ask questions about the loaded report

✅ With report access check enabled (default):
- Only reports you own can be loaded
- Attempts to load other users' reports are blocked

## Troubleshooting

If knowledge base search still doesn't work:
1. Check the console for errors
2. Verify the agent has `search_tms_knowledge` in its tools
3. Make sure the knowledge base documents are loaded in Supabase

The key fix was:
1. Added DebriefAgent to the chat route registration
2. Added UI controls to disable report access check for testing
3. Fixed import paths in guardrails