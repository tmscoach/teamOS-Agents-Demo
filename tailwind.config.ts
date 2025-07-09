import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // teamOS Brand Colors
        'teams-primary': '#18181B',
        'teams-bg': '#FFFFFF',
        'teams-text': {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        },
        'teams-accent': {
          green: '#84CC16',
          orange: '#FB923C',
          pink: '#EC4899',
          purple: '#8B5CF6',
          blue: '#60A5FA',
          yellow: '#FCD34D',
        },
        'teams-ui': {
          border: '#E5E7EB',
          'button-secondary': '#F3F4F6',
          'hover-bg': '#F3F4F6',
          'sidebar-bg': '#F9FAFB',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // teamOS specific radii
        'teams-sm': '6px',
        'teams-md': '12px',
        'teams-lg': '16px',
        'teams-full': '9999px',
      },
      spacing: {
        // teamOS spacing scale
        'teams-xs': '4px',
        'teams-sm': '8px',
        'teams-md': '16px',
        'teams-lg': '24px',
        'teams-xl': '32px',
        'teams-2xl': '48px',
      },
      boxShadow: {
        // teamOS shadows
        'teams-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config