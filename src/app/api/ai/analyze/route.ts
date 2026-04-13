import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

    // 1. DATA CLEANING: Stop the [object Object] error
    // We transform the Supabase objects into a single readable text string
    const textLogs = logs.map((l: any) => {
      const type = l.log_type || 'INFO';
      const msg = l.message || '';
      const sym = l.symbol || '';
      return `[${type}] ${sym}: ${msg}`;
    }).join('\n');

    if (!textLogs || textLogs.length < 10) {
      return NextResponse.json({ error: "Logs are too short to analyze." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. 2026 MODEL ID: Using the stable 3.1 Flash-Lite for speed
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are 'OpenClaw', an expert analyst for the KIMOO CRT trading system.
      
      CRITICAL INSTRUCTION:
      The user's logs might not use standard tags. Look for these patterns:
      - If a log says "Price did not hit", "Filter", or "Skipping" -> Count as a SKIPPED trade.
      - If a log says "Order Sent", "Position Opened", or "Entry" -> Count as an EXECUTED trade.
      
      Calculate the Execution Rate as: (Executed / (Executed + Skipped)) * 100.
    
      Return ONLY this JSON:
      {
        "executionRate": "string",
        "primaryBlocker": "string",
        "recommendation": "string"
      }
    
      DATA:
      ${textLogs}
    `;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("OpenClaw Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
