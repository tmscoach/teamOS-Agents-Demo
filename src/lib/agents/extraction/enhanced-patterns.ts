/**
 * Enhanced extraction patterns for improved coverage and accuracy
 * These patterns are designed to handle more edge cases and variations
 */

export interface EnhancedExtractionRule {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  patterns: string[];
  useLLMFallback?: boolean;
  examples?: string[];
  preprocessor?: (text: string) => string;
  postprocessor?: (value: any) => any;
  confidence?: {
    minScore?: number;
    boostPatterns?: string[];
  };
}

export const ENHANCED_EXTRACTION_PATTERNS: Record<string, EnhancedExtractionRule> = {
  // Personal Information
  manager_name: {
    type: 'string',
    description: 'Extract the manager or leader name',
    required: true,
    patterns: [
      // Handle titles and formal introductions
      "(?:I'm|I am|My name is|Call me)\\s+(?:Dr\\.|Prof\\.|Mr\\.|Ms\\.|Mrs\\.)?\\s*([A-Z][a-z]+(?:['-][A-Z][a-z]+)?(?:\\s+[A-Z][a-z]+(?:['-][A-Z][a-z]+)?)*)",
      // Handle "Hi, [Name] here" variations
      "^(?:Hi|Hello|Hey|Greetings),?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+(?:here|speaking)",
      // Handle "Good morning, I'm [Name]"
      "^Good (?:morning|afternoon|evening),?\\s*I'm\\s+([A-Z][a-z]+)",
      // Handle "This is [Name]"
      "^This is\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)",
      // Handle casual introductions
      "(?:call me|I go by|everyone calls me)\\s+([A-Z][a-z]+)",
      // Handle sign-offs
      "^(?:Best|Regards|Thanks|Sincerely|Cheers),?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)",
      // Handle "[Name] from [Company]"
      "^([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+(?:from|at|with)\\s+",
      // Handle possessive introductions
      "(?:It's|It is)\\s+([A-Z][a-z]+)(?:\\s*[,.])?",
      // Handle nickname patterns
      "(?:but\\s+)?(?:you can\\s+|please\\s+)?call me\\s+([A-Z][a-z]+)"
    ],
    useLLMFallback: true,
    examples: [
      "Hi, I'm Dr. Sarah Johnson",
      "This is Jean-Pierre Martin",
      "Hello, Mary-Anne O'Brien here",
      "My name is李明 (Li Ming)",
      "Call me Bob"
    ]
  },

  // Team Information
  team_size: {
    type: 'number',
    description: 'Extract the size of the team',
    required: true,
    patterns: [
      // Standard numeric patterns
      "(\\d+)\\s*(?:people|members|employees|staff|direct reports|folks|individuals|heads?|person|engineers?|developers?)",
      // Range patterns (will need special handling)
      "(\\d+)\\s*(?:to|-)\\s*(\\d+)\\s*(?:people|members|employees|staff)",
      // Approximate patterns
      "(?:about|approximately|roughly|around|nearly)\\s+(\\d+)\\s*(?:people|members|employees|staff)",
      // Descriptive patterns with numeric mapping
      "(?:a )?(?:dozen|handful|few|couple)\\s*(?:of)?\\s*(?:people|members|employees|staff)",
      // Department/team size
      "(?:team|department|group|division)\\s+of\\s+(\\d+)",
      // Managing X people
      "(?:manage|lead|oversee|supervise|responsible for)\\s+(\\d+)\\s*(?:people|members|employees|staff)",
      // X-person team
      "(\\d+)\\s*(?:-|\\s)?person\\s+(?:team|group|department)",
      // Just X (in context of team size question)
      "^(?:just |only |exactly )?\\s*(\\d+)\\s*$"
    ],
    useLLMFallback: true,
    examples: [
      "We have 25 people",
      "I manage a team of 10-15 members",
      "About a dozen folks",
      "Small team of 5",
      "12-person engineering team"
    ],
    postprocessor: (value: any) => {
      // Handle descriptive terms
      const descriptiveMap: Record<string, number> = {
        'couple': 2,
        'few': 3,
        'handful': 5,
        'dozen': 12
      };
      
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        for (const [term, num] of Object.entries(descriptiveMap)) {
          if (lower.includes(term)) {
            return num;
          }
        }
      }
      
      return parseInt(value, 10);
    }
  },

  team_tenure: {
    type: 'string',
    description: 'How long the manager has been with this team',
    patterns: [
      // Standard duration patterns
      "(\\d+(?:\\.\\d+)?)\\s*(?:years?|months?|weeks?|days?)\\s*(?:managing|leading|with|on|in)?",
      // Since/for patterns
      "(?:since|for)\\s+(?:the )?(?:past|last)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:years?|months?|weeks?)",
      // Descriptive durations
      "(?:just )?(?:started|beginning|new)\\s*(?:this|last)?\\s*(?:week|month|year)?",
      // X and a half
      "(\\d+)\\s+and\\s+a\\s+half\\s+(?:years?|months?)",
      // Relative time
      "(?:almost|nearly|about|approximately)\\s+(\\d+(?:\\.\\d+)?)\\s*(?:years?|months?|weeks?)",
      // Since specific time
      "since\\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s*(?:\\d{4})?",
      // Brand new
      "(?:brand )?new\\s+(?:to|in|at)\\s+(?:this|the)\\s+(?:role|position|team)"
    ],
    useLLMFallback: true,
    examples: [
      "3 years managing this team",
      "Just started last month",
      "Been here for 2 and a half years",
      "Since January 2023",
      "Brand new to this role"
    ]
  },

  // Organization Information
  company_name: {
    type: 'string',
    description: 'Extract the company or organization name',
    patterns: [
      // Work at/for patterns - more flexible
      "(?:work(?:ing)?|employed)\\s+(?:at|for|with)\\s+([A-Za-z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)",
      // From patterns
      "(?:from|with|represent(?:ing)?)\\s+([A-Za-z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)",
      // Company is patterns
      "(?:company|organization|org|firm|employer|business|startup|corporation|agency)\\s+(?:is|called|named|known as)?\\s*([A-Za-z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)",
      // At [Company] patterns
      "(?:at|for|with)\\s+(?:a\\s+)?(?:company|organization|org|firm|startup)?\\s*(?:called|named)?\\s*([A-Z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)",
      // [Name] from [Company]
      "[A-Za-z]+\\s+from\\s+([A-Z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)",
      // Part of/member of
      "(?:part of|member of|joined)\\s+([A-Z][A-Za-z0-9]*(?:[\\s\\-&.,'/](?:&\\s*)?[A-Za-z0-9]+)*)"
    ],
    useLLMFallback: true,
    examples: [
      "I work at Microsoft",
      "From Google LLC",
      "Representing Smith & Associates",
      "My company is bright green projects",
      "Part of the Acme Corporation family"
    ]
  },

  department: {
    type: 'string',
    description: 'Department or division within the organization',
    patterns: [
      // Department patterns
      "(?:in|from|lead|manage|head)\\s+(?:the\\s+)?([A-Za-z]+(?:\\s+[A-Za-z]+)*)\\s+(?:department|team|division|group|unit)",
      // Engineering/Sales/etc team
      "(?:on|in|with|lead)\\s+(?:the\\s+)?([A-Za-z]+(?:\\s+[A-Za-z]+)*)\\s+(?:side|team)",
      // Role-based inference
      "(?:head of|director of|manager of|lead for|vp of)\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)*)",
      // Work in X
      "work(?:ing)?\\s+in\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)*)(?:\\s+(?:department|division))?",
      // X department/division
      "([A-Za-z]+(?:\\s+[A-Za-z]+)*)\\s+(?:department|division|team|group)\\s*(?:manager|lead|head)?",
      // Function-based
      "(?:responsible for|oversee|manage)\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)*)\\s+(?:function|operations)?"
    ],
    useLLMFallback: true,
    examples: [
      "I lead the engineering department",
      "From product management",
      "Work in customer success",
      "Head of Digital Marketing",
      "On the sales side"
    ]
  },

  // Financial Information
  budget_range: {
    type: 'string',
    description: 'Budget or investment range for the initiative',
    patterns: [
      // Currency with amount
      "(?:\\$|€|£|¥)\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?)\\s*(?:k|K|m|M|thousand|million|mil)?",
      // Range patterns
      "(?:\\$|€|£)\\s*([0-9,]+)\\s*(?:to|-)\\s*(?:\\$|€|£)?\\s*([0-9,]+)\\s*(?:k|K|m|M)?",
      // Budget/funding patterns
      "(?:budget|funding|investment|spend)\\s*(?:of|is|around|approximately)?\\s*(?:\\$|€|£)?\\s*([0-9,]+(?:\\.[0-9]+)?)\\s*(?:k|K|m|M)?",
      // Descriptive budget
      "(?:low|mid|high)\\s+(?:five|six|seven)\\s+figures?",
      // Per period budget
      "([0-9,]+(?:\\.[0-9]+)?)\\s*(?:k|K|m|M)?\\s*(?:per|/)\\s*(?:year|annum|annually|month|quarter)",
      // No specific budget
      "(?:no|without|don't have)\\s+(?:specific|set|fixed)?\\s*budget",
      // TBD/flexible
      "budget\\s+(?:is\\s+)?(?:tbd|flexible|open|negotiable|to be determined)"
    ],
    useLLMFallback: true,
    examples: [
      "$50,000 budget",
      "€25k-50k range",
      "Low six figures",
      "100k per year",
      "Budget is TBD"
    ]
  },

  // Timeline Information
  timeline_preference: {
    type: 'string',
    description: 'Preferred timeline for seeing results',
    patterns: [
      // Standard duration
      "(\\d+)\\s*(?:weeks?|months?|quarters?|years?)\\s*(?:timeline|timeframe)?",
      // Relative timeframes
      "(?:by|within)\\s+(?:the\\s+)?(?:end of|next|this)\\s+(?:week|month|quarter|year|Q[1-4])",
      // Specific months
      "(?:by|before|until|in)\\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s*(?:\\d{1,2},?\\s*)?(?:20\\d{2})?",
      // Seasonal references
      "(?:by|in|during)\\s+(?:spring|summer|fall|autumn|winter)\\s*(?:20\\d{2})?",
      // ASAP patterns
      "(?:asap|immediately|urgent(?:ly)?|right away|as soon as possible|yesterday)",
      // Fiscal patterns
      "(Q[1-4]|FY)\\s*(?:20)?\\d{2}",
      // No rush
      "(?:no|not)\\s+(?:specific|particular|set)?\\s*(?:timeline|deadline|rush)",
      // Flexible timeline
      "(?:flexible|open|relaxed)\\s+(?:timeline|timeframe)"
    ],
    useLLMFallback: true,
    examples: [
      "3 months",
      "By end of Q2",
      "Before summer 2024",
      "ASAP",
      "No specific timeline"
    ]
  },

  // Challenge Information
  primary_challenge: {
    type: 'string',
    description: 'Main challenge or problem the team is facing',
    patterns: [
      // Challenge/problem patterns
      "(?:main|primary|biggest|key)?\\s*(?:challenge|problem|issue|struggle|difficulty|pain point)\\s+(?:is|are|we have|I have)\\s+(.+?)(?:\\.|$)",
      // Struggling with patterns
      "(?:struggling|dealing|faced?)\\s+with\\s+(.+?)(?:\\.|$)",
      // Need help with
      "(?:need|want|looking for)\\s+(?:help|assistance|support)\\s+(?:with|on|for)\\s+(.+?)(?:\\.|$)",
      // Trying to patterns
      "(?:trying|attempting|working)\\s+to\\s+(.+?)(?:\\.|$)",
      // Problem statement
      "(?:the\\s+)?(?:problem|issue)\\s+(?:is\\s+)?(?:that\\s+)?(.+?)(?:\\.|$)",
      // Can't/unable patterns
      "(?:can't|cannot|unable to|difficulty|trouble)\\s+(.+?)(?:\\.|$)",
      // Improvement needs
      "(?:need to|want to|have to)\\s+(?:improve|fix|solve|address)\\s+(.+?)(?:\\.|$)"
    ],
    useLLMFallback: true,
    examples: [
      "Main challenge is team communication",
      "Struggling with low morale",
      "Need help with productivity",
      "Can't seem to meet deadlines",
      "Want to improve collaboration"
    ]
  },

  // Success Metrics
  success_metrics: {
    type: 'string',
    description: 'How success will be measured',
    patterns: [
      // Success definition patterns
      "(?:success|win|victory)\\s+(?:would be|is|means|looks like)\\s+(.+?)(?:\\.|$)",
      // Goal/objective patterns
      "(?:goal|objective|aim|target)\\s+(?:is|are)\\s+(?:to\\s+)?(.+?)(?:\\.|$)",
      // Want to see patterns
      "(?:want|need|hope|expect)\\s+to\\s+(?:see|achieve|reach)\\s+(.+?)(?:\\.|$)",
      // Measure by patterns
      "(?:measure|track|monitor)\\s+(?:success\\s+)?(?:by|through|with)\\s+(.+?)(?:\\.|$)",
      // KPI patterns
      "(?:kpi|metric|indicator)s?\\s+(?:include|are|would be)\\s+(.+?)(?:\\.|$)",
      // Improvement patterns
      "(?:improve|increase|decrease|reduce|enhance)\\s+(.+?)\\s+(?:by|to)\\s+(?:\\d+%?)",
      // Looking for patterns
      "(?:looking for|seeking|aiming for)\\s+(.+?)(?:\\.|$)"
    ],
    useLLMFallback: true,
    examples: [
      "Success would be 20% improvement in productivity",
      "Goal is to reduce turnover",
      "Want to see better collaboration",
      "Measure by employee satisfaction scores",
      "Looking for higher engagement"
    ]
  },

  // Additional Context Fields
  urgency_level: {
    type: 'string',
    description: 'Urgency or priority level of the initiative',
    patterns: [
      // Urgency keywords
      "(?:very\\s+)?(?:urgent|critical|high priority|immediate|asap)",
      // Crisis language
      "(?:crisis|emergency|burning|on fire|falling apart)",
      // Priority levels
      "(?:top|high|medium|low)\\s+priority",
      // Time pressure
      "(?:under|lot of|significant)\\s+(?:pressure|stress|deadline)",
      // Relaxed timeline
      "(?:no|not)\\s+(?:rush|urgent|immediate)\\s*(?:need)?",
      // Important but not urgent
      "important\\s+but\\s+not\\s+urgent"
    ],
    useLLMFallback: false,
    examples: [
      "This is urgent",
      "High priority initiative",
      "No immediate rush",
      "Crisis mode",
      "Important but not urgent"
    ]
  },

  team_distribution: {
    type: 'string',
    description: 'How the team is distributed (remote, hybrid, on-site)',
    patterns: [
      // Remote patterns
      "(?:fully|completely|all|100%)?\\s*remote\\s*(?:team|work)?",
      // Hybrid patterns
      "hybrid\\s*(?:model|approach|team|work)?",
      // On-site/office patterns
      "(?:on-?site|in-?office|co-?located|in person)\\s*(?:team|work)?",
      // Distributed patterns
      "(?:distributed|spread|located)\\s+(?:across|in|over)\\s+(.+)",
      // Mixed patterns
      "(?:mix|combination)\\s+of\\s+(?:remote|office|on-?site)",
      // Percentage patterns
      "(\\d+)%?\\s+(?:remote|office|home)",
      // Days in office
      "(\\d+)\\s+days?\\s+(?:in\\s+)?(?:office|remote|home)"
    ],
    useLLMFallback: true,
    examples: [
      "Fully remote team",
      "Hybrid - 3 days office",
      "All on-site",
      "Distributed across 3 locations",
      "80% remote"
    ]
  },

  previous_initiatives: {
    type: 'string',
    description: 'Previous transformation or improvement initiatives',
    patterns: [
      // Previous experience patterns
      "(?:previously|before|in the past)\\s+(?:tried|attempted|did|implemented)\\s+(.+?)(?:\\.|$)",
      // Have tried patterns
      "(?:have|we've|I've)\\s+(?:already\\s+)?tried\\s+(.+?)(?:\\.|$)",
      // Experience with patterns
      "(?:experience|history)\\s+with\\s+(.+?)(?:\\.|$)",
      // Last time patterns
      "(?:last|previous)\\s+(?:time|year|quarter)\\s+(?:we|I)\\s+(.+?)(?:\\.|$)",
      // Worked/didn't work patterns
      "(.+?)\\s+(?:worked|didn't work|failed|succeeded)\\s+(?:well|poorly)?",
      // No previous experience
      "(?:no|haven't|never)\\s+(?:tried|done|attempted)\\s+(?:anything|this)\\s+(?:like this\\s+)?before"
    ],
    useLLMFallback: true,
    examples: [
      "Previously tried agile transformation",
      "We've already tried team building workshops",
      "Last year we implemented OKRs",
      "360 feedback didn't work well",
      "Never done anything like this before"
    ]
  },

  leader_commitment: {
    type: 'string',
    description: 'Leader commitment level and availability',
    patterns: [
      // Commitment level
      "(?:fully|very|highly|somewhat|not very)?\\s*committed",
      // Time availability
      "(?:can|could|will)\\s+(?:dedicate|commit|spend)\\s+(.+?)\\s+(?:hours?|time)",
      // Involvement level
      "(?:hands-on|hands-off|very involved|not very involved)",
      // Support patterns
      "(?:full|strong|limited|no)\\s+(?:support|buy-in)\\s+(?:from)?\\s*(?:leadership|management)?",
      // Readiness patterns
      "(?:ready|prepared|willing)\\s+to\\s+(.+?)(?:\\.|$)",
      // Skeptical patterns
      "(?:skeptical|unsure|hesitant|cautious)\\s+(?:about|of)?"
    ],
    useLLMFallback: true,
    examples: [
      "Fully committed",
      "Can dedicate 5 hours per week",
      "Very hands-on approach",
      "Strong support from leadership",
      "Ready to invest time and resources"
    ]
  }
};

/**
 * Helper function to get patterns for a specific field
 */
export function getEnhancedPatterns(fieldName: string): string[] {
  const rule = ENHANCED_EXTRACTION_PATTERNS[fieldName];
  return rule ? rule.patterns : [];
}

/**
 * Helper function to get all enhanced extraction rules
 */
export function getAllEnhancedRules(): Record<string, EnhancedExtractionRule> {
  return ENHANCED_EXTRACTION_PATTERNS;
}

/**
 * Convert enhanced rules to standard extraction rules format
 */
export function convertToStandardRules(enhancedRules: Record<string, EnhancedExtractionRule>): Record<string, any> {
  const standardRules: Record<string, any> = {};
  
  for (const [fieldName, rule] of Object.entries(enhancedRules)) {
    standardRules[fieldName] = {
      type: rule.type,
      description: rule.description,
      required: rule.required,
      patterns: rule.patterns,
      useLLMFallback: rule.useLLMFallback
    };
  }
  
  return standardRules;
}

/**
 * Get example inputs for testing a specific field
 */
export function getFieldExamples(fieldName: string): string[] {
  const rule = ENHANCED_EXTRACTION_PATTERNS[fieldName];
  return rule?.examples || [];
}