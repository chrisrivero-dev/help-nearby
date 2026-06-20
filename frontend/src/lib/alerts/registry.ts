/**
 * Alerts registry — the scoped source list feeding AlertPanel. Built on the
 * shared registry core (resolver-based selection + fan-out), typed to WeatherAlert.
 * Today it's NWS (national); city/state alert feeds register in alerts.sources.json
 * scoped to place:/state: ids and are selected automatically for matching points.
 * See docs/location-data-network.md §5b.
 */
import alertsData from '@/data/alerts.sources.json';
import {
  selectByJurisdiction,
  fanOut,
  type CheckedSource,
} from '@/lib/registry/core';
import { reliableRun } from '@/lib/registry/reliability';
import type {
  AlertSourceRow,
  WeatherAlert,
  SocrataAlertAdapter,
  FemaAlertAdapter,
} from './types';

const ROWS = alertsData as unknown as AlertSourceRow[];

const ALERT_CACHE_TTL_SECONDS = 300;
const roundCoord = (n: number) => n.toFixed(2);

const ALERTS_USER_AGENT = 'HelpNearby/1.0 (https://helpnearby.co)';
const EARTH_RADIUS_KM = 6371;

function toIso(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const time = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/** Map varied upstream hazard labels to one canonical title so the same event
 *  from different sources shares a title — used for the panel's type badges and
 *  as the consolidation key (e.g. EONET "Wildfires" === CAL FIRE "Wildfire"). */
const HAZARD_TITLE_ALIASES: Record<string, string> = {
  wildfires: 'Wildfire',
  wildfire: 'Wildfire',
  'severe storms': 'Severe Storm',
  'severe storm': 'Severe Storm',
  volcanoes: 'Volcano',
  volcano: 'Volcano',
  landslides: 'Landslide',
  landslide: 'Landslide',
  'dust and haze': 'Dust/Haze',
  'dust haze': 'Dust/Haze',
};

function canonicalHazardTitle(title: string): string {
  return HAZARD_TITLE_ALIASES[title.trim().toLowerCase()] ?? title;
}

// Only these canonical event types are consolidated across sources. Crime,
// weather, tsunami, emergency notices, etc. are never merged — distinct
// incidents legitimately share a title and must all be shown.
const CONSOLIDATABLE_HAZARDS = new Set(Object.values(HAZARD_TITLE_ALIASES));

function isConsolidatableHazard(title: string): boolean {
  return CONSOLIDATABLE_HAZARDS.has(canonicalHazardTitle(title));
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function bboxForRadius(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta =
    radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

type NwsFeature = {
  id?: string;
  properties?: {
    id?: string;
    event?: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity?: string;
    urgency?: string;
    certainty?: string;
    effective?: string;
    expires?: string;
    areaDesc?: string;
    web?: string;
  };
};

/** Fetch + normalize NWS active alerts. Throws on failure so fan-out marks it down. */
async function fetchNwsWeather(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': ALERTS_USER_AGENT,
      Accept: 'application/geo+json',
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`nws_http_${res.status}`);
  const data = (await res.json()) as { features?: NwsFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map((feature, index) => {
    const p = feature.properties || {};
    return {
      id: p.id || feature.id || `nws-alert-${index}`,
      title: p.event || 'Weather Alert',
      headline: p.headline || p.event || 'Official weather alert',
      description: p.description || '',
      instruction: p.instruction || '',
      severity: p.severity || 'Unknown',
      urgency: p.urgency || 'Unknown',
      certainty: p.certainty || 'Unknown',
      effective: p.effective || null,
      expires: p.expires || null,
      area: p.areaDesc || '',
      url: p.web || 'https://www.weather.gov/',
    };
  });
}

type UsgsFeature = {
  id?: string;
  properties?: {
    mag?: number;
    place?: string;
    time?: number;
    updated?: number;
    url?: string;
    alert?: string | null;
    tsunami?: number;
    sig?: number;
    type?: string;
  };
  geometry?: { coordinates?: [number, number, number?] };
};

export async function fetchUsgsEarthquakes(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    maxradiuskm: '300',
    minmagnitude: '3.5',
    starttime: start,
    orderby: 'time',
    limit: '20',
  });
  const res = await fetch(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`,
    {
      headers: {
        'User-Agent': ALERTS_USER_AGENT,
        Accept: 'application/geo+json',
      },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`usgs_http_${res.status}`);
  const data = (await res.json()) as { features?: UsgsFeature[] };
  return (Array.isArray(data.features) ? data.features : []).map(
    (feature, index) => {
      const p = feature.properties || {};
      const mag = numberValue(p.mag);
      const coords = feature.geometry?.coordinates;
      const distance =
        coords && coords.length >= 2
          ? Math.round(distanceKm(lat, lng, coords[1], coords[0]))
          : null;
      const place = text(p.place, 'nearby area');
      const title = mag ? `M${mag.toFixed(1)} Earthquake` : 'Earthquake';
      return {
        id: `usgs-${feature.id || index}`,
        title,
        headline: `${title} ${place}${distance !== null ? ` (${distance} km away)` : ''}`,
        description: text(p.place, 'USGS reported a nearby earthquake.'),
        instruction:
          p.tsunami === 1
            ? 'Check official tsunami and local emergency guidance.'
            : 'Check USGS and local emergency guidance if you felt shaking.',
        severity:
          p.alert === 'red' || p.alert === 'orange'
            ? 'Severe'
            : p.alert === 'yellow'
              ? 'Moderate'
              : mag && mag >= 5
                ? 'Moderate'
                : 'Minor',
        urgency: 'Past',
        certainty: 'Observed',
        effective: toIso(p.time),
        expires: null,
        area: place,
        url: text(p.url, 'https://earthquake.usgs.gov/earthquakes/map/'),
      };
    },
  );
}

type EonetFeature = {
  id?: string;
  properties?: {
    id?: string;
    title?: string;
    description?: string | null;
    link?: string;
    closed?: string | null;
    date?: string;
    categories?: { title?: string }[];
    sources?: { url?: string }[];
    magnitudeValue?: number;
    magnitudeUnit?: string;
  };
  geometry?: { type?: string; coordinates?: unknown };
};

function firstPointFromGeometry(
  geometry: EonetFeature['geometry'],
): [number, number] | null {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [coords[1], coords[0]];
  }
  const stack = [...coords];
  while (stack.length) {
    const next = stack.shift();
    if (!Array.isArray(next)) continue;
    if (typeof next[0] === 'number' && typeof next[1] === 'number') {
      return [next[1], next[0]];
    }
    stack.push(...next);
  }
  return null;
}

export async function fetchNasaEonet(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const box = bboxForRadius(lat, lng, 250);
  const params = new URLSearchParams({
    status: 'open',
    days: '30',
    category: 'wildfires,severeStorms,volcanoes,landslides,dustHaze',
    bbox: `${box.west.toFixed(4)},${box.north.toFixed(4)},${box.east.toFixed(4)},${box.south.toFixed(4)}`,
    limit: '20',
  });
  const res = await fetch(
    `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?${params.toString()}`,
    {
      headers: {
        'User-Agent': ALERTS_USER_AGENT,
        Accept: 'application/geo+json',
      },
      next: { revalidate: 900 },
    },
  );
  if (!res.ok) throw new Error(`eonet_http_${res.status}`);
  const data = (await res.json()) as { features?: EonetFeature[] };
  return (Array.isArray(data.features) ? data.features : []).map(
    (feature, index) => {
      const p = feature.properties || {};
      const category = p.categories
        ?.map((c) => c.title)
        .filter(Boolean)
        .join(', ');
      const point = firstPointFromGeometry(feature.geometry);
      const distance = point
        ? Math.round(distanceKm(lat, lng, point[0], point[1]))
        : null;
      // Canonicalize so EONET labels match the dedicated adapters' titles
      // (e.g. EONET "Wildfires" === CAL FIRE "Wildfire") for badges + dedup.
      const title = canonicalHazardTitle(text(category, 'Natural Event'));
      const eventTitle = text(p.title, title);
      const magnitude =
        typeof p.magnitudeValue === 'number'
          ? ` Magnitude: ${p.magnitudeValue}${p.magnitudeUnit ? ` ${p.magnitudeUnit}` : ''}.`
          : '';
      return {
        id: `eonet-${p.id || feature.id || index}`,
        title,
        headline: `${eventTitle}${distance !== null ? ` (${distance} km away)` : ''}`,
        description: `${text(p.description, eventTitle)}${magnitude}`.trim(),
        instruction:
          'Check local emergency management guidance for current protective actions.',
        severity: 'Unknown',
        urgency: 'Expected',
        certainty: 'Likely',
        effective: toIso(p.date),
        expires: toIso(p.closed),
        area: eventTitle,
        url: text(
          p.sources?.[0]?.url,
          text(p.link, 'https://eonet.gsfc.nasa.gov/'),
        ),
        latitude: point ? point[0] : undefined,
        longitude: point ? point[1] : undefined,
      };
    },
  );
}

function xmlValue(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(
      `<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`,
      'i',
    ),
  );
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function fetchNoaaTsunami(
  row: AlertSourceRow,
): Promise<WeatherAlert[]> {
  const res = await fetch(row.url, {
    headers: {
      'User-Agent': ALERTS_USER_AGENT,
      Accept: 'application/xml,text/xml',
    },
    next: { revalidate: 120 },
  });
  if (!res.ok) throw new Error(`tsunami_http_${res.status}`);
  const xml = await res.text();
  const event = xmlValue(xml, 'event') || xmlValue(xml, 'headline');
  const headline = xmlValue(xml, 'headline') || event;
  const combined = `${event} ${headline}`.toLowerCase();
  if (!/(warning|advisory|watch|threat)/.test(combined)) return [];
  if (
    /no tsunami warning|no tsunami advisory|no tsunami watch|no tsunami threat/.test(
      combined,
    )
  ) {
    return [];
  }
  return [
    {
      id: `tsunami-${xmlValue(xml, 'identifier') || row.id}`,
      title: event || 'Tsunami Alert',
      headline: headline || 'Official tsunami message',
      description: xmlValue(xml, 'description'),
      instruction:
        xmlValue(xml, 'instruction') || 'Follow local emergency instructions.',
      severity: xmlValue(xml, 'severity') || 'Unknown',
      urgency: xmlValue(xml, 'urgency') || 'Unknown',
      certainty: xmlValue(xml, 'certainty') || 'Unknown',
      effective: toIso(xmlValue(xml, 'effective') || xmlValue(xml, 'sent')),
      expires: toIso(xmlValue(xml, 'expires')),
      area: xmlValue(xml, 'areaDesc'),
      url: 'https://www.tsunami.gov/',
    },
  ];
}

type SocrataRow = Record<string, unknown>;

export async function fetchSocrataLocalIncident(
  lat: number,
  lng: number,
  row: AlertSourceRow,
): Promise<WeatherAlert[]> {
  const cfg = row.adapter as SocrataAlertAdapter | undefined;
  if (!cfg) throw new Error(`missing_socrata_adapter:${row.id}`);
  const days = cfg.days ?? 7;
  const limit = cfg.limit ?? 15;
  const radiusKm = cfg.radiusKm ?? 8;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    $limit: String(limit),
    $order: `${cfg.dateField} DESC`,
  });
  const where: string[] = [`${cfg.dateField} >= '${since}T00:00:00'`];
  if (cfg.locationField) {
    const box = bboxForRadius(lat, lng, radiusKm);
    where.push(
      `within_box(${cfg.locationField}, ${box.north.toFixed(5)}, ${box.west.toFixed(5)}, ${box.south.toFixed(5)}, ${box.east.toFixed(5)})`,
    );
  }
  params.set('$where', where.join(' AND '));
  const res = await fetch(`${cfg.endpoint}?${params.toString()}`, {
    headers: { 'User-Agent': ALERTS_USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`socrata_http_${res.status}`);
  const data = (await res.json()) as SocrataRow[];
  return (Array.isArray(data) ? data : [])
    .map((item, index) => {
      const itemLat = numberValue(cfg.latField ? item[cfg.latField] : null);
      const itemLng = numberValue(cfg.lngField ? item[cfg.lngField] : null);
      if (
        itemLat !== null &&
        itemLng !== null &&
        distanceKm(lat, lng, itemLat, itemLng) > radiusKm
      ) {
        return null;
      }
      const category = text(
        cfg.categoryField ? item[cfg.categoryField] : null,
        'Local Incident',
      );
      if (cfg.includeCategories && cfg.includeCategories.length > 0) {
        const haystack = category.toLowerCase();
        const matches = cfg.includeCategories.some((wanted) =>
          haystack.includes(wanted.toLowerCase()),
        );
        if (!matches) return null;
      }
      const title = text(item[cfg.titleField], category);
      const area = text(cfg.areaField ? item[cfg.areaField] : null);
      const alert: WeatherAlert = {
        id: `${row.id}-${text(item.cmplnt_num ?? item.id, String(index))}`,
        title: category,
        headline: title,
        description: text(
          cfg.descriptionField ? item[cfg.descriptionField] : null,
          title,
        ),
        instruction: 'Check local public safety guidance for official updates.',
        severity: category.toLowerCase().includes('felony')
          ? 'Moderate'
          : 'Unknown',
        urgency: 'Past',
        certainty: 'Observed',
        effective: toIso(item[cfg.dateField]),
        expires: null,
        area,
        url: text(cfg.urlField ? item[cfg.urlField] : null, row.url),
      };
      return alert;
    })
    .filter((item): item is WeatherAlert => Boolean(item));
}

type CalfireIncident = {
  Name?: string;
  Latitude?: number;
  Longitude?: number;
  County?: string;
  AcresBurned?: number;
  PercentContained?: number;
  Started?: string;
  IsActive?: boolean;
  Url?: string;
  ConditionStatement?: string;
};

/** Active California wildfire incidents within ~300 km of the point (CAL FIRE). */
export async function fetchCalfire(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const res = await fetch(
    'https://incidents.fire.ca.gov/umbraco/api/IncidentApi/List?inactive=false',
    {
      headers: { 'User-Agent': ALERTS_USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 600 },
    },
  );
  if (!res.ok) throw new Error(`calfire_http_${res.status}`);
  const data = (await res.json()) as CalfireIncident[];
  const radiusKm = 300;
  return (Array.isArray(data) ? data : [])
    .map((incident, index) => {
      if (incident.IsActive === false) return null;
      const iLat = numberValue(incident.Latitude);
      const iLng = numberValue(incident.Longitude);
      if (iLat === null || iLng === null) return null;
      const distance = distanceKm(lat, lng, iLat, iLng);
      if (distance > radiusKm) return null;
      const name = text(incident.Name, 'Wildfire incident');
      const county = text(incident.County);
      const acres = numberValue(incident.AcresBurned);
      const contained = numberValue(incident.PercentContained);
      const detail = [
        county ? `${county} County` : '',
        `${Math.round(distance)} km away`,
        acres !== null ? `${Math.round(acres).toLocaleString()} acres` : '',
        contained !== null ? `${Math.round(contained)}% contained` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      const severe =
        (acres !== null && acres >= 5000) ||
        (contained !== null && contained < 25);
      const alert: WeatherAlert = {
        id: `calfire-${text(incident.Name, String(index))}`,
        title: 'Wildfire',
        headline: `${name}${detail ? ` — ${detail}` : ''}`,
        description: text(incident.ConditionStatement, name),
        instruction:
          'Follow CAL FIRE and local evacuation orders; do not return to evacuated areas until cleared.',
        severity: severe ? 'Severe' : 'Moderate',
        urgency: 'Expected',
        certainty: 'Observed',
        effective: toIso(incident.Started),
        expires: null,
        area: county || name,
        url: text(incident.Url, 'https://www.fire.ca.gov/incidents/'),
        latitude: iLat,
        longitude: iLng,
      };
      return alert;
    })
    .filter((item): item is WeatherAlert => Boolean(item));
}

type AirnowObservation = {
  ParameterName?: string;
  AQI?: number;
  Category?: { Number?: number; Name?: string };
  ReportingArea?: string;
  DateObserved?: string;
  HourObserved?: number;
};

/** Current air-quality alerts for the point (EPA AirNow). Emits only when the
 *  AQI category is Unhealthy-for-Sensitive-Groups (3) or worse. Requires a key. */
export async function fetchAirnow(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) throw new Error('airnow_missing_api_key');
  const params = new URLSearchParams({
    format: 'application/json',
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    distance: '50',
    API_KEY: apiKey,
  });
  const res = await fetch(
    `https://www.airnowapi.org/aq/observation/latLong/current/?${params.toString()}`,
    {
      headers: { 'User-Agent': ALERTS_USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 1800 },
    },
  );
  if (!res.ok) throw new Error(`airnow_http_${res.status}`);
  const data = (await res.json()) as AirnowObservation[];
  return (Array.isArray(data) ? data : [])
    .map((obs, index) => {
      const categoryNumber = numberValue(obs.Category?.Number);
      if (categoryNumber === null || categoryNumber < 3) return null;
      const aqi = numberValue(obs.AQI);
      const parameter = text(obs.ParameterName, 'Air quality');
      const categoryName = text(obs.Category?.Name, 'Unhealthy');
      const area = text(obs.ReportingArea, 'your area');
      const severity =
        categoryNumber >= 5
          ? 'Severe'
          : categoryNumber >= 4
            ? 'Moderate'
            : 'Minor';
      const alert: WeatherAlert = {
        id: `airnow-${text(obs.ParameterName, String(index))}`,
        title: 'Air Quality',
        headline: `${parameter} AQI ${aqi ?? '—'} — ${categoryName} in ${area}`,
        description: `Air quality for ${parameter} is ${categoryName}${aqi !== null ? ` (AQI ${aqi})` : ''} in ${area}.`,
        instruction:
          'Sensitive groups should limit prolonged outdoor exertion; follow local air-quality guidance.',
        severity,
        urgency: 'Expected',
        certainty: 'Observed',
        effective: toIso(
          obs.DateObserved
            ? `${obs.DateObserved.trim()}T${String(obs.HourObserved ?? 0).padStart(2, '0')}:00:00`
            : null,
        ),
        expires: null,
        area,
        url: 'https://www.airnow.gov/',
      };
      return alert;
    })
    .filter((item): item is WeatherAlert => Boolean(item));
}

type FemaDeclaration = {
  disasterNumber?: number;
  femaDeclarationString?: string;
  declarationTitle?: string;
  incidentType?: string;
  declarationType?: string;
  declarationDate?: string;
  incidentBeginDate?: string;
  incidentEndDate?: string | null;
  designatedArea?: string;
};

/** Recent FEMA disaster/emergency declarations for the row's state (optionally
 *  county). The literal "state of emergency" signal; dedup by disaster number. */
export async function fetchFemaDeclarations(
  row: AlertSourceRow,
): Promise<WeatherAlert[]> {
  const cfg = row.adapter as FemaAlertAdapter | undefined;
  if (!cfg) throw new Error(`missing_fema_adapter:${row.id}`);
  const days = cfg.days ?? 365;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  // Recently declared OR still active (no end date) — a long-running declaration
  // with an old begin date is still an active state of emergency.
  const filters = [
    `fipsStateCode eq '${cfg.stateFips}'`,
    `(incidentBeginDate ge '${since}' or incidentEndDate eq null)`,
  ];
  if (cfg.countyFips) filters.push(`fipsCountyCode eq '${cfg.countyFips}'`);
  const params = new URLSearchParams({
    $filter: filters.join(' and '),
    $orderby: 'declarationDate desc',
    $top: String(cfg.limit ?? 10),
  });
  const res = await fetch(
    `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?${params.toString()}`,
    {
      headers: { 'User-Agent': ALERTS_USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 3600 },
    },
  );
  if (!res.ok) throw new Error(`fema_http_${res.status}`);
  const data = (await res.json()) as {
    DisasterDeclarationsSummaries?: FemaDeclaration[];
  };
  const rows = Array.isArray(data.DisasterDeclarationsSummaries)
    ? data.DisasterDeclarationsSummaries
    : [];
  const seen = new Set<number>();
  return rows
    .map((decl) => {
      const number = numberValue(decl.disasterNumber);
      if (number !== null) {
        if (seen.has(number)) return null;
        seen.add(number);
      }
      const incidentType = text(decl.incidentType, 'Disaster');
      const title = text(decl.declarationTitle, incidentType);
      const ended = decl.incidentEndDate
        ? Date.parse(decl.incidentEndDate)
        : NaN;
      const active = Number.isNaN(ended) || ended >= Date.now();
      const kind =
        decl.declarationType === 'DR'
          ? 'Major Disaster'
          : decl.declarationType === 'EM'
            ? 'Emergency'
            : 'Declaration';
      const alert: WeatherAlert = {
        id: `fema-${decl.femaDeclarationString || decl.disasterNumber || title}`,
        title: `${incidentType} Declaration`,
        headline: `${kind}: ${title}`,
        description: `FEMA ${text(decl.declarationType)} declaration for ${text(decl.designatedArea, 'the area')}.`,
        instruction:
          'Check FEMA and local emergency management for assistance and protective actions.',
        severity: active ? 'Moderate' : 'Minor',
        urgency: active ? 'Expected' : 'Past',
        certainty: 'Observed',
        effective: toIso(decl.incidentBeginDate || decl.declarationDate),
        expires: toIso(decl.incidentEndDate ?? null),
        area: text(decl.designatedArea),
        url: `https://www.fema.gov/disaster/${decl.disasterNumber ?? ''}`,
      };
      return alert;
    })
    .filter((item): item is WeatherAlert => Boolean(item));
}

const ADAPTERS: Record<
  AlertSourceRow['sourceType'],
  (lat: number, lng: number, row: AlertSourceRow) => Promise<WeatherAlert[]>
> = {
  'nws-weather': (lat, lng) => fetchNwsWeather(lat, lng),
  'usgs-earthquake': (lat, lng) => fetchUsgsEarthquakes(lat, lng),
  'nasa-eonet': (lat, lng) => fetchNasaEonet(lat, lng),
  'noaa-tsunami': (_lat, _lng, row) => fetchNoaaTsunami(row),
  'socrata-local-incident': (lat, lng, row) =>
    fetchSocrataLocalIncident(lat, lng, row),
  calfire: (lat, lng) => fetchCalfire(lat, lng),
  airnow: (lat, lng) => fetchAirnow(lat, lng),
  'openfema-declaration': (_lat, _lng, row) => fetchFemaDeclarations(row),
};

export const ALERT_ADAPTER_TYPES = Object.keys(
  ADAPTERS,
) as AlertSourceRow['sourceType'][];

const SAME_EVENT_RADIUS_KM = 15;

/**
 * Collapse the same natural-hazard event reported by multiple sources into one
 * record — e.g. a wildfire from both CAL FIRE (trust 80) and NASA EONET (trust
 * 60) becomes a single CAL FIRE entry. Two alerts are duplicates only when they
 * are a consolidatable hazard, come from *different* sources, share a canonical
 * title, and sit within ~15 km. The highest-trust copy wins. Original ordering
 * is preserved; same-source incident lists (crime, etc.) are never merged.
 */
function consolidateAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  const byTrust = alerts
    .map((alert, index) => ({ alert, index }))
    .sort((a, b) => (b.alert.trust ?? 0) - (a.alert.trust ?? 0));

  const kept: { alert: WeatherAlert; index: number }[] = [];
  for (const candidate of byTrust) {
    const a = candidate.alert;
    const isDuplicate =
      isConsolidatableHazard(a.title) &&
      typeof a.latitude === 'number' &&
      typeof a.longitude === 'number' &&
      kept.some(({ alert: k }) => {
        if (k.sourceName === a.sourceName) return false; // never merge a source with itself
        if (
          canonicalHazardTitle(k.title) !== canonicalHazardTitle(a.title)
        )
          return false;
        if (typeof k.latitude !== 'number' || typeof k.longitude !== 'number')
          return false;
        return (
          distanceKm(a.latitude!, a.longitude!, k.latitude, k.longitude) <=
          SAME_EVENT_RADIUS_KM
        );
      });
    if (!isDuplicate) kept.push(candidate);
  }

  const keepIndices = new Set(kept.map((k) => k.index));
  return alerts.filter((_, index) => keepIndices.has(index));
}

export interface AlertsResult {
  alerts: WeatherAlert[];
  checked: CheckedSource[];
  degraded: boolean;
}

/** Active alerts for a point, from every alert source scoped to it. */
export async function fetchAlerts(
  lat: number,
  lng: number,
): Promise<AlertsResult> {
  const rows = await selectByJurisdiction(ROWS, lat, lng);
  const run = reliableRun(
    async (row: AlertSourceRow) => {
      const items = await ADAPTERS[row.sourceType](lat, lng, row);
      // Stamp per-item provenance + trust so the panel attributes each alert and
      // consolidation can rank duplicate events across sources.
      return items.map((item) => ({
        ...item,
        sourceName: row.name,
        sourceUrl: row.url,
        trust: row.trust,
      }));
    },
    {
      cacheKeyFor: (row) => `${row.id}:${roundCoord(lat)},${roundCoord(lng)}`,
      ttlSecondsFor: (row) => row.ttlSeconds ?? ALERT_CACHE_TTL_SECONDS,
    },
  );
  const { items, checked, degraded } = await fanOut(rows, run);
  // Consolidate the same event reported by multiple sources (e.g. a wildfire
  // from both CAL FIRE and NASA EONET) before handing off to the panel.
  return { alerts: consolidateAlerts(items), checked, degraded };
}
