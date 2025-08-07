# TeamOS System Architecture

## Overview

This document provides visual representations of how TeamOS integrates with various systems including TMS Global (legacy), Clerk (auth), Supabase (database), OpenAI (AI), and Vercel (hosting).

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js UI]
        Mobile[Mobile App<br/>Future]
    end
    
    subgraph "TeamOS Platform - Vercel"
        API[Next.js API Routes]
        Agents[AI Agents<br/>Orchestrator, Assessment, Debrief]
        UC[UnifiedChat Component]
        Voice[Voice Service<br/>Realtime API]
    end
    
    subgraph "Authentication"
        Clerk[Clerk Auth<br/>SSO, User Mgmt]
    end
    
    subgraph "Data Layer"
        Supabase[(Supabase<br/>PostgreSQL)]
        Vector[(Vector DB<br/>pgvector)]
        Storage[Supabase Storage<br/>Images, Reports]
    end
    
    subgraph "AI Services"
        OpenAI[OpenAI API<br/>GPT-4, Embeddings]
        Realtime[OpenAI Realtime<br/>Voice]
    end
    
    subgraph "Legacy System"
        TMS[TMS Global API<br/>Assessments, Reports]
        TMSDB[(TMS Database<br/>40+ years IP)]
    end
    
    subgraph "External Services"
        Stripe[Stripe<br/>Payments]
        Email[Email Service<br/>SendGrid/Resend]
    end
    
    %% Client connections
    UI --> API
    UI --> UC
    UI --> Voice
    Mobile -.-> API
    
    %% Auth flow
    API --> Clerk
    Clerk --> API
    
    %% Database connections
    API --> Supabase
    API --> Vector
    Agents --> Supabase
    Agents --> Vector
    
    %% AI connections
    Agents --> OpenAI
    UC --> OpenAI
    Voice --> Realtime
    
    %% Legacy connections
    API --> TMS
    Agents --> TMS
    TMS --> TMSDB
    
    %% Storage
    API --> Storage
    
    %% External
    API --> Stripe
    API --> Email
    
    %% Styling
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef platform fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef ai fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef legacy fill:#efebe9,stroke:#3e2723,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class UI,Mobile client
    class API,Agents,UC,Voice platform
    class Clerk auth
    class Supabase,Vector,Storage data
    class OpenAI,Realtime ai
    class TMS,TMSDB legacy
    class Stripe,Email external
```

## 2. Simple API Key Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant TeamOS as TeamOS Frontend
    participant Backend as TeamOS Backend
    participant TMS as TMS API
    
    Note over Backend,TMS: One-time: TeamOS receives API Key + Secret
    
    User->>TeamOS: Login with Clerk
    TeamOS->>Backend: User authenticated
    
    Backend->>Backend: Check token cache
    alt Token not cached or expired
        Backend->>TMS: POST /auth/token<br/>Headers: x-api-key, x-api-secret<br/>Body: {userId: "user@email.com"}
        TMS->>Backend: JWT Token (1 hour expiry)
        Backend->>Backend: Cache token
    end
    
    Backend->>TeamOS: Return TMS token
    
    Note over TeamOS,TMS: All API calls use JWT token
    TeamOS->>TMS: GET /assessments<br/>Authorization: Bearer {token}
    TMS->>TeamOS: Assessment data
```

## 3. Assessment Journey Flow

```mermaid
graph LR
    subgraph "1. Start Assessment"
        U1[User] --> O1[Orchestrator Agent]
        O1 --> TMS1[TMS: Create Subscription]
        TMS1 --> DB1[(Supabase: Track Journey)]
    end
    
    subgraph "2. Take Assessment"
        U2[User] --> AA[Assessment Agent]
        AA --> UC[UnifiedChat]
        UC --> Voice[Voice Plugin<br/>Optional]
        AA --> TMS2[TMS: Get Questions]
        AA --> TMS3[TMS: Submit Answers]
        Voice --> RT[OpenAI Realtime]
    end
    
    subgraph "3. Generate Report"
        Complete[Assessment Complete] --> TMS4[TMS: Generate Report]
        TMS4 --> Process[Process Report]
        Process --> Vision[GPT-4 Vision<br/>Extract Charts]
        Process --> Embed[Generate Embeddings]
        Process --> DB2[(Supabase: Store Chunks)]
        Process --> Vec[(Vector DB: Store Embeddings)]
    end
    
    subgraph "4. Debrief"
        U3[User] --> DA[Debrief Agent]
        DA --> DB3[(Get Report Chunks)]
        DA --> Vec2[(Semantic Search)]
        DA --> GPT[GPT-4: Answer Questions]
        DA --> KB[TMS Knowledge Base]
    end
    
    U1 -.-> U2
    Complete -.-> U3
```

## 4. Data Storage Architecture

```mermaid
graph TB
    subgraph "Supabase Database"
        Users[users table<br/>Clerk ID, metadata]
        Orgs[organizations table<br/>subscription info]
        Reports[user_reports table<br/>report metadata]
        Chunks[report_chunks table<br/>semantic sections]
        Journey[user_journey table<br/>phase tracking]
        Credits[credits_ledger table<br/>usage tracking]
    end
    
    subgraph "Vector Storage"
        Embeddings[report_embeddings<br/>pgvector]
        Knowledge[tms_knowledge<br/>IP embeddings]
    end
    
    subgraph "Blob Storage"
        Images[Report Images<br/>Charts, Graphs]
        PDFs[PDF Reports<br/>Full documents]
        Audio[Voice Recordings<br/>Future]
    end
    
    Reports --> Chunks
    Chunks --> Embeddings
    Reports --> Images
    Users --> Journey
    Users --> Credits
    Orgs --> Users
```

## 5. AI Agent Architecture

```mermaid
graph TD
    subgraph "Agent System"
        Router[Agent Router<br/>UnifiedChat]
        
        subgraph "Core Agents"
            Orch[Orchestrator Agent<br/>Journey Management]
            Assess[Assessment Agent<br/>Questionnaire Flow]
            Debrief[Debrief Agent<br/>Report Q&A]
        end
        
        subgraph "Agent Capabilities"
            Tools[Tool Registry]
            Memory[Conversation Memory]
            Context[Context Management]
        end
    end
    
    subgraph "AI Tools"
        TMSTools[TMS Tools<br/>- Get Subscriptions<br/>- Start Workflow<br/>- Submit Answers]
        KBTools[Knowledge Tools<br/>- Search TMS IP<br/>- Get Methodology]
        ReportTools[Report Tools<br/>- Search Chunks<br/>- Vector Search]
    end
    
    Router --> Orch
    Router --> Assess
    Router --> Debrief
    
    Orch --> Tools
    Assess --> Tools
    Debrief --> Tools
    
    Tools --> TMSTools
    Tools --> KBTools
    Tools --> ReportTools
    
    Tools --> Memory
    Tools --> Context
```

## 6. Report Processing & Vector Storage Pipeline

```mermaid
sequenceDiagram
    participant User
    participant TeamOS
    participant TMS as TMS Global API
    participant OpenAI
    participant Supabase
    participant Vector as pgvector
    participant Agent as Debrief Agent
    
    Note over User,Agent: Phase 1: Report Generation
    User->>TeamOS: Complete Assessment
    TeamOS->>TMS: GET /api/v2/reports/{subscriptionId}
    TMS->>TMS: Generate Report with:<br/>- Structured JSON sections<br/>- Embedded visualization data<br/>- Pre-computed vectorChunks
    TMS->>TeamOS: Return JSON Report<br/>(14 sections with text + viz data)
    
    Note over User,Agent: Phase 2: Vector Storage
    TeamOS->>TeamOS: Process each section
    loop For Each Section
        TeamOS->>OpenAI: Generate embedding<br/>from section.vectorChunk
        OpenAI->>TeamOS: Vector embedding
        TeamOS->>Supabase: Store section content
        TeamOS->>Vector: Store embedding with metadata
    end
    
    Note over User,Agent: Phase 3: Knowledge Base Integration
    TeamOS->>Vector: Store TMS IP embeddings<br/>(methodology, frameworks, research)
    TeamOS->>Supabase: Link report to user journey
    
    Note over User,Agent: Phase 4: AI-Powered Debrief
    User->>Agent: "Tell me about my TMP results"
    Agent->>Vector: Semantic search:<br/>1. User's report sections<br/>2. TMS IP knowledge base
    Vector->>Agent: Relevant chunks + context
    Agent->>OpenAI: Generate personalized insights
    Agent->>User: Voice/text debrief with:<br/>- Report interpretation<br/>- Methodology explanation<br/>- Actionable recommendations
```

## 7. Debrief Agent Architecture

```mermaid
graph TB
    subgraph "Debrief Agent System"
        User[User Query<br/>Voice or Text]
        
        subgraph "Context Sources"
            UserReport[User's Report<br/>14 TMP Sections]
            TMSIP[TMS IP Knowledge<br/>40+ Years Methodology]
            History[Conversation<br/>History]
        end
        
        subgraph "RAG Pipeline"
            Query[Query Processing]
            VectorSearch[Vector Search<br/>pgvector]
            Rerank[Result Reranking]
            Context[Context Assembly]
        end
        
        subgraph "Response Generation"
            LLM[GPT-4<br/>with Context]
            Voice[Voice Synthesis<br/>OpenAI Realtime]
            Text[Text Response]
        end
        
        User --> Query
        Query --> VectorSearch
        
        VectorSearch --> UserReport
        VectorSearch --> TMSIP
        VectorSearch --> History
        
        UserReport --> Rerank
        TMSIP --> Rerank
        History --> Rerank
        
        Rerank --> Context
        Context --> LLM
        
        LLM --> Voice
        LLM --> Text
        
        Voice --> User
        Text --> User
    end
    
    style User fill:#e1f5fe
    style UserReport fill:#fff3e0
    style TMSIP fill:#f3e5f5
    style LLM fill:#fce4ec
```

## 8. Real-time Voice Integration

```mermaid
graph LR
    subgraph "Voice Flow"
        User[User Speech] --> Mic[Microphone]
        Mic --> WS[WebSocket<br/>Connection]
        WS --> OAI[OpenAI Realtime API]
        OAI --> Trans[Transcription +<br/>Processing]
        Trans --> Agent[Active Agent<br/>Assessment/Debrief]
        Agent --> Response[Generate Response]
        Response --> TTS[Text-to-Speech]
        TTS --> Speaker[Audio Output]
    end
    
    Agent --> Tools[Agent Tools]
    Tools --> TMS[TMS API Calls]
    Tools --> DB[(Database Queries)]
```

## 9. Knowledge Base & Vector Storage Structure

```mermaid
graph TB
    subgraph "Knowledge Sources"
        subgraph "TMS IP Documents"
            Handbooks[Accreditation Handbooks<br/>HET, TMP, QO2, WoWV, LLP]
            Questionnaires[Questionnaire Content<br/>Team Signals, TMP, QO2]
            Reports[Example Reports<br/>Finished TMP/QO2 samples]
            Research[Research Manuals<br/>40+ years methodology]
        end
        
        subgraph "User Data"
            UserReports[User Reports<br/>Chunked by section]
            TeamReports[Team Reports<br/>Aggregated insights]
            OrgData[Organization Data<br/>Benchmarks, trends]
        end
    end
    
    subgraph "Vector Processing"
        Chunker[Document Chunker<br/>Semantic sections]
        Embedder[OpenAI Embeddings<br/>text-embedding-3-large]
        Metadata[Metadata Enrichment<br/>Source, type, context]
    end
    
    subgraph "Storage"
        Supabase[(Supabase<br/>Raw content)]
        pgvector[(pgvector<br/>Embeddings + metadata)]
    end
    
    Handbooks --> Chunker
    Questionnaires --> Chunker
    Reports --> Chunker
    Research --> Chunker
    UserReports --> Chunker
    
    Chunker --> Embedder
    Embedder --> Metadata
    
    Metadata --> Supabase
    Metadata --> pgvector
    
    style Handbooks fill:#f3e5f5
    style UserReports fill:#fff3e0
    style pgvector fill:#e8f5e9
```

## 10. Infrastructure Overview

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Vercel Edge Network"
            CF[Cloudflare CDN]
            Edge[Edge Functions]
            Server[Serverless Functions]
        end
        
        subgraph "Databases"
            PG[(PostgreSQL<br/>Supabase)]
            Redis[(Redis Cache<br/>Future)]
        end
        
        subgraph "Monitoring"
            Sentry[Sentry<br/>Error Tracking]
            Analytics[Vercel Analytics]
            Logs[Log Aggregation]
        end
    end
    
    subgraph "Development"
        Local[Local Dev<br/>Next.js]
        Preview[Preview Deploys<br/>PR Branches]
    end
    
    CF --> Edge
    Edge --> Server
    Server --> PG
    Server --> Redis
    
    Local --> Preview
    Preview --> CF
    
    Server --> Sentry
    Server --> Analytics
    Server --> Logs
```

## Key Integration Points

### 1. **Simple API Key Authentication**
- TeamOS uses API key + secret for TMS access
- Generate JWT tokens for users via TMS API
- No complex SSO or identity mapping needed

### 2. **TeamOS ↔ TMS API**
- RESTful API communication
- JWT-based authentication per user
- Structured JSON responses with embedded visualization data
- Pre-computed vectorChunks for AI processing

### 3. **Supabase & Vector Storage**
- Primary database for TeamOS data
- pgvector for semantic search (report chunks + TMS IP)
- Store report sections as individual records
- Blob storage for visualization images

### 4. **OpenAI Integration**
- GPT-4 for debrief agent intelligence
- text-embedding-3-large for vector embeddings
- Realtime API for voice debrief sessions
- NO Vision API needed (data comes structured from TMS)

### 5. **Vercel Hosting**
- Edge functions for API routes
- Serverless deployment
- Global CDN distribution

## Security Considerations

```mermaid
graph TD
    subgraph "Security Layers"
        Auth[Authentication<br/>Clerk JWT]
        AuthZ[Authorization<br/>Role-based]
        Encrypt[Encryption<br/>TLS/HTTPS]
        Secrets[Secrets Management<br/>Env Variables]
        Audit[Audit Logging<br/>All API Calls]
    end
    
    Auth --> AuthZ
    AuthZ --> Encrypt
    Encrypt --> Secrets
    Secrets --> Audit
```

## Technology Stack Rationale (Why Not .NET/Azure?)

### MVP Requirements (3-Month Timeline)
- **AI-first application** with voice interaction and RAG pipeline
- **Rapid iteration** with daily deployments for customer feedback
- **Modern UX** to demonstrate innovation beyond legacy system
- **Clean API boundary** to protect legacy system from MVP experiments

### Why Modern Stack (Next.js/TypeScript/Vercel) for MVP

| Factor | Modern Stack | Legacy .NET/Azure |
|--------|-------------|-------------------|
| **Time to Market** | 3 months achievable | 9-12 months realistic |
| **AI Ecosystem** | First-class OpenAI, vector DB, LangChain support | Limited AI tooling, secondary support |
| **Development Speed** | Hot reload, instant deploys, rich components | Slower iteration, complex deployments |
| **Developer Pool** | 10x more React developers available | Limited .NET specialists |
| **Cost** | ~$500/month (Vercel + Supabase) | ~$2000/month (Azure App Service + SQL) |
| **Risk Isolation** | Completely separate from legacy | Could impact production system |

### Strategic Benefits

1. **Forces Proper API Design** - Legacy system must expose clean APIs that benefit any future architecture
2. **Parallel Development** - Legacy team continues maintenance while innovation happens separately  
3. **Modern Skills Investment** - Team gains AI/RAG experience regardless of MVP outcome
4. **Customer Perception** - Modern UI demonstrates innovation vs "another enterprise app"
5. **Potential Future Path** - If successful, modern stack could become the platform going forward

### The Business Case

> "We're building the MVP on modern stack to achieve 3-month delivery of an AI-first application. This approach delivers 3-5x faster than extending the legacy system, provides access to cutting-edge AI tools, and protects the production system from experimental risk. The clean API boundary means the legacy system gains valuable APIs regardless of outcome. Success creates a modern platform for the future; failure means we've learned quickly without any impact to core operations."

### Post-MVP Options

1. **If Successful** → Modern stack becomes the new platform, legacy provides data APIs
2. **If Pivot Needed** → APIs built for MVP can be consumed by any technology
3. **If Failed** → No impact to legacy system, valuable learnings gained

## Scalability Design

- **Stateless Architecture**: All services are stateless
- **Horizontal Scaling**: Vercel automatically scales
- **Database Pooling**: Supabase connection pooling
- **Caching Strategy**: Edge caching for static content
- **Queue System**: Future implementation for heavy tasks

This architecture ensures:
1. **Separation of Concerns** - Each system handles its domain
2. **Scalability** - Can handle growth without major changes
3. **Security** - Multiple layers of protection
4. **Flexibility** - Easy to add new features or integrations
5. **Reliability** - Redundancy and error handling at each layer