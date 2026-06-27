import { NextRequest, NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';
import { importCommunityOpportunities } from '@/lib/community/sources/importer';

export const runtime = 'nodejs';

function numberFrom(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const body =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};
  const latitude = numberFrom(body.latitude ?? body.lat);
  const longitude = numberFrom(body.longitude ?? body.lng);
  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields (latitude, longitude)' },
      { status: 400 },
    );
  }

  const store = await readStore();
  const result = await importCommunityOpportunities(store, {
    latitude,
    longitude,
  });
  await writeStore(store);

  return NextResponse.json({
    ok: true,
    created: result.created,
    updated: result.updated,
    expired: result.expired,
    degraded: result.degraded,
    checked: result.checked,
    imported: result.opportunities.length,
  });
}
