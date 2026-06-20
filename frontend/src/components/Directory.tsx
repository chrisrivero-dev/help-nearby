'use client';

import type { CSSProperties, FC } from 'react';
import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import resourceSourcesData from '@/data/sources.json';
import alertSourcesData from '@/data/alerts.sources.json';
import directorySourcesData from '@/data/directory.sources.json';

type DirectoryDomain = 'resources' | 'community' | 'alerts';
type DomainFilter = 'all' | DirectoryDomain;

interface RawSource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  category?: string;
  domain?: string;
  jurisdictionId: string;
  trust?: number;
  refresh?: string;
  enabled?: boolean;
  notes?: string;
}

export interface DirectorySource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  category?: string;
  domain: DirectoryDomain;
  jurisdictionId: string;
  trust?: number;
  refresh?: string;
  enabled: boolean;
  notes?: string;
  searchText: string;
}

const DOMAIN_LABELS: Record<DirectoryDomain, string> = {
  resources: 'Resources',
  community: 'Community',
  alerts: 'Alerts',
};

function normalizeSource(row: RawSource, domain: DirectoryDomain): DirectorySource {
  const category = row.category ?? row.domain;
  const parts = [
    row.name,
    row.id,
    row.url,
    row.sourceType,
    category,
    domain,
    row.jurisdictionId,
    row.refresh,
    row.notes,
  ];
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    sourceType: row.sourceType,
    category,
    domain,
    jurisdictionId: row.jurisdictionId,
    trust: row.trust,
    refresh: row.refresh,
    enabled: row.enabled !== false,
    notes: row.notes,
    searchText: parts.filter(Boolean).join(' ').toLowerCase(),
  };
}

export function buildDirectorySources(): DirectorySource[] {
  const resources = (resourceSourcesData as RawSource[]).map((row) =>
    normalizeSource(row, 'resources'),
  );
  const alerts = (alertSourcesData as RawSource[]).map((row) =>
    normalizeSource(row, 'alerts'),
  );
  const community = (directorySourcesData as RawSource[]).map((row) =>
    normalizeSource(row, 'community'),
  );
  return [...resources, ...community, ...alerts].sort((a, b) => {
    const domainCmp = a.domain.localeCompare(b.domain);
    return domainCmp || a.name.localeCompare(b.name);
  });
}

const Directory: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<DomainFilter>('all');

  const sources = useMemo(() => buildDirectorySources(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((source) => {
      const domainMatch = domain === 'all' || source.domain === domain;
      const queryMatch = !q || source.searchText.includes(q);
      return domainMatch && queryMatch;
    });
  }, [domain, query, sources]);

  const counts = useMemo(
    () => ({
      all: sources.length,
      resources: sources.filter((s) => s.domain === 'resources').length,
      community: sources.filter((s) => s.domain === 'community').length,
      alerts: sources.filter((s) => s.domain === 'alerts').length,
    }),
    [sources],
  );

  const text = isDark ? '#dedede' : '#111111';
  const muted = isDark ? '#8a8a8a' : '#666666';
  const border = isDark ? '#252525' : '#e4e4e4';
  const surface = isDark ? '#121212' : '#ffffff';
  const softSurface = isDark ? '#171717' : '#f8f8f8';
  const gold = '#f59e0b';

  const pageStyle: CSSProperties = {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '2rem max(2%, 16px) 4rem',
    boxSizing: 'border-box',
  };

  const toolbarStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  const searchWrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    border: `1px solid ${border}`,
    background: surface,
    color: muted,
    padding: '0.72rem 0.85rem',
  };

  const chipRowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  };

  const rowStyle: CSSProperties = {
    display: 'grid',
    gap: '0.7rem',
    padding: '1rem',
    border: `1px solid ${border}`,
    background: surface,
  };

  const metaStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  };

  const metaPillStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0.18rem 0.48rem',
    border: `1px solid ${border}`,
    background: softSurface,
    color: muted,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.66rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  function chip(label: string, value: DomainFilter, count: number) {
    const active = domain === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => setDomain(value)}
        style={{
          border: `1px solid ${active ? gold : border}`,
          background: active ? gold : surface,
          color: active ? '#111111' : text,
          cursor: 'pointer',
          padding: '0.42rem 0.7rem',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label} {count}
      </button>
    );
  }

  return (
    <section style={pageStyle}>
      <div style={toolbarStyle}>
        <div style={searchWrapStyle}>
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sources, categories, jurisdictions, notes..."
            style={{
              width: '100%',
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: text,
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.86rem',
            }}
          />
        </div>
        <div style={chipRowStyle}>
          {chip('All', 'all', counts.all)}
          {chip('Resources', 'resources', counts.resources)}
          {chip('Community', 'community', counts.community)}
          {chip('Alerts', 'alerts', counts.alerts)}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '0.65rem',
        }}
      >
        {filtered.map((source) => (
          <article key={`${source.domain}:${source.id}`} style={rowStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    color: text,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.96rem',
                    lineHeight: 1.35,
                  }}
                >
                  {source.name}
                </h2>
                <div
                  style={{
                    marginTop: '0.35rem',
                    color: muted,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.72rem',
                    wordBreak: 'break-word',
                  }}
                >
                  {source.url}
                </div>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View source: ${source.name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  border: `1px solid ${border}`,
                  color: gold,
                  background: softSurface,
                }}
              >
                <ExternalLink size={15} />
              </a>
            </div>

            <div style={metaStyle}>
              <span style={metaPillStyle}>{DOMAIN_LABELS[source.domain]}</span>
              {source.category && <span style={metaPillStyle}>{source.category}</span>}
              <span style={metaPillStyle}>{source.sourceType}</span>
              <span style={metaPillStyle}>{source.jurisdictionId}</span>
              {typeof source.trust === 'number' && (
                <span style={metaPillStyle}>trust {source.trust}</span>
              )}
              <span style={metaPillStyle}>
                {source.enabled ? 'enabled' : 'disabled'}
              </span>
            </div>

            {(source.refresh || source.notes) && (
              <div
                style={{
                  display: 'grid',
                  gap: '0.25rem',
                  color: muted,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.74rem',
                  lineHeight: 1.55,
                }}
              >
                {source.refresh && <div>{source.refresh}</div>}
                {source.notes && <div>{source.notes}</div>}
              </div>
            )}
          </article>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              padding: '2rem',
              border: `1px solid ${border}`,
              color: muted,
              background: surface,
              textAlign: 'center',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.82rem',
            }}
          >
            No sources match the current search.
          </div>
        )}
      </div>
    </section>
  );
};

export default Directory;

