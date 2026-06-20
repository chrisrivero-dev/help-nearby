import {
  customSourcesToNearbyResources,
  validateCustomSourcePayload,
  type CustomSourceRecord,
} from '../customSources';

const continental: CustomSourceRecord = {
  id: 'custom-the-continental-greenpoint',
  name: 'The Continental',
  category: 'shelter',
  address: '83 Apollo St',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11222',
  phone: '(718) 724-7900',
  website: 'https://breakingground.org/',
  latitude: 40.7247,
  longitude: -73.951,
  status: 'active',
  createdAt: '2026-06-20T00:00:00.000Z',
};

describe('custom resource sources', () => {
  it('validates required source fields and accepts phone numbers', () => {
    const result = validateCustomSourcePayload({
      name: 'The Continental',
      phone: '(718) 724-7900',
      website: 'https://breakingground.org',
      category: 'shelter',
      address: '83 Apollo St',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11222',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.phone).toBe('(718) 724-7900');
      expect(result.value.website).toBe('https://breakingground.org/');
    }
  });

  it('requires either a ZIP or city and state', () => {
    const result = validateCustomSourcePayload({
      name: 'Missing Place',
      website: 'https://example.org',
      category: 'food',
      city: 'Brooklyn',
    });

    expect(result.ok).toBe(false);
  });

  it('rejects invalid urls and invalid categories', () => {
    expect(
      validateCustomSourcePayload({
        name: 'Bad Link',
        website: 'notaurl',
        category: 'food',
        zip: '11222',
      }).ok,
    ).toBe(false);

    expect(
      validateCustomSourcePayload({
        name: 'Bad Category',
        website: 'https://example.org',
        category: 'made_up',
        zip: '11222',
      }).ok,
    ).toBe(false);
  });

  it('silently accepts honeypot submissions without storing them', () => {
    const result = validateCustomSourcePayload({
      name: 'Spam',
      website: 'https://example.org',
      category: 'food',
      zip: '11222',
      websiteHoneypot: 'filled',
    });

    expect(result).toEqual({ ok: false, error: 'ok', status: 200 });
  });

  it('returns The Continental near Greenpoint but not unrelated cities', () => {
    const near = customSourcesToNearbyResources([continental], {
      latitude: 40.724,
      longitude: -73.95,
      radiusMiles: 10,
    });
    const far = customSourcesToNearbyResources([continental], {
      latitude: 34.0537,
      longitude: -118.2427,
      radiusMiles: 10,
    });

    expect(near).toHaveLength(1);
    expect(near[0]).toMatchObject({
      name: 'The Continental',
      sourceType: 'custom',
      isCustom: true,
      phone: '(718) 724-7900',
    });
    expect(far).toHaveLength(0);
  });
});
