import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    if (!logs || logs.length === 0) return NextResponse.json({ error: "No logs found" }, { status: 400 });

    // CLEANING: Convert raw database objects into readable text strings
    const cleanLogs = logs.map((l: any) => `[${l.log_type || 'INFO'}] ${l.symbol || ''}: ${l.message || ''}`).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using the 2026 stable Gemini 3.1 Flash-Lite
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are 'OpenClaw', an expert analyst for the KIMOO CRT system. 
      Analyze these trading logs and calculate execution metrics.
      
      Look for patterns: "SKIP" or "FILTER" means a missed trade. "EXECUTE" or "ORDER" means success.
      
      Return ONLY this JSON:
      {
        "executionRate": "percentage",
        "primaryBlocker": "one sentence summary",
        "recommendation": "one specific parameter adjustment"
      }

      DATA:
      ${cleanLogs}
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json(JSON.parse(result.response.text()));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
