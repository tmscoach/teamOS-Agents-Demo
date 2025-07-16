import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper'
import { redirect } from 'next/navigation'
import { getCurrentUserWithJourney } from '@/lib/auth/roles'
import { prisma } from '@/lib/db/prisma'
import { Bell, Users, Pencil, Book, Settings, Focus, Plus, Coins, ChevronDown, User, CheckCircle } from 'lucide-react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import Link from 'next/link'

export default async function DashboardPage() {
  const clerkUser = await currentUser()
  console.log('[Dashboard] Current user:', clerkUser ? { id: clerkUser.id, email: clerkUser.emailAddresses?.[0]?.emailAddress } : null)
  
  if (!clerkUser) {
    console.log('[Dashboard] No user found, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Get user with journey info including phase
  // For dev auth, use email to find user instead of clerkId
  const userQuery = clerkUser.emailAddresses?.[0]?.emailAddress 
    ? { email: clerkUser.emailAddresses[0].emailAddress }
    : { clerkId: clerkUser.id };
    
  console.log('[Dashboard] User query:', userQuery)
  
  const user = clerkUser ? await prisma.user.findUnique({
    where: userQuery,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      journeyStatus: true,
      journeyPhase: true,
      currentAgent: true,
      completedSteps: true,
      lastActivity: true,
      onboardingData: true,
      teamId: true,
      team: {
        select: {
          name: true,
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }
    }
  }).catch((error) => {
    // Database connection error - return null to handle gracefully
    console.error('[Dashboard] Database error:', error)
    return null
  }) : null
  
  console.log('[Dashboard] Database user:', user ? { id: user.id, email: user.email, journeyPhase: user.journeyPhase, journeyStatus: user.journeyStatus } : null)
  
  // Redirect admin users to admin dashboard
  if (user && user.role === 'ADMIN') {
    console.log('[Dashboard] Admin user, redirecting to /admin')
    redirect('/admin')
  }
  
  // If no user found in database, redirect to sign-in
  if (!user) {
    console.log('[Dashboard] No database user found for:', userQuery);
    redirect('/sign-in');
  }
  
  // Check if user needs onboarding (use journeyPhase if available, fallback to journeyStatus)
  // Note: The NEXT_REDIRECT error in dev console is expected behavior - it's how Next.js handles redirects
  const isInOnboarding = user?.journeyPhase === 'ONBOARDING' || 
    (!user?.journeyPhase && user?.journeyStatus === 'ONBOARDING')
  
  console.log('[Dashboard] Is in onboarding:', isInOnboarding, 'Journey phase:', user?.journeyPhase, 'Journey status:', user?.journeyStatus)
  
  if (user && isInOnboarding && user.role === 'MANAGER') {
    // Check if user has any existing conversations
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        managerId: user.id,
        currentAgent: 'OnboardingAgent'
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true }
    }).catch(() => null)

    // Only add new=true if this is truly their first conversation
    if (existingConversation) {
      console.log('[Dashboard] Redirecting to existing onboarding conversation')
      redirect('/chat?agent=OnboardingAgent')
    } else {
      console.log('[Dashboard] Redirecting to new onboarding conversation')
      redirect('/chat?agent=OnboardingAgent&new=true')
    }
  }

  // Get user's name from onboarding data if available
  const onboardingData = user?.onboardingData as Record<string, any> || {}
  const userName = onboardingData.managerName || user?.name || clerkUser?.firstName || 'Manager'
  const teamName = onboardingData.teamName || user?.team?.name || 'Your Team'
  const teamSize = onboardingData.teamSize || user?.team?.members?.length || 0
  
  // Check if user is in Assessment phase
  const isInAssessment = user?.journeyPhase === 'ASSESSMENT' || 
    (user?.journeyStatus === 'ACTIVE' && !user?.journeyPhase)

  return (
    <div className="bg-white min-h-screen w-full flex justify-center">
      <div className="bg-white w-full max-w-[1280px] h-[800px]">
        <div className="relative h-[800px]">
          {/* Main Container */}
          <div className="flex w-full h-[800px] items-start border border-solid border-gray-200">
            {/* Left Sidebar */}
            <div className="flex flex-col w-[280px] items-start justify-between relative self-stretch bg-gray-50/30 border-r border-solid border-gray-200">
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full">
                {/* Logo and Notification */}
                <div className="flex h-[60px] items-center justify-between px-6 relative self-stretch w-full border-gray-200">
                  <img
                    className="relative ml-[-5px] w-[90px] h-[39px]"
                    alt="teamOS"
                    src="/img/teamos-logo.png"
                  />
                  
                  <button className="flex w-8 h-8 items-center justify-center gap-2.5 py-2 px-4 bg-white rounded-md border border-solid border-gray-200">
                    <Bell className="w-4 h-4 ml-[-8px] mr-[-8px]" color="#0F172A" />
                  </button>
                </div>

                {/* Navigation Menu */}
                <div className="flex flex-col items-start gap-3 px-4 relative self-stretch w-full">
                  {/* Team Dashboard - Active */}
                  <button className="flex items-center gap-3 py-2 px-3 relative self-stretch w-full bg-gray-100 rounded-lg">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-gray-900 text-sm leading-normal">
                      Team Dashboard
                    </span>
                  </button>

                  {/* Craft Messages */}
                  <button className="flex items-center gap-3 py-2 px-3 relative self-stretch w-full rounded-lg hover:bg-gray-100 transition-colors">
                    <Pencil className="w-4 h-4" color="#64748B" />
                    <span className="font-medium text-gray-500 text-sm leading-normal">
                      Craft Messages
                    </span>
                  </button>

                  {/* Learning Pathways */}
                  <button className="flex items-center gap-3 py-2 px-3 relative self-stretch w-full rounded-lg hover:bg-gray-100 transition-colors">
                    <Book className="w-4 h-4" color="#64748B" />
                    <span className="font-medium text-gray-500 text-sm leading-normal">
                      Learning Pathways
                    </span>
                  </button>

                  {/* Settings */}
                  <button className="flex items-center gap-3 py-2 px-3 relative self-stretch w-full rounded-lg hover:bg-gray-100 transition-colors">
                    <Settings className="w-4 h-4" color="#64748B" />
                    <span className="font-medium text-gray-500 text-sm leading-normal">
                      Settings
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2.5 py-4 px-4 relative self-stretch w-full" />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col items-start relative flex-1 self-stretch grow">
              {/* Header */}
              <div className="flex h-[60px] items-center justify-between px-6 relative self-stretch w-full border-b border-solid border-gray-200 backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)]">
                {/* Search Bar */}
                <div className="flex w-96 items-center gap-2">
                  <div className="flex flex-col items-start gap-1.5 flex-1 grow">
                    <div className="flex items-center gap-2 pl-3 pr-14 py-2 self-stretch w-full bg-white rounded-md border border-solid border-gray-300">
                      <Oscar1 className="w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Ask Oskar"
                        className="flex-1 bg-transparent outline-none font-normal text-gray-500 text-sm leading-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Right side - Credits and Avatar */}
                <div className="inline-flex items-center justify-end gap-5">
                  <div className="inline-flex items-center justify-center gap-1">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium text-gray-500 text-sm">
                      5,000 Credits
                    </span>
                  </div>

                  {/* Avatar Dropdown */}
                  <button className="inline-flex items-center gap-2 h-10 px-1.5 rounded-lg border border-solid border-gray-200 shadow-sm bg-white">
                    <div className="flex w-7 h-7 items-center justify-center bg-gray-200 rounded-full">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-col items-start gap-4 p-6 relative flex-1 self-stretch w-full grow bg-white">
                {/* Title and Tabs */}
                <div className="flex items-center justify-between relative self-stretch w-full">
                  <div className="flex items-center gap-4">
                    <h1 className="font-semibold text-black text-2xl">
                      Team Dashboard
                    </h1>
                    {user?.journeyPhase && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {user.journeyPhase === 'ASSESSMENT' ? 'Assessment Phase' : 
                           user.journeyPhase === 'ONBOARDING' ? 'Onboarding' :
                           user.journeyPhase === 'DEBRIEF' ? 'Debrief Phase' :
                           'Active'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-2.5">
                    {/* Tab Switcher */}
                    <div className="inline-flex items-start p-[5px] bg-gray-100 rounded-md">
                      <button className="flex w-[95px] items-center justify-center py-1.5 px-3 bg-white rounded-md shadow-sm">
                        <span className="font-medium text-black text-sm text-center">
                          Overview
                        </span>
                      </button>
                      <button className="flex w-[95px] items-center justify-center py-1.5 px-3">
                        <span className="font-medium text-gray-900 text-sm text-center opacity-70">
                          Analytics
                        </span>
                      </button>
                      <button className="flex w-[95px] items-center justify-center py-1.5 px-3">
                        <span className="font-medium text-gray-900 text-sm text-center opacity-70">
                          Reports
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <button className="flex w-8 h-8 items-center justify-center rounded-full bg-white border border-solid border-gray-200 shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="flex w-8 h-8 items-center justify-center rounded-full bg-white border border-solid border-gray-200 shadow-sm">
                      <Focus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team Visualization Area */}
                <div className="relative flex-1 self-stretch w-full grow rounded-lg border border-dashed border-gray-300 shadow-sm bg-[linear-gradient(0deg,rgba(241,245,249,0.3)_0%,rgba(241,245,249,0.3)_100%)] bg-gray-50">
                  {/* Center Profile Card */}
                  <div className="absolute left-1/2 top-[27px] transform -translate-x-1/2">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-[118px] h-[118px] bg-slate-400 rounded-full overflow-hidden border border-dashed border-gray-300 shadow-md flex items-center justify-center">
                        <User className="w-14 h-14 text-slate-500" />
                      </div>
                      <div className="text-center">
                        <h2 className="font-bold text-black text-2xl">{userName}</h2>
                        <p className="font-normal text-slate-500 text-sm mt-1">Manager</p>
                        {teamName !== 'Your Team' && (
                          <p className="font-normal text-slate-400 text-xs mt-1">{teamName}</p>
                        )}
                      </div>
                      {isInAssessment && (
                        <Link 
                          href="/chat?agent=AssessmentAgent&assessment=tmp"
                          className="inline-flex items-center gap-2.5 py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <span className="font-medium text-white text-sm">
                            Complete Your First Profile
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Team Members Grid */}
                  <div className="absolute bottom-[102px] left-[88px] inline-flex items-center gap-16">
                    {/* Team Member 1 */}
                    <div className="w-[146px]">
                      <div className="w-[76px] h-[76px] mx-auto flex items-center justify-center bg-[#f8dcb8] rounded-full overflow-hidden border border-dashed border-gray-300 shadow-sm">
                        <User className="w-10 h-10" fill="#020617" opacity={0.5} />
                      </div>
                    </div>

                    {/* Team Member 2 */}
                    <div className="w-[146px]">
                      <div className="w-[76px] h-[76px] mx-auto flex items-center justify-center bg-[#edbbd2] rounded-full overflow-hidden border border-dashed border-gray-300 shadow-sm">
                        <User className="w-10 h-10" fill="#020617" opacity={0.5} />
                      </div>
                    </div>

                    {/* Team Member 3 */}
                    <div className="w-[146px]">
                      <div className="w-[76px] h-[76px] mx-auto flex items-center justify-center bg-[#cfbcd9] rounded-full overflow-hidden border border-dashed border-gray-300 shadow-sm">
                        <User className="w-10 h-10" fill="#020617" opacity={0.5} />
                      </div>
                    </div>

                    {/* Team Member 4 */}
                    <div className="w-[146px]">
                      <div className="w-[76px] h-[76px] mx-auto flex items-center justify-center bg-[#a7c0e3] rounded-full overflow-hidden border border-dashed border-gray-300 shadow-sm">
                        <User className="w-10 h-10" fill="#020617" opacity={0.5} />
                      </div>
                    </div>
                  </div>

                  {/* Add buttons */}
                  <button className="absolute left-[41px] top-[350px] flex w-8 h-8 items-center justify-center rounded-full bg-white border border-solid border-gray-200 shadow">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="absolute right-[41px] top-[350px] flex w-8 h-8 items-center justify-center rounded-full bg-white border border-solid border-gray-200 shadow">
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Credits Badge */}
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 absolute top-[289px] left-1/2 transform -translate-x-1/2 bg-white rounded-md border border-solid border-gray-200 shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a]">
                    <Coins className="w-4 h-4" color="#64748B" />
                    <span className="font-medium text-gray-500 text-sm">
                      +5000 credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info Card */}
          <div className="flex flex-col w-[776px] p-6 absolute bottom-[17px] right-[112px] rounded-md border border-solid border-gray-200 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] backdrop-blur-[15px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(15px)_brightness(100%)] bg-[linear-gradient(158deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)]">
            <div className="inline-flex flex-col items-start gap-2">
              <div className="inline-flex items-center justify-center gap-2.5">
                <Oscar1 className="w-5 h-5" />
                <p className="font-semibold text-gray-900 text-lg leading-7 whitespace-nowrap">
                  {isInAssessment ? 
                    'Complete your first profile to unlock team building' : 
                    'Welcome to your Team Dashboard'}
                </p>
              </div>
              <p className="w-[726px] font-normal text-gray-500 text-sm leading-5">
                {isInAssessment ? 
                  'The Team Management Profile (TMP) and Team Signals are well-known tools that enhance individual and team performance. Grounded in psychometric research, they reveal work preferences and clarify how team roles impact organisational success.' :
                  `You're managing ${teamSize > 0 ? `a team of ${teamSize}` : 'your team'}. Use this dashboard to track progress, manage assessments, and guide your team transformation journey.`}
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2.5 py-2 mt-2 rounded-md hover:underline">
              <span className="font-medium text-slate-900 text-sm leading-6 whitespace-nowrap">
                Learn more
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}