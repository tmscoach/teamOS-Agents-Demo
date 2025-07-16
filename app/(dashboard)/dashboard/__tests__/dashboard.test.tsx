import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardPage from '../page'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn()
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    conversation: {
      findFirst: jest.fn()
    }
  }
}))

jest.mock('@/app/chat/components/icons/Oscar1', () => ({
  Oscar1: () => <div data-testid="oscar-icon">Oscar Icon</div>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Pencil: () => <div data-testid="pencil-icon">Pencil</div>,
  Book: () => <div data-testid="book-icon">Book</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Focus: () => <div data-testid="focus-icon">Focus</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Coins: () => <div data-testid="coins-icon">Coins</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  User: () => <div data-testid="user-icon">User</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>
}))

describe('DashboardPage', () => {
  const mockClerkUser = {
    id: 'clerk_123',
    firstName: 'John',
    emailAddresses: [{ emailAddress: 'john@example.com' }]
  }

  const mockUser = {
    id: 'user_123',
    clerkId: 'clerk_123',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'MANAGER',
    journeyStatus: 'ACTIVE',
    journeyPhase: 'ASSESSMENT',
    currentAgent: 'AssessmentAgent',
    completedSteps: ['welcome', 'manager_team_context', 'manager_goals'],
    lastActivity: new Date(),
    onboardingData: {
      managerName: 'John',
      teamName: 'Engineering Team',
      teamSize: '5'
    },
    teamId: 'team_123',
    team: {
      name: 'Engineering Team',
      members: [
        { id: '1', name: 'Member 1', email: 'member1@test.com', role: 'TEAM_MEMBER' },
        { id: '2', name: 'Member 2', email: 'member2@test.com', role: 'TEAM_MEMBER' }
      ]
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(currentUser as jest.Mock).mockResolvedValue(mockClerkUser)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
  })

  it('redirects to sign-in if no clerk user', async () => {
    ;(currentUser as jest.Mock).mockResolvedValue(null)

    await DashboardPage()

    expect(redirect).toHaveBeenCalledWith('/sign-in')
  })

  it('redirects admin users to admin dashboard', async () => {
    const adminUser = { ...mockUser, role: 'ADMIN' }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(adminUser)

    await DashboardPage()

    expect(redirect).toHaveBeenCalledWith('/admin')
  })

  it('redirects users in onboarding phase to chat', async () => {
    const onboardingUser = { 
      ...mockUser, 
      journeyPhase: 'ONBOARDING',
      journeyStatus: 'ONBOARDING'
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(onboardingUser)
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({ id: 'conv_123' })

    await DashboardPage()

    expect(redirect).toHaveBeenCalledWith('/chat?agent=OnboardingAgent')
  })

  it('displays dashboard for users in assessment phase', async () => {
    const { container } = render(await DashboardPage())

    // Check main structure - use heading for title to avoid confusion with sidebar
    expect(screen.getByRole('heading', { name: 'Team Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Assessment Phase')).toBeInTheDocument()
    
    // Check user data from onboarding
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Manager')).toBeInTheDocument()
    expect(screen.getByText('Engineering Team')).toBeInTheDocument()
    
    // Check CTA button
    expect(screen.getByText('Complete Your First Profile')).toBeInTheDocument()
    const ctaLink = screen.getByText('Complete Your First Profile').closest('a')
    expect(ctaLink).toHaveAttribute('href', '/chat?agent=AssessmentAgent&assessment=tmp')
  })

  it('displays correct message for assessment phase', async () => {
    render(await DashboardPage())

    expect(screen.getByText('Complete your first profile to unlock team building')).toBeInTheDocument()
    expect(screen.getByText(/The Team Management Profile \(TMP\)/)).toBeInTheDocument()
  })

  it('shows sidebar navigation items', async () => {
    render(await DashboardPage())

    // Check for navigation items in the sidebar
    const sidebar = screen.getByRole('button', { name: /Team Dashboard/i }).closest('div')
    expect(sidebar).toBeInTheDocument()
    expect(screen.getByText('Craft Messages')).toBeInTheDocument()
    expect(screen.getByText('Learning Pathways')).toBeInTheDocument()
    // Settings appears twice (icon name and menu item), use getAllByText
    expect(screen.getAllByText('Settings')).toHaveLength(2)
  })

  it('displays credits and user avatar', async () => {
    render(await DashboardPage())

    expect(screen.getByText('5,000 Credits')).toBeInTheDocument()
    expect(screen.getByText('+5000 credits')).toBeInTheDocument()
  })

  it('shows team member placeholders', async () => {
    const { container } = render(await DashboardPage())

    // Should have 4 team member placeholder circles
    const teamMemberCircles = container.querySelectorAll('[class*="rounded-full"][class*="bg-"]')
    expect(teamMemberCircles.length).toBeGreaterThanOrEqual(4)
  })

  it('handles missing onboarding data gracefully', async () => {
    const userWithoutOnboarding = {
      ...mockUser,
      onboardingData: null,
      name: 'Jane Smith'
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutOnboarding)

    render(await DashboardPage())

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows different content for non-assessment phases', async () => {
    const continuousUser = {
      ...mockUser,
      journeyPhase: 'CONTINUOUS_ENGAGEMENT',
      journeyStatus: 'ACTIVE'
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(continuousUser)

    render(await DashboardPage())

    expect(screen.getByText('Welcome to your Team Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Complete Your First Profile')).not.toBeInTheDocument()
  })
})