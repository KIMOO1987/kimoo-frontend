import { NextResponse } from 'next/server';

// Note: Ensure you have OPENAI_API_KEY (or your preferred LLM key) in your .env.local
export async function POST(req: Request) {
  try {
    const { logs } = await req.json();

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: "No logs provided for analysis." }, { status: 400 });
    }

    // Combine the logs into a single readable string
    const logData = logs.join('\n');

    // The "OpenClaw" Agentic Prompt
    const systemPrompt = `
      You are 'OpenClaw', an expert quantitative trading AI for the KIMOO CRT system.
      Analyze the following system logs from a cTrader execution engine. 
      Focus specifically on 'SKIP', 'REJECT', 'FILTER', and 'ERROR' events.
      
      You MUST respond in strictly valid JSON format with exactly these 3 keys:
      {
        "executionRate": "A string like '12%' based on entries vs skips",
        "primaryBlocker": "A short 1-sentence summary of why trades are failing/skipping most often",
        "recommendation": "One actionable parameter adjustment the user should make (e.g., 'Increase Max Gap Pips to 3.0')"
      }
    `;

    // Example using standard OpenAI API fetch (You can swap this for Anthropic/Claude if you prefer)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast, cheap, and smart enough for log parsing
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these recent logs:\n${logData}` }
        ],
        temperature: 0.2
      })
    });

    const aiData = await aiResponse.json();
    const insights = JSON.parse(aiData.choices[0].message.content);

    return NextResponse.json(insights);

  } catch (error: any) {
    console.error("OpenClaw Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
