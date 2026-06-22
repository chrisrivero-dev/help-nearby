import { NextRequest, NextResponse } from 'next/server';
import { collectNyc311 } from '@/lib/nyc311/importer';

export const runtime = 'nodejs';

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

// GET /api/nyc311 — live NYC 311 records near a point. `applies` is false for
// non-NYC points (no source matches the NYC jurisdiction), which the panel uses
// to hide itself. This is the authoritative NYC gate (server-side jurisdiction).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const latitude = numberParam(request, ['latitude', 'lat']);
  const longitude = numberParam(request, ['longitude', 'lng']);

  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ items: [], applies: false });
  }

  const result = await collectNyc311({ latitude, longitude });
  return NextResponse.json({
    items: result.items,
    applies: result.applies,
    import: {
      degraded: result.degraded,
      checked: result.checked.map((s) => ({
        id: s.id,
        name: s.name,
        ok: s.ok,
      })),
    },
  });
}
