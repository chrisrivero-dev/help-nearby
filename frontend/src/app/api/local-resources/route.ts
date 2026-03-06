import { NextRequest, NextResponse } from 'next/server';

export interface LocalEntry {
  title: string;
  url: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const category    = searchParams.get('category')    ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const city        = searchParams.get('city')        ?? '';
  const state       = searchParams.get('state')       ?? '';

  // TODO: replace with real DB / external API lookup using the params above
  const results: LocalEntry[] = [
    { title: `${city} Rescue Mission`,    url: 'https://www.cityrescuemission.com' },
    { title: `${state} Housing Authority`, url: 'https://www.hud.gov/findhelp' },
    { title: '211 Local Help',            url: 'https://www.211.org' },
  ];

  return NextResponse.json(results);
}
