'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

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

const ALERT_CATEGORIES = [
  { label: 'Fire', color: '#ef4444' },
  { label: 'Earthquake', color: '#f97316' },
  { label: 'Storm', color: '#60a5fa' },
  { label: 'Evacuation', color: '#a78bfa' },
  { label: 'Public Safety', color: '#f9c700' },
  { label: 'Severe Weather', color: '#6ee7b7' },
];

export const AlertPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, isDemo } = useLocationContext();

  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[] | null>(
    null,
  );
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(false);
  const [weatherAlertsError, setWeatherAlertsError] = useState(false);

  const fetchWeatherAlerts = useCallback(async (zipCode: string) => {
    setWeatherAlertsLoading(true);
    setWeatherAlertsError(false);
    setWeatherAlerts(null);

    try {
      const res = await fetch(
        `/api/weather-alerts?zip=${encodeURIComponent(zipCode)}`,
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setWeatherAlertsError(true);
      } else {
        setWeatherAlerts(data.alerts ?? []);
      }
    } catch {
      setWeatherAlertsError(true);
    } finally {
      setWeatherAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (zip && /^\d{5}$/.test(zip) && !isDemo) {
      fetchWeatherAlerts(zip);
    }
  }, [zip, isDemo, fetchWeatherAlerts]);

  const severityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return '#dc2626';
      case 'severe':
        return '#ef4444';
      case 'moderate':
        return '#f97316';
      case 'minor':
        return '#f59e0b';
      default:
        return '#60a5fa';
    }
  };

  const formatCheckedTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';

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
        <div style={{ height: 2, background: '#dc2626' }} />

        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${divider}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 2,
                height: 16,
                background: '#dc2626',
                flexShrink: 0,
              }}
            />
            <AlertTriangle size={14} color="#dc2626" strokeWidth={2.5} />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              EMERGENCY ALERTS
            </span>
          </div>
        </div>

        {/* Category chips */}
        <div
          style={{
            padding: '0.75rem 1.4rem',
            display: 'flex',
            gap: '0.38rem',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${divider}`,
          }}
        >
          {ALERT_CATEGORIES.map(({ label, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.28rem',
                padding: '0.2rem 0.48rem',
                border: `1px solid ${color}28`,
                backgroundColor: color + '0c',
                fontSize: '0.65rem',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                color: isDark ? color + 'cc' : color,
                letterSpacing: '0.04em',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Alert content */}
        <AnimatePresence mode="wait">
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
                Checking for official weather alerts...
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
                borderLeft: '3px solid #f97316',
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
                Official weather alerts could not be loaded. Check{' '}
                <a
                  href="https://www.weather.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#f97316', textDecoration: 'underline' }}
                >
                  weather.gov
                </a>{' '}
                directly.
              </span>
            </motion.div>
          ) : weatherAlerts !== null && weatherAlerts.length === 0 ? (
            <motion.div
              key="alerts-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '0.5rem 0' }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.78rem',
                  color: mutedText,
                  lineHeight: 1.5,
                }}
              >
                No active official weather alerts near this location.
              </span>
            </motion.div>
          ) : weatherAlerts !== null && weatherAlerts.length > 0 ? (
            <motion.div
              key="alerts-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {weatherAlerts.map((alert) => {
                const accentColor = severityColor(alert.severity);
                return (
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
                    <AlertTriangle
                      size={14}
                      color={accentColor}
                      strokeWidth={2}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
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
                );
              })}
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
                    Source: National Weather Service
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
                      Checked {formatCheckedTime(weatherAlerts[0].effective)}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="alerts-locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '0.5rem 0' }}
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.78rem',
                  color: mutedText,
                }}
              >
                Enter a 5-digit ZIP code for official weather alerts.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
