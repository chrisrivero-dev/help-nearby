import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';
import type { LocalUpdate } from '@/lib/community/types';

export const runtime = 'nodejs';

const VALID_TYPES = [
  'cooling',
  'shelter',
  'food',
  'road',
  'emergency',
  'general',
] as const;
type UpdateType = (typeof VALID_TYPES)[number];

function isNonExpired(u: LocalUpdate, now: number): boolean {
  if (u.status !== 'approved') return false;
  if (u.endsAt && Date.parse(u.endsAt) < now) return false;
  return true;
}

// GET /api/local-updates — public list of approved, non-expired records.
// Admins (Bearer token) get the full list including pending/expired for review.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await readStore();
  const updates = store.updates ?? [];

  if (isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ updates });
  }

  const now = Date.now();
  const visible = updates.filter((u) => isNonExpired(u, now));
  return NextResponse.json({ updates: visible });
}

// POST /api/local-updates — admin-only create. Updates are admin-owned records
// backed by an authoritative source; there is no public write path.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let payload: Partial<LocalUpdate>;
  try {
    payload = (await request.json()) as Partial<LocalUpdate>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    !payload.title?.trim() ||
    !payload.description?.trim() ||
    !payload.sourceName?.trim() ||
    !payload.updateType ||
    !VALID_TYPES.includes(payload.updateType as UpdateType)
  ) {
    return NextResponse.json(
      {
        error:
          'Missing required fields (title, description, sourceName, updateType)',
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const record: LocalUpdate = {
    id: randomUUID(),
    title: payload.title.trim(),
    updateType: payload.updateType as UpdateType,
    description: payload.description.trim(),
    address: payload.address?.trim() || undefined,
    latitude: typeof payload.latitude === 'number' ? payload.latitude : undefined,
    longitude:
      typeof payload.longitude === 'number' ? payload.longitude : undefined,
    sourceName: payload.sourceName.trim(),
    sourceUrl: payload.sourceUrl?.trim() || undefined,
    startsAt: payload.startsAt || undefined,
    endsAt: payload.endsAt || undefined,
    status: payload.status === 'approved' ? 'approved' : 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.updates.push(record);
  await writeStore(store);

  return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
}
