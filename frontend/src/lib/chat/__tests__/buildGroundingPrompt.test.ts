/**
 * @jest-environment node
 */
import {
  buildGroundingSystemPrompt,
  summarizeGrounding,
} from '../buildGroundingPrompt';
import type {
  DetailDescriptor,
  PanelGrounding,
} from '@/components/help/DashboardContext';
import type { LocationState } from '@/components/help/LocationContext';

const noLocation: LocationState = {
  zip: '',
  city: '',
  state: '',
  latitude: 0,
  longitude: 0,
  isValid: false,
};

const laLocation: LocationState = {
  zip: '90012',
  city: 'Los Angeles',
  state: 'CA',
  latitude: 34.0561,
  longitude: -118.2391,
  isValid: true,
};

const makeDescriptor = (id: string, title: string): DetailDescriptor => ({
  kind: 'resource',
  id,
  title,
  payload: {},
  groundingSummary: `${title} · Health · 0.4 mi`,
});

const resourcesPanel: PanelGrounding = {
  panelId: 'resources',
  label: 'Resources',
  totalCount: 2,
  items: [
    {
      descriptor: makeDescriptor('res_1', 'Hope Clinic'),
      groundingText: 'Hope Clinic · Health · 0.4 mi · 100 Main St',
    },
    {
      descriptor: makeDescriptor('res_2', 'Casa Shelter'),
      groundingText: 'Casa Shelter · Shelter · 1.2 mi · 200 Oak Ave',
    },
  ],
  filters: { query: 'clinic', categories: ['Health'] },
};

// Grounding-only panel: items carry no descriptor, so they're referenceable but
// not openable (e.g. alerts, community, 311, updates).
const alertsPanel: PanelGrounding = {
  panelId: 'alerts',
  label: 'Alerts',
  totalCount: 1,
  items: [
    {
      groundingText: 'Flood Warning · Severe · Downtown LA — Flooding expected',
    },
  ],
};

describe('buildGroundingSystemPrompt', () => {
  it('returns null when there is nothing to ground', () => {
    expect(
      buildGroundingSystemPrompt({
        location: noLocation,
        detail: null,
        panelGrounding: {},
      }),
    ).toBeNull();
  });

  it('includes the location when valid', () => {
    const out = buildGroundingSystemPrompt({
      location: laLocation,
      detail: null,
      panelGrounding: {},
    });
    expect(out).toContain('USER LOCATION');
    expect(out).toContain('Los Angeles, CA');
    expect(out).toContain('90012');
  });

  it('surfaces the open detail item with its marker, ahead of panel lists', () => {
    const out = buildGroundingSystemPrompt({
      location: laLocation,
      detail: makeDescriptor('res_2', 'Casa Shelter'),
      panelGrounding: { resources: resourcesPanel },
    })!;
    expect(out).toContain('CURRENTLY OPEN');
    expect(out).toContain('[[open:res_2]]');
    // Layering: location < open detail < panel list.
    const locIdx = out.indexOf('USER LOCATION');
    const openIdx = out.indexOf('CURRENTLY OPEN');
    const panelIdx = out.indexOf('RESOURCES NEARBY');
    expect(locIdx).toBeLessThan(openIdx);
    expect(openIdx).toBeLessThan(panelIdx);
  });

  it('lists panel items with open markers and active filters', () => {
    const out = buildGroundingSystemPrompt({
      location: laLocation,
      detail: null,
      panelGrounding: { resources: resourcesPanel },
    })!;
    expect(out).toContain('RESOURCES NEARBY');
    expect(out).toContain('search="clinic"');
    expect(out).toContain('categories: Health');
    expect(out).toContain('Hope Clinic');
    expect(out).toContain('[[open:res_1]]');
    expect(out).toContain('[[open:res_2]]');
  });

  it('lists grounding-only panel items without an open marker', () => {
    const out = buildGroundingSystemPrompt({
      location: laLocation,
      detail: null,
      panelGrounding: { alerts: alertsPanel },
    })!;
    expect(out).toContain('ALERTS NEARBY');
    expect(out).toContain('Flood Warning');
    // The item line carries no marker (only the intro mentions the marker form).
    const alertsSection = out.slice(out.indexOf('ALERTS NEARBY'));
    expect(alertsSection).not.toContain('[[open:');
  });

  it('notes truncation when more items match than are shown', () => {
    const out = buildGroundingSystemPrompt({
      location: laLocation,
      detail: null,
      panelGrounding: {
        resources: { ...resourcesPanel, totalCount: 40 },
      },
    })!;
    expect(out).toContain('showing 2 of 40');
  });
});

describe('summarizeGrounding', () => {
  it('reports "not set" / "none" when there is no grounding', () => {
    const out = summarizeGrounding({
      location: noLocation,
      detail: null,
      panelGrounding: {},
    });
    expect(out).toContain('Location: not set');
    expect(out).toContain('Active panels: none');
  });

  it('reports location, active panels with counts/filters, and open item', () => {
    const out = summarizeGrounding({
      location: laLocation,
      detail: makeDescriptor('res_2', 'Casa Shelter'),
      panelGrounding: { resources: resourcesPanel },
    });
    expect(out).toContain('Location: Los Angeles, CA');
    expect(out).toContain('Resources (2 results');
    expect(out).toContain('search="clinic"');
    expect(out).toContain('Currently open: Casa Shelter');
    // Deterministic readout — never emits open markers.
    expect(out).not.toContain('[[open:');
  });
});
