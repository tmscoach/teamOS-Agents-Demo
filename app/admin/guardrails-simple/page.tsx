"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface GuardrailCheck {
  id: string;
  conversationId: string;
  agentName: string;
  guardrailType: string;
  input: string;
  passed: boolean;
  severity: string | null;
  reasoning: string;
  timestamp: string;
}

export default function SimpleGuardrailsPage() {
  const [checks, setChecks] = useState<GuardrailCheck[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuardrails();
  }, []);

  const fetchGuardrails = async () => {
    try {
      // Use the working test endpoint approach
      const response = await fetch("/api/test-guardrails-detailed");
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setChecks(data.guardrailChecks.all || []);
        setStats({
          total: data.guardrailChecks.total,
          failed: data.guardrailChecks.failed,
          passed: data.guardrailChecks.passed
        });
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error fetching guardrails:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string | null, passed: boolean) => {
    if (passed) return <Badge variant="secondary">Passed</Badge>;
    
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-orange-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-yellow-500">Low</Badge>;
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error Loading Guardrails</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guardrail Monitoring (Simple View)</h1>
        <p className="text-muted-foreground">All guardrail checks from the database</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Guardrail Checks</CardTitle>
          <CardDescription>
            Showing all guardrail checks (both passed and failed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Guardrail</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Reasoning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id} className={!check.passed ? "bg-red-50" : ""}>
                  <TableCell>{getStatusIcon(check.passed)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(check.timestamp), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell>{check.agentName}</TableCell>
                  <TableCell>{check.guardrailType}</TableCell>
                  <TableCell>{getSeverityBadge(check.severity, check.passed)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={check.input}>
                    {check.input || "(empty)"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={check.reasoning}>
                    {check.reasoning}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}