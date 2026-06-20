import { randomUUID } from 'node:crypto';
import { haversineDistanceMiles } from '@/lib/location/distance';
import type { NearbyQuery, NearbyResource, ResourceCategory } from './schema';
import { CATEGORY_LABELS } from './categories';

export interface CustomSourceRecord {
  id: string;
  name: string;
  category: ResourceCategory;
  customCategoryLabel?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website: string;
  latitude: number;
  longitude: number;
  status: 'active';
  createdAt: string;
}

export interface CustomSourceStore {
  sources: CustomSourceRecord[];
}

export interface CustomSourcePayload {
  name?: unknown;
  phone?: unknown;
  website?: unknown;
  category?: unknown;
  customCategoryLabel?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
  websiteHoneypot?: unknown;
}

export interface ValidCustomSourceInput {
  name: string;
  phone?: string;
  website: string;
  category: ResourceCategory;
  customCategoryLabel?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const VALID_CATEGORIES = new Set<ResourceCategory>(
  Object.keys(CATEGORY_LABELS) as ResourceCategory[],
);

const cleanString = (value: unknown, max = 240) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeZip = (value: unknown) => {
  const zip = cleanString(value, 20);
  const match = zip.match(/\d{5}(?:-\d{4})?/);
  return match?.[0];
};

const normalizeState = (value: unknown) => {
  const state = cleanString(value, 40);
  if (!state) return undefined;
  return /^[a-zA-Z]{2}$/.test(state) ? state.toUpperCase() : state;
};

export function validateCustomSourcePayload(payload: CustomSourcePayload):
  | { ok: true; value: ValidCustomSourceInput }
  | { ok: false; error: string; status?: number } {
  const body = payload ?? {};
  if (cleanString(body.websiteHoneypot)) {
    return { ok: false, error: 'ok', status: 200 };
  }

  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 40) || undefined;
  const websiteRaw = cleanString(body.website, 500);
  const category = cleanString(body.category) as ResourceCategory;
  const customCategoryLabel =
    cleanString(body.customCategoryLabel, 60) || undefined;
  const address = cleanString(body.address, 180) || undefined;
  const city = cleanString(body.city, 80) || undefined;
  const state = normalizeState(body.state);
  const zip = normalizeZip(body.zip);

  if (!name) return { ok: false, error: 'Name is required', status: 400 };
  if (!websiteRaw) return { ok: false, error: 'Link is required', status: 400 };
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, error: 'Invalid category', status: 400 };
  }
  if (!zip && !(city && state)) {
    return {
      ok: false,
      error: 'Enter either a ZIP code or a city and state',
      status: 400,
    };
  }

  let website: string;
  try {
    const url = new URL(websiteRaw);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { ok: false, error: 'Link must be http or https', status: 400 };
    }
    website = url.toString();
  } catch {
    return { ok: false, error: 'Enter a valid link', status: 400 };
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return { ok: false, error: 'Enter a valid phone number', status: 400 };
    }
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      website,
      category,
      customCategoryLabel,
      address,
      city,
      state,
      zip,
    },
  };
}

function buildGeocodeQuery(input: ValidCustomSourceInput): string {
  const addressParts = [input.address, input.city, input.state, input.zip]
    .filter(Boolean)
    .join(', ');
  if (addressParts) return addressParts;
  if (input.zip) return input.zip;
  return [input.city, input.state].filter(Boolean).join(', ');
}

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zip?: string;
}

async function geocodeZip(zip: string): Promise<GeocodedLocation | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${zip.slice(0, 5)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const place = data?.places?.[0];
  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    city: place?.['place name'],
    state: place?.['state abbreviation'],
    zip,
  };
}

async function geocodeNominatim(
  input: ValidCustomSourceInput,
): Promise<GeocodedLocation | null> {
  const params =
    input.address && (input.city || input.state || input.zip)
      ? new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          countrycodes: 'us',
          limit: '1',
          street: input.address,
          ...(input.city ? { city: input.city } : {}),
          ...(input.state ? { state: input.state } : {}),
          ...(input.zip ? { postalcode: input.zip } : {}),
        })
      : null;
  const structured = params ? await fetchNominatim(params) : null;
  if (structured) return structured;

  const query = buildGeocodeQuery(input);
  if (!query) return null;
  return fetchNominatim(
    new URLSearchParams({
      format: 'json',
      addressdetails: '1',
      countrycodes: 'us',
      limit: '1',
      q: query,
    }),
    input,
  );
}

async function fetchNominatim(
  params: URLSearchParams,
  input?: ValidCustomSourceInput,
): Promise<GeocodedLocation | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        'User-Agent':
          'help-nearby-app/1.0 (+https://github.com/chrisrivero-dev/help-nearby)',
      },
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const top = Array.isArray(data) ? data[0] : null;
  const latitude = Number(top?.lat);
  const longitude = Number(top?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const address = top.address ?? {};
  return {
    latitude,
    longitude,
    city:
      address.city ??
      address.town ??
      address.village ??
      address.hamlet ??
      input?.city,
    state: address.state ?? input?.state,
    zip: address.postcode ?? input?.zip,
  };
}

export async function geocodeCustomSource(
  input: ValidCustomSourceInput,
): Promise<GeocodedLocation | null> {
  if (input.address || (input.city && input.state)) {
    const exact = await geocodeNominatim(input);
    if (exact) return exact;
  }
  if (input.zip) return geocodeZip(input.zip);
  return null;
}

async function customSourceStorePath() {
  const path = await import('node:path');
  const dataDir = path.join(process.cwd(), '.data');
  return {
    dataDir,
    storeFile: path.join(dataDir, 'custom.sources.json'),
  };
}

export async function readCustomSources(): Promise<CustomSourceStore> {
  const { promises: fs } = await import('node:fs');
  const { dataDir, storeFile } = await customSourceStorePath();
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(storeFile, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CustomSourceStore>;
    return { sources: parsed.sources ?? [] };
  } catch {
    return { sources: [] };
  }
}

export async function writeCustomSources(
  data: CustomSourceStore,
): Promise<void> {
  const { promises: fs } = await import('node:fs');
  const { dataDir, storeFile } = await customSourceStorePath();
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storeFile, JSON.stringify(data, null, 2), 'utf-8');
}

export function makeCustomSourceRecord(
  input: ValidCustomSourceInput,
  location: GeocodedLocation,
): CustomSourceRecord {
  return {
    id: randomUUID(),
    name: input.name,
    category: input.category,
    customCategoryLabel: input.customCategoryLabel,
    address: input.address,
    city: input.city ?? location.city,
    state: input.state ?? location.state,
    zip: input.zip ?? location.zip,
    phone: input.phone,
    website: input.website,
    latitude: location.latitude,
    longitude: location.longitude,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

export function customSourcesToNearbyResources(
  records: CustomSourceRecord[],
  query: NearbyQuery,
): NearbyResource[] {
  return records
    .filter((record) => record.status === 'active')
    .map((record): NearbyResource => {
      const distanceMiles = haversineDistanceMiles(
        query.latitude,
        query.longitude,
        record.latitude,
        record.longitude,
      );
      return {
        id: record.id,
        name: record.name,
        category: record.category,
        customCategoryLabel: record.customCategoryLabel,
        address: record.address,
        city: record.city,
        state: record.state,
        zip: record.zip,
        phone: record.phone,
        website: record.website,
        latitude: record.latitude,
        longitude: record.longitude,
        distanceMiles,
        sourceName: `CUSTOM: ${record.website}`,
        sourceUrl: record.website,
        sourceType: 'custom',
        sourceId: 'custom-sources',
        trust: 30,
        createdAt: record.createdAt,
        isLive: false,
        isCustom: true,
      };
    })
    .filter(
      (resource) => (resource.distanceMiles ?? Infinity) <= query.radiusMiles,
    );
}
