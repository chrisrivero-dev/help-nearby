import { NextRequest, NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';

export const runtime = 'nodejs';

const VALID_STATUSES = [
  'open',
  'investigating',
  'resolved_fixed',
  'resolved_unverified',
  'dismissed',
] as const;

// PATCH /api/resource-reports/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  let payload: { status: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(payload.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const store = await readStore();
  const report = store.reports.find((r) => r.id === id);
  if (!report) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  report.status = payload.status as (typeof VALID_STATUSES)[number];
  report.resolvedAt = new Date().toISOString();
  report.resolvedBy = 'admin';

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
