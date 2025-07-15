# Suggested Response Options for OnboardingAgent

## Overview

This feature adds intelligent response suggestions to help users answer open-ended questions during onboarding. When users struggle with questions about challenges, goals, or metrics, the system can present clickable options to guide their responses.

## Problem Statement

Users often respond with:
- "dunno"
- "not sure"
- "I don't know"
- "umm"
- "maybe"

This happens especially with abstract questions like:
- "What challenges are you facing?"
- "How will you measure success?"
- "What are your leadership goals?"

## Solution Design

### 1. Extraction Rule Enhancement

Add `suggestedOptions` field to extraction rules:

```javascript
{
  "primary_challenge": {
    "type": "string",
    "description": "Main team challenge",
    "required": true,
    "preferLLM": true,
    "suggestedOptions": [
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
    "helpText": "Think about what keeps you up at night about your team"
  }
}
```

### 2. Agent Response Enhancement

When detecting uncertainty, the agent should:

```typescript
// Detect uncertainty patterns
const uncertaintyPatterns = [
  /\b(dunno|don't know|not sure|unsure|maybe|umm+|idk)\b/i,
  /\b(no idea|no clue|hard to say|difficult to)\b/i,
  /\b(need to think|let me think|good question)\b/i
];

// If uncertainty detected, include suggestions in response
if (detectsUncertainty(message) && field.suggestedOptions) {
  response.suggestedOptions = {
    field: fieldName,
    options: field.suggestedOptions,
    helpText: field.helpText,
    multiSelect: field.type === 'array'
  };
}
```

### 3. UI Component Design

Create a `SuggestedOptions` component:

```typescript
interface SuggestedOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  multiSelect?: boolean;
  helpText?: string;
}

export function SuggestedOptions({ options, onSelect, multiSelect, helpText }: SuggestedOptionsProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      {helpText && (
        <p className="text-sm text-gray-600 mb-3">{helpText}</p>
      )}
      <p className="text-sm font-medium mb-2">
        {multiSelect ? "Select all that apply:" : "Choose an option:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 4. Field-Specific Suggestions

#### Primary Challenge
```javascript
suggestedOptions: [
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
]
```

#### Success Metrics
```javascript
suggestedOptions: [
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
]
```

#### Budget Range
```javascript
suggestedOptions: [
  "Under $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "Over $100,000",
  "Need to determine budget",
  "Budget flexible based on value",
  "No specific budget allocated yet"
]
```

#### Timeline Preference
```javascript
suggestedOptions: [
  "ASAP - Urgent need",
  "Within 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Next fiscal year",
  "No specific timeline",
  "Flexible based on approach"
]
```

### 5. Implementation Steps

1. **Update Extraction Rules Schema**
   - Add `suggestedOptions?: string[]` field
   - Add `helpText?: string` field
   - Add `showSuggestionsOn?: string[]` (trigger patterns)

2. **Enhance OnboardingAgent**
   - Detect uncertainty in user messages
   - Include suggestions in response metadata
   - Provide contextual help based on field

3. **Update Chat UI**
   - Create SuggestedOptions component
   - Display when suggestions are provided
   - Handle option selection and resubmission

4. **Track Usage**
   - Log which suggestions are selected
   - Monitor uncertainty patterns
   - Refine options based on usage

### 6. Agent Conversation Flow

```typescript
// Example conversation with suggestions
User: "What challenges are you facing?"
User: "umm not really sure"

Agent: "That's perfectly fine! Many managers face similar challenges. 
Here are some common areas where teams often need support. 
Do any of these resonate with you?"

[Show suggested options]

User: [Clicks "Communication and collaboration issues"]

Agent: "Communication challenges are very common, especially in 
today's work environment. Can you tell me a bit more about 
how this shows up in your team?"
```

### 7. Benefits

1. **Reduced Friction**: Users don't get stuck on difficult questions
2. **Better Data Quality**: More specific, actionable responses
3. **Improved Completion Rates**: Fewer abandoned conversations
4. **Educational**: Helps users understand what to look for
5. **Confidence Building**: Validates that their challenges are common

### 8. Future Enhancements

1. **Smart Suggestions**: Use context to pre-filter options
2. **Learning System**: Track most selected options and reorder
3. **Custom Options**: Allow saving of custom responses
4. **Multi-language**: Translate suggestions for global teams
5. **Integration**: Link suggestions to specific TMS solutions

## Conclusion

This feature significantly improves the onboarding experience by providing guidance when users need it most, while maintaining the conversational and personalized feel of the agent interaction.