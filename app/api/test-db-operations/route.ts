import { NextResponse } from "next/server";
import prisma from '@/lib/db';

export async function GET() {
  const results: any = {};
  
  try {
    // Test basic database connectivity
    results.databaseConnection = { status: 'testing' };
    await prisma.$queryRaw`SELECT 1`;
    results.databaseConnection = { status: 'success' };
  } catch (error: any) {
    results.databaseConnection = { 
      status: 'error', 
      error: error.message 
    };
  }
  
  // Test each table
  const tables = [
    { name: 'users', query: () => prisma.user.count() },
    { name: 'teams', query: () => prisma.team.count() },
    { name: 'conversations', query: () => prisma.conversation.count() },
    { name: 'messages', query: () => prisma.message.count() },
    { name: 'agentEvents', query: () => prisma.agentEvent.count() },
    { name: 'guardrailChecks', query: () => prisma.guardrailCheck.count() },
    { name: 'variableExtractions', query: () => prisma.variableExtraction.count() },
    { name: 'documents', query: () => prisma.document.count() },
    { name: 'documentChunks', query: () => prisma.documentChunk.count() },
    { name: 'questionnaireItems', query: () => prisma.questionnaireItem.count() },
  ];
  
  results.tables = {};
  
  for (const table of tables) {
    try {
      const count = await table.query();
      results.tables[table.name] = { 
        status: 'success', 
        count,
        exists: true 
      };
    } catch (error: any) {
      results.tables[table.name] = { 
        status: 'error',
        exists: false,
        error: error.message.includes('does not exist') ? 'Table does not exist' : error.message
      };
    }
  }
  
  // Check for specific issues
  results.issues = [];
  
  // Check if admin tables exist
  const adminTables = ['guardrailChecks', 'variableExtractions'];
  for (const tableName of adminTables) {
    if (!results.tables[tableName]?.exists) {
      results.issues.push({
        type: 'missing_table',
        table: tableName,
        solution: 'Run: npx prisma migrate dev'
      });
    }
  }
  
  // Check if there's data in key tables
  if (results.tables.conversations?.count === 0) {
    results.issues.push({
      type: 'no_data',
      table: 'conversations',
      solution: 'Start a chat conversation to generate data'
    });
  }
  
  // Summary
  results.summary = {
    databaseOk: results.databaseConnection.status === 'success',
    totalTables: Object.keys(results.tables).length,
    existingTables: Object.values(results.tables).filter((t: any) => t.exists).length,
    missingTables: Object.values(results.tables).filter((t: any) => !t.exists).length,
    issueCount: results.issues.length,
    recommendation: results.issues.length > 0 
      ? 'Some issues found - see issues section for solutions'
      : 'All database operations working correctly'
  };
  
  return NextResponse.json(results, { status: 200 });
}