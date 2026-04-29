import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://kimoocrt.onrender.com';

    console.log(`Proxying trial request for ${body.userId} to ${backendUrl}`);

    const res = await fetch(`${backendUrl}/api/start-trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Trial Proxy Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
