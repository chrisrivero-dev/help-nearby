'use client';

import type { FC, CSSProperties } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle, Heart, Bus, Users, Bell,
  MapPin, ChevronRight, Flame,
  Thermometer, CloudLightning, Wind, ShieldAlert,
  Home, Utensils, DollarSign, Activity,
  Crosshair, ArrowRight,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import FeatureToggles from '@/components/FeatureToggles';
import { useTheme } from '@/components/useTheme';

// ── Demo data (placeholder — not live) ────────────────────────────────────────

const ALERT_CATEGORIES = [
  { label: 'Fire', Icon: Flame, color: '#ef4444' },
  { label: 'Earthquake', Icon: Activity, color: '#f97316' },
  { label: 'Storm', Icon: CloudLightning, color: '#60a5fa' },
  { label: 'Evacuation', Icon: Wind, color: '#a78bfa' },
  { label: 'Public Safety', Icon: ShieldAlert, color: '#f9c700' },
  { label: 'Severe Weather', Icon: CloudLightning, color: '#6ee7b7' },
];

const DEMO_ALERTS = [
  {
    id: 1,
    title: 'Heat Advisory in Effect',
    body: 'Stay hydrated. Avoid outdoor activity 11AM–4PM. Check on elderly neighbors.',
    issued: 'Today at 10:30 AM',
    Icon: Thermometer,
    accentColor: '#f97316',
  },
  {
    id: 2,
    title: 'Shelter Capacity Update',
    body: 'Hope Shelter at 90% capacity. Overflow directed to Community Center on Elm St.',
    issued: 'Today at 9:15 AM',
    Icon: Home,
    accentColor: '#60a5fa',
  },
];

const DEMO_RESOURCES = [
  { name: 'Hope Shelter', type: 'Shelter', address: '123 River St', distance: '0.4 mi', status: 'Open 24/7', Icon: Home, color: '#60a5fa' },
  { name: 'Community Food Hub', type: 'Food Support', address: '456 Main St', distance: '0.6 mi', status: 'Closes 6:00 PM', Icon: Utensils, color: '#f9c700' },
  { name: 'Care First Clinic', type: 'Health Services', address: '789 Health Ave', distance: '0.8 mi', status: 'Walk-ins Welcome', Icon: Heart, color: '#dc3545' },
  { name: 'Cooling Center', type: 'Cooling/Warming', address: '200 Park Ave', distance: '1.1 mi', status: 'Open until 8PM', Icon: Thermometer, color: '#10b981' },
  { name: 'Emergency Aid Office', type: 'Financial Aid', address: '55 Grant Blvd', distance: '1.4 mi', status: 'Mon–Fri 9AM–5PM', Icon: DollarSign, color: '#a78bfa' },
];

const DEMO_TRANSIT = [
  { route: '2', name: 'Downtown Express', stop: 'Oak St & 5th Ave', next: '6 min', later: '22 min' },
  { route: '5', name: 'Eastside Local', stop: 'Main St & River Rd', next: '14 min', later: '29 min' },
  { route: '12', name: 'Northside Connector', stop: 'Park Ave & 3rd St', next: '22 min', later: '38 min' },
];

const DEMO_COMMUNITY = [
  { title: 'Food Bank Volunteers Needed', org: 'Unity Church', when: 'Today · 2PM–6PM', type: 'volunteer' as const },
  { title: 'Blanket & Supply Drive', org: 'Red Cross Chapter', when: 'Ongoing · This week', type: 'donation' as const },
  { title: 'Community Aid Fair', org: 'City Outreach Network', when: 'Sat May 18 · 10AM–2PM', type: 'event' as const },
  { title: 'Nonprofit Resource Drive', org: 'Community Alliance', when: 'Sun May 19 · 9AM–1PM', type: 'donation' as const },
];

const DEMO_UPDATES = [
  { title: 'Cooling Center Now Open', detail: 'Central Library · 200 Park Ave', ago: '1h ago', type: 'info' as const },
  { title: 'Road Closure: Main St', detail: 'Between 4th & 5th Ave until 5PM', ago: '3h ago', type: 'warning' as const },
  { title: 'Free Food Distribution', detail: 'Unity Church · 12PM – 3PM', ago: '5h ago', type: 'info' as const },
  { title: 'Emergency Shelter Activated', detail: 'Community Center · 800 Elm St', ago: '8h ago', type: 'critical' as const },
];

const communityTypeColor = { volunteer: '#10b981', donation: '#f9c700', event: '#a78bfa' };
const updateTypeColor = { info: '#60a5fa', warning: '#f97316', critical: '#dc3545' };

// ── Help page ──────────────────────────────────────────────────────────────────

const HelpPage: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { setLocation('Geolocation not available'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
      },
      () => { setLocation('Location unavailable — try a ZIP or city name'); setLocating(false); },
      { timeout: 8000 }
    );
  }, []);

  const shadow = isDark ? '4px 4px 0px rgba(0,0,0,0.6)' : '4px 4px 0px rgba(0,0,0,0.12)';

  const card: CSSProperties = {
    border: '2px solid var(--color-border-strong)',
    background: 'var(--color-surface)',
    boxShadow: shadow,
    overflow: 'hidden',
    position: 'relative',
  };

  // Inline section header builder — avoids prop-drilling a full sub-component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SectionHeader = ({ accent, Icon, title, ctaLabel, ctaHref }: { accent: string; Icon: any; title: string; ctaLabel?: string; ctaHref?: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem 0.85rem',
      borderBottom: '1.5px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent + '20',
          border: `1.5px solid ${accent}`,
        }}>
          <Icon size={15} color={accent} strokeWidth={2.5} />
        </div>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: '0.78rem',
          letterSpacing: '0.1em',
          color: 'var(--color-text)',
        }}>
          {title}
          <span style={{
            display: 'inline-block',
            marginLeft: '0.5rem',
            fontSize: '0.58rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#888',
            border: '1px solid #888',
            padding: '1px 5px',
            verticalAlign: 'middle',
          }}>DEMO</span>
        </span>
      </div>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: '0.73rem',
          color: accent,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.15rem',
          letterSpacing: '0.03em',
        }}>
          {ctaLabel} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );

  return (
    <motion.main
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        paddingLeft: 'max(2%, 16px)',
        paddingRight: 'max(2%, 16px)',
        paddingTop: '110px',
        paddingBottom: '4rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        boxSizing: 'border-box',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <NavBar variant="help" title="HELP! NEARBY." showMapPin />
      <FeatureToggles bottom={20} right={20} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        style={{ marginBottom: '2rem' }}
      >
        <h1 style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          lineHeight: 1.0,
          letterSpacing: '-0.02em',
          margin: '0 0 0.6rem',
          color: 'var(--color-text)',
        }}>
          HELP NEAR YOU.<br />
          <span style={{ color: '#dc3545' }}>RIGHT NOW.</span>
        </h1>

        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem',
        }}>
          Urgent alerts, nearby resources, and transit options for your area.
        </p>

        {/* Location bar */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
            <MapPin size={15} style={{
              position: 'absolute', left: 13, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Enter ZIP code or city"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.9rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border-strong)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button style={{
            padding: '0.7rem 1.4rem',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: '2px solid #dc3545',
            cursor: 'pointer',
            boxShadow: shadow,
            whiteSpace: 'nowrap',
          }}>
            FIND HELP NEARBY →
          </button>

          <button
            onClick={handleLocate}
            disabled={locating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1rem',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              border: '2px solid var(--color-border)',
              cursor: locating ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Crosshair size={14} />
            {locating ? 'Locating…' : 'Use My Location'}
          </button>
        </div>
      </motion.section>

      {/* ── Dashboard grid ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 3fr) minmax(0, 2fr)',
        gap: '1.25rem',
        alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1 · Emergency Alerts */}
          <motion.div
            style={card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #dc3545, #f97316)' }} />

            <SectionHeader accent="#dc3545" Icon={AlertTriangle} title="EMERGENCY ALERTS" ctaLabel="View all alerts" ctaHref="#" />

            {/* Alert category chips */}
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {ALERT_CATEGORIES.map(({ label, Icon, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.28rem 0.6rem',
                  border: `1.5px solid ${color}44`,
                  backgroundColor: color + '12',
                  fontSize: '0.7rem',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: color,
                  letterSpacing: '0.04em',
                }}>
                  <Icon size={10} color={color} />
                  {label}
                </div>
              ))}
            </div>

            {/* Active demo alerts */}
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {DEMO_ALERTS.map((alert) => (
                <div key={alert.id} style={{
                  border: `1.5px solid ${alert.accentColor}44`,
                  background: alert.accentColor + '0e',
                  padding: '0.8rem 1rem',
                }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <alert.Icon size={15} color={alert.accentColor} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-text)', marginBottom: '0.2rem' }}>
                        {alert.title}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.79rem', color: 'var(--color-text-muted)', lineHeight: 1.45, marginBottom: '0.3rem' }}>
                        {alert.body}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
                        Issued: {alert.issued}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2 · Nearby Help */}
          <motion.div
            style={card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f9c700, #10b981)' }} />

            <SectionHeader accent="#f9c700" Icon={Heart} title="NEARBY HELP" ctaLabel="Browse all resources" ctaHref="/resources" />

            <div style={{ padding: '0.5rem 0 0.5rem' }}>
              {DEMO_RESOURCES.map((r, i) => (
                <div key={r.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 1.25rem',
                  borderBottom: i < DEMO_RESOURCES.length - 1 ? '1px solid var(--color-border)' : undefined,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: r.color + '20',
                    border: `1.5px solid ${r.color}`,
                    flexShrink: 0,
                  }}>
                    <r.Icon size={15} color={r.color} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.83rem', color: 'var(--color-text)' }}>
                      {r.name}
                    </div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                      {r.address} · {r.type} · {r.status}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {r.distance}
                  </div>
                  <ChevronRight size={14} color="var(--color-text-muted)" />
                </div>
              ))}
            </div>

            <div style={{ padding: '0.9rem 1.25rem', borderTop: '1.5px solid var(--color-border)' }}>
              <Link href="/resources" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.65rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border-strong)',
                textDecoration: 'none',
                boxShadow: shadow,
                boxSizing: 'border-box',
              }}>
                BROWSE ALL RESOURCES <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>

          {/* 4 · Community Action */}
          <motion.div
            style={{
              ...card,
              background: isDark
                ? 'linear-gradient(135deg, #0f1f18 0%, #1a2a1a 60%, #1e1e1e 100%)'
                : 'linear-gradient(135deg, #f0fdf4 0%, #f5f5f5 100%)',
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #10b981, #a78bfa)' }} />

            <SectionHeader accent="#10b981" Icon={Users} title="COMMUNITY ACTION" ctaLabel="Get involved" ctaHref="#" />

            <div style={{ padding: '0.5rem 0 0.5rem' }}>
              {DEMO_COMMUNITY.map((item, i) => {
                const typeColor = communityTypeColor[item.type];
                return (
                  <div key={item.title} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem 1.25rem',
                    borderBottom: i < DEMO_COMMUNITY.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}>
                    <div style={{
                      padding: '0.2rem 0.5rem',
                      background: typeColor + '20',
                      border: `1px solid ${typeColor}44`,
                      color: typeColor,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {item.type}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.83rem', color: 'var(--color-text)', marginBottom: '0.1rem' }}>
                        {item.title}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                        {item.org} · {item.when}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '0.9rem 1.25rem', borderTop: '1.5px solid var(--color-border)' }}>
              <button style={{
                width: '100%',
                padding: '0.65rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: '#fff',
                backgroundColor: '#10b981',
                border: '2px solid #10b981',
                cursor: 'pointer',
                boxShadow: shadow,
              }}>
                GET INVOLVED →
              </button>
            </div>
          </motion.div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 3 · Get There */}
          <motion.div
            style={{
              ...card,
              background: isDark
                ? 'linear-gradient(145deg, #080f1a 0%, #0d1b2e 45%, #0a1628 100%)'
                : 'linear-gradient(145deg, #e8f0fe 0%, #dbeafe 100%)',
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #60a5fa, #818cf8)' }} />

            <SectionHeader accent="#60a5fa" Icon={Bus} title="GET THERE" />

            <div style={{ padding: '0.6rem 1.25rem 0 1.25rem' }}>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.75rem',
                color: isDark ? '#60a5fa99' : '#3b82f6',
                letterSpacing: '0.03em',
                margin: '0.2rem 0 0.8rem',
              }}>
                Transit stops near your location
              </p>

              {/* Walking estimate row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid ' + (isDark ? '#ffffff12' : '#00000012'),
                marginBottom: '0.8rem',
              }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.4rem' }}>🚶</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#2563eb' }}>8 min</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.62rem', color: isDark ? '#60a5fa88' : '#60a5fa' }}>Walking</div>
                </div>
                <div style={{ width: 1, height: 40, background: isDark ? '#ffffff18' : '#00000018', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: isDark ? '#e8e8e8' : '#111' }}>
                    Hope Shelter
                  </div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#2563eb' }}>
                    0.4 mi · 123 River St
                  </div>
                </div>
              </div>

              {/* Bus routes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {DEMO_TRANSIT.map((t) => (
                  <div key={t.route} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.9rem',
                    border: `1px solid ${isDark ? '#ffffff14' : '#00000014'}`,
                    background: isDark ? '#ffffff08' : '#00000006',
                  }}>
                    <div style={{
                      width: 28, height: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#60a5fa',
                      color: '#fff',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0,
                    }}>
                      {t.route}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: isDark ? '#e8e8e8' : '#111' }}>
                        {t.name}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.69rem', color: isDark ? '#93c5fd' : '#3b82f6' }}>
                        {t.stop}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: isDark ? '#60a5fa' : '#2563eb' }}>
                        {t.next}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: isDark ? '#60a5fa66' : '#93c5fd' }}>
                        then {t.later}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem' }}>
              <button style={{
                width: '100%',
                padding: '0.65rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: '#fff',
                backgroundColor: '#60a5fa',
                border: '2px solid #60a5fa',
                cursor: 'pointer',
                boxShadow: shadow,
              }}>
                VIEW DIRECTIONS →
              </button>
            </div>
          </motion.div>

          {/* 5 · Latest Updates */}
          <motion.div
            style={card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f97316, #f9c700)' }} />

            <SectionHeader accent="#f97316" Icon={Bell} title="LATEST UPDATES" ctaLabel="View all updates" ctaHref="#" />

            <div style={{ padding: '0.5rem 0' }}>
              {DEMO_UPDATES.map((u, i) => {
                const col = updateTypeColor[u.type];
                return (
                  <div key={u.title} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.8rem 1.25rem',
                    borderBottom: i < DEMO_UPDATES.length - 1 ? '1px solid var(--color-border)' : undefined,
                  }}>
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      backgroundColor: col,
                      flexShrink: 0,
                      marginTop: 5,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>
                        {u.title}
                      </div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                        {u.detail}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {u.ago}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.main>
  );
};

export default HelpPage;
