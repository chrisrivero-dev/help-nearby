'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { PanelStatusSquare, PanelRefreshButton } from './PanelStatusControls';

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
}

interface AlertSourceStatus {
  id: string;
  name: string;
  ok: boolean;
}

const GOLD_COLOR = '#f59e0b';

export const AlertPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, latitude, longitude, isValid } = useLocationContext();

  // HeroSection color scheme
  const heroBg = isDark
    ? 'linear-gradient(135deg, #09090b 0%, #0a0c10 55%, #0b0d14 100%)'
    : 'linear-gradient(135deg, #f4f5f7 0%, #f8f9fb 100%)';
  const heroBorder = isDark ? '#1a1e28' : '#dde2ea';
  const heroShadow = isDark
    ? '4px 4px 0px rgba(0,0,0,0.85)'
    : '4px 4px 0px rgba(0,0,0,0.05)';
  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const inputBg = isDark ? '#07080b' : '#ffffff';
  const inputBorder = isDark ? '#252a36' : '#d0d4dc';
  const errorColor = '#dc2626';

  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[] | null>(
    null,
  );
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(
    null,
  );

  // Extract unique event types from alerts for category badges
  const eventTypes = useMemo(() => {
    if (!weatherAlerts || weatherAlerts.length === 0) return [];
    const types = new Set(weatherAlerts.map((a) => a.title));
    return Array.from(types);
  }, [weatherAlerts]);
  const filteredWeatherAlerts = useMemo(() => {
    if (!weatherAlerts) return null;
    if (!selectedAlertType) return weatherAlerts;
    return weatherAlerts.filter((alert) => alert.title === selectedAlertType);
  }, [selectedAlertType, weatherAlerts]);
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(false);
  const [weatherAlertsError, setWeatherAlertsError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sources, setSources] = useState<AlertSourceStatus[]>([
    { id: 'nws', name: 'National Weather Service', ok: true },
  ]);

  const fetchWeatherAlerts = useCallback(async (lat: number, lng: number) => {
    setWeatherAlertsLoading(true);
    setWeatherAlertsError(false);
    setWeatherAlerts(null);
    setSelectedAlertType(null);

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

  useEffect(() => {
    if (
      selectedAlertType &&
      !eventTypes.some((eventType) => eventType === selectedAlertType)
    ) {
      setSelectedAlertType(null);
    }
  }, [eventTypes, selectedAlertType]);

  useEffect(() => {
    if (!zip) {
      setWeatherAlerts(null);
      setWeatherAlertsError(false);
      return;
    }
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchWeatherAlerts(latitude, longitude);
    } else {
      // ZIP entered but lookup failed — show empty/unavailable.
      setWeatherAlerts([]);
      setWeatherAlertsError(false);
    }
  }, [zip, isValid, latitude, longitude, fetchWeatherAlerts]);

  const handleRefresh = useCallback(() => {
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchWeatherAlerts(latitude, longitude);
    }
  }, [isValid, latitude, longitude, fetchWeatherAlerts]);

  const formatCheckedTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const accentColor = GOLD_COLOR;

  return (
    <motion.div
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: 'fit-content',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Back panel - static, zIndex 1 */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)'}`,
        }}
      />
      {/* Front panel - zIndex 2, lifts on hover */}
      <motion.div
        style={{
          background: isDark ? '#121212' : '#ffffff',
          border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
          position: 'relative',
          zIndex: 2,
        }}
        whileHover={{
          x: -4,
          y: -4,
        }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${divider}`,
            cursor: 'pointer',
          }}
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
            {zip && isValid && (
              <PanelRefreshButton
                loading={weatherAlertsLoading}
                onRefresh={handleRefresh}
                isDark={isDark}
                label="Refresh alerts"
              />
            )}
            {/* Info tooltip */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setSourcesOpen(true)}
              onMouseLeave={() => setSourcesOpen(false)}
            >
              <button
                type="button"
                aria-label="Show live data sources"
                aria-expanded={sourcesOpen}
                onClick={() => setSourcesOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: mutedText,
                  lineHeight: 0,
                }}
              >
                <Info size={13} />
              </button>
              {sourcesOpen && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    zIndex: 99999,
                    minWidth: 240,
                    maxWidth: 280,
                    padding: '0.65rem 0.8rem',
                    background: isDark ? '#0a0a0a' : '#ffffff',
                    border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
                    boxShadow: isDark
                      ? '0 4px 12px rgba(0,0,0,0.6)'
                      : '0 4px 12px rgba(0,0,0,0.08)',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      letterSpacing: '0.1em',
                      color: cardText,
                      marginBottom: '0.4rem',
                    }}
                  >
                    LIVE DATA SOURCES
                  </div>
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
                </div>
              )}
            </div>
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
        </div>

        {/* Alert content */}
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <>
              {/* Event type filter badges */}
              {eventTypes.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1.4rem',
                    display: 'flex',
                    gap: '0.38rem',
                    flexWrap: 'wrap',
                    borderBottom: `1px solid ${divider}`,
                  }}
                >
                  {eventTypes.map((eventType) => (
                    <button
                      type="button"
                      key={eventType}
                      aria-pressed={selectedAlertType === eventType}
                      onClick={() =>
                        setSelectedAlertType((current) =>
                          current === eventType ? null : eventType,
                        )
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.28rem',
                        padding: '0.2rem 0.48rem',
                        border: `1px solid ${
                          selectedAlertType === eventType
                            ? accentColor
                            : divider
                        }`,
                        backgroundColor:
                          selectedAlertType === eventType
                            ? isDark
                              ? 'rgba(245, 158, 11, 0.14)'
                              : 'rgba(245, 158, 11, 0.12)'
                            : isDark
                              ? '#1a1a1a'
                              : '#f5f5f5',
                        fontSize: '0.65rem',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        color:
                          selectedAlertType === eventType
                            ? accentColor
                            : mutedText,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        lineHeight: 1.2,
                      }}
                    >
                      {eventType}
                    </button>
                  ))}
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
                    background: isDark ? '#0d0d0d' : '#fafafa',
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
                  {filteredWeatherAlerts.length === 0 ? (
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
                        NO {selectedAlertType?.toUpperCase()} ALERTS
                      </span>
                    </div>
                  ) : (
                    filteredWeatherAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                          padding: '0.85rem 1rem',
                          borderLeft: `3px solid ${accentColor}`,
                          background: isDark ? '#0d0d0d' : '#fafafa',
                        }}
                      >
                        <div>
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
                                color: mutedText,
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
                        </div>
                      </div>
                    ))
                  )}
                  {!weatherAlertsLoading && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.55rem 1.4rem',
                        borderTop: `1px solid ${divider}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.62rem',
                          color: mutedText,
                          letterSpacing: '0.02em',
                        }}
                      >
                        Sources:{' '}
                        {sources
                          .filter((source) => source.ok)
                          .map((source) => source.name)
                          .slice(0, 2)
                          .join(', ') || 'Official alert sources'}
                        {sources.filter((source) => source.ok).length > 2
                          ? ' + more'
                          : ''}
                      </span>
                      {weatherAlerts[0]?.effective && (
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: mutedText,
                            letterSpacing: '0.02em',
                          }}
                        >
                          Checked{' '}
                          {formatCheckedTime(weatherAlerts[0].effective)}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
