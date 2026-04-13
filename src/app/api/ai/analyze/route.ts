import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { logs } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    if (!logs || logs.length === 0) return NextResponse.json({ error: "No logs provided" }, { status: 400 });

    // 1. CLEAN THE DATA: Convert objects [{message: '...', type: '...'}] into readable strings
    const cleanLogs = logs.map((log: any) => {
      // If your Supabase column is named 'message' and 'log_type':
      return `[${log.log_type || 'INFO'}] ${log.message || ''} (${log.symbol || ''})`;
    }).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. USE THE 2026 WORKHORSE MODEL
    // gemini-3.1-flash-lite-preview is the most efficient for logs in April 2026
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      You are 'OpenClaw', the AI analytics engine for the KIMOO CRT trading system.
      Analyze these system logs and identify why trades are being skipped.

      Respond ONLY in this JSON format:
      {
        "executionRate": "e.g., 15%",
        "primaryBlocker": "Short summary of the main filter blocking trades",
        "recommendation": "One specific parameter adjustment"
      }

      LOG DATA:
      ${cleanLogs}
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json(JSON.parse(result.response.text()));

  } catch (error: any) {
    console.error("OpenClaw Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
