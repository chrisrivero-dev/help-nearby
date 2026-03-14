import { NextRequest, NextResponse } from 'next/server';

export interface LocalEntry {
  title: string;
  url: string;
}

/* ── In-process cache (survives across requests, resets on cold start) ── */
type CacheEntry = { results: LocalEntry[]; expiresAt: number };
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Maps category + subcategory to a human-readable search term. */
const QUERY_TERMS: Record<string, Record<string, string>> = {
  housing: {
    'Emergency Shelter':  'emergency shelter',
    'Rent Assistance':    'rent assistance',
    'Temporary Housing':  'transitional housing',
  },
  food: {
    'Food Banks':      'food bank',
    'Free Meals':      'free meals soup kitchen',
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

/* ── Fallback: search-link results (housing / finance, or on API failure) ── */
function buildSearchLinks(
  subcategory: string,
  city: string,
  state: string,
  term: string,
): LocalEntry[] {
  const enc = encodeURIComponent(`${city} ${term}`.trim());
  return [
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
}

/* ── Partial-fill: pad API results with search links up to 3 entries ────── */
const RESULT_CAP = 3;

function fillToThree(
  entries: LocalEntry[],
  subcategory: string,
  city: string,
  state: string,
  term: string,
): LocalEntry[] {
  if (entries.length >= RESULT_CAP) return entries.slice(0, RESULT_CAP);
  const fallbacks = buildSearchLinks(subcategory, city, state, term);
  return [...entries, ...fallbacks].slice(0, RESULT_CAP);
}

/* ── Food: Yelp Fusion API ──────────────────────────────────────────────── */
interface YelpBusiness { name: string; url: string; rating?: number }

async function fetchFoodResources(
  city: string,
  state: string,
  term: string,
): Promise<LocalEntry[]> {
  const apiKey = process.env.FOOD_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    term:     term,
    location: `${city}, ${state}`,
    limit:    '3',
    sort_by:  'rating',
  });
  const res = await fetch(
    `https://api.yelp.com/v3/businesses/search?${params}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) return [];

  const data = await res.json() as { businesses?: YelpBusiness[] };
  return (data.businesses ?? [])
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((b) => ({ title: b.name, url: b.url }));
}

/* ── Safety: Google Places Text Search API ──────────────────────────────── */
interface PlacesResult { name: string; place_id: string; rating?: number }

async function fetchSafetyResources(
  city: string,
  state: string,
  term: string,
): Promise<LocalEntry[]> {
  const apiKey = process.env.SAFETY_API_KEY;
  if (!apiKey) return [];

  // Location bias is embedded in the query string ("…in {city}, {state}").
  // The Text Search API uses the location words in the query as its primary
  // geographic anchor; no separate lat/lng param is needed.
  const params = new URLSearchParams({
    query: `${term} in ${city}, ${state}`,
    key:   apiKey,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
  );
  if (!res.ok) return [];

  const data = await res.json() as { results?: PlacesResult[] };
  return (data.results ?? [])
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3)
    .map((p) => ({
      title: p.name,
      url:   `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));
}

/* ── Route handler ──────────────────────────────────────────────────────── */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const category    = searchParams.get('category')    ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const city        = searchParams.get('city')        ?? '';
  const state       = searchParams.get('state')       ?? '';

  /* Cache check */
  const cacheKey = `${category}|${subcategory}|${city}|${state}`;
  const cached   = _cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.results);
  }

  const term = QUERY_TERMS[category]?.[subcategory] ?? subcategory;

  /* Dispatch to the right fetcher; fill any gaps with search links */
  let apiResults: LocalEntry[] = [];
  if (category === 'food') {
    apiResults = await fetchFoodResources(city, state, term).catch(() => []);
  } else if (category === 'safety') {
    apiResults = await fetchSafetyResources(city, state, term).catch(() => []);
  }

  const results = fillToThree(apiResults, subcategory, city, state, term);

  /* Populate cache */
  _cache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json(results);
}
