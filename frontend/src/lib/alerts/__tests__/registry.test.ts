/**
 * @jest-environment node
 */
import alertSourcesData from '@/data/alerts.sources.json';
import {
  ALERT_ADAPTER_TYPES,
  fetchNasaEonet,
  fetchNoaaTsunami,
  fetchSocrataLocalIncident,
  fetchUsgsEarthquakes,
} from '../registry';
import type { AlertSourceRow } from '../types';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
  jest.useFakeTimers().setSystemTime(new Date('2026-06-20T12:00:00Z'));
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function mockJson(body: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  });
}

function mockText(body: string, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    text: async () => body,
  });
}

describe('alert source catalog', () => {
  it('has an adapter for every configured alert source type', () => {
    const configuredTypes = new Set(
      (alertSourcesData as AlertSourceRow[]).map((source) => source.sourceType),
    );
    for (const sourceType of configuredTypes) {
      expect(ALERT_ADAPTER_TYPES).toContain(sourceType);
    }
  });
});

describe('USGS earthquake adapter', () => {
  it('normalizes nearby earthquake GeoJSON features', async () => {
    mockJson({
      features: [
        {
          id: 'ci123',
          properties: {
            mag: 4.2,
            place: '10 km S of Malibu, CA',
            time: Date.parse('2026-06-19T10:00:00Z'),
            url: 'https://earthquake.usgs.gov/event/ci123',
            alert: 'yellow',
            tsunami: 0,
          },
          geometry: { coordinates: [-118.7, 34.0, 8] },
        },
      ],
    });

    const alerts = await fetchUsgsEarthquakes(34.05, -118.25);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'usgs-ci123',
      title: 'M4.2 Earthquake',
      severity: 'Moderate',
      certainty: 'Observed',
      url: 'https://earthquake.usgs.gov/event/ci123',
    });
  });

  it('throws on upstream errors so fan-out can mark the source down', async () => {
    mockJson({}, false);
    await expect(fetchUsgsEarthquakes(34.05, -118.25)).rejects.toThrow(
      'usgs_http_500',
    );
  });
});

describe('NASA EONET adapter', () => {
  it('normalizes open natural events', async () => {
    mockJson({
      features: [
        {
          id: 'EONET_1',
          properties: {
            title: 'Palisades Fire',
            description: 'Active wildfire',
            date: '2026-06-18T00:00:00Z',
            categories: [{ title: 'Wildfires' }],
            sources: [{ url: 'https://eonet.gsfc.nasa.gov/events/EONET_1' }],
            magnitudeValue: 1200,
            magnitudeUnit: 'acres',
          },
          geometry: { type: 'Point', coordinates: [-118.55, 34.08] },
        },
      ],
    });

    const alerts = await fetchNasaEonet(34.05, -118.25);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'eonet-EONET_1',
      title: 'Wildfires',
      headline: expect.stringContaining('Palisades Fire'),
      url: 'https://eonet.gsfc.nasa.gov/events/EONET_1',
    });
  });

  it('returns an empty list for malformed feature arrays', async () => {
    mockJson({ features: null });
    await expect(fetchNasaEonet(34.05, -118.25)).resolves.toEqual([]);
  });
});

describe('NOAA tsunami adapter', () => {
  const row = {
    id: 'noaa-tsunami-test',
    name: 'NOAA Tsunami',
    url: 'https://www.tsunami.gov/events/xml/PAAQCAP.xml',
    sourceType: 'noaa-tsunami',
    jurisdictionId: 'state:06',
    trust: 80,
    refresh: '~2 min',
    enabled: true,
  } satisfies AlertSourceRow;

  it('normalizes actionable CAP tsunami messages', async () => {
    mockText(`
      <alert>
        <identifier>PAAQ-1</identifier>
        <sent>2026-06-20T10:00:00Z</sent>
        <info>
          <event>Tsunami Advisory</event>
          <urgency>Immediate</urgency>
          <severity>Severe</severity>
          <certainty>Likely</certainty>
          <headline>Tsunami Advisory for the California coast</headline>
          <description>Strong currents are possible.</description>
          <instruction>Stay away from beaches.</instruction>
          <area><areaDesc>California Coast</areaDesc></area>
        </info>
      </alert>
    `);

    const alerts = await fetchNoaaTsunami(row);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'tsunami-PAAQ-1',
      title: 'Tsunami Advisory',
      urgency: 'Immediate',
      area: 'California Coast',
    });
  });

  it('suppresses no-threat informational CAP messages', async () => {
    mockText(`
      <alert>
        <identifier>PAAQ-2</identifier>
        <info>
          <event>Information</event>
          <headline>No Tsunami Warning, Advisory, Watch, or Threat</headline>
        </info>
      </alert>
    `);

    await expect(fetchNoaaTsunami(row)).resolves.toEqual([]);
  });
});

describe('Socrata local incident adapter', () => {
  const row = {
    id: 'nyc-test',
    name: 'NYC Test',
    url: 'https://data.cityofnewyork.us/example',
    sourceType: 'socrata-local-incident',
    jurisdictionId: 'place:3651000',
    trust: 55,
    refresh: 'current year',
    enabled: true,
    adapter: {
      endpoint: 'https://data.cityofnewyork.us/resource/qgea-i56i.json',
      locationField: 'lat_lon',
      latField: 'latitude',
      lngField: 'longitude',
      dateField: 'cmplnt_fr_dt',
      titleField: 'pd_desc',
      descriptionField: 'ofns_desc',
      categoryField: 'law_cat_cd',
      areaField: 'boro_nm',
      days: 14,
      limit: 10,
      radiusKm: 8,
    },
  } satisfies AlertSourceRow;

  it('normalizes official local incident records', async () => {
    mockJson([
      {
        cmplnt_num: '123',
        cmplnt_fr_dt: '2026-06-19T00:00:00.000',
        pd_desc: 'PETIT LARCENY',
        ofns_desc: 'LARCENY',
        law_cat_cd: 'MISDEMEANOR',
        boro_nm: 'MANHATTAN',
        latitude: '40.758',
        longitude: '-73.985',
      },
    ]);

    const alerts = await fetchSocrataLocalIncident(40.758, -73.985, row);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'nyc-test-123',
      title: 'MISDEMEANOR',
      headline: 'PETIT LARCENY',
      area: 'MANHATTAN',
      url: row.url,
    });
  });

  it('filters rows outside the configured local radius', async () => {
    mockJson([
      {
        cmplnt_num: 'far',
        cmplnt_fr_dt: '2026-06-19T00:00:00.000',
        pd_desc: 'ROBBERY',
        latitude: '41.2',
        longitude: '-74.6',
      },
    ]);

    await expect(
      fetchSocrataLocalIncident(40.758, -73.985, row),
    ).resolves.toEqual([]);
  });
});
