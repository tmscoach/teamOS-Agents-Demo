# Issue #137: Implement Figma design for expanded debrief chat window - Implementation Plan

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/137

## Overview
Implement the Figma design for the debrief agent's expanded chat interface with full-window expansion, "Osmos" branding, report summary, and suggested questions.

## Current State Analysis
Based on code review:
- **ExpandedChat.tsx**: Fixed 600px height, 432px width, "Chat with Oskar" title
- **ChatInterface.tsx**: Has access to `reportData` (ParsedReport) but doesn't use it for summary
- **ParsedReport**: Contains all needed data (profile, majorRole, scores, insights)
- **CollapsedChat.tsx**: Shows "Ask Oskar about your profile" placeholder
- No report summary generation utility exists
- No suggested questions component exists

## Implementation Tasks

### Task 1: Update ExpandedChat Layout and Styling
**File**: `/app/chat/debrief/components/ChatInterface/ExpandedChat.tsx`

Changes needed:
1. Change dimensions from fixed to responsive:
   - Height: from `600px` to `calc(100vh - 140px)`
   - Width: from `432px` to `min(600px, 40vw)` for responsive design
2. Change title from "Chat with Oskar" to "Osmos"
3. Add report summary section above messages
4. Add suggested questions section above input
5. Adjust positioning to ensure full right-side coverage

### Task 2: Create Report Summary Generator Utility
**New File**: `/src/lib/utils/report-summary.ts`

Purpose: Generate 3-line summaries from ParsedReport data
```typescript
export function generateReportSummary(report: ParsedReport): string[] {
  // Line 1: Name and major role
  // Line 2: Top work preferences (percentages)
  // Line 3: Key strength or insight
}
```

### Task 3: Create Suggested Questions Component
**New File**: `/app/chat/debrief/components/ChatInterface/SuggestedQuestions.tsx`

Features:
- Display 3-4 contextual questions based on report type
- Click handler to populate input field
- Questions tailored to TMP, QO2, or TeamSignals reports

### Task 4: Update ExpandedChat Component Integration
Integrate the new components:
1. Import and use report summary generator
2. Add SuggestedQuestions component
3. Pass report data to both new features
4. Handle question click to populate input

### Task 5: Update Welcome Experience
Modify the initial expanded state to:
1. Show report summary immediately
2. Display suggested questions
3. Remove generic placeholder behavior
4. Make interface immediately actionable

### Task 6: Enhance Responsive Design
Ensure proper behavior on:
- Desktop: Full right-side expansion
- Tablet: Adjusted proportions
- Mobile: Overlay mode with proper touch interactions

## Detailed Implementation Steps

### Step 1: Create Report Summary Utility
```typescript
// /src/lib/utils/report-summary.ts
import { ParsedReport } from './report-parser';

export function generateReportSummary(report: ParsedReport | undefined): string[] {
  if (!report) {
    return [
      'Loading your assessment report...',
      'Preparing personalized insights...',
      'Chat with Osmos for deeper understanding'
    ];
  }

  const lines: string[] = [];
  
  // Line 1: Name and major role
  const name = report.profile.name || 'Your Profile';
  const majorRole = report.profile.majorRole || report.profile.tagline || '';
  lines.push(`${name} - ${majorRole}`);
  
  // Line 2: Top work preferences (for TMP) or key metrics
  if (report.type === 'TMP' && report.scores) {
    const topScores = Object.entries(report.scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => `${key} (${Math.round(value)}%)`)
      .join(', ');
    lines.push(`Top preferences: ${topScores}`);
  } else {
    lines.push(report.subtitle || 'Comprehensive assessment completed');
  }
  
  // Line 3: Key strength or first insight
  if (report.insights && report.insights.length > 0) {
    lines.push(report.insights[0]);
  } else {
    lines.push(report.profile.description?.split('.')[0] + '.' || 'Discover your unique strengths');
  }
  
  return lines;
}

export function generateSuggestedQuestions(report: ParsedReport | undefined): string[] {
  if (!report) {
    return [
      'What does my assessment reveal?',
      'How can I improve my performance?',
      'What are my key strengths?'
    ];
  }

  const questions: string[] = [];
  
  switch (report.type) {
    case 'TMP':
      questions.push(
        `What does my ${report.profile.name} role mean?`,
        'How can I work better with different role types?',
        'What are my key strengths according to this profile?',
        'How do I compare to other team members?'
      );
      break;
      
    case 'QO2':
      questions.push(
        'What leadership style does my QO² reveal?',
        'How can I improve my operational effectiveness?',
        'What are my blind spots as a leader?',
        'How should I structure my team for success?'
      );
      break;
      
    case 'TeamSignals':
      questions.push(
        'What are our team\'s key dynamics?',
        'Where are our collaboration gaps?',
        'How can we improve team performance?',
        'What should we focus on next quarter?'
      );
      break;
  }
  
  return questions.slice(0, 4); // Return max 4 questions
}
```

### Step 2: Create Suggested Questions Component
```typescript
// /app/chat/debrief/components/ChatInterface/SuggestedQuestions.tsx
interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export default function SuggestedQuestions({ questions, onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Update ExpandedChat Component
Major changes to make:
1. Add reportData prop
2. Change dimensions and title
3. Add report summary section
4. Add suggested questions
5. Handle question clicks

### Step 4: Test Implementation
1. Load debrief interface with different report types
2. Verify full-height expansion
3. Check report summary accuracy
4. Test suggested questions functionality
5. Ensure responsive behavior

## Success Criteria
- [x] Chat expands to full right-side height
- [x] Shows "Osmos" title
- [x] Displays 3-line report summary
- [x] Shows 3-4 contextual suggested questions
- [x] Questions populate input when clicked
- [x] Maintains all existing chat functionality
- [x] Responsive on different screen sizes
- [x] No regression in current features

## Risk Mitigation
1. **Data Availability**: Handle cases where reportData is undefined
2. **Layout Breaking**: Test on various screen sizes
3. **Performance**: Memoize summary generation to avoid recalculation
4. **Accessibility**: Ensure keyboard navigation works for suggested questions

## Testing Plan
1. Unit tests for report-summary utility functions
2. Component tests for SuggestedQuestions
3. Integration test for question click → input population
4. Visual regression tests for layout changes
5. Manual testing across devices

## Rollback Plan
If issues arise, the changes can be reverted by:
1. Restoring original ExpandedChat dimensions
2. Removing new components
3. The chat functionality remains independent of these UI changes