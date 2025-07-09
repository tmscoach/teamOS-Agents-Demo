import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { action, query, documentContent } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured for embeddings",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (action === "test-embedding") {
      // Test creating an embedding
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query || "test embedding",
      });

      return NextResponse.json({
        success: true,
        action: "test-embedding",
        embeddingDimensions: embedding.data[0].embedding.length,
        model: embedding.model,
      });
    }

    if (action === "create-document") {
      // Create a test document with chunks
      const testContent = documentContent || `This is a test document about Team Management Systems (TMS). 
TMS helps teams improve their performance through structured assessments and transformations.
The methodology is based on 40+ years of research into team effectiveness.`;

      // Create document
      const document = await prisma.document.create({
        data: {
          title: "Test TMS Document",
          sourcePath: `/test/doc-${Date.now()}.md`,
          documentType: "RESEARCH",
          content: testContent,
          metadata: { test: true, createdAt: new Date() },
        },
      });

      // Split into chunks (simple split for testing)
      const chunks = testContent.split('\n').filter(chunk => chunk.trim());
      
      // Create embeddings for each chunk
      const chunkPromises = chunks.map(async (chunkText, index) => {
        const embedding = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunkText,
        });

        // Note: Actual embedding storage would require pgvector extension
        // For now, we'll create chunks without embeddings
        return prisma.documentChunk.create({
          data: {
            documentId: document.id,
            chunkIndex: index,
            content: chunkText,
            metadata: { 
              embeddingCreated: true,
              dimensions: embedding.data[0].embedding.length 
            },
          },
        });
      });

      const createdChunks = await Promise.all(chunkPromises);

      return NextResponse.json({
        success: true,
        action: "create-document",
        document: {
          id: document.id,
          title: document.title,
          chunksCreated: createdChunks.length,
        },
      });
    }

    if (action === "test-search") {
      // Test vector search (simulated since we can't store vectors without pgvector)
      const searchEmbedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query || "team performance",
      });

      // For now, return all chunks as "search results"
      const chunks = await prisma.documentChunk.findMany({
        take: 5,
        include: {
          document: true,
        },
      });

      return NextResponse.json({
        success: true,
        action: "test-search",
        query,
        embeddingDimensions: searchEmbedding.data[0].embedding.length,
        results: chunks.map(chunk => ({
          content: chunk.content,
          documentTitle: chunk.document.title,
          metadata: chunk.metadata,
        })),
        note: "Vector similarity search requires pgvector extension. Showing recent chunks instead.",
      });
    }

    if (action === "check-status") {
      // Check current status of vector database
      const documentCount = await prisma.document.count();
      const chunkCount = await prisma.documentChunk.count();
      
      // Check if we have any questionnaire items
      const questionnaireCount = await prisma.questionnaireItem.count();

      return NextResponse.json({
        success: true,
        action: "check-status",
        status: {
          documents: documentCount,
          chunks: chunkCount,
          questionnaireItems: questionnaireCount,
          vectorExtension: "pgvector required for similarity search",
          embeddingModel: "text-embedding-ada-002",
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action. Use: test-embedding, create-document, test-search, or check-status",
    });
  } catch (error) {
    console.error("Vector test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}