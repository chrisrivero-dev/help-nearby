import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';
import { importCommunityOpportunities } from '@/lib/community/sources/importer';
import { listCommunitySourceRows } from '@/lib/community/sources/registry';
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

function numberParam(
  request: NextRequest,
  names: string[],
): number | undefined {
  for (const name of names) {
    const raw = request.nextUrl.searchParams.get(name);
    if (!raw) continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function hasOpportunityLocation(o: CommunityOpportunity): boolean {
  return (
    (typeof o.latitude === 'number' &&
      Number.isFinite(o.latitude) &&
      typeof o.longitude === 'number' &&
      Number.isFinite(o.longitude)) ||
    !!o.address?.trim()
  );
}

// GET /api/community-opportunities — public list of approved, non-expired records.
// Admins (Bearer token) get the full list including pending/expired for review.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await readStore();
  store.opportunities ??= [];

  if (isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ opportunities: store.opportunities });
  }

  const latitude = numberParam(request, ['latitude', 'lat']);
  const longitude = numberParam(request, ['longitude', 'lng']);
  let importMeta:
    | {
        created: number;
        updated: number;
        expired: number;
        degraded: boolean;
        checked: Array<{ id: string; name: string; ok: boolean }>;
      }
    | undefined;
  let selectedSourceIds: Set<string> | undefined;

  if (latitude !== undefined && longitude !== undefined) {
    const result = await importCommunityOpportunities(store, {
      latitude,
      longitude,
    });
    await writeStore(store);
    selectedSourceIds = new Set(result.checked.map((s) => s.id));
    importMeta = {
      created: result.created,
      updated: result.updated,
      expired: result.expired,
      degraded: result.degraded,
      checked: result.checked.map((s) => ({
        id: s.id,
        name: s.name,
        ok: s.ok,
      })),
    };
  }

  const now = Date.now();
  const requiresLocationBySource = new Map(
    listCommunitySourceRows().map((s) => [s.id, s.requiresLocation !== false]),
  );
  const visible = store.opportunities.filter(
    (o) =>
      isNonExpired(o, now) &&
      (!selectedSourceIds ||
        !o.sourceId ||
        selectedSourceIds.has(o.sourceId)) &&
      (!o.sourceId ||
        (selectedSourceIds && !selectedSourceIds.has(o.sourceId)) ||
        requiresLocationBySource.get(o.sourceId) === false ||
        hasOpportunityLocation(o)),
  );
  return NextResponse.json({ opportunities: visible, import: importMeta });
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
    description: payload.description?.trim() || undefined,
    venueName: payload.venueName?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    latitude:
      typeof payload.latitude === 'number' ? payload.latitude : undefined,
    longitude:
      typeof payload.longitude === 'number' ? payload.longitude : undefined,
    startAt: payload.startAt || undefined,
    endAt: payload.endAt || undefined,
    sourceId: payload.sourceId?.trim() || undefined,
    sourceName: payload.sourceName?.trim() || undefined,
    externalId: payload.externalId?.trim() || undefined,
    sourceUrl: payload.sourceUrl?.trim() || undefined,
    contactPhone: payload.contactPhone?.trim() || undefined,
    contactEmail: payload.contactEmail?.trim() || undefined,
    importedAt: payload.importedAt || undefined,
    lastSeenAt: payload.lastSeenAt || undefined,
    status: payload.status === 'approved' ? 'approved' : 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.opportunities.push(record);
  await writeStore(store);

  return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
}
