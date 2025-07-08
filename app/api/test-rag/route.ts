import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import OpenAI from "openai";

const prisma = new PrismaClient();

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

    // Step 1: Create embedding for the question
    console.log("Creating embedding for question:", question);
    const questionEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });

    // Step 2: Search for relevant chunks
    // Since we don't have pgvector, we'll do keyword search instead
    const searchTerms = question.toLowerCase().split(' ')
      .filter(term => term.length > 3); // Filter out short words

    console.log("Searching for terms:", searchTerms);

    // Search for chunks containing relevant keywords
    const relevantChunks = await prisma.documentChunk.findMany({
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
      take: 10, // Get top 10 relevant chunks
    });

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // If no direct matches, try searching in document titles or broader search
    let chunks = relevantChunks;
    if (chunks.length === 0) {
      console.log("No direct matches, trying broader search...");
      
      // Search for specific TMS terms that might be relevant
      const tmsTerms = ['wheel', 'creator', 'innovator', 'inner', 'outer', 'role', 'team'];
      chunks = await prisma.documentChunk.findMany({
        where: {
          OR: tmsTerms.map(term => ({
            content: {
              contains: term,
              mode: 'insensitive'
            }
          }))
        },
        include: {
          document: true
        },
        take: 5,
      });
    }

    // Step 3: Build context from chunks
    const context = chunks.map(chunk => {
      return `[From ${chunk.document.title}]:\n${chunk.content}`;
    }).join('\n\n---\n\n');

    console.log("Context length:", context.length);

    // Step 4: Use OpenAI to answer the question with context
    const systemPrompt = `You are an expert on Team Management Systems (TMS) methodology. 
You have access to TMS intellectual property documents. 
Use the provided context to answer questions accurately.
If the context doesn't contain enough information, say so clearly.
Always cite which document the information comes from when possible.`;

    const userPrompt = `Context from TMS documents:
${context}

Question: ${question}

Please answer based on the context provided. If the context doesn't contain the answer, indicate what information is missing.`;

    console.log("Sending to OpenAI for answer generation...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 500,
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      question,
      answer,
      context: {
        chunksFound: chunks.length,
        sources: [...new Set(chunks.map(c => c.document.title))],
        searchMethod: relevantChunks.length > 0 ? "keyword match" : "fallback search",
      },
      debug: {
        searchTerms,
        embeddingDimensions: questionEmbedding.data[0].embedding.length,
        contextLength: context.length,
      }
    });

  } catch (error) {
    console.error("RAG test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}