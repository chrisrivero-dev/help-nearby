import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/community/moderation';
import { getHealthSnapshot } from '@/lib/registry/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/source-health — per-source health + circuit state for the admin
// dashboard. Reflects this serverless instance's observations since cold start.
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const sources = getHealthSnapshot();
  const summary = {
    total: sources.length,
    healthy: sources.filter((s) => s.status === 'healthy').length,
    degraded: sources.filter((s) => s.status === 'degraded').length,
    circuitOpen: sources.filter((s) => s.status === 'circuit_open').length,
  };
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary,
    sources,
  });
}
