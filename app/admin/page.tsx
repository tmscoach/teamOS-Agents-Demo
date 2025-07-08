"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, Terminal, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'ready' | 'needs-migration'>('checking');
  const [error, setError] = useState<string | null>(null);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dbStatus === 'needs-migration') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Database Setup Required</p>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Database Migration Required</AlertTitle>
          <AlertDescription className="text-orange-800">
            The admin dashboard tables have not been created in your database yet. 
            Please run the database migrations to create the required tables.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to set up your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium">1. Generate Prisma Client</p>
                  <code className="block bg-muted p-3 rounded text-sm">
                    npx prisma generate
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium">2. Run Database Migrations</p>
                  <code className="block bg-muted p-3 rounded text-sm">
                    npx prisma migrate dev --name add_admin_tables
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium">3. Refresh this page</p>
                  <p className="text-sm text-muted-foreground">
                    After running the migrations, refresh this page to access the admin dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tables to be Created</CardTitle>
            <CardDescription>
              The following tables will be created by the migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="font-mono text-sm">GuardrailCheck</span>
                <span className="text-sm text-muted-foreground">- Tracks guardrail violations</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="font-mono text-sm">VariableExtraction</span>
                <span className="text-sm text-muted-foreground">- Tracks extracted variables</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="font-mono text-sm">AgentConfiguration</span>
                <span className="text-sm text-muted-foreground">- Manages agent configurations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Database is ready - show the main dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage your TMS transformation system</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/conversations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>
                Monitor active onboarding conversations and manager interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                View Conversations →
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/guardrails">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Guardrails</CardTitle>
              <CardDescription>
                Track guardrail violations and security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                View Guardrails →
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/variables">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Variables</CardTitle>
              <CardDescription>
                Analyze extracted variables and data quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                View Variables →
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/agents/config">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Manage agent prompts and conversation flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                Configure Agents →
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}