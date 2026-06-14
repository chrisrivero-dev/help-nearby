import { NextRequest, NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/community/store';
import { isAdminAuthorized } from '@/lib/community/moderation';

export const runtime = 'nodejs';

interface ModerateBody {
  action: 'approve' | 'reject' | 'needs_review';
  reason?: string;
  editedBody?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!isAdminAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  let payload: ModerateBody;
  try {
    payload = (await request.json()) as ModerateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, reason, editedBody } = payload;
  if (!['approve', 'reject', 'needs_review'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const store = await readStore();
  const tip = store.tips.find((t) => t.id === id);
  if (!tip) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    needs_review: 'needs_review',
  } as const;

  tip.status = statusMap[action];
  tip.moderatedAt = new Date().toISOString();
  tip.moderatedBy = 'admin';

  if (action === 'reject' && reason) {
    tip.rejectionReason = reason;
  }
  if (editedBody && editedBody.trim() !== tip.body) {
    tip.originalBody = tip.body;
    tip.body = editedBody.trim().slice(0, 280);
  }

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
