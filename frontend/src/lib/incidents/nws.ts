import type {
  IncidentCategory,
  IncidentItem,
  IncidentSeverity,
} from './types';

type NwsFeature = {
  id?: string;
  geometry?: unknown;
  properties?: {
    id?: string;
    event?: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity?: string;
    effective?: string;
    expires?: string;
    areaDesc?: string;
    web?: string;
  };
};

type NwsFetchResult = {
  ok: boolean;
  incidents: IncidentItem[];
};

const NWS_USER_AGENT = 'HelpNearby/1.0 (https://helpnearby.co)';

function mapSeverity(capSeverity: string | undefined): IncidentSeverity {
  switch ((capSeverity || '').toLowerCase()) {
    case 'extreme':
      return 'emergency';
    case 'severe':
      return 'warning';
    case 'moderate':
      return 'watch';
    default:
      return 'advisory';
  }
}

function mapCategory(event: string | undefined): IncidentCategory {
  const e = (event || '').toLowerCase();
  if (!e) return 'other';
  if (e.includes('evacuation')) return 'evacuation';
  if (e.includes('shelter')) return 'shelter-in-place';
  if (e.includes('hazmat') || e.includes('hazardous materials')) return 'hazmat';
  if (e.includes('fire')) return 'fire';
  if (
    e.includes('tornado') ||
    e.includes('thunderstorm') ||
    e.includes('flood') ||
    e.includes('hurricane') ||
    e.includes('tropical') ||
    e.includes('winter') ||
    e.includes('snow') ||
    e.includes('wind') ||
    e.includes('heat') ||
    e.includes('freeze') ||
    e.includes('frost') ||
    e.includes('fog') ||
    e.includes('storm')
  ) {
    return 'weather';
  }
  return 'other';
}

export async function fetchNwsIncidents(
  lat: number,
  lng: number,
  fetchedAt: string,
): Promise<NwsFetchResult> {
  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': NWS_USER_AGENT,
        Accept: 'application/geo+json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { ok: false, incidents: [] };
    }

    const data = (await response.json()) as { features?: NwsFeature[] };
    const features = Array.isArray(data.features) ? data.features : [];

    const incidents: IncidentItem[] = features.map((feature, index) => {
      const p = feature.properties || {};
      const id = p.id || feature.id || `nws-${index}`;
      return {
        id,
        title: p.event || p.headline || 'Weather Alert',
        status: 'active',
        severity: mapSeverity(p.severity),
        category: mapCategory(p.event),
        area: p.areaDesc || '',
        geometry: feature.geometry ?? null,
        effective: p.effective || null,
        expires: p.expires || null,
        instructions: p.instruction || '',
        source: {
          name: 'National Weather Service',
          url: p.web || 'https://www.weather.gov/',
          kind: 'api',
          fetchedAt,
        },
      };
    });

    return { ok: true, incidents };
  } catch {
    return { ok: false, incidents: [] };
  }
}
