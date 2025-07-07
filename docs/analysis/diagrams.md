# TMS System Architecture Diagrams

This document contains visual representations of the Team Transformation System architecture using Mermaid diagrams.

## 1. High Energy Teams Framework

```mermaid
graph TB
    subgraph "High Energy Teams - 8 Fundamental Questions"
        Q1["1. Who are we?<br/>(Understanding differences)"]
        Q2["2. Where are we now?<br/>(Current state)"]
        Q3["3. Where are we going?<br/>(Vision & purpose)"]
        Q4["4. How will we get there?<br/>(Implementation)"]
        Q5["5. What is expected of us?<br/>(Role clarity)"]
        Q6["6. What support do we need?<br/>(Development)"]
        Q7["7. How effective are we?<br/>(Performance)"]
        Q8["8. What recognition do we get?<br/>(Motivation)"]
        
        Q1 --> Q2
        Q2 --> Q3
        Q3 --> Q4
        Q4 --> Q5
        Q5 --> Q6
        Q6 --> Q7
        Q7 --> Q8
        Q8 -.-> Q1
    end
    
    style Q1 fill:#e1f5fe
    style Q2 fill:#e1f5fe
    style Q3 fill:#c8e6c9
    style Q4 fill:#c8e6c9
    style Q5 fill:#fff9c4
    style Q6 fill:#fff9c4
    style Q7 fill:#ffccbc
    style Q8 fill:#ffccbc
```

## 2. TMS Assessment Tools Ecosystem

```mermaid
graph LR
    subgraph "Quick Assessment"
        TS[Team Signals<br/>32 items, 5 min<br/>Pulse check]
    end
    
    subgraph "Core Assessments"
        TMP[TMP<br/>Work Preferences<br/>RIDO Model]
        QO2[QO2<br/>Risk Orientation<br/>Opportunities vs Obstacles]
        WoWV[WoWV<br/>Work Values<br/>8 Value Types]
    end
    
    subgraph "Leadership Assessment"
        LLP[LLP|360<br/>13 Linking Skills<br/>Multi-rater]
    end
    
    TS --> TMP
    TS --> QO2
    TS --> WoWV
    
    TMP --> LLP
    QO2 --> LLP
    WoWV --> LLP
    
    style TS fill:#e3f2fd
    style TMP fill:#e8f5e9
    style QO2 fill:#fff3e0
    style WoWV fill:#fce4ec
    style LLP fill:#f3e5f5
```

## 3. Multi-Agent System Architecture

```mermaid
graph TB
    subgraph "Control Layer"
        O[Orchestrator Agent<br/>Manages transformation journey]
    end
    
    subgraph "Discovery & Setup"
        D[Discovery Agent<br/>Analyzes context]
        ON[Onboarding Agent<br/>Engages manager]
    end
    
    subgraph "Assessment & Alignment"
        A[Assessment Agent<br/>Deploys tools]
        AL[Alignment Agent<br/>Facilitates workshops]
    end
    
    subgraph "Continuous Engagement"
        L[Learning Agent<br/>Delivers content]
        N[Nudge Agent<br/>Sends insights]
    end
    
    subgraph "Monitoring & Recognition"
        P[Progress Monitor<br/>Tracks metrics]
        R[Recognition Agent<br/>Celebrates wins]
    end
    
    O --> D
    O --> ON
    D --> A
    ON --> A
    A --> AL
    AL --> L
    AL --> N
    L --> P
    N --> P
    P --> R
    R -.-> O
    
    style O fill:#e1bee7
    style D fill:#c5cae9
    style ON fill:#c5cae9
    style A fill:#b3e5fc
    style AL fill:#b3e5fc
    style L fill:#c8e6c9
    style N fill:#c8e6c9
    style P fill:#ffe082
    style R fill:#ffe082
```

## 4. Tool Selection Decision Tree

```mermaid
graph TD
    Start[Team Need Assessment] --> Q1{Quick health check needed?}
    Q1 -->|Yes| TS[Deploy Team Signals]
    Q1 -->|No| Q2{New team formation?}
    
    Q2 -->|Yes| NewTeam[TMP → WoWV → Purpose Statement]
    Q2 -->|No| Q3{Performance issues?}
    
    Q3 -->|Yes| Q4{What type?}
    Q3 -->|No| Q5{Leadership development?}
    
    Q4 -->|Communication| TMP2[Deploy TMP]
    Q4 -->|Conflict| WoWV2[Deploy WoWV]
    Q4 -->|Change resistance| QO2_2[Deploy QO2]
    
    Q5 -->|Yes| LLP2[Deploy LLP|360]
    Q5 -->|No| Full[Full transformation suite]
    
    style Start fill:#f9f9f9
    style TS fill:#e3f2fd
    style TMP2 fill:#e8f5e9
    style WoWV2 fill:#fce4ec
    style QO2_2 fill:#fff3e0
    style LLP2 fill:#f3e5f5
```

## 5. 16-Week Transformation Timeline

```mermaid
gantt
    title Team Transformation Program Timeline
    dateFormat YYYY-MM-DD
    section Phase 1: Discovery
    Team Signals Baseline    :2025-01-01, 7d
    TMP Assessments         :7d
    Team TMP Workshop       :7d
    WoWV Assessment        :7d
    
    section Phase 2: Alignment
    Purpose Statement      :2025-01-29, 7d
    Ground Rules Creation  :7d
    Work Allocation       :7d
    Communication Training :7d
    
    section Phase 3: Development
    QO2 Assessments       :2025-02-26, 7d
    Change Workshop       :7d
    Development Planning  :7d
    LLP|360 Leadership   :7d
    
    section Phase 4: Integration
    Linking Skills       :2025-03-26, 7d
    Effectiveness Review :7d
    Action Planning      :7d
    Team Signals Review  :7d
```

## 6. Agent Communication Flow

```mermaid
sequenceDiagram
    participant TM as Team Manager
    participant O as Orchestrator
    participant D as Discovery
    participant ON as Onboarding
    participant A as Assessment
    participant AL as Alignment
    participant L as Learning
    participant N as Nudge
    participant P as Progress
    participant R as Recognition
    
    TM->>O: Request transformation
    O->>D: Analyze team context
    O->>ON: Engage manager
    D->>O: Context report
    ON->>O: Goals established
    O->>A: Deploy assessments
    A->>AL: Share results
    AL->>L: Identify learning needs
    AL->>N: Configure nudges
    L->>P: Report progress
    N->>P: Track engagement
    P->>R: Trigger recognition
    R->>TM: Celebrate achievements
    P->>O: Status update
```

## 7. Workplace Behaviour Pyramid

```mermaid
graph TD
    subgraph "Workplace Behaviour Pyramid"
        P[Preferences<br/>Visible behaviors<br/>Measured by TMP]
        RO[Risk-Orientation<br/>Approach to opportunities/obstacles<br/>Measured by QO2]
        V[Values<br/>Core beliefs<br/>Measured by WoWV]
        
        V --> RO
        RO --> P
    end
    
    style P fill:#b3e5fc,stroke:#0277bd
    style RO fill:#ffcc80,stroke:#ef6c00
    style V fill:#a5d6a7,stroke:#2e7d32
```

## 8. Types of Work Wheel

```mermaid
graph LR
    subgraph "Types of Work Wheel"
        center((Linking))
        
        A[Advising]
        I[Innovating]
        P[Promoting]
        D[Developing]
        O[Organising]
        PR[Producing]
        IN[Inspecting]
        M[Maintaining]
        
        center --- A
        center --- I
        center --- P
        center --- D
        center --- O
        center --- PR
        center --- IN
        center --- M
        
        A -.-> I
        I -.-> P
        P -.-> D
        D -.-> O
        O -.-> PR
        PR -.-> IN
        IN -.-> M
        M -.-> A
    end
    
    style center fill:#ffd54f,stroke:#f57f17
```

## 9. Success Pattern Flow

```mermaid
graph LR
    subgraph "Success Pattern Implementation"
        VA[Values Alignment<br/>Week 1-4] --> TM[Task-Preference Match<br/>Week 5-8]
        TM --> PC[Pulse Checks<br/>Monthly]
        PC --> CI[Continuous Improvement<br/>Ongoing]
        
        LM[Leader Modeling] --> TE[Team Engagement]
        TE --> SD[Structured Debriefs]
        SD --> AP[Action Plans]
        AP --> FT[Follow Through]
        FT --> CR[Celebrate Results]
    end
    
    style VA fill:#c8e6c9
    style TM fill:#c8e6c9
    style PC fill:#c8e6c9
    style CI fill:#c8e6c9
    style LM fill:#b3e5fc
    style TE fill:#b3e5fc
    style SD fill:#b3e5fc
    style AP fill:#b3e5fc
    style FT fill:#b3e5fc
    style CR fill:#b3e5fc
```

## 10. Data Flow Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        TM1[Team Members]
        TL[Team Leaders]
        SM[Senior Management]
    end
    
    subgraph "Assessment Platform"
        AP[Assessment<br/>Engine]
        VE[Validation<br/>Engine]
    end
    
    subgraph "Data Layer"
        DS[(Central<br/>Data Store)]
        AE[Analytics<br/>Engine]
    end
    
    subgraph "Intelligence Layer"
        AB[Agent<br/>Brain]
        ML[Machine<br/>Learning]
    end
    
    subgraph "Action Layer"
        ACT[Action<br/>Engine]
        COM[Communication<br/>Engine]
    end
    
    subgraph "Output Layer"
        REP[Reports]
        INS[Insights]
        REC[Recommendations]
    end
    
    TM1 --> AP
    TL --> AP
    SM --> AP
    
    AP --> VE
    VE --> DS
    
    DS --> AE
    DS --> AB
    
    AE --> ML
    ML --> AB
    
    AB --> ACT
    ACT --> COM
    
    COM --> REP
    COM --> INS
    COM --> REC
    
    style DS fill:#ffe082
    style AB fill:#ce93d8
    style ML fill:#ce93d8
```

## Usage Notes

These diagrams can be rendered using any Mermaid-compatible viewer or integrated into documentation platforms that support Mermaid syntax. They provide visual representations of:

1. The conceptual framework (HET questions)
2. Tool relationships and dependencies
3. System architecture and agent interactions
4. Decision flows and timelines
5. Communication patterns
6. Core models from TMS methodology

Each diagram is designed to be self-contained and can be used independently in presentations or documentation.