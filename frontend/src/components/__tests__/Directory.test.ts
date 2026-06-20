/**
 * @jest-environment node
 */
import { buildDirectorySources } from '../Directory';

describe('buildDirectorySources', () => {
  it('compiles resource, community, and alert catalogs', () => {
    const sources = buildDirectorySources();
    expect(sources.some((s) => s.domain === 'resources')).toBe(true);
    expect(sources.some((s) => s.domain === 'community')).toBe(true);
    expect(sources.some((s) => s.domain === 'alerts')).toBe(true);
    expect(sources.find((s) => s.id === 'nyc-service')).toMatchObject({
      domain: 'community',
      category: 'volunteer',
    });
    expect(sources.find((s) => s.id === 'nws-weather-alerts')).toMatchObject({
      domain: 'alerts',
    });
    expect(
      sources.find((s) => s.id === 'usgs-nearby-earthquakes'),
    ).toMatchObject({
      domain: 'alerts',
      sourceType: 'usgs-earthquake',
    });
    expect(
      sources.find((s) => s.id === 'nasa-eonet-open-events'),
    ).toMatchObject({
      domain: 'alerts',
      sourceType: 'nasa-eonet',
    });
    expect(
      sources.find((s) => s.id === 'nyc-nypd-complaints-current-year'),
    ).toMatchObject({
      domain: 'alerts',
      sourceType: 'socrata-local-incident',
    });
  });
});
