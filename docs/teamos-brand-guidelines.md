# teamOS Brand Guidelines

## Brand Overview
teamOS is a team management and collaboration platform focused on understanding team dynamics through psychometric profiling and fostering better workplace relationships.

## Logo & Identity

### Logo
- **Primary Logo**: "teamOS" in lowercase letters
- **Logo Treatment**: Simple, modern wordmark
- **Icon**: Colorful geometric shape (appears to be overlapping circles or petals in multiple colors)

## Color Palette

### Primary Colors
- **Primary Background**: `#FFFFFF` (White)
- **Text Primary**: `#1A1A1A` (Near Black)
- **Text Secondary**: `#6B7280` (Gray)

### Accent Colors
Based on the team profile avatars and UI elements:
- **Green**: `#84CC16` (Lime Green) - Used for Creator Innovator profile
- **Orange**: `#FB923C` (Orange) - Team member avatars
- **Pink**: `#EC4899` (Pink) - Team member avatars
- **Purple**: `#8B5CF6` (Purple) - Team member avatars
- **Blue**: `#60A5FA` (Sky Blue) - Team member avatars
- **Yellow**: `#FCD34D` (Amber) - Team member avatars

### Gradient System
The app uses subtle gradient overlays on profile cards:
- Soft radial gradients from color to transparent
- Used for visual hierarchy and emphasis

### UI Colors
- **Border Color**: `#E5E7EB` (Light Gray)
- **Card Background**: `#FFFFFF` with subtle shadows
- **Button Primary**: `#18181B` (Near Black)
- **Button Secondary**: `#F3F4F6` (Light Gray Background)

## Typography

### Font Family
- **Primary Font**: System UI font stack (likely San Francisco on iOS/Mac, Segoe UI on Windows)
- **Font Weights**:
  - Regular (400) - Body text
  - Medium (500) - Subtitles, labels
  - Semibold (600) - Section headers
  - Bold (700) - Primary headers

### Text Sizes
- **Hero Title**: 32px (e.g., "Team Dashboard")
- **Section Headers**: 24px
- **Card Titles**: 20px
- **Body Text**: 16px
- **Small Text**: 14px (labels, metadata)
- **Micro Text**: 12px (badges, credits)

## Layout & Spacing

### Grid System
- **Container Max Width**: 1200px
- **Sidebar Width**: 280px
- **Main Content Area**: Flexible with padding

### Spacing Scale
- **4px**: Micro spacing (between related elements)
- **8px**: Small spacing
- **16px**: Default spacing
- **24px**: Medium spacing
- **32px**: Large spacing
- **48px**: Extra large spacing

### Border Radius
- **Small**: 6px (buttons, badges)
- **Medium**: 12px (cards, containers)
- **Large**: 16px (modals, major containers)
- **Full**: 9999px (avatar circles, pills)

## Components

### Cards
- White background
- Subtle box shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Border: 1px solid `#E5E7EB`
- Border radius: 12px
- Padding: 24px

### Buttons
**Primary Button**
- Background: `#18181B`
- Text: `#FFFFFF`
- Border radius: 6px
- Padding: 12px 24px
- Font weight: 500

**Secondary Button**
- Background: `#F3F4F6`
- Text: `#374151`
- Border: 1px solid `#E5E7EB`

### Navigation
- **Sidebar**: Light background with icon + text items
- **Active State**: Darker text color
- **Hover State**: Light gray background

### Avatars
- **Size**: 80px (large), 48px (medium), 32px (small)
- **Shape**: Perfect circle
- **Content**: Icon or initial on colored background
- **Colors**: Use accent color palette

### Badges & Pills
- **Credits Badge**: Pill shape with light background
- **Profile Type Badge**: Rounded rectangle with descriptive text

## Icons & Imagery

### Icon Style
- **Style**: Outline icons, 2px stroke weight
- **Size**: 20px default, 16px small, 24px large
- **Color**: Matches text color or uses accent colors

### Profile Icons
- Simple geometric shapes or symbols
- White on colored backgrounds
- Consistent stroke weight

## Interactive Elements

### Hover States
- Buttons: Slight darkening of background
- Cards: Subtle elevation increase
- Links: Underline or color change

### Focus States
- 2px outline offset
- Uses primary color for outline

### Transitions
- Duration: 200ms
- Easing: ease-in-out
- Properties: background-color, transform, box-shadow

## Voice & Tone

### Writing Style
- **Friendly and approachable**: "Hey Johanna and Nilay..."
- **Encouraging**: "Congratulations on completing your first profile!"
- **Informative**: Clear explanations of features and benefits
- **Action-oriented**: Clear CTAs like "Complete Your First Profile"

### Messaging Patterns
- Use of emojis for visual interest (💡)
- Personalized messages using user names
- Focus on team collaboration and growth
- Gamification elements (credits, badges)

## Data Visualization

### Team Pulse Chart
- Minimalist bar chart design
- Uses accent colors
- No gridlines for clean appearance
- Labels below bars

### Progress Indicators
- Horizontal progress bars
- Subtle gray background with colored fill
- Rounded ends

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Considerations
- Stack navigation vertically
- Full-width cards with reduced padding
- Simplified team member grid
- Hamburger menu for navigation

## Accessibility

### Color Contrast
- Ensure all text meets WCAG AA standards
- Primary text on white: 12.63:1 ratio
- Use sufficient contrast for colored elements

### Interactive Elements
- Minimum touch target: 44x44px
- Clear focus indicators
- Descriptive labels for all actions

## Implementation Notes

### CSS Variables
```css
:root {
  --color-primary: #18181B;
  --color-background: #FFFFFF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
  
  --color-green: #84CC16;
  --color-orange: #FB923C;
  --color-pink: #EC4899;
  --color-purple: #8B5CF6;
  --color-blue: #60A5FA;
  --color-yellow: #FCD34D;
  
  --radius-small: 6px;
  --radius-medium: 12px;
  --radius-large: 16px;
  --radius-full: 9999px;
  
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Component Library Recommendations
- Consider using Tailwind CSS for utility-first approach
- Radix UI for accessible components
- Framer Motion for animations
- React Icons for consistent iconography