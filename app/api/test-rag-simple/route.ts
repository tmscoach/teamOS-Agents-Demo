import { NextResponse } from "next/server";
import OpenAI from "openai";

// Mock some TMS document chunks for testing
const mockChunks = [
  {
    content: `The Wheel of Work categorizes team members into different roles based on their natural strengths and preferences. The Inner Wheel consists of roles that are more task-focused and detail-oriented, while the Outer Wheel contains roles that are more people-focused and big-picture oriented.`,
    source: "TMP Handbook - Team Roles"
  },
  {
    content: `Creator Innovators in the Outer Wheel are visionary leaders who excel at generating new ideas and inspiring others. They focus on possibilities and future potential. In contrast, Creator Innovators in the Inner Wheel are more focused on practical innovation and implementing creative solutions within existing frameworks.`,
    source: "WoW Questionnaire Guide"
  },
  {
    content: `Outer Wheel Creator Innovators tend to be more extroverted and comfortable with ambiguity. They thrive in environments where they can explore radical new concepts and challenge the status quo. Inner Wheel Creator Innovators prefer to work within established parameters, finding creative ways to improve existing processes and systems.`,
    source: "Team Roles Research Manual"
  },
  {
    content: `The key difference between Outer and Inner Wheel Creator Innovators lies in their approach to innovation. Outer Wheel types are revolutionary - they want to completely reimagine how things are done. Inner Wheel types are evolutionary - they want to make existing things work better through creative improvements.`,
    source: "QO2 Framework Documentation"
  }
];

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

    // Build context from mock chunks
    const context = mockChunks.map(chunk => {
      return `[From ${chunk.source}]:\n${chunk.content}`;
    }).join('\n\n---\n\n');

    // Use OpenAI to answer the question with context
    const systemPrompt = `You are an expert on Team Management Systems (TMS) methodology. 
You have access to TMS intellectual property documents. 
Use the provided context to answer questions accurately.
Always cite which document the information comes from when possible.`;

    const userPrompt = `Context from TMS documents:
${context}

Question: ${question}

Please answer based on the context provided. Be specific and detailed in your response.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      question,
      answer,
      context: {
        chunksFound: mockChunks.length,
        sources: mockChunks.map(c => c.source),
        note: "Using mock data - database connection issue"
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