# User Journey Flows

## 1. Complete Assessment Journey

```mermaid
sequenceDiagram
    participant U as User
    participant UI as TeamOS UI
    participant Clerk as Clerk Auth
    participant API as TeamOS API
    participant OA as Orchestrator Agent
    participant AA as Assessment Agent
    participant TMS as TMS Global API
    participant DB as Supabase
    participant AI as OpenAI
    participant DA as Debrief Agent
    
    Note over U,DA: Phase 1: Authentication & Onboarding
    U->>UI: Visit TeamOS
    UI->>Clerk: Check Auth Status
    alt Not Authenticated
        Clerk->>U: Show Login/Signup
        U->>Clerk: Create Account
        Clerk->>API: User Created Webhook
        API->>TMS: Create TMS User<br/>(Token Exchange)
        API->>DB: Store User Mapping
    end
    Clerk->>UI: Authenticated
    
    Note over U,DA: Phase 2: Assessment Selection
    U->>UI: Open Dashboard
    UI->>API: Get User Journey Status
    API->>DB: Query Journey Phase
    DB->>API: Phase: ONBOARDING
    API->>OA: Get Recommendations
    OA->>TMS: Get Available Assessments
    OA->>U: "Welcome! I recommend starting with TMP..."
    
    U->>OA: "Start TMP Assessment"
    OA->>TMS: Create Subscription
    TMS->>OA: Subscription ID: sub_123
    OA->>DB: Update Journey Phase<br/>to ASSESSMENT
    OA->>AA: Hand off to Assessment Agent
    
    Note over U,DA: Phase 3: Assessment Completion
    loop For Each Page
        AA->>TMS: Get Page Questions
        TMS->>AA: Questions Data
        AA->>U: Present Questions<br/>(Text or Voice)
        U->>AA: Provide Answers
        AA->>TMS: Submit Answers
        AA->>DB: Track Progress
    end
    
    AA->>TMS: Complete Assessment
    TMS->>AA: Trigger Report Generation
    AA->>DB: Update Journey Phase<br/>to DEBRIEF
    AA->>U: "Assessment complete! Generating report..."
    
    Note over U,DA: Phase 4: Report Processing
    API->>TMS: Get HTML Report
    TMS->>API: HTML + Images
    API->>AI: Process Images<br/>(GPT-4 Vision)
    API->>API: Parse & Chunk Report
    API->>AI: Generate Embeddings
    API->>DB: Store Report Chunks<br/>& Embeddings
    API->>U: "Report Ready!"
    
    Note over U,DA: Phase 5: Debrief
    U->>UI: View Report
    UI->>DA: Initialize Debrief Agent
    DA->>DB: Load Report Context
    DA->>U: "Here's your TMP report showing<br/>you're an Upholder Maintainer..."
    
    U->>DA: "What does this mean?"
    DA->>DB: Vector Search<br/>Relevant Chunks
    DA->>AI: Generate Answer
    DA->>U: Detailed Explanation
    
    Note over U,DA: Journey Complete - User can explore report, ask questions, or take another assessment
```

## 2. Voice Assessment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as TeamOS UI
    participant VP as Voice Plugin
    participant RT as OpenAI Realtime
    participant AA as Assessment Agent
    participant TMS as TMS Global
    
    U->>UI: Click Microphone Icon
    UI->>VP: Initialize Voice Mode
    VP->>RT: Create WebSocket Connection
    RT->>VP: Connection Established
    
    VP->>VP: Check Context<br/>(Assessment vs Debrief)
    VP->>RT: Send Instructions<br/>"You are conducting TMP assessment..."
    
    U->>VP: "Hello, I'm ready to start"
    VP->>RT: Stream Audio
    RT->>RT: Speech Recognition
    RT->>AA: "User ready to start"
    
    AA->>TMS: Get First Question
    TMS->>AA: Question Data
    AA->>RT: "Let's begin. For the first question..."
    RT->>RT: Text to Speech
    RT->>VP: Stream Audio Response
    VP->>U: Play Audio
    
    loop Voice Q&A
        U->>VP: Speaks Answer
        VP->>RT: Stream Audio
        RT->>AA: Transcribed Answer
        AA->>AA: Validate Answer
        alt Valid Answer
            AA->>TMS: Submit Answer
            AA->>RT: "Thank you. Next question..."
        else Invalid Answer
            AA->>RT: "Please distribute exactly 10 points..."
        end
        RT->>VP: Audio Response
        VP->>U: Play Audio
    end
    
    AA->>RT: "Assessment complete!"
    U->>VP: End Voice Session
    VP->>RT: Close Connection
```

## 3. Report Generation Pipeline

```mermaid
graph TB
    subgraph "Input"
        Assessment[Completed Assessment<br/>Subscription ID]
    end
    
    subgraph "TMS Processing"
        Gen[Generate HTML Report]
        Template[Apply Template<br/>TMP/QO2/TS]
        Charts[Generate Charts<br/>PNG Images]
    end
    
    subgraph "TeamOS Processing"
        Parse[Parse HTML<br/>Extract Structure]
        Vision[GPT-4 Vision<br/>Process Charts]
        Chunk[Split into Sections<br/>Semantic Chunks]
        Embed[Generate Embeddings<br/>OpenAI API]
    end
    
    subgraph "Storage"
        Meta[(Store Metadata<br/>user_reports)]
        Chunks[(Store Chunks<br/>report_chunks)]
        Vectors[(Store Vectors<br/>pgvector)]
        Images[(Store Images<br/>Supabase Storage)]
    end
    
    subgraph "Output"
        Ready[Report Ready<br/>for Debrief]
    end
    
    Assessment --> Gen
    Gen --> Template
    Template --> Charts
    Charts --> Parse
    Parse --> Vision
    Parse --> Chunk
    Vision --> Chunk
    Chunk --> Embed
    
    Chunk --> Chunks
    Embed --> Vectors
    Parse --> Meta
    Charts --> Images
    
    Meta --> Ready
    Chunks --> Ready
    Vectors --> Ready
    Images --> Ready
```

## 4. Multi-User Organization Flow

```mermaid
graph LR
    subgraph "Organization Setup"
        Admin[Admin User] --> Create[Create Organization]
        Create --> Invite[Invite Team Members]
    end
    
    subgraph "Team Members"
        M1[Member 1] --> Accept1[Accept Invite]
        M2[Member 2] --> Accept2[Accept Invite]
        M3[Member 3] --> Accept3[Accept Invite]
    end
    
    subgraph "Assessment Assignment"
        Admin2[Admin] --> Assign[Assign TMP to Team]
        Assign --> N1[Notify Member 1]
        Assign --> N2[Notify Member 2]
        Assign --> N3[Notify Member 3]
    end
    
    subgraph "Completion Tracking"
        Accept1 --> Complete1[Complete TMP]
        Accept2 --> Complete2[Complete TMP]
        Accept3 --> InProgress[In Progress]
    end
    
    subgraph "Team Analytics"
        Complete1 --> Analytics[Team Composition<br/>Dashboard]
        Complete2 --> Analytics
        Analytics --> Insights[Team Insights<br/>& Recommendations]
    end
    
    Admin2 --> Analytics
```

## 5. Error Recovery Flows

```mermaid
stateDiagram-v2
    [*] --> Normal: User Flow
    
    Normal --> AuthError: Auth Failure
    AuthError --> RefreshToken: Token Expired
    RefreshToken --> Normal: Success
    RefreshToken --> ReAuth: Refresh Failed
    ReAuth --> Normal: Re-login
    
    Normal --> TMSError: TMS API Error
    TMSError --> Retry: Automatic Retry
    Retry --> Normal: Success
    Retry --> Fallback: Max Retries
    Fallback --> ShowError: Display Error
    ShowError --> Normal: User Retry
    
    Normal --> NetworkError: Connection Lost
    NetworkError --> Queue: Queue Actions
    Queue --> Sync: Connection Restored
    Sync --> Normal: Sync Complete
    
    Normal --> [*]: Complete
```

## 6. Credit System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as TeamOS API
    participant DB as Supabase
    participant TMS as TMS Global
    participant Stripe as Stripe
    
    U->>API: Start Assessment
    API->>DB: Check Credits
    
    alt Sufficient Credits
        DB->>API: Credits: 500
        API->>TMS: Create Subscription
        API->>DB: Reserve Credits (-100)
        API->>U: Assessment Started
        
        Note over U,TMS: User Completes Assessment
        
        API->>DB: Confirm Credit Usage
        API->>DB: Update credits_ledger
    else Insufficient Credits
        DB->>API: Credits: 50
        API->>U: Insufficient Credits
        U->>API: Purchase Credits
        API->>Stripe: Create Checkout
        Stripe->>U: Payment Page
        U->>Stripe: Complete Payment
        Stripe->>API: Payment Webhook
        API->>DB: Add Credits (+1000)
        API->>U: Credits Added
        
        Note over U,API: Retry Assessment Start
    end
```

## Key Integration Points Summary

1. **Clerk ↔ TeamOS**: Handles all authentication
2. **TeamOS ↔ TMS**: API calls for assessments and reports  
3. **TeamOS ↔ Supabase**: All data persistence
4. **TeamOS ↔ OpenAI**: AI processing and embeddings
5. **TeamOS ↔ Stripe**: Payment processing
6. **TeamOS ↔ Vercel**: Hosting and edge functions

Each flow shows how data moves through the system and where each external service is utilized.