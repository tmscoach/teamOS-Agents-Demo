Role Definition: "You are an expert TMS (Team Management Systems) practitioner tasked with analyzing 40+ years of intellectual property to design an intelligent team transformation system.
Primary Objective: Conduct a comprehensive analysis of all TMS IP documents to discover and extract the methodology for transforming teams into high-performing units. Based on your findings, design a multi-agent system that can autonomously manage the entire transformation process.
Phase 1: Deep IP Analysis
Use ultra hard thinking to analyze all provided documents with no preconceptions:
1. /.documentation/Accreditation Handbooks (HET framework, TMP, QO2, WoWV, LLP)
2. /.documentation/Questionnaire Content (Team Signals, TMP, QO2, WoW, LLP)
3. /.documentation/Finished Report Examples (Team Signals - team member/manager versions, TMP, QO2, WoW, LLP)
4. /.documentation/Research Manuals (TMP, QO2, WoW, LLP)
Your Analysis Should Discover:
* What makes teams high-performing according to TMS research
* How the tools actually work and interconnect
* What questions determine which tools to use
* Optimal sequences and timelines found in the research
* Success patterns and failure patterns
* The theory and evidence behind interventions
* Best practices for implementation
* How to interpret and act on assessment results
Phase 2: System Design Based on Findings
After completing your analysis, design:
1. An Intelligent Multi-Agent System that reflects what you learned about:
    * How to onboard teams effectively
    * How to select and sequence tools
    * How to distribute questionnaires
    * How to analyze and debrief results
    * How to maintain engagement
    * How to deliver insights and learning
    * How to monitor progress
    * How to ensure transformation success
2. Agent Architecture Let the IP analysis determine:
    * How many agents are needed
    * What each agent should do
    * How agents should interact
    * When handoffs should occur
    * What triggers different interventions
    * How to maintain system coherence
3. You can take inspiration from project ../openai-cs-agents-demo for how they handle agent triage, guardrails and lang chain to keep the agent on track.  However the stack should be React, Nextjs, Tailwind, Shadcn, Lucide Icons, Sonner Toast Backend: Prisma, Supabase, Vercel, Stripe, Clerk Auth.
Critical Requirements:
* Base ALL design decisions on evidence from the IP documents
* Don't assume standard approaches - let the TMS methodology guide you
* Show clear traceability from IP findings to system design
* Ensure nothing requires the manager to track or remember tasks
Expected Outputs:
1. IP Analysis Report showing:
    * Key discoveries from each document type
    * The TMS methodology for team transformation
    * Evidence-based decision criteria
    * Unexpected insights or unique approaches
2. Agent System Design including:
    * Number and types of agents needed (as determined by your analysis)
    * Responsibilities of each agent (based on IP findings)
    * Interaction protocols (derived from best practices found)
    * Implementation approach (following TMS methodology)
3. Rationale Document explaining:
    * Why this agent architecture matches TMS principles
    * How the design ensures transformation success
    * Which IP sources support each design decision

Let the documents tell you what the system should be - don't impose a predetermined structure."
This approach ensures that the agent architecture and system design emerge from actual analysis of the TMS intellectual property rather than assumptions about what should exist.


Phase 3: Mock System Implementation
After completing the IP analysis and system design, build a functional mock system (with inspiration from../openai-cs-agents-demo) :
1. Database Architecture Create tables based on your IP findings, including at minimum:
* Users Table
    * User ID, Name, Email, Role (Manager/Team Member)
    * Team ID, Department
    * Profile data extracted from actual TMS assessments
    * Engagement metrics
    * Assessment completion status
* Teams Table
    * Team composition and structure
    * Team maturity indicators
    * Historical performance data
    * Current transformation program status
* Additional Tables (as determined by IP analysis)
    * Whatever the TMS methodology requires for tracking
2. Mock Data Requirements
* DO NOT invent any data
* Extract all mock data directly from IP documents:
    * Use actual question sets from assessments
    * Use real profile examples from finished reports
    * Use case study data from research manuals
    * Use timeline examples from accreditation handbooks
    * Anonymize any real names but preserve data patterns
3. Simulation Capabilities Build a system where:
* A real human can log in as a team manager
* They can "invite" mock team members (pre-populated from IP examples)
* The system runs through the entire transformation journey
* All agent interactions occur with realistic timing
* Progress can be accelerated for testing (e.g., compress 12 weeks to 12 days)
4. Agent Implementation
* Each agent identified in Phase 2 should be functional
* Agents should process mock data exactly as they would real data
* Agent decisions must follow IP-derived logic
* All content (nudges, insights, micro-learning) must come from IP documents
5. Communication Simulation Phase 1 (Current):
* Log all communications that would be sent
* Display in a communication dashboard
* Show: recipient, sender agent, timing, content, trigger reason
Phase 2 (After validation):
* Implement actual email sending via cron jobs
* SMS simulation capability
* In-app notification system
6. Validation Features
* Audit trail showing which IP document supports each system decision
* Side-by-side comparison of system behavior vs. IP recommendations
* Metrics dashboard showing transformation progress
* Manager view vs. team member view toggle
Critical Constraints:
* Every piece of content must be traceable to source IP
* No fictional scenarios - only combinations of real TMS data
* System must demonstrate the exact methodology found in documents
* Mock manager should experience the same journey a real manager would
Deliverable: A working mock system that:
1. Authentically represents TMS methodology
2. Uses only IP-derived data and logic
3. Allows realistic user testing
4. Proves the agent architecture works
5. Is ready for email integration in Phase 2
This ensures we can validate that the system truly reflects the TMS IP before moving to production implementation.