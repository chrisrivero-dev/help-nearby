import { NextRequest, NextResponse } from 'next/server';

interface SmsPayload {
  to: string;
  resourceName: string;
  resourceAddress: string;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

export async function POST(req: NextRequest) {
  const { to, resourceName, resourceAddress }: SmsPayload = await req.json();

  if (!to || !resourceName || !resourceAddress) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  const digits = to.replace(/\D/g, '');
  if (digits.length < 10) {
    return NextResponse.json({ ok: false, error: 'Invalid phone number' }, { status: 400 });
  }

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_PHONE_NUMBER;

  const missing: string[] = [];
  if (!accountSid)  missing.push('TWILIO_ACCOUNT_SID');
  if (!authToken)   missing.push('TWILIO_AUTH_TOKEN');
  if (!fromNumber)  missing.push('TWILIO_PHONE_NUMBER');

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'SMS service not configured', missing },
      { status: 503 },
    );
  }

  const body = `Help Nearby: ${resourceName}\n${resourceAddress}`;

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: normalizePhone(to), From: fromNumber!, Body: body }),
    },
  );

  if (!twilioRes.ok) {
    let twilioMessage = `HTTP ${twilioRes.status}`;
    try {
      const errBody = await twilioRes.json() as { message?: string; code?: number };
      twilioMessage = errBody.message ?? twilioMessage;
      console.error('[send-sms] Twilio error:', errBody);
    } catch {
      console.error('[send-sms] Twilio error: status', twilioRes.status);
    }
    return NextResponse.json(
      { ok: false, error: 'Failed to send SMS', detail: twilioMessage },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
