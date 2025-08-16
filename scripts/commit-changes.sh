#!/bin/bash
# Stage the modified files
git add src/lib/agents/config/default-agent-configs.ts
git add src/lib/agents/extraction/extraction-processor.ts

# Create commit
git commit -m "fix: Address PR review comments

- Add missing TypeScript properties to AgentDefaultConfig interface
  - Added preferLLM and suggestedValues to extractionRules type
- Re-enable batch extraction feature
  - Single digit extraction issue has been resolved
  - Changed USE_BATCH_EXTRACTION from false to true

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push