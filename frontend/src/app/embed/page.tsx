'use client';

import type { CSSProperties, FC } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { lookupLocation } from '@/lib/location/locationLookup';
import type {
  NearbyResource,
  NearbyResponse,
  ResourceCategory,
} from '@/lib/resources/schema';

const MAX_ROWS = 5;

// Categories the widget can offer. Only categories with live registered
// sources are listed so an embed never advertises an empty filter.
const EMBED_CATEGORIES: { id: ResourceCategory; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'recreation', label: 'Parks & Community' },
];

const DEFAULT_ACCENT = '#f59e0b';

const sanitizeAccent = (raw: string | null): string => {
  if (!raw) return DEFAULT_ACCENT;
  const hex = raw.replace(/^#/, '');
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)
    ? `#${hex}`
    : DEFAULT_ACCENT;
};

const parseCategories = (raw: string | null): ResourceCategory[] => {
  const valid = new Set(EMBED_CATEGORIES.map((c) => c.id));
  const parsed = (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ResourceCategory => valid.has(s as ResourceCategory));
  return parsed.length > 0 ? parsed : EMBED_CATEGORIES.map((c) => c.id);
};

const formatCategory = (c: ResourceCategory): string =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());

// Diversity-aware picker for the "All" view (same approach as the Where
// Nearby panel): one nearest resource per category first, then fill the
// remaining slots with the nearest leftovers. Input is sorted by distance.
const pickDiverse = (
  list: NearbyResource[],
  max: number,
): NearbyResource[] => {
  const picked: NearbyResource[] = [];
  const usedIds = new Set<string>();
  const usedCategories = new Set<ResourceCategory>();
  for (const r of list) {
    if (picked.length >= max) break;
    if (usedCategories.has(r.category)) continue;
    usedCategories.add(r.category);
    usedIds.add(r.id);
    picked.push(r);
  }
  for (const r of list) {
    if (picked.length >= max) break;
    if (usedIds.has(r.id)) continue;
    usedIds.add(r.id);
    picked.push(r);
  }
  return picked;
};

const EmbedWidget: FC = () => {
  const params = useSearchParams();

  const isDark = params?.get('theme') === 'dark';
  const accent = sanitizeAccent(params?.get('accent') ?? null);
  const partnerLabel = (params?.get('label') ?? '').slice(0, 60);
  const enabledCategories = useMemo(
    () => parseCategories(params?.get('categories') ?? null),
    [params],
  );
  const radiusRaw = Number(params?.get('radius') ?? NaN);
  const radiusMiles =
    Number.isFinite(radiusRaw) && radiusRaw > 0 ? Math.min(radiusRaw, 50) : 10;
  const defaultZip = (params?.get('zip') ?? '').replace(/\D/g, '').slice(0, 5);

  const [inputValue, setInputValue] = useState(defaultZip);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [placeLabel, setPlaceLabel] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | null>(
    null,
  );
  const [resources, setResources] = useState<NearbyResource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = isDark ? '#0f0f0f' : '#ffffff';
  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#888' : '#777';
  const divider = isDark ? '#222' : '#ececec';
  const inputBg = isDark ? '#171717' : '#fafafa';
  const inputBorder = isDark ? '#2a2a2a' : '#d8d8d8';
  const chipBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const resolveAndSearch = useCallback(
    async (query: string) => {
      const cleaned = query.trim();
      if (!cleaned) {
        setError('Enter a ZIP code to find nearby resources.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const loc = await lookupLocation(cleaned);
        if (!loc.isValid) {
          setError('Location not found. Try a 5-digit ZIP code.');
          setResources(null);
          setCoords(null);
          return;
        }
        setCoords({ lat: loc.latitude, lng: loc.longitude });
        setPlaceLabel(
          [loc.city, loc.stateCode].filter(Boolean).join(', '),
        );
      } catch {
        setError('Location lookup failed. Please try again.');
        setResources(null);
        setCoords(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Fetch resources whenever coordinates or the selected category change.
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          lat: String(coords.lat),
          lng: String(coords.lng),
          radiusMiles: String(radiusMiles),
        });
        if (activeCategory) qs.set('category', activeCategory);
        const res = await fetch(`/api/nearby-resources?${qs.toString()}`);
        const data: NearbyResponse = await res.json();
        if (cancelled) return;
        const allowed = new Set<ResourceCategory>(
          activeCategory ? [activeCategory] : enabledCategories,
        );
        const filtered = (data.resources ?? []).filter((r) =>
          allowed.has(r.category),
        );
        setResources(
          activeCategory
            ? filtered.slice(0, MAX_ROWS)
            : pickDiverse(filtered, MAX_ROWS),
        );
      } catch {
        if (!cancelled) {
          setError('Could not load resources. Please try again.');
          setResources(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [coords, activeCategory, enabledCategories, radiusMiles]);

  // Auto-search the configured default ZIP on first load.
  useEffect(() => {
    if (defaultZip) resolveAndSearch(defaultZip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Location access is not available here. Enter a ZIP instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setError(null);
        setInputValue('');
        setPlaceLabel('your location');
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setError('Location access denied. Enter a ZIP code instead.');
      },
      { timeout: 8000 },
    );
  };

  const linkStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.64rem',
    textDecoration: 'underline',
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: bg,
        color: cardText,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '1rem 1.1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.6rem',
          marginBottom: '0.8rem',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: '0.78rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {partnerLabel || 'Find Help Nearby'}
        </span>
        <span
          style={{ fontSize: '0.6rem', color: mutedText, flexShrink: 0 }}
        >
          {placeLabel ? `Near ${placeLabel}` : ''}
        </span>
      </div>

      {/* Search row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '0.55rem' }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            border: `1.5px solid ${inputBorder}`,
            borderRight: 'none',
          }}
        >
          <MapPin
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: mutedText,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter ZIP"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') resolveAndSearch(inputValue);
            }}
            aria-label="ZIP code"
            style={{
              width: '100%',
              padding: '0.6rem 0.6rem 0.6rem 2rem',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.82rem',
              backgroundColor: inputBg,
              color: cardText,
              border: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => resolveAndSearch(inputValue)}
          style={{
            padding: '0 1rem',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            backgroundColor: accent,
            color: '#000',
            border: `1.5px solid ${inputBorder}`,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          SEARCH
        </button>
      </div>

      <button
        onClick={handleLocate}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          alignSelf: 'flex-start',
          marginBottom: '0.7rem',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.68rem',
          color: accent,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Navigation size={10} />
        Use my location
      </button>

      {/* Category chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '0.8rem',
        }}
      >
        {[null, ...enabledCategories].map((cat) => {
          const isActive = activeCategory === cat;
          const label =
            cat === null
              ? 'All'
              : EMBED_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
          return (
            <button
              key={cat ?? 'all'}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={isActive}
              style={{
                padding: '0.3rem 0.65rem',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '0.62rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: isActive ? accent : chipBg,
                color: isActive ? '#000' : mutedText,
                border: `1px solid ${isActive ? accent : divider}`,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div style={{ flex: 1 }}>
        {error && (
          <p
            style={{
              fontSize: '0.72rem',
              color: '#dc2626',
              margin: '0 0 0.6rem',
            }}
          >
            {error}
          </p>
        )}
        {loading && (
          <p style={{ fontSize: '0.72rem', color: mutedText, margin: 0 }}>
            Loading nearby resources…
          </p>
        )}
        {!loading && !error && resources === null && (
          <p style={{ fontSize: '0.72rem', color: mutedText, margin: 0 }}>
            Enter a ZIP code to see source-backed resources near you.
          </p>
        )}
        {!loading && resources !== null && resources.length === 0 && (
          <p style={{ fontSize: '0.72rem', color: mutedText, margin: 0 }}>
            No resources found from connected public datasets in this area.
            Coverage is strongest in Southern California.
          </p>
        )}
        {!loading &&
          resources !== null &&
          resources.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              style={{
                padding: '0.65rem 0',
                borderBottom:
                  i < resources.length - 1 ? `1px solid ${divider}` : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    minWidth: 0,
                  }}
                >
                  {r.name}
                </span>
                {typeof r.distanceMiles === 'number' && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: mutedText,
                      flexShrink: 0,
                    }}
                  >
                    {r.distanceMiles.toFixed(1)} mi
                  </span>
                )}
              </div>
              {r.address && (
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: mutedText,
                    marginTop: '0.08rem',
                  }}
                >
                  {r.address}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.3rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.56rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: mutedText,
                    background: chipBg,
                    border: `1px solid ${divider}`,
                    padding: '0.1rem 0.35rem',
                  }}
                >
                  {formatCategory(r.category)}
                </span>
                {typeof r.latitude === 'number' &&
                  typeof r.longitude === 'number' &&
                  coords && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${r.latitude},${r.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open directions to ${r.name} in Google Maps`}
                      style={{
                        ...linkStyle,
                        fontWeight: 700,
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                      }}
                    >
                      <ExternalLink size={9} /> Directions
                    </a>
                  )}
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...linkStyle, color: mutedText }}
                >
                  <ExternalLink size={9} /> Source: {r.sourceName}
                </a>
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '0.9rem',
          paddingTop: '0.7rem',
          borderTop: `1px solid ${divider}`,
        }}
      >
        <p
          style={{
            fontSize: '0.6rem',
            color: mutedText,
            lineHeight: 1.55,
            margin: '0 0 0.35rem',
          }}
        >
          Source-backed public data where available. Confirm details with the
          listed source. Call 911 for emergencies.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
          }}
        >
          <a
            href="https://helpnearby.co"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: cardText,
              textDecoration: 'none',
            }}
          >
            Powered by Help Nearby
          </a>
          <a
            href={`mailto:rrslider@gmail.com?subject=${encodeURIComponent('Help Nearby — Outdated resource report')}`}
            style={{ fontSize: '0.6rem', color: mutedText }}
          >
            Report outdated info
          </a>
        </div>
      </div>
    </div>
  );
};

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedWidget />
    </Suspense>
  );
}
