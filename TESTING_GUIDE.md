# OnboardingAgent Testing Guide

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Pages Available

#### API Connection Test
**URL:** http://localhost:3000/api-test
- Tests database connection (should show 48 documents)
- Tests OpenAI API key
- Tests vector database operations

#### TMS Knowledge Base Q&A
**URL:** http://localhost:3000/tms-qa
- Ask questions about TMS methodology
- Uses RAG to search 12,484 document chunks
- Provides answers with source citations

#### OnboardingAgent Chat
**URL:** http://localhost:3000/test-chat.html
- Interactive chat with the OnboardingAgent
- Extracts team information from natural language
- Shows real-time data extraction

#### Admin Dashboard (Mock)
**URL:** http://localhost:3000/admin-test
- Shows how admins would monitor conversations
- Displays mock conversation data

## 🔧 Configuration Requirements

### Environment Variables (.env)
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.vkgtigmrazhmsvmlsglb:PcShKCqEPCMGsHfp@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Clerk (for authentication - optional for testing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"
```

## 📊 What's Implemented

### OnboardingAgent Features
- 8 conversation states for guided onboarding
- Natural language information extraction
- Knowledge base integration
- Quality metrics and guardrails
- Handoff to Assessment Agent

### Knowledge Base
- 47 TMS documents loaded
- 12,484 searchable chunks
- Keyword-based search (vector similarity requires pgvector)
- RAG system for context-aware answers

## 🧪 Test Scenarios

### OnboardingAgent Test Flow
1. Visit http://localhost:3000/test-chat.html
2. Try these inputs:
   - "Hi, I'm Sarah Johnson"
   - "I manage a team of 15 people"
   - "Our main challenge is poor communication"
   - Watch the extracted data panel update

### TMS Q&A Test Questions
1. Visit http://localhost:3000/tms-qa
2. Try these questions:
   - "What is an outer wheel creator innovator?"
   - "How do you identify dysfunction in a team using TMS tools?"
   - "Explain the Team Signals methodology"
   - "What are the key components of the TMP assessment?"

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure Supabase is accessible
- Check if using correct pooler URL (port 5432, not 6543)
- Verify SSL mode is enabled

### OpenAI API Issues
- Verify API key is valid
- Check for rate limits
- Ensure GPT-4 access is enabled

### No Search Results
- Database contains data but keyword search may miss some queries
- Try broader search terms
- Vector similarity search would improve results (requires pgvector)

## 📝 Notes

- The system uses keyword search instead of vector similarity
- Mock data is available for testing without dependencies
- Authentication (Clerk) is optional for test pages
- All test pages work without sign-in