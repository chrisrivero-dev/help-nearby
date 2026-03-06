import { NextRequest, NextResponse } from 'next/server';

export interface LocalEntry {
  title: string;
  url: string;
}

/** Maps category + subcategory to a human-readable search term. */
const QUERY_TERMS: Record<string, Record<string, string>> = {
  housing: {
    'Emergency Shelter':  'emergency shelter',
    'Rent Assistance':    'rent assistance',
    'Temporary Housing':  'transitional housing',
  },
  food: {
    'Food Banks':     'food bank',
    'Free Meals':     'free meals soup kitchen',
    'SNAP Enrollment': 'SNAP office',
  },
  safety: {
    'Domestic Violence Help': 'domestic violence shelter',
    'Emergency Services':     'emergency services',
    'Crisis Lines':           'crisis hotline',
  },
  finance: {
    'Cash Assistance':  'cash assistance program',
    'Utility Help':     'utility assistance',
    'Debt Counseling':  'debt counseling nonprofit',
  },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const category    = searchParams.get('category')    ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const city        = searchParams.get('city')        ?? '';
  const state       = searchParams.get('state')       ?? '';

  const term  = QUERY_TERMS[category]?.[subcategory] ?? subcategory;
  const query = `${city} ${term}`.trim();
  const enc   = encodeURIComponent(query);

  const results: LocalEntry[] = [
    {
      title: `${subcategory} near ${city}, ${state}`,
      url:   `https://www.google.com/maps/search/${enc}`,
    },
    {
      title: 'Find Local Help (211)',
      url:   `https://www.211.org/search?query=${enc}`,
    },
    {
      title: 'Government Assistance Programs',
      url:   `https://www.benefits.gov/search?query=${enc}`,
    },
  ];

  return NextResponse.json(results);
}
