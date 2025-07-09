"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// Mock data showing what guardrails would look like
const mockGuardrailChecks = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    agentName: "OnboardingAgent",
    guardrailType: "Professionalism",
    input: "I HATE THIS STUPID SYSTEM",
    passed: false,
    severity: "high",
    reason: "Please avoid using all caps as it can be perceived as shouting.",
    metadata: { capsRatio: 0.76, inappropriateLanguage: true }
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    agentName: "OnboardingAgent",
    guardrailType: "MessageLength",
    input: "Hi",
    passed: false,
    severity: "medium",
    reason: "Message is too short. Please provide more detail.",
    metadata: { messageLength: 2, minLength: 10 }
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    agentName: "OnboardingAgent",
    guardrailType: "Professionalism",
    input: "i hate you fuck off",
    passed: true,
    severity: null,
    reason: null,
    metadata: { warning: "Detected potentially negative language. Maintain supportive tone." }
  }
];

export default function GuardrailsDebugPage() {
  const [checks] = useState(mockGuardrailChecks);

  const getSeverityBadge = (severity: string | null, passed: boolean) => {
    if (passed && !severity) return <Badge variant="secondary">Warning</Badge>;
    
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-orange-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-yellow-500">Low</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guardrails Debug View</h1>
        <p className="text-muted-foreground">
          Mock view showing how guardrails work (database not required)
        </p>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900">
            <AlertTriangle className="h-5 w-5" />
            Database Connection Issue
          </CardTitle>
          <CardDescription className="text-yellow-800">
            Cannot connect to Supabase database. Showing mock data to demonstrate how guardrails work.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Guardrail Check Results
          </CardTitle>
          <CardDescription>
            This shows what would appear in the admin panel when the database is working
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
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id} className={!check.passed ? "bg-red-50" : ""}>
                  <TableCell>{getStatusIcon(check.passed)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(check.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{check.agentName}</TableCell>
                  <TableCell>{check.guardrailType}</TableCell>
                  <TableCell>{getSeverityBadge(check.severity, check.passed)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={check.input}>
                    {check.input}
                  </TableCell>
                  <TableCell className="text-sm">
                    {check.reason || check.metadata?.warning || "Passed"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Test Guardrails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-red-600">🚫 Messages that FAIL (get blocked):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code className="bg-gray-100 px-1">"I HATE THIS STUPID SYSTEM"</code> - All caps detected</li>
              <li><code className="bg-gray-100 px-1">"Hi"</code> - Too short (min 10 chars)</li>
              <li><code className="bg-gray-100 px-1">"THIS IS ALL CAPS TEXT"</code> - More than 50% uppercase</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-yellow-600">⚠️ Messages that WARN (but pass):</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code className="bg-gray-100 px-1">"i hate this system"</code> - Negative language (lowercase)</li>
              <li><code className="bg-gray-100 px-1">"this sucks"</code> - Inappropriate but not caps</li>
              <li><code className="bg-gray-100 px-1">"fuck this"</code> - Profanity (if not in caps)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">✅ Messages that PASS:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code className="bg-gray-100 px-1">"I need help with my team"</code> - Professional</li>
              <li><code className="bg-gray-100 px-1">"We're facing communication challenges"</code> - Appropriate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}