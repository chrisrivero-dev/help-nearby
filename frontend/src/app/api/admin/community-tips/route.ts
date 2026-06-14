import { NextRequest, NextResponse } from 'next/server';
import { readStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';

export const runtime = 'nodejs';

// GET /api/admin/community-tips — returns all tips, all statuses, for admin queue
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const store = await readStore();
  const status = request.nextUrl.searchParams.get('status');
  const tips = status
    ? store.tips.filter((t) => t.status === status)
    : store.tips;
  return NextResponse.json({ tips });
}
