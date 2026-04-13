import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing in .env.local" }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: "No logs provided." }, { status: 400 });
    }

    // 1. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // Replaces gemini-1.5-flash
      generationConfig: { responseMimeType: "application/json" } 
    });

    // 2. The OpenClaw Prompt
    const prompt = `
      You are 'OpenClaw', the AI analytics engine for the KIMOO CRT trading system.
      Analyze these cTrader system logs and identify why trades are being skipped or failing.

      Respond in strictly valid JSON:
      {
        "executionRate": "e.g., 15%",
        "primaryBlocker": "Short summary of the main filter or error blocking trades",
        "recommendation": "One specific parameter adjustment"
      }

      LOG DATA:
      ${logs.join('\n')}
    `;

    // 3. Generate Content
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json(JSON.parse(responseText));

  } catch (error: any) {
    console.error("Gemini OpenClaw Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

