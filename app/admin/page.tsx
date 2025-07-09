"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin";
import { MetricCard } from "@/components/admin/metric-card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Database, 
  Terminal, 
  CheckCircle, 
  MessageSquare,
  Shield,
  Variable,
  Settings,
  Users,
  Activity,
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  guardrailViolations: number;
  variableExtractions: number;
  successRate: number;
}

export default function AdminDashboardPage() {
  const { userId } = useAuth();
  const [dbStatus, setDbStatus] = useState<'checking' | 'ready' | 'needs-migration'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    activeConversations: 0,
    guardrailViolations: 0,
    variableExtractions: 0,
    successRate: 0
  });

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // Try to fetch from each admin endpoint to check if tables exist
      const endpoints = [
        '/api/admin/guardrails/stats',
        '/api/admin/variables/stats',
        '/api/admin/agents/config'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint).then(res => res.json()))
      );

      // Check if any response has a warning about missing tables
      const needsMigration = responses.some(data => data.warning && data.warning.includes('not initialized'));
      
      if (!needsMigration) {
        // Fetch actual stats if database is ready
        const [guardrailStats, variableStats] = responses;
        setStats({
          totalConversations: 150, // Mock data - would come from API
          activeConversations: 23,
          guardrailViolations: guardrailStats.failedChecks || 0,
          variableExtractions: variableStats.totalExtractions || 0,
          successRate: variableStats.overallSuccessRate || 0
        });
      }
      
      setDbStatus(needsMigration ? 'needs-migration' : 'ready');
    } catch (error) {
      console.error('Error checking database status:', error);
      setError('Failed to check database status');
      setDbStatus('needs-migration');
    }
  };

  if (dbStatus === 'checking') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teams-primary"></div>
      </div>
    );
  }

  if (dbStatus === 'needs-migration') {
    return (
      <div className="space-y-teams-lg">
        <div>
          <h1 className="text-4xl font-bold text-teams-text-primary">Admin Dashboard</h1>
          <p className="text-teams-text-secondary mt-2">Database Setup Required</p>
        </div>

        <AdminCard className="border-teams-accent-orange/20 bg-teams-accent-orange/5">
          <div className="flex gap-teams-md">
            <AlertCircle className="h-5 w-5 text-teams-accent-orange flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-teams-text-primary">Database Migration Required</h3>
              <p className="text-teams-text-secondary mt-1">
                The admin dashboard tables have not been created in your database yet. 
                Please run the database migrations to create the required tables.
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teams-accent-blue" />
              Setup Instructions
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="space-y-teams-lg">
            <div className="space-y-teams-md">
              <div className="flex items-start gap-teams-md">
                <Terminal className="h-5 w-5 text-teams-text-secondary mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-teams-text-primary">1. Generate Prisma Client</p>
                  <code className="block bg-teams-ui-hover-bg p-teams-md rounded-teams-sm text-sm font-mono">
                    npx prisma generate
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-teams-md">
                <Terminal className="h-5 w-5 text-teams-text-secondary mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-teams-text-primary">2. Run Database Migrations</p>
                  <code className="block bg-teams-ui-hover-bg p-teams-md rounded-teams-sm text-sm font-mono">
                    npx prisma migrate dev --name add_admin_tables
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-teams-md">
                <CheckCircle className="h-5 w-5 text-teams-accent-green mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-teams-text-primary">3. Refresh this page</p>
                  <p className="text-sm text-teams-text-secondary">
                    After running the migrations, refresh this page to access the admin dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-teams-md">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-teams-primary hover:bg-teams-text-primary text-white"
              >
                Refresh Page
              </Button>
            </div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Tables to be Created</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <ul className="space-y-teams-sm">
              <li className="flex items-center gap-teams-sm">
                <div className="w-2 h-2 bg-teams-accent-green rounded-full" />
                <span className="font-mono text-sm">GuardrailCheck</span>
                <span className="text-sm text-teams-text-secondary">- Tracks guardrail violations</span>
              </li>
              <li className="flex items-center gap-teams-sm">
                <div className="w-2 h-2 bg-teams-accent-blue rounded-full" />
                <span className="font-mono text-sm">VariableExtraction</span>
                <span className="text-sm text-teams-text-secondary">- Tracks extracted variables</span>
              </li>
              <li className="flex items-center gap-teams-sm">
                <div className="w-2 h-2 bg-teams-accent-purple rounded-full" />
                <span className="font-mono text-sm">AgentConfiguration</span>
                <span className="text-sm text-teams-text-secondary">- Manages agent configurations</span>
              </li>
            </ul>
          </AdminCardContent>
        </AdminCard>
      </div>
    );
  }

  // Database is ready - show the main dashboard
  const userName = "Admin"; // In a real app, fetch from user profile

  return (
    <div className="space-y-teams-xl">
      <div>
        <h1 className="text-4xl font-bold text-teams-text-primary">
          Welcome back, {userName}!
        </h1>
        <p className="text-teams-text-secondary mt-2">
          Here's an overview of your TMS transformation system
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-teams-lg grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Conversations"
          value={stats.totalConversations}
          icon={MessageSquare}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Active Sessions"
          value={stats.activeConversations}
          icon={Activity}
          color="green"
          subtitle="Currently in progress"
        />
        <MetricCard
          title="Guardrail Violations"
          value={stats.guardrailViolations}
          icon={Shield}
          color="orange"
          trend={{ value: 8, isPositive: false }}
        />
        <MetricCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
          subtitle="Variable extraction"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-teams-lg md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/conversations">
          <AdminCard className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className="flex items-start gap-teams-md">
              <div className="p-teams-sm rounded-teams-sm bg-teams-accent-blue/10 text-teams-accent-blue">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teams-text-primary group-hover:text-teams-primary transition-colors">
                  Conversations
                </h3>
                <p className="text-sm text-teams-text-secondary mt-1">
                  Monitor active onboarding sessions
                </p>
              </div>
            </div>
          </AdminCard>
        </Link>

        <Link href="/admin/guardrails">
          <AdminCard className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className="flex items-start gap-teams-md">
              <div className="p-teams-sm rounded-teams-sm bg-teams-accent-orange/10 text-teams-accent-orange">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teams-text-primary group-hover:text-teams-primary transition-colors">
                  Guardrails
                </h3>
                <p className="text-sm text-teams-text-secondary mt-1">
                  Track violations and security
                </p>
              </div>
            </div>
          </AdminCard>
        </Link>

        <Link href="/admin/variables">
          <AdminCard className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className="flex items-start gap-teams-md">
              <div className="p-teams-sm rounded-teams-sm bg-teams-accent-purple/10 text-teams-accent-purple">
                <Variable className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teams-text-primary group-hover:text-teams-primary transition-colors">
                  Variables
                </h3>
                <p className="text-sm text-teams-text-secondary mt-1">
                  Analyze extracted data quality
                </p>
              </div>
            </div>
          </AdminCard>
        </Link>

        <Link href="/admin/agents/config">
          <AdminCard className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className="flex items-start gap-teams-md">
              <div className="p-teams-sm rounded-teams-sm bg-teams-accent-green/10 text-teams-accent-green">
                <Settings className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teams-text-primary group-hover:text-teams-primary transition-colors">
                  Agent Config
                </h3>
                <p className="text-sm text-teams-text-secondary mt-1">
                  Manage prompts and flows
                </p>
              </div>
            </div>
          </AdminCard>
        </Link>
      </div>

      {/* Recent Activity */}
      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center justify-between">
            <AdminCardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teams-accent-blue" />
              Recent Activity
            </AdminCardTitle>
            <Button variant="ghost" size="sm" className="text-teams-text-secondary hover:text-teams-text-primary">
              View All →
            </Button>
          </div>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="space-y-teams-md">
            {[
              { time: "2 minutes ago", event: "New conversation started", user: "Manager #42", type: "info" },
              { time: "15 minutes ago", event: "Guardrail violation detected", user: "OnboardingAgent", type: "warning" },
              { time: "1 hour ago", event: "Variable extraction completed", user: "System", type: "success" },
              { time: "2 hours ago", event: "Agent configuration updated", user: "Admin", type: "info" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-teams-md py-teams-sm border-b border-teams-ui-border last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'warning' ? 'bg-teams-accent-orange' : 
                  activity.type === 'success' ? 'bg-teams-accent-green' : 
                  'bg-teams-accent-blue'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-teams-text-primary">{activity.event}</p>
                  <p className="text-xs text-teams-text-secondary mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AdminCardContent>
      </AdminCard>

      {error && (
        <AdminCard className="border-destructive/20 bg-destructive/5">
          <div className="flex gap-teams-md">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-teams-text-primary">Error</h3>
              <p className="text-teams-text-secondary mt-1">{error}</p>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}