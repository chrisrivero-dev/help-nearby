import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { checkRateLimit } from '@/lib/community/rateLimiter';
import {
  geocodeCustomSource,
  makeCustomSourceRecord,
  readCustomSources,
  validateCustomSourcePayload,
  writeCustomSources,
  type CustomSourcePayload,
} from '@/lib/resources/customSources';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: CustomSourcePayload;
  try {
    payload = (await request.json()) as CustomSourcePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateCustomSourcePayload(payload);
  if (!validation.ok) {
    if (validation.status === 200) return NextResponse.json({ ok: true });
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status ?? 400 },
    );
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
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  const location = await geocodeCustomSource(validation.value);
  if (!location) {
    return NextResponse.json(
      {
        error:
          'Could not map that location. Try adding a street address or ZIP code.',
      },
      { status: 422 },
    );
  }

  const record = makeCustomSourceRecord(validation.value, location);
  const store = await readCustomSources();
  store.sources.push(record);
  await writeCustomSources(store);

  return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
}
