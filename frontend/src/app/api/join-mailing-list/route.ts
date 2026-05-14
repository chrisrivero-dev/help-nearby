import { NextRequest, NextResponse } from 'next/server';

interface MailingListPayload {
  email: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { email }: MailingListPayload = await req.json();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'Email is required' },
      { status: 400 },
    );
  }

  // Simple email validation
  if (!email.includes('@') || !email.split('@')[1]?.includes('.')) {
    return NextResponse.json(
      { ok: false, error: 'Invalid email format' },
      { status: 400 },
    );
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { ok: false, error: 'Backend URL not configured' },
      { status: 500 },
    );
  }

  try {
    const backendRes = await fetch(`${backendUrl}/api/join-mailing-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: errorData.detail || 'Failed to join mailing list' },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[join-mailing-list] Backend fetch error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to connect to backend' },
      { status: 502 },
    );
  }
}
