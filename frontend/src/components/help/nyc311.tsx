'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, MapPin, Search, X } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { NeoPanel } from './NeoPanel';
import { PanelHeader } from './PanelHeader';
import { usePanelControl } from './PanelControlContext';
import {
  PanelStatusSquare,
  PanelRefreshButton,
  PanelInfoPopover,
} from './PanelStatusControls';
import type { NYC311Item } from '@/lib/nyc311/types';
import type { GroundingItem } from './DashboardContext';
import { usePublishGrounding } from '@/lib/chat/usePublishGrounding';

const GOLD_COLOR = '#E0A800';
const NYC311_CACHE_TTL_MS = 10 * 60 * 1000;
const NYC311_PAGE_SIZE = 10;

// Cheap client-side NYC bounding box — avoids a fetch (and a panel flash) for
// obviously non-NYC locations. The server's jurisdiction resolver (`applies`)
// is still the authoritative gate; this only suppresses clearly-outside points.
const inNycBox = (lat: number, lng: number): boolean =>
  lat >= 40.49 && lat <= 40.92 && lng >= -74.27 && lng <= -73.68;

interface NYC311SourceStatus {
  id: string;
  name: string;
  ok: boolean;
}

interface NYC311CacheEntry {
  items: NYC311Item[];
  applies: boolean;
  sources: NYC311SourceStatus[];
  lastChecked: string;
  ts: number;
}

const cacheKey = (lat: number, lng: number) =>
  `hn:nyc311:${lat.toFixed(3)},${lng.toFixed(3)}`;

const readCache = (key: string): NYC311CacheEntry | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as NYC311CacheEntry;
    if (!entry?.ts || Date.now() - entry.ts > NYC311_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

const writeCache = (key: string, entry: Omit<NYC311CacheEntry, 'ts'>): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...entry, ts: Date.now() }),
    );
  } catch {
    /* storage full or disabled — non-fatal */
  }
};

// Displayed tag: the source-native category (e.g. the 311 request status).
function tagOf(item: NYC311Item): string | undefined {
  return item.category?.trim() || undefined;
}

// "When" line derived from the upstream report timestamp.
function formatReported(item: NYC311Item): string | undefined {
  if (!item.reportedAt) return undefined;
  const d = new Date(item.reportedAt);
  if (Number.isNaN(d.getTime())) return undefined;
  const dateStr = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateStr} · ${time}`;
}

function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function formatChecked(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// One-line summary of a 311 request for the chat grounding bus.
function nyc311GroundingText(item: NYC311Item): string {
  return [item.title, tagOf(item), formatReported(item), item.address?.trim()]
    .filter(Boolean)
    .join(' · ');
}

export const NYC311Panel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { latitude, longitude, isValid, isResolvingLocation } =
    useLocationContext();
  const hasLocation =
    isValid && Number.isFinite(latitude) && Number.isFinite(longitude);
  // Only a candidate for NYC when inside the bounding box; server confirms.
  const maybeNyc = hasLocation && inNycBox(latitude, longitude);

  const [isExpanded, setIsExpanded] = useState(true);
  const [items, setItems] = useState<NYC311Item[]>([]);
  const [applies, setApplies] = useState(false);
  const [sources, setSources] = useState<NYC311SourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const detailText = isDark ? '#bdbdbd' : '#444444';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';

  const tagOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const o of items) {
      const t = tagOf(o);
      if (t) seen.add(t);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((o) => {
      const t = tagOf(o);
      if (activeTags.length > 0 && (!t || !activeTags.includes(t)))
        return false;
      if (!q) return true;
      const haystack = [
        o.title,
        o.organizationName,
        o.category,
        o.description,
        o.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, activeTags]);

  const filtersActive = query.trim().length > 0 || activeTags.length > 0;

  // Publish the filtered 311 requests to the chat so it can see what's shown here.
  const groundingItems = useMemo<GroundingItem[] | null>(
    () =>
      filteredItems.length > 0
        ? filteredItems.map((o) => ({ groundingText: nyc311GroundingText(o) }))
        : null,
    [filteredItems],
  );
  const groundingFilters = useMemo(
    () => ({
      query: query.trim() || undefined,
      categories: activeTags.length ? activeTags : undefined,
    }),
    [query, activeTags],
  );
  usePublishGrounding('nyc311', '311', groundingItems, groundingFilters);

  const toggleTag = (t: string) =>
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const filteredTotal = filteredItems.length;
  const totalPages =
    filteredTotal === 0 ? 0 : Math.ceil(filteredTotal / NYC311_PAGE_SIZE);
  const shownTotalPages = Math.max(totalPages, 1);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (page - 1) * NYC311_PAGE_SIZE,
        (page - 1) * NYC311_PAGE_SIZE + NYC311_PAGE_SIZE,
      ),
    [filteredItems, page],
  );

  // Drop active toggles that no longer exist after a refresh/location change.
  useEffect(() => {
    setActiveTags((prev) => {
      const next = prev.filter((t) => tagOptions.includes(t));
      return next.length === prev.length ? prev : next;
    });
  }, [tagOptions]);

  useEffect(() => {
    setPage(1);
  }, [query, activeTags]);
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Fetch live 311 records. localStorage-cached (10 min); refresh bypasses it.
  // Skips entirely outside the NYC box; the server `applies` flag is the final
  // word on whether the panel shows.
  const load = useCallback(
    async (opts?: { bypassCache?: boolean }) => {
      if (!hasLocation || !inNycBox(latitude, longitude)) {
        setItems([]);
        setSources([]);
        setApplies(false);
        setError(false);
        return;
      }

      const key = cacheKey(latitude, longitude);
      if (opts?.bypassCache) {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      } else {
        const cached = readCache(key);
        if (cached) {
          setItems(cached.items);
          setApplies(cached.applies);
          setSources(cached.sources);
          setLastChecked(cached.lastChecked);
          setError(false);
          setLoaded(true);
          return;
        }
      }

      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
        });
        const res = await fetch(`/api/nyc311?${params.toString()}`);
        const data = (await res.json()) as {
          items?: NYC311Item[];
          applies?: boolean;
          import?: { checked?: NYC311SourceStatus[] };
        };
        if (!res.ok) {
          setError(true);
        } else {
          const nextItems = Array.isArray(data.items) ? data.items : [];
          const nextApplies = data.applies === true;
          const srcs = Array.isArray(data.import?.checked)
            ? data.import!.checked!
            : [];
          const checkedAt = new Date().toISOString();
          setItems(nextItems);
          setApplies(nextApplies);
          setSources(srcs);
          setLastChecked(checkedAt);
          writeCache(key, {
            items: nextItems,
            applies: nextApplies,
            sources: srcs,
            lastChecked: checkedAt,
          });
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [hasLocation, latitude, longitude],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    void load({ bypassCache: true });
  }, [load]);

  const busy = loading || isResolvingLocation;
  const showStatus = busy || sources.length > 0 || error;

  // Applicability (311 is NYC-only) and live status reported up to the sidebar
  // control cell so it can drop the panel from the picker outside NYC. These
  // hooks run before the early returns below to satisfy the Rules of Hooks.
  const panelControl = usePanelControl();
  const available = maybeNyc && (!loaded || applies);
  const panelLive = available && sources.length > 0 && !busy && !error;
  useEffect(() => {
    panelControl?.reportStatus('nyc311', {
      available,
      live: panelLive,
      loading: busy,
      ok: !error,
    });
  }, [panelControl, available, panelLive, busy, error]);
  const expandNonce = panelControl?.expandSignal.nonce ?? 0;
  const expandValue = panelControl?.expandSignal.value ?? true;
  useEffect(() => {
    if (expandNonce === 0) return;
    setIsExpanded(expandValue);
  }, [expandNonce, expandValue]);

  // Hide the panel entirely outside NYC: not in the box, or the server said the
  // location isn't covered by an NYC source.
  if (!maybeNyc) return null;
  if (loaded && !applies) return null;

  const EmptyState = ({ text }: { text: string }) => (
    <div
      style={{
        padding: '1.75rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.55rem',
        minHeight: 100,
      }}
    >
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.78rem',
          color: mutedText,
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.65,
          maxWidth: 280,
        }}
      >
        {text}
      </p>
    </div>
  );

  return (
    <NeoPanel isExpanded={isExpanded}>
      {/* Section Header */}
      <PanelHeader
        divider={divider}
        isDark={isDark}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {showStatus && (
            <PanelStatusSquare loading={busy} ok={!error} isDark={isDark} />
          )}
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              color: cardText,
            }}
          >
            311! NEARBY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <PanelRefreshButton
            loading={busy}
            onRefresh={handleRefresh}
            isDark={isDark}
            label="Refresh 311"
          />
          <PanelInfoPopover
            isDark={isDark}
            title="LIVE DATA SOURCES"
            ariaLabel="Show live data sources"
          >
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.22rem',
              }}
            >
              {sources.length > 0 ? (
                sources.map((s) => (
                  <li
                    key={s.id}
                    style={{
                      fontSize: '0.68rem',
                      color: mutedText,
                      lineHeight: 1.4,
                    }}
                  >
                    {s.name} {s.ok ? '' : '(failed)'}
                  </li>
                ))
              ) : (
                <li
                  style={{
                    fontSize: '0.68rem',
                    color: mutedText,
                    lineHeight: 1.4,
                  }}
                >
                  Recent NYC 311 service requests near you, from the
                  city&rsquo;s open data. Updated daily.
                </li>
              )}
            </ul>
          </PanelInfoPopover>
          <motion.div
            style={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mutedText,
            }}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </motion.div>
        </div>
      </PanelHeader>

      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="nyc311-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {busy && !loaded ? (
              <EmptyState text="Checking NYC 311 service requests…" />
            ) : error ? (
              <EmptyState text="NYC 311 data could not be loaded. Try refreshing." />
            ) : items.length === 0 ? (
              <EmptyState text="No recent 311 service requests are listed near you." />
            ) : (
              <>
                {/* Filter bar — keyword search + status toggles */}
                <div
                  style={{
                    padding: '0.8rem 1.4rem',
                    borderBottom: `1px solid ${divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
                      background: isDark ? '#0a0a0a' : '#fafafa',
                      padding: '0.4rem 0.6rem',
                    }}
                  >
                    <Search size={13} color={mutedText} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter by type, agency, or status…"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.72rem',
                        color: cardText,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                    />
                    {filtersActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setActiveTags([]);
                        }}
                        aria-label="Clear filters"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: mutedText,
                          lineHeight: 0,
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  {tagOptions.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                      }}
                    >
                      {tagOptions.map((t) => {
                        const active = activeTags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            aria-pressed={active}
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              padding: '0.22rem 0.55rem',
                              cursor: 'pointer',
                              border: `1px solid ${
                                active
                                  ? GOLD_COLOR
                                  : isDark
                                    ? '#2a2a2a'
                                    : '#e0e0e0'
                              }`,
                              background: active ? GOLD_COLOR : 'transparent',
                              color: active ? '#000' : mutedText,
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {filteredTotal > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.8rem',
                      padding: '0.65rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.68rem',
                        color: mutedText,
                      }}
                    >
                      Page {Math.min(page, shownTotalPages)} of{' '}
                      {shownTotalPages}
                      {filteredTotal > 0 ? ` · ${filteredTotal} results` : ''}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!hasPreviousPage}
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.55rem',
                          cursor: !hasPreviousPage ? 'not-allowed' : 'pointer',
                          border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
                          background: 'transparent',
                          color: !hasPreviousPage ? mutedText : cardText,
                          opacity: !hasPreviousPage ? 0.45 : 1,
                        }}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasNextPage}
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.55rem',
                          cursor: !hasNextPage ? 'not-allowed' : 'pointer',
                          border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
                          background: 'transparent',
                          color: !hasNextPage ? mutedText : cardText,
                          opacity: !hasNextPage ? 0.45 : 1,
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {filteredItems.length === 0 ? (
                  <EmptyState text="No 311 requests match your filters." />
                ) : (
                  pagedItems.map((item, i) => {
                    const when = formatReported(item);
                    const where = item.address?.trim();
                    const tag = tagOf(item);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
                          padding: '0.82rem 1.4rem',
                          borderBottom:
                            i < pagedItems.length - 1
                              ? `1px solid ${divider}`
                              : undefined,
                        }}
                      >
                        {tag ? (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '0.18rem',
                              padding: '0.18rem 0.45rem',
                              background: isDark ? '#1a1a1a' : '#f5f5f5',
                              border: `1px solid ${divider}`,
                              color: mutedText,
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 700,
                              fontSize: '0.57rem',
                              letterSpacing: '0.06em',
                              flexShrink: 0,
                              maxWidth: 130,
                            }}
                          >
                            {tag}
                          </span>
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: cardText,
                              marginBottom: '0.12rem',
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.7rem',
                              color: detailText,
                            }}
                          >
                            {item.description
                              ? item.description
                              : item.organizationName}
                            {when ? ` · ${when}` : ''}
                          </div>
                          {where ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.25rem',
                                marginTop: '0.18rem',
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '0.66rem',
                                color: detailText,
                                lineHeight: 1.4,
                              }}
                            >
                              <MapPin
                                size={10}
                                style={{ flexShrink: 0, marginTop: '0.15rem' }}
                              />
                              <span>{where}</span>
                            </div>
                          ) : null}
                          {item.sourceUrl || item.website ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.16rem',
                                marginTop: '0.4rem',
                              }}
                            >
                              {item.website ? (
                                <a
                                  href={item.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: '0.66rem',
                                    color: GOLD_COLOR,
                                    textDecoration: 'none',
                                    maxWidth: '100%',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  <ExternalLink
                                    size={9}
                                    style={{ flexShrink: 0 }}
                                  />{' '}
                                  {displayUrl(item.website)}
                                </a>
                              ) : null}
                              {item.sourceUrl ? (
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: '0.66rem',
                                    color: mutedText,
                                    textDecoration: 'underline',
                                    width: 'fit-content',
                                  }}
                                >
                                  <ExternalLink size={9} /> View source
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                {lastChecked && (
                  <div
                    style={{
                      padding: '0.6rem 1.4rem',
                      borderTop: `1px solid ${divider}`,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.62rem',
                      color: mutedText,
                    }}
                  >
                    Last checked {formatChecked(lastChecked)}
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </NeoPanel>
  );
};
