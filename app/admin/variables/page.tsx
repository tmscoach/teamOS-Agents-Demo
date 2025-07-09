"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Database, TrendingUp, TrendingDown, Search, BarChart3, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface VariableExtraction {
  id: string;
  conversationId: string;
  agentName: string;
  fieldName: string;
  attempted: boolean;
  successful: boolean;
  extractedValue: string | null;
  confidence: number | null;
  timestamp: string;
  conversation?: {
    id: string;
    teamId: string;
    managerId: string;
  };
}

interface ExtractionStats {
  totalExtractions: number;
  successfulExtractions: number;
  successRate: number;
  fields: Array<{
    fieldName: string;
    attempts: number;
    successful: number;
    successRate: number;
    avgConfidence: number;
  }>;
  byAgent: Array<{
    agentName: string;
    attempts: number;
  }>;
}

interface ProblematicField {
  fieldName: string;
  successRate: number;
  attempts: number;
  examples: VariableExtraction[];
}

export default function VariablesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ExtractionStats | null>(null);
  const [problematicFields, setProblematicFields] = useState<ProblematicField[]>([]);
  const [trends, setTrends] = useState<Array<{ date: string; attempts: number; successful: number; successRate: number }>>([]);
  const [searchResults, setSearchResults] = useState<{ results: VariableExtraction[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterField, setFilterField] = useState("");
  const [selectedField, setSelectedField] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, problematicRes, trendsRes] = await Promise.all([
        fetch("/api/admin/variables/stats"),
        fetch("/api/admin/variables/stats?endpoint=problematic-fields&threshold=70"),
        fetch("/api/admin/variables/stats?endpoint=trends&days=7"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (problematicRes.ok) {
        const problematicData = await problematicRes.json();
        setProblematicFields(problematicData);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData);
      }
    } catch (error) {
      console.error("Error fetching variable extraction data:", error);
      toast.error("Failed to load variable extraction data");
    } finally {
      setLoading(false);
    }
  };

  const searchExtractions = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (filterAgent) params.append("agentName", filterAgent);
      if (filterField) params.append("fieldName", filterField);

      const res = await fetch(`/api/admin/variables?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching extractions:", error);
      toast.error("Failed to search extractions");
    }
  };

  const getConfidenceDistribution = async (fieldName: string) => {
    try {
      const res = await fetch(`/api/admin/variables/stats?endpoint=confidence-distribution&fieldName=${fieldName}`);
      if (res.ok) {
        const data = await res.json();
        // Handle confidence distribution data
        console.log("Confidence distribution:", data);
      }
    } catch (error) {
      console.error("Error fetching confidence distribution:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM d, yyyy HH:mm:ss");
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Variable Extraction Analytics</h1>
        <p className="text-muted-foreground">Monitor and analyze variable extraction success rates</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExtractions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              {stats.successRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                {stats.successRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulExtractions} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fields Tracked</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fields.length}</div>
              <p className="text-xs text-muted-foreground">
                Unique fields
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problem Fields</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{problematicFields.length}</div>
              <p className="text-xs text-muted-foreground">
                Below 70% success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fields">Field Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Field Success Rates</CardTitle>
                <CardDescription>
                  Success rate by field type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.fields?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fieldName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extraction Volume by Agent</CardTitle>
                <CardDescription>
                  Number of extraction attempts per agent
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byAgent || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.agentName}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="attempts"
                    >
                      {stats?.byAgent?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Problematic Fields</CardTitle>
              <CardDescription>
                Fields with low extraction success rates requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Recent Examples</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problematicFields.map((field) => (
                    <TableRow key={field.fieldName}>
                      <TableCell className="font-medium">{field.fieldName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={field.successRate} className="w-[60px]" />
                          <span className={getSuccessRateColor(field.successRate)}>
                            {field.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{field.attempts}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {field.examples.length} failed attempts
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedField(field.fieldName);
                            getConfidenceDistribution(field.fieldName);
                          }}
                        >
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Performance Details</CardTitle>
              <CardDescription>
                Detailed extraction metrics for each field
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Successful</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.fields?.map((field) => (
                    <TableRow key={field.fieldName}>
                      <TableCell className="font-medium">{field.fieldName}</TableCell>
                      <TableCell>{field.attempts}</TableCell>
                      <TableCell>{field.successful}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={field.successRate} className="w-[60px]" />
                          <span className={getSuccessRateColor(field.successRate)}>
                            {field.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {field.avgConfidence > 0 ? `${(field.avgConfidence * 100).toFixed(1)}%` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Success Trends</CardTitle>
              <CardDescription>
                7-day trend of extraction attempts and success rates
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="attempts"
                    stroke="#3b82f6"
                    name="Attempts"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="successful"
                    stroke="#10b981"
                    name="Successful"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="successRate"
                    stroke="#f59e0b"
                    name="Success Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Extractions</CardTitle>
              <CardDescription>
                Search and filter through extraction history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by extracted value..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchExtractions()}
                  />
                </div>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Agents</SelectItem>
                    <SelectItem value="OnboardingAgent">Onboarding Agent</SelectItem>
                    <SelectItem value="AssessmentAgent">Assessment Agent</SelectItem>
                    <SelectItem value="AnalysisAgent">Analysis Agent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Fields</SelectItem>
                    {stats?.fields?.map((field) => (
                      <SelectItem key={field.fieldName} value={field.fieldName}>
                        {field.fieldName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={searchExtractions}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.total} extractions
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="text-sm">{formatTimestamp(result.timestamp)}</TableCell>
                          <TableCell>{result.agentName}</TableCell>
                          <TableCell>{result.fieldName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {result.extractedValue || "-"}
                          </TableCell>
                          <TableCell>
                            {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.successful ? "default" : "destructive"}>
                              {result.successful ? "Success" : "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/conversations/${result.conversationId}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}