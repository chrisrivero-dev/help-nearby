import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'node:crypto';
import { readStore, writeStore } from '@/lib/community/store';
import { computeResourceKey } from '@/lib/community/resourceKey';
import { autoCheck } from '@/lib/community/moderation';
import { checkRateLimit } from '@/lib/community/rateLimiter';
import type { CommunityTip } from '@/lib/community/types';

export const runtime = 'nodejs';

// GET /api/community-tips?resourceKeys=key1,key2,...
export async function GET(request: NextRequest): Promise<NextResponse> {
  const keys = request.nextUrl.searchParams.get('resourceKeys');
  if (!keys) {
    return NextResponse.json({ tips: {} });
  }
  const keySet = new Set(keys.split(',').map((k) => k.trim()).filter(Boolean));
  const store = await readStore();
  const result: Record<string, CommunityTip[]> = {};
  for (const tip of store.tips) {
    if (tip.status === 'approved' && keySet.has(tip.resourceKey)) {
      if (!result[tip.resourceKey]) result[tip.resourceKey] = [];
      result[tip.resourceKey].push(tip);
    }
  }
  return NextResponse.json({ tips: result });
}

interface SubmitBody {
  resourceSnapshot: {
    name: string;
    address?: string;
    category: string;
    sourceName: string;
  };
  body: string;
  submitterName?: string;
  submitterEmail?: string;
  visitedOn?: string;
  website?: string; // honeypot
}

// POST /api/community-tips
export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: SubmitBody;
  try {
    payload = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot
  if (payload.website) {
    return NextResponse.json({ ok: true }); // silent reject
  }

  const { resourceSnapshot, body, submitterName, submitterEmail, visitedOn } =
    payload;

  if (!resourceSnapshot?.name || !body?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (body.length > 280) {
    return NextResponse.json({ error: 'Tip too long (max 280 characters)' }, { status: 422 });
  }

  const check = autoCheck(body);
  if (check.action === 'reject') {
    if (check.reason === 'Emergency language detected') {
      return NextResponse.json(
        {
          error: 'emergency',
          message:
            'This sounds like an emergency. Please call 911 or 211 for immediate assistance.',
        },
        { status: 422 },
      );
    }
    return NextResponse.json({ ok: true }); // silent reject for spam
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const salt = process.env.HASH_SALT ?? 'hn-salt';
  const submitterHash = createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);

  if (!checkRateLimit(submitterHash)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  const resourceKey = computeResourceKey(
    resourceSnapshot.name,
    resourceSnapshot.address,
  );

  const tip: CommunityTip = {
    id: randomUUID(),
    resourceKey,
    resourceSnapshot: {
      name: resourceSnapshot.name,
      address: resourceSnapshot.address,
      category: resourceSnapshot.category,
      sourceName: resourceSnapshot.sourceName,
    },
    body: body.trim(),
    submitterName: submitterName?.trim().slice(0, 60) || undefined,
    submitterEmail: submitterEmail?.trim().slice(0, 200) || undefined,
    submitterHash,
    visitedOn: visitedOn || undefined,
    status: check.action === 'flag' ? 'needs_review' : 'pending',
    createdAt: new Date().toISOString(),
  };

  const store = await readStore();
  store.tips.push(tip);
  await writeStore(store);

  return NextResponse.json({ ok: true }, { status: 201 });
}
