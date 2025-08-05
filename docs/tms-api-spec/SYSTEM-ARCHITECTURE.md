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

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant TeamOS
    participant Clerk
    participant TMS
    participant Supabase
    
    User->>TeamOS: Access Platform
    TeamOS->>Clerk: Check Authentication
    
    alt New User
        Clerk->>User: Show Sign Up
        User->>Clerk: Create Account
        Clerk->>TeamOS: Return User Info + JWT
        TeamOS->>TMS: Create TMS Account<br/>(via token exchange)
        TMS->>TeamOS: Return TMS User ID
        TeamOS->>Supabase: Store User Mapping<br/>(Clerk ID <-> TMS ID)
    else Existing User
        Clerk->>TeamOS: Return JWT
        TeamOS->>Supabase: Get User Mapping
        TeamOS->>TMS: Exchange for TMS Token
        TMS->>TeamOS: Return TMS JWT
    end
    
    TeamOS->>User: Grant Access
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

## 6. Report Generation Pipeline

```mermaid
sequenceDiagram
    participant User
    participant TeamOS
    participant TMS
    participant GPT4V as GPT-4 Vision
    participant Supabase
    participant Vector as Vector DB
    
    User->>TeamOS: Complete Assessment
    TeamOS->>TMS: Request Report Generation
    TMS->>TMS: Generate HTML Report
    TMS->>TeamOS: Return HTML + Images
    
    TeamOS->>TeamOS: Parse HTML Structure
    TeamOS->>GPT4V: Process Images<br/>(Extract Charts)
    GPT4V->>TeamOS: Structured Data
    
    TeamOS->>TeamOS: Split into Sections
    TeamOS->>TeamOS: Generate Embeddings
    
    par Store Report Data
        TeamOS->>Supabase: Store Report Metadata
        TeamOS->>Supabase: Store Report Chunks
        TeamOS->>Vector: Store Embeddings
        TeamOS->>Supabase: Store Images
    end
    
    TeamOS->>User: Report Ready
```

## 7. Real-time Voice Integration

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

## 8. Infrastructure Overview

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

### 1. **Clerk ↔ TMS Authentication**
- Clerk manages user authentication
- TMS token exchange for legacy API access
- User mapping stored in Supabase

### 2. **TeamOS ↔ TMS API**
- RESTful API communication
- JWT-based authentication
- Structured JSON responses (proposed)

### 3. **Supabase Integration**
- Primary database for TeamOS data
- Vector storage for semantic search
- Blob storage for images and reports

### 4. **OpenAI Integration**
- GPT-4 for agent intelligence
- Embeddings for semantic search
- Realtime API for voice interaction
- Vision API for chart extraction

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