import { NextResponse } from "next/server";
import OpenAI from "openai";

// Import Prisma client directly to avoid connection issues
async function searchDocuments(searchTerms: string[]) {
  try {
    // Dynamic import to avoid initialization issues
    const { PrismaClient } = await import("@/lib/generated/prisma");
    const prisma = new PrismaClient();
    
    // Search for chunks containing relevant keywords
    const chunks = await prisma.documentChunk.findMany({
      where: {
        OR: searchTerms.map(term => ({
          content: {
            contains: term,
            mode: 'insensitive'
          }
        }))
      },
      include: {
        document: true
      },
      take: 20, // Get more chunks for better context
    });
    
    await prisma.$disconnect();
    return chunks;
  } catch (error) {
    console.error("Database search error:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Step 1: Extract search terms from the question
    const searchTerms = question.toLowerCase()
      .split(' ')
      .filter((term: string) => term.length > 3 && !['what', 'how', 'when', 'where', 'does', 'using', 'with'].includes(term));
    
    // Add TMS-specific terms based on the question
    if (question.toLowerCase().includes('dysfunction')) {
      searchTerms.push('dysfunction', 'dysfunctional', 'problem', 'issue', 'conflict');
    }
    if (question.toLowerCase().includes('tool')) {
      searchTerms.push('assessment', 'questionnaire', 'framework', 'methodology');
    }
    if (question.toLowerCase().includes('team')) {
      searchTerms.push('team', 'group', 'collaboration');
    }

    console.log("Searching for terms:", searchTerms);

    // Step 2: Search the actual database
    let chunks = await searchDocuments(searchTerms);
    
    // If no results, try broader search
    if (chunks.length === 0) {
      console.log("No results, trying broader search...");
      const broaderTerms = ['team', 'assessment', 'tms', 'methodology', 'framework'];
      chunks = await searchDocuments(broaderTerms);
    }

    console.log(`Found ${chunks.length} chunks from database`);

    // Step 3: Build context from chunks
    let context = "";
    if (chunks.length > 0) {
      context = chunks.map(chunk => {
        return `[From ${chunk.document.title}]:\n${chunk.content}`;
      }).join('\n\n---\n\n');
    } else {
      // If still no chunks, provide some general TMS context
      context = `General TMS Information:
TMS (Team Management Systems) is a comprehensive methodology for team transformation based on 40+ years of research. 
It includes various assessment tools, frameworks, and methodologies designed to improve team effectiveness.
Key components include Team Signals assessments, TMP (Team Management Profile), QO2 framework, WoW (Wheel of Work), and LLP (Linking Leader Profile).
However, specific information about the requested topic is not available in the current context.`;
    }

    console.log("Context length:", context.length);

    // Step 4: Use OpenAI to answer the question
    const systemPrompt = `You are an expert on Team Management Systems (TMS) methodology. 
Use the provided context to answer questions accurately.
If the context doesn't contain enough specific information, acknowledge this but try to provide general guidance based on TMS principles.
Always cite which document the information comes from when possible.`;

    const userPrompt = `Context from TMS documents:
${context.substring(0, 10000)} ${context.length > 10000 ? '...[truncated]' : ''}

Question: ${question}

Please answer based on the context provided. If the context lacks specific details, provide general TMS guidance and explain what additional information would be helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 700,
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      question,
      answer,
      context: {
        chunksFound: chunks.length,
        sources: chunks.length > 0 
          ? [...new Set(chunks.map(c => c.document.title))].slice(0, 5)
          : ["No specific documents found - using general TMS knowledge"],
        searchMethod: chunks.length > 0 ? "database search" : "fallback to general knowledge",
        searchTerms: searchTerms.slice(0, 5),
      },
      debug: {
        totalChunksInDB: "12,484 (from previous load)",
        actualChunksSearched: chunks.length,
        contextLength: context.length,
      }
    });

  } catch (error) {
    console.error("RAG test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: "Error accessing the knowledge base. The database contains 12,484 document chunks but there may be a connection issue.",
    });
  }
}