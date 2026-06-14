import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';
import type { CommunityOpportunity } from '@/lib/community/types';

export const runtime = 'nodejs';

const VALID_TYPES = [
  'volunteer',
  'donation',
  'event',
  'shelter',
  'food',
  'other',
] as const;
type OppType = (typeof VALID_TYPES)[number];

function isNonExpired(o: CommunityOpportunity, now: number): boolean {
  if (o.status !== 'approved') return false;
  if (o.endAt && Date.parse(o.endAt) < now) return false;
  return true;
}

// GET /api/community-opportunities — public list of approved, non-expired records.
// Admins (Bearer token) get the full list including pending/expired for review.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await readStore();
  const opportunities = store.opportunities ?? [];

  if (isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ opportunities });
  }

  const now = Date.now();
  const visible = opportunities.filter((o) => isNonExpired(o, now));
  return NextResponse.json({ opportunities: visible });
}

// POST /api/community-opportunities — admin-only create. There is no public
// write path: community opportunities are admin-owned records only.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let payload: Partial<CommunityOpportunity>;
  try {
    payload = (await request.json()) as Partial<CommunityOpportunity>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    !payload.title?.trim() ||
    !payload.organizationName?.trim() ||
    !payload.type ||
    !VALID_TYPES.includes(payload.type as OppType)
  ) {
    return NextResponse.json(
      { error: 'Missing required fields (title, organizationName, type)' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const record: CommunityOpportunity = {
    id: randomUUID(),
    title: payload.title.trim(),
    type: payload.type as OppType,
    organizationName: payload.organizationName.trim(),
    address: payload.address?.trim() || undefined,
    latitude: typeof payload.latitude === 'number' ? payload.latitude : undefined,
    longitude:
      typeof payload.longitude === 'number' ? payload.longitude : undefined,
    startAt: payload.startAt || undefined,
    endAt: payload.endAt || undefined,
    sourceUrl: payload.sourceUrl?.trim() || undefined,
    contactPhone: payload.contactPhone?.trim() || undefined,
    contactEmail: payload.contactEmail?.trim() || undefined,
    status: payload.status === 'approved' ? 'approved' : 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.opportunities.push(record);
  await writeStore(store);

  return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
}
