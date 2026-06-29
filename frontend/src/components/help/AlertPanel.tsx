'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Search, X } from 'lucide-react';
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
import type { GroundingItem } from './DashboardContext';
import { usePublishGrounding } from '@/lib/chat/usePublishGrounding';

interface WeatherAlert {
  id: string;
  title: string;
  headline: string;
  description: string;
  instruction: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string | null;
  expires: string | null;
  area: string;
  url: string;
  sourceName?: string;
  sourceUrl?: string;
}

interface AlertSourceStatus {
  id: string;
  name: string;
  ok: boolean;
}

const GOLD_COLOR = '#E0A800';
const ALERTS_PAGE_SIZE = 10;

// One-line summary of an alert for the chat grounding bus.
const alertGroundingText = (a: WeatherAlert): string => {
  const head = [a.title, a.severity, a.area].filter(Boolean).join(' · ');
  return a.headline ? `${head} — ${a.headline}` : head;
};

export const AlertPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { latitude, longitude, isValid } = useLocationContext();

  // HeroSection color scheme
  const heroBg = isDark
    ? 'linear-gradient(135deg, #09090b 0%, #0a0c10 55%, #0b0d14 100%)'
    : 'linear-gradient(135deg, #f4f5f7 0%, #f8f9fb 100%)';
  const heroBorder = isDark ? '#1a1e28' : '#dde2ea';
  const heroShadow = isDark
    ? '4px 4px 0px rgba(0,0,0,0.85)'
    : '4px 4px 0px rgba(0,0,0,0.05)';
  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#9a9a9a' : '#999';
  // Detail/subtext tone matched to ResourcesPanel so alert headlines read clearly.
  const detailText = isDark ? '#bdbdbd' : '#444444';
  const inputBg = isDark ? '#07080b' : '#ffffff';
  const inputBorder = isDark ? '#252a36' : '#d0d4dc';
  const errorColor = '#dc2626';

  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[] | null>(
    null,
  );
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Extract unique event types from alerts for category badges
  const eventTypes = useMemo(() => {
    if (!weatherAlerts || weatherAlerts.length === 0) return [];
    const types = new Set(weatherAlerts.map((a) => a.title));
    return Array.from(types);
  }, [weatherAlerts]);
  const filteredWeatherAlerts = useMemo(() => {
    if (!weatherAlerts) return null;
    const q = query.trim().toLowerCase();
    return weatherAlerts.filter((alert) => {
      if (activeTypes.length > 0 && !activeTypes.includes(alert.title))
        return false;
      if (!q) return true;
      const haystack = [
        alert.title,
        alert.headline,
        alert.area,
        alert.description,
        alert.sourceName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTypes, query, weatherAlerts]);

  const filteredTotal = filteredWeatherAlerts?.length ?? 0;
  const totalPages =
    filteredTotal === 0 ? 0 : Math.ceil(filteredTotal / ALERTS_PAGE_SIZE);
  const shownTotalPages = Math.max(totalPages, 1);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const pagedAlerts = useMemo(() => {
    if (!filteredWeatherAlerts) return filteredWeatherAlerts;
    const offset = (page - 1) * ALERTS_PAGE_SIZE;
    return filteredWeatherAlerts.slice(offset, offset + ALERTS_PAGE_SIZE);
  }, [filteredWeatherAlerts, page]);
  const filtersActive = query.trim().length > 0 || activeTypes.length > 0;

  // Publish the filtered alerts to the chat so it can see what's shown here.
  const groundingItems = useMemo<GroundingItem[] | null>(
    () =>
      filteredWeatherAlerts?.map((a) => ({
        groundingText: alertGroundingText(a),
      })) ?? null,
    [filteredWeatherAlerts],
  );
  const groundingFilters = useMemo(
    () => ({
      query: query.trim() || undefined,
      categories: activeTypes.length ? activeTypes : undefined,
    }),
    [query, activeTypes],
  );
  usePublishGrounding('alerts', 'Alerts', groundingItems, groundingFilters);

  const toggleType = (t: string) =>
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(false);
  const [weatherAlertsError, setWeatherAlertsError] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sources, setSources] = useState<AlertSourceStatus[]>([
    { id: 'nws', name: 'National Weather Service', ok: true },
  ]);

  const fetchWeatherAlerts = useCallback(async (lat: number, lng: number) => {
    setWeatherAlertsLoading(true);
    setWeatherAlertsError(false);
    setWeatherAlerts(null);
    setActiveTypes([]);
    setQuery('');
    setPage(1);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
      });
      const res = await fetch(`/api/weather-alerts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setWeatherAlertsError(true);
      } else {
        setWeatherAlerts(data.alerts ?? []);
        setLastChecked(new Date().toISOString());
        if (Array.isArray(data.sources) && data.sources.length > 0) {
          setSources(data.sources);
        }
      }
    } catch {
      setWeatherAlertsError(true);
    } finally {
      setWeatherAlertsLoading(false);
    }
  }, []);

  // Drop any active type filters that no longer exist in the latest results.
  useEffect(() => {
    setActiveTypes((prev) => {
      const next = prev.filter((t) => eventTypes.includes(t));
      return next.length === prev.length ? prev : next;
    });
  }, [eventTypes]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [activeTypes, query]);

  // Keep the page in range as the filtered total shrinks.
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchWeatherAlerts(latitude, longitude);
    } else {
      // No resolved location yet (or lookup failed) — show nothing.
      setWeatherAlerts(null);
      setWeatherAlertsError(false);
    }
  }, [isValid, latitude, longitude, fetchWeatherAlerts]);

  const handleRefresh = useCallback(() => {
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchWeatherAlerts(latitude, longitude);
    }
  }, [isValid, latitude, longitude, fetchWeatherAlerts]);

  const formatChecked = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const alertSourceName =
    sources.find((source) => source.ok)?.name ?? 'National Weather Service';

  const divider = isDark ? '#2a2a2a' : '#f0f0f0';
  const accentColor = GOLD_COLOR;

  // Report live status (green / connected source) and respond to the
  // sidebar's expand/collapse-all control.
  const panelControl = usePanelControl();
  const panelLive =
    sources.length > 0 && !weatherAlertsError && !weatherAlertsLoading;
  useEffect(() => {
    panelControl?.reportStatus('alerts', {
      available: true,
      live: panelLive,
      loading: weatherAlertsLoading,
      ok: !weatherAlertsError,
    });
  }, [panelControl, panelLive, weatherAlertsLoading, weatherAlertsError]);
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
          {/* Status indicator - left of title */}
          {(weatherAlertsLoading || sources.length > 0) && (
            <PanelStatusSquare
              loading={weatherAlertsLoading}
              ok={!weatherAlertsError}
              isDark={isDark}
            />
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
            ALERTS! NEARBY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Manual refresh — left of the info icon */}
          {isValid && (
            <PanelRefreshButton
              loading={weatherAlertsLoading}
              onRefresh={handleRefresh}
              isDark={isDark}
              label="Refresh alerts"
            />
          )}
          {/* Info popover — live data sources */}
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
              {sources.map((s) => (
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
              ))}
            </ul>
          </PanelInfoPopover>
          {/* Collapse indicator */}
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

      {/* Alert content */}
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <>
            {/* Filter bar — keyword search + type toggles (multi-select) */}
            {weatherAlerts !== null && weatherAlerts.length > 0 && (
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
                    placeholder="Filter by type, area, or source…"
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
                {eventTypes.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                    }}
                  >
                    {eventTypes.map((eventType) => {
                      const active = activeTypes.includes(eventType);
                      return (
                        <button
                          key={eventType}
                          type="button"
                          onClick={() => toggleType(eventType)}
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
                                ? '#E0A800'
                                : isDark
                                  ? '#3A3A3A'
                                  : '#d0d0d0'
                            }`,
                            background: active ? '#E0A800' : 'transparent',
                            color: active ? '#111' : mutedText,
                          }}
                        >
                          {eventType}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {weatherAlertsLoading ? (
              <motion.div
                key="alerts-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '0.9rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.78rem',
                    color: mutedText,
                  }}
                >
                  Checking official alert sources...
                </span>
              </motion.div>
            ) : weatherAlertsError ? (
              <motion.div
                key="alerts-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '0.85rem 1rem',
                  borderLeft: `3px solid ${accentColor}`,
                  background: isDark ? '#141414' : '#fafafa',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.78rem',
                    color: mutedText,
                    lineHeight: 1.5,
                  }}
                >
                  Official alerts could not be loaded. Check{' '}
                  <a
                    href="https://www.weather.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: accentColor,
                      textDecoration: 'underline',
                    }}
                  >
                    weather.gov
                  </a>{' '}
                  or local emergency sources directly.
                </span>
              </motion.div>
            ) : weatherAlerts !== null && weatherAlerts.length === 0 ? (
              <motion.div
                key="alerts-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.88rem',
                    color: mutedText,
                    lineHeight: 1.6,
                  }}
                >
                  NO OFFICIAL ALERTS
                </span>
              </motion.div>
            ) : filteredWeatherAlerts !== null &&
              weatherAlerts !== null &&
              weatherAlerts.length > 0 ? (
              <motion.div
                key="alerts-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Pagination — 10 alerts per page */}
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
                    Page {Math.min(page, shownTotalPages)} of {shownTotalPages}
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
                {(pagedAlerts ?? []).length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '120px',
                      padding: '1.2rem',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.78rem',
                        color: mutedText,
                        lineHeight: 1.6,
                      }}
                    >
                      No alerts match your filters.
                    </span>
                  </div>
                ) : (
                  (pagedAlerts ?? []).map((alert, index, arr) => {
                    const isLast = index === arr.length - 1;
                    const itemSourceName = alert.sourceName ?? alertSourceName;
                    const sourceUrl =
                      alert.sourceUrl ||
                      alert.url ||
                      'https://www.weather.gov/';
                    return (
                      <div
                        key={alert.id}
                        style={{
                          padding: '0.9rem 1.4rem',
                          borderBottom: isLast
                            ? undefined
                            : `1px solid ${divider}`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.83rem',
                            color: cardText,
                            marginBottom: '0.2rem',
                          }}
                        >
                          {alert.title}
                        </div>
                        {alert.headline && (
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.77rem',
                              color: detailText,
                              lineHeight: 1.5,
                              marginBottom: '0.3rem',
                            }}
                          >
                            {alert.headline}
                          </div>
                        )}
                        {alert.area && (
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.64rem',
                              color: mutedText,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {alert.area}
                          </div>
                        )}
                        {/* Footer: source above the last-checked timestamp */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.16rem',
                            marginTop: '0.7rem',
                            paddingTop: '0.6rem',
                            borderTop: `1px solid ${divider}`,
                          }}
                        >
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              color: mutedText,
                              textDecoration: 'underline',
                              width: 'fit-content',
                            }}
                          >
                            <ExternalLink size={9} /> Source: {itemSourceName}
                          </a>
                          {lastChecked && (
                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '0.62rem',
                                color: mutedText,
                              }}
                            >
                              Last checked {formatChecked(lastChecked)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : null}
          </>
        ) : null}
      </AnimatePresence>
    </NeoPanel>
  );
};
