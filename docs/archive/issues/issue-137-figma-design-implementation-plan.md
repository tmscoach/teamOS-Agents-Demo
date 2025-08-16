# Issue #137: Implement Figma Design for Expanded Debrief Chat Window

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/137

## Figma Design Analysis

Based on the screenshot and Figma code analysis:

### Key Visual Elements in the Expanded Chat:

1. **Header Section**
   - Title: "Chat with OSmos" (with colorful OSmos logo)
   - Subtitle: "Your AI team dynamics coach"

2. **Profile Summary Box**
   - Icon with user avatar/icon
   - Title: "Your Profile: Creator-Innovator"
   - 3 bullet points summarizing key traits:
     - Excel at innovative solutions through deep analysis
     - Strong intellectual curiosity & big picture thinking
     - Ideal for advisory & strategic design roles

3. **Chat Messages Section**
   - Initial message from OSmos introducing itself
   - User message example
   - Shows timestamp (12:14 PM)

4. **Suggested Actions Section**
   - "3 highlights about me" button
   - "Areas I need support with" button
   - "How should others communicate with me?" button
   - "Show more suggestions" link

5. **Input Area**
   - Text input with placeholder "Ask about your profile..."
   - Send button

### Design Specifications:

- **Layout**: Full height right sidebar (not 600px fixed)
- **Width**: Appears to be ~400-450px
- **Background**: White with subtle gradient overlay (same as current)
- **Border**: Standard shadcn border styling
- **Shadow**: Card shadow for depth

## Implementation Plan

### 1. Create Report Summary Generator Utility
**File**: `/src/lib/utils/report-summary.ts`

```typescript
export interface ProfileSummary {
  title: string;
  role: string;
  bullets: string[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  question: string;
}

export function generateProfileSummary(report: ParsedReport | undefined): ProfileSummary {
  if (!report) {
    return {
      title: "Your Profile",
      role: "Loading...",
      bullets: [
        "Analyzing your assessment results",
        "Preparing personalized insights",
        "Chat with OSmos for deeper understanding"
      ]
    };
  }

  // Generate based on report type
  const role = report.profile.majorRole || report.profile.tagline || "Professional";
  const bullets: string[] = [];

  if (report.type === 'TMP') {
    // Extract key strengths and characteristics
    if (report.insights && report.insights.length >= 3) {
      bullets.push(...report.insights.slice(0, 3));
    } else {
      // Generate from profile description
      const description = report.profile.description || "";
      const sentences = description.split('. ').filter(s => s.length > 0);
      bullets.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
  }

  return {
    title: "Your Profile",
    role: role,
    bullets: bullets.slice(0, 3)
  };
}

export function generateSuggestedActions(report: ParsedReport | undefined): SuggestedAction[] {
  const baseActions: SuggestedAction[] = [
    {
      id: 'highlights',
      label: '3 highlights about me',
      question: 'What are my top 3 strengths and highlights from my profile?'
    },
    {
      id: 'support',
      label: 'Areas I need support with',
      question: 'What areas should I focus on for development based on my profile?'
    },
    {
      id: 'communication',
      label: 'How should others communicate with me?',
      question: 'What\'s the best way for others to communicate and work with me?'
    }
  ];

  if (!report) return baseActions;

  // Add report-specific actions
  if (report.type === 'TMP') {
    baseActions.push({
      id: 'role-meaning',
      label: `Understanding my ${report.profile.majorRole} role`,
      question: `What does it mean to be a ${report.profile.majorRole} and how can I leverage this?`
    });
  }

  return baseActions;
}
```

### 2. Create Suggested Actions Component
**File**: `/app/chat/debrief/components/ChatInterface/SuggestedActions.tsx`

```typescript
import { ChevronRight } from 'lucide-react';

interface SuggestedActionsProps {
  actions: Array<{
    id: string;
    label: string;
    question: string;
  }>;
  onActionClick: (question: string) => void;
  showMore?: boolean;
}

export default function SuggestedActions({ 
  actions, 
  onActionClick,
  showMore = true 
}: SuggestedActionsProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.question)}
          className="flex items-center justify-between w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
        >
          <span className="text-gray-700">{action.label}</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      ))}
      {showMore && (
        <button className="text-sm text-blue-600 hover:text-blue-700 mt-1">
          Show more suggestions
        </button>
      )}
    </div>
  );
}
```

### 3. Create Profile Summary Component
**File**: `/app/chat/debrief/components/ChatInterface/ProfileSummary.tsx`

```typescript
import { User } from 'lucide-react';

interface ProfileSummaryProps {
  title: string;
  role: string;
  bullets: string[];
}

export default function ProfileSummary({ title, role, bullets }: ProfileSummaryProps) {
  return (
    <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {title}: {role}
          </h3>
          <ul className="mt-2 space-y-1">
            {bullets.map((bullet, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### 4. Update ExpandedChat Component

Major changes needed:
1. Change title from "Chat with Oskar" to "Chat with OSmos"
2. Add subtitle "Your AI team dynamics coach"
3. Change dimensions to full height
4. Add profile summary section
5. Add suggested actions section
6. Update input placeholder to "Ask about your profile..."

### 5. Update ChatInterface to Pass Report Data

The ChatInterface already has reportData prop but doesn't pass it to ExpandedChat. Need to:
1. Pass reportData to ExpandedChat component
2. Generate profile summary and suggested actions
3. Handle action clicks to populate input

## Testing Checklist

- [ ] Chat expands to full right-side height (calc(100vh - 140px))
- [ ] Shows "Chat with OSmos" title with subtitle
- [ ] Displays profile summary with role and 3 bullets
- [ ] Shows 3-4 suggested action buttons
- [ ] Actions populate input when clicked
- [ ] Maintains all existing chat functionality
- [ ] Responsive on different screen sizes
- [ ] Works with TMP, QO2, and TeamSignals reports

## Risk Mitigation

1. **Data Availability**: Handle undefined reportData gracefully
2. **Layout Conflicts**: Test with existing report viewer
3. **Mobile Responsiveness**: Ensure overlay mode works properly
4. **Performance**: Memoize summary generation