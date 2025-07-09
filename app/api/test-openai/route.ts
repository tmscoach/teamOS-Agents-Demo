import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant. Keep responses brief." },
        { role: "user", content: message },
      ],
      max_tokens: 100,
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0].message.content,
      model: completion.model,
    });
  } catch (error) {
    console.error("OpenAI test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}