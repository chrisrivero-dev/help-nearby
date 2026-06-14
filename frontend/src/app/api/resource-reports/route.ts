import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'node:crypto';
import { readStore, writeStore } from '@/lib/community/store';
import { computeResourceKey } from '@/lib/community/resourceKey';
import { checkRateLimit } from '@/lib/community/rateLimiter';
import { isAdminAuthorized } from '@/lib/community/moderation';
import type { ListingIssueReport } from '@/lib/community/types';

export const runtime = 'nodejs';

const VALID_ISSUE_TYPES = [
  'wrong_hours',
  'closed',
  'wrong_phone',
  'wrong_address',
  'not_offering_service',
  'other',
] as const;
type IssueType = (typeof VALID_ISSUE_TYPES)[number];

// GET /api/resource-reports — admin list
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const store = await readStore();
  const status = request.nextUrl.searchParams.get('status');
  const reports = status
    ? store.reports.filter((r) => r.status === status)
    : store.reports;
  return NextResponse.json({ reports });
}

// POST /api/resource-reports
export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: {
    resourceSnapshot: { name: string; address?: string };
    issueType: IssueType;
    detail?: string;
    website?: string; // honeypot
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.website) return NextResponse.json({ ok: true });

  const { resourceSnapshot, issueType, detail } = payload;
  if (!resourceSnapshot?.name || !VALID_ISSUE_TYPES.includes(issueType)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

  if (!checkRateLimit(submitterHash, 5)) {
    return NextResponse.json({ error: 'Too many submissions.' }, { status: 429 });
  }

  const report: ListingIssueReport = {
    id: randomUUID(),
    resourceKey: computeResourceKey(resourceSnapshot.name, resourceSnapshot.address),
    resourceSnapshot: {
      name: resourceSnapshot.name,
      address: resourceSnapshot.address,
    },
    issueType,
    detail: detail?.trim().slice(0, 500) || undefined,
    submitterHash,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  const store = await readStore();
  store.reports.push(report);
  await writeStore(store);

  return NextResponse.json({ ok: true }, { status: 201 });
}
