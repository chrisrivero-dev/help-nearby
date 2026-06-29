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
import type { CommunityOpportunity } from '@/lib/community/types';
import type { GroundingItem } from './DashboardContext';
import { usePublishGrounding } from '@/lib/chat/usePublishGrounding';

const GOLD_COLOR = '#E0A800';
const COMMUNITY_CACHE_TTL_MS = 10 * 60 * 1000;
const COMMUNITY_PAGE_SIZE = 10;

interface CommunitySourceStatus {
  id: string;
  name: string;
  ok: boolean;
}

interface CommunityCacheEntry {
  items: CommunityOpportunity[];
  sources: CommunitySourceStatus[];
  lastChecked: string;
  ts: number;
}

const cacheKey = (lat: number, lng: number) =>
  `hn:community:${lat.toFixed(3)},${lng.toFixed(3)}`;

const readCommunityCache = (key: string): CommunityCacheEntry | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CommunityCacheEntry;
    if (!entry?.ts || Date.now() - entry.ts > COMMUNITY_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

const writeCommunityCache = (
  key: string,
  entry: Omit<CommunityCacheEntry, 'ts'>,
): void => {
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

// The displayed tag: the source-native category (e.g. NYC "Street and
// Neighborhood") when present, otherwise the coarse enum type.
function tagOf(o: CommunityOpportunity): string {
  const c = o.category?.trim();
  return c && c.length > 0 ? c : o.type;
}

// "When" line: prefer the source's own human labels (NYC datePart "Jun 21" +
// timePart "5:30am to 7:30pm"); fall back to deriving from startAt/endAt for
// sources that only provide machine timestamps.
function formatWhen(o: CommunityOpportunity): string | undefined {
  const dl = o.dateLabel?.trim();
  const tl = o.timeLabel?.trim();
  if (dl || tl) return [dl, tl].filter(Boolean).join(' · ');

  if (!o.startAt) return undefined;
  const start = new Date(o.startAt);
  if (Number.isNaN(start.getTime())) return undefined;
  const dateStr = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const isAllDay = start.getHours() === 0 && start.getMinutes() <= 5;
  if (isAllDay) return `${dateStr} · All day`;
  const time = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const end = o.endAt ? new Date(o.endAt) : null;
  if (end && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
    return `${dateStr} · ${time(start)} – ${time(end)}`;
  }
  return `${dateStr} · ${time(start)}`;
}

// Clean URL for display as link text — drop the scheme and any trailing slash.
function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

// "Where" line: the source address, unless it's a non-location placeholder.
function formatWhere(o: CommunityOpportunity): string | undefined {
  const a = o.address?.trim();
  if (!a) return undefined;
  if (/^check website/i.test(a)) return undefined;
  return a;
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

// One-line summary of an opportunity for the chat grounding bus.
function communityGroundingText(o: CommunityOpportunity): string {
  return [tagOf(o), o.title, o.organizationName, formatWhen(o), formatWhere(o)]
    .filter(Boolean)
    .join(' · ');
}

export const CommunityPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { latitude, longitude, isValid, isResolvingLocation } =
    useLocationContext();
  const hasLocation =
    isValid && Number.isFinite(latitude) && Number.isFinite(longitude);

  const [isExpanded, setIsExpanded] = useState(true);
  const [items, setItems] = useState<CommunityOpportunity[]>([]);
  const [sources, setSources] = useState<CommunitySourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const cardText = isDark ? '#f4f4f4' : '#111111';
  // Detail/subtext tone matched to Alerts/Resources panels (darker, near-black).
  const detailText = isDark ? '#bdbdbd' : '#444444';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';

  // Distinct tags present in the current results, for the toggle chips.
  const tagOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const o of items) seen.add(tagOf(o));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((o) => {
      if (activeTypes.length > 0 && !activeTypes.includes(tagOf(o)))
        return false;
      if (!q) return true;
      const haystack = [
        o.title,
        o.organizationName,
        o.category,
        o.type,
        o.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, activeTypes]);

  const filtersActive = query.trim().length > 0 || activeTypes.length > 0;

  // Publish the filtered events to the chat so it can see what's shown here.
  const groundingItems = useMemo<GroundingItem[] | null>(
    () =>
      filteredItems.length > 0
        ? filteredItems.map((o) => ({ groundingText: communityGroundingText(o) }))
        : null,
    [filteredItems],
  );
  const groundingFilters = useMemo(
    () => ({
      query: query.trim() || undefined,
      categories: activeTypes.length ? activeTypes : undefined,
    }),
    [query, activeTypes],
  );
  usePublishGrounding('community', 'Community', groundingItems, groundingFilters);

  const toggleType = (t: string) =>
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  // Pagination — 10 per page, like the other panels.
  const filteredTotal = filteredItems.length;
  const totalPages =
    filteredTotal === 0 ? 0 : Math.ceil(filteredTotal / COMMUNITY_PAGE_SIZE);
  const shownTotalPages = Math.max(totalPages, 1);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (page - 1) * COMMUNITY_PAGE_SIZE,
        (page - 1) * COMMUNITY_PAGE_SIZE + COMMUNITY_PAGE_SIZE,
      ),
    [filteredItems, page],
  );

  // Drop active toggles that no longer exist after a refresh/location change.
  useEffect(() => {
    setActiveTypes((prev) => {
      const next = prev.filter((t) => tagOptions.includes(t));
      return next.length === prev.length ? prev : next;
    });
  }, [tagOptions]);

  // Reset to the first page when filters change; keep page in range as results shrink.
  useEffect(() => {
    setPage(1);
  }, [query, activeTypes]);
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Fetch real, approved, non-expired opportunities for the resolved location.
  // localStorage-cached (10 min); refresh bypasses the cache. No demo fallback —
  // an empty result renders the empty state, which is still a successful load.
  const load = useCallback(
    async (opts?: { bypassCache?: boolean }) => {
      if (
        !isValid ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setItems([]);
        setSources([]);
        setError(false);
        return;
      }

      const key = cacheKey(latitude, longitude);
      if (opts?.bypassCache) {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      } else {
        const cached = readCommunityCache(key);
        if (cached) {
          setItems(cached.items);
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
        const res = await fetch(
          `/api/community-opportunities?${params.toString()}`,
        );
        const data = (await res.json()) as {
          opportunities?: CommunityOpportunity[];
          import?: { checked?: CommunitySourceStatus[] };
        };
        if (!res.ok) {
          setError(true);
        } else {
          const ops = Array.isArray(data.opportunities)
            ? data.opportunities
            : [];
          const srcs = Array.isArray(data.import?.checked)
            ? data.import!.checked!
            : [];
          const checkedAt = new Date().toISOString();
          setItems(ops);
          setSources(srcs);
          setLastChecked(checkedAt);
          writeCommunityCache(key, {
            items: ops,
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
    [isValid, latitude, longitude],
  );

  // Load eagerly whenever the resolved location changes (mirrors AlertPanel).
  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    void load({ bypassCache: true });
  }, [load]);

  const busy = loading || isResolvingLocation;
  const communityOk = sources.some((s) => s.ok) && !error;

  const EmptyOrLocked = ({ text }: { text: string }) => (
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

  // Report live status (green / connected source) and respond to the
  // sidebar's expand/collapse-all control.
  const panelControl = usePanelControl();
  const panelLive = communityOk && !busy;
  useEffect(() => {
    panelControl?.reportStatus('community', {
      available: true,
      live: panelLive,
      loading: busy,
      ok: communityOk,
    });
  }, [panelControl, panelLive, busy, communityOk]);
  const expandNonce = panelControl?.expandSignal.nonce ?? 0;
  const expandValue = panelControl?.expandSignal.value ?? true;
  useEffect(() => {
    if (expandNonce === 0) return;
    setIsExpanded(expandValue);
  }, [expandNonce, expandValue]);

  return (
    <NeoPanel isExpanded={isExpanded}>
      {/* Section Header */}
      <PanelHeader
        divider={divider}
        isDark={isDark}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PanelStatusSquare loading={busy} ok={communityOk} isDark={isDark} />
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              color: cardText,
            }}
          >
            COMMUNITY! NEARBY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Manual refresh — left of the info icon */}
          {hasLocation && (
            <PanelRefreshButton
              loading={busy}
              onRefresh={handleRefresh}
              isDark={isDark}
              label="Refresh community"
            />
          )}
          {/* Info popover — live data sources actually queried for this location */}
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
                  Official events and happenings from your area&rsquo;s civic
                  data sources. No live source covers this location yet.
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
            key="community-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!hasLocation ? (
              <EmptyOrLocked text="Enter your location to see community events and happenings nearby." />
            ) : busy && !loaded ? (
              <EmptyOrLocked text="Checking official community sources…" />
            ) : error ? (
              <EmptyOrLocked text="Community events could not be loaded. Try refreshing." />
            ) : items.length === 0 ? (
              <EmptyOrLocked text="No community events or happenings are currently listed nearby." />
            ) : (
              <>
                {/* Filter bar — keyword search + category toggles */}
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
                      placeholder="Filter by name, category, or org…"
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
                          setActiveTypes([]);
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
                        const active = activeTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
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
                  <EmptyOrLocked text="No community events match your filters." />
                ) : (
                  pagedItems.map((item, i) => {
                    const when = formatWhen(item);
                    const where = formatWhere(item);
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
                          {tagOf(item)}
                        </span>
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
                            {item.organizationName}
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
