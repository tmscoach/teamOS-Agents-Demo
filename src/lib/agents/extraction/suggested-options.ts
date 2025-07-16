/**
 * Suggested response options for OnboardingAgent fields
 * These help users who struggle with open-ended questions
 */

export interface FieldSuggestions {
  options: string[];
  helpText?: string;
  multiSelect?: boolean;
  showOnUncertainty?: boolean;
}

/**
 * Patterns that indicate user uncertainty
 */
export const UNCERTAINTY_PATTERNS = [
  /\b(dunno|don't\s+know|not\s+sure|unsure|maybe|umm+|uhh+|idk)\b/i,
  /\b(no\s+idea|no\s+clue|hard\s+to\s+say|difficult\s+to)\b/i,
  /\b(need\s+to\s+think|let\s+me\s+think|good\s+question)\b/i,
  /^(hmm+|err+|uh+)\.?$/i,
  /\?+$/  // Ends with question marks
];

/**
 * Check if a message indicates uncertainty
 */
export function detectsUncertainty(message: string): boolean {
  return UNCERTAINTY_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Suggested options for each field that commonly needs help
 */
export const FIELD_SUGGESTIONS: Record<string, FieldSuggestions> = {
  manager_role: {
    options: [
      "Engineering Manager",
      "Product Manager",
      "Sales Manager",
      "Marketing Manager",
      "Operations Manager",
      "HR Manager",
      "Finance Manager",
      "General Manager",
      "Team Lead",
      "Department Head",
      "Director",
      "VP/Vice President"
    ],
    helpText: "Select your role or enter a custom one"
  },
  user_role: {
    options: [
      "Engineering Manager",
      "Product Manager",
      "Sales Manager",
      "Marketing Manager",
      "Operations Manager",
      "HR Manager",
      "Finance Manager",
      "General Manager",
      "Team Lead",
      "Department Head",
      "Director",
      "VP/Vice President"
    ],
    helpText: "Select your role or enter a custom one"
  },
  primary_challenge: {
    options: [
      "Communication and collaboration issues",
      "Low team morale or engagement",
      "Unclear goals and priorities",
      "Performance and productivity concerns",
      "Conflict between team members",
      "Skill gaps and development needs",
      "Remote work coordination challenges",
      "High turnover or retention issues",
      "Innovation and creativity blocks",
      "Leadership and delegation challenges",
      "Other (please specify)",
      "Not sure - help me identify"
    ],
    helpText: "Think about what keeps you up at night about your team",
    showOnUncertainty: true
  },

  success_metrics: {
    options: [
      "Improved team satisfaction scores",
      "Reduced turnover rate",
      "Increased productivity metrics",
      "Better project delivery times",
      "Higher quality output",
      "Improved collaboration frequency",
      "Enhanced innovation metrics",
      "Better customer satisfaction",
      "Clearer goal achievement",
      "Reduced conflicts/issues",
      "Other measurable outcome",
      "Help me define metrics"
    ],
    helpText: "How will you know the transformation worked?",
    multiSelect: true,
    showOnUncertainty: true
  },

  budget_range: {
    options: [
      "Under $10,000",
      "$10,000 - $25,000",
      "$25,000 - $50,000",
      "$50,000 - $100,000",
      "Over $100,000",
      "Need to determine budget",
      "Budget flexible based on value",
      "No specific budget allocated yet"
    ],
    helpText: "Successful transformations typically range from $25,000 to $75,000",
    showOnUncertainty: true
  },

  timeline_preference: {
    options: [
      "ASAP - Urgent need",
      "Within 1 month",
      "1-3 months",
      "3-6 months",
      "6-12 months",
      "Next fiscal year",
      "No specific timeline",
      "Flexible based on approach"
    ],
    helpText: "Most transformations show initial results in 3-6 months",
    showOnUncertainty: true
  },

  team_distribution: {
    options: [
      "Fully remote",
      "Fully on-site",
      "Hybrid - mostly remote",
      "Hybrid - mostly on-site",
      "Hybrid - flexible",
      "Multiple office locations",
      "Mix of remote and on-site",
      "Varies by role"
    ],
    showOnUncertainty: true
  },

  leader_commitment: {
    options: [
      "Fully committed - top priority",
      "High commitment - significant time",
      "Moderate - balanced with other priorities",
      "Limited time available",
      "Delegating to team lead",
      "Need to assess availability",
      "Depends on program requirements"
    ],
    helpText: "Successful transformations typically need 3-5 hours/week from leadership",
    showOnUncertainty: true
  },

  leadership_goals: {
    options: [
      "Build trust and relationships",
      "Become better at spotting conflict",
      "Learn how to motivate each person",
      "Feel less overwhelmed in my role",
      "Improve delegation skills",
      "Enhance communication effectiveness",
      "Develop coaching abilities",
      "Create psychological safety",
      "Drive innovation and creativity",
      "Build high-performing culture"
    ],
    helpText: "What would make you feel more successful as a leader?",
    multiSelect: true,
    showOnUncertainty: true
  },

  urgency_level: {
    options: [
      "Critical - immediate action needed",
      "High - address within weeks",
      "Medium - address within months",
      "Low - long-term improvement",
      "Not urgent but important"
    ],
    showOnUncertainty: false // This field is usually clear
  },

  previous_initiatives: {
    options: [
      "Team building workshops",
      "Leadership training",
      "Agile/Scrum implementation",
      "Performance management systems",
      "Communication training",
      "Personality assessments (DISC, MBTI, etc.)",
      "360 feedback programs",
      "Coaching programs",
      "None - first transformation",
      "Other (please describe)"
    ],
    helpText: "What have you tried before to improve team dynamics?",
    multiSelect: true,
    showOnUncertainty: true
  }
};

/**
 * Get suggestions for a field if the user seems uncertain
 */
export function getSuggestionsForField(
  fieldName: string, 
  userMessage: string
): FieldSuggestions | null {
  const suggestions = FIELD_SUGGESTIONS[fieldName];
  
  if (!suggestions) {
    return null;
  }

  // If showOnUncertainty is false, don't show suggestions automatically
  if (suggestions.showOnUncertainty === false && !detectsUncertainty(userMessage)) {
    return null;
  }

  // For fields marked to show on uncertainty, check if user is uncertain
  if (suggestions.showOnUncertainty && detectsUncertainty(userMessage)) {
    return suggestions;
  }

  // Some fields might always show suggestions when asked
  // (future enhancement: could be configured per field)
  
  return null;
}

/**
 * Format suggested options for display in agent response
 */
export function formatSuggestionsForResponse(
  fieldName: string,
  suggestions: FieldSuggestions
): string {
  const intro = suggestions.multiSelect 
    ? "Here are some common options (you can select multiple):"
    : "Here are some common options:";
    
  const optionsList = suggestions.options
    .map((option, index) => `${index + 1}. ${option}`)
    .join('\n');
    
  const helpText = suggestions.helpText 
    ? `\n\n💡 ${suggestions.helpText}` 
    : '';
    
  return `${intro}\n\n${optionsList}${helpText}`;
}

/**
 * Generate a contextual response when user is uncertain
 */
export function generateUncertaintyResponse(fieldName: string): string {
  const responses: Record<string, string> = {
    primary_challenge: "That's perfectly fine! Many managers face similar challenges. Here are some common areas where teams often need support. Do any of these resonate with you?",
    
    success_metrics: "No worries! Defining success can be tricky. Here are some ways other managers measure transformation success. Which of these would be meaningful for your team?",
    
    budget_range: "That's okay! Budget planning can be complex. Here are typical investment ranges for team transformations. Where might your organization fit?",
    
    timeline_preference: "No problem! Let me help you think about timing. Here are common timelines based on different needs and constraints:",
    
    leadership_goals: "Great question! Sometimes it helps to see what other leaders focus on. Here are some common leadership development goals:",
    
    team_distribution: "Let me help clarify. Here are the common team structures we see:",
    
    leader_commitment: "That's understandable! Time commitment can vary. Here are typical involvement levels:"
  };

  return responses[fieldName] || "That's okay! Let me help you with some options:";
}