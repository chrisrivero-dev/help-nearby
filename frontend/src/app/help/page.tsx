'use client';

import type { FC, CSSProperties } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle, Heart, Bus, Users, Bell,
  MapPin, ChevronRight, Flame,
  Thermometer, CloudLightning, Wind, ShieldAlert,
  Home, Utensils, DollarSign, Activity,
  Navigation, ArrowRight,
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
  { name: 'Hope Shelter', type: 'Shelter', address: '123 River St', distance: '0.4 mi', status: 'Open 24/7', Icon: Home, color: '#3b82f6' },
  { name: 'Community Food Hub', type: 'Food Support', address: '456 Main St', distance: '0.6 mi', status: 'Closes 6:00 PM', Icon: Utensils, color: '#d97706' },
  { name: 'Care First Clinic', type: 'Health Services', address: '789 Health Ave', distance: '0.8 mi', status: 'Walk-ins Welcome', Icon: Heart, color: '#dc2626' },
  { name: 'Cooling Center', type: 'Cooling/Warming', address: '200 Park Ave', distance: '1.1 mi', status: 'Open until 8PM', Icon: Thermometer, color: '#059669' },
  { name: 'Emergency Aid Office', type: 'Financial Aid', address: '55 Grant Blvd', distance: '1.4 mi', status: 'Mon–Fri 9AM–5PM', Icon: DollarSign, color: '#7c3aed' },
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

const TICKER_ITEMS = [
  { dot: '#ea580c', text: 'Cooling center now open · Central Library, 200 Park Ave' },
  { dot: '#059669', text: 'Free food distribution today · Unity Church · 12PM–3PM' },
  { dot: '#f97316', text: 'Road closure: Main St between 4th & 5th Ave until 5PM' },
  { dot: '#60a5fa', text: 'Shelter capacity update: Hope Shelter at 90% · overflow at Elm St' },
  { dot: '#059669', text: 'Volunteer shift needed · Food Bank · Today 2PM–6PM' },
  { dot: '#dc2626', text: 'Heat advisory in effect · avoid outdoor activity 11AM–4PM' },
];

const communityTypeColor = { volunteer: '#059669', donation: '#d97706', event: '#7c3aed' };
const updateTypeColor = { info: '#3b82f6', warning: '#ea580c', critical: '#dc2626' };

// ── Framer motion variants ─────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.18 } },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ── Hero network SVG (CSS/SVG only — no images) ───────────────────────────────

const HeroNetwork: FC<{ isDark: boolean }> = ({ isDark }) => {
  const gold = '#f59e0b';
  const dim = isDark ? '#f59e0b' : '#d97706';
  const buildFill = isDark ? '#111213' : '#dde2e8';
  const bgFadeColor = isDark ? '#0a0c10' : '#f4f5f7';

  const center = { x: 390, y: 195 };

  const primaries = [
    { x: 255, y: 98 }, { x: 435, y: 68 }, { x: 535, y: 158 },
    { x: 505, y: 278 }, { x: 335, y: 312 }, { x: 195, y: 248 }, { x: 175, y: 132 },
  ];

  const secondaries: Array<{ x: number; y: number; to: number }> = [
    { x: 155, y: 52, to: 6 }, { x: 340, y: 28, to: 1 }, { x: 595, y: 98, to: 2 },
    { x: 622, y: 218, to: 2 }, { x: 578, y: 342, to: 3 }, { x: 288, y: 382, to: 4 },
    { x: 82, y: 338, to: 5 }, { x: 62, y: 158, to: 6 }, { x: 118, y: 78, to: 0 },
  ];

  const buildings = [
    { x: 15, y: 310, w: 28, h: 110 }, { x: 46, y: 278, w: 20, h: 142 },
    { x: 70, y: 295, w: 40, h: 125 }, { x: 114, y: 262, w: 28, h: 158 },
    { x: 146, y: 285, w: 45, h: 135 }, { x: 196, y: 270, w: 25, h: 150 },
    { x: 225, y: 292, w: 18, h: 128 }, { x: 247, y: 262, w: 32, h: 158 },
    { x: 282, y: 235, w: 48, h: 185 }, { x: 334, y: 280, w: 28, h: 140 },
    { x: 366, y: 255, w: 52, h: 165 }, { x: 422, y: 278, w: 22, h: 142 },
    { x: 448, y: 258, w: 36, h: 162 }, { x: 488, y: 292, w: 24, h: 128 },
    { x: 516, y: 268, w: 42, h: 152 }, { x: 562, y: 282, w: 32, h: 138 },
    { x: 598, y: 262, w: 48, h: 158 },
  ];

  return (
    <svg
      viewBox="0 0 650 420"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroFadeX" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bgFadeColor} stopOpacity="1" />
          <stop offset="38%" stopColor={bgFadeColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroFadeY" x1="0" y1="0" x2="0" y2="1">
          <stop offset="62%" stopColor={bgFadeColor} stopOpacity="0" />
          <stop offset="100%" stopColor={bgFadeColor} stopOpacity="1" />
        </linearGradient>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity={isDark ? '0.28' : '0.16'} />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
      </defs>

      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={buildFill} />
      ))}

      {secondaries.map((s, i) => {
        const target = primaries[s.to] ?? center;
        return (
          <line
            key={i} x1={s.x} y1={s.y} x2={target.x} y2={target.y}
            stroke={dim} strokeWidth="0.5" opacity={isDark ? 0.2 : 0.14}
          />
        );
      })}

      {primaries.map((p, i) => (
        <line
          key={i} x1={center.x} y1={center.y} x2={p.x} y2={p.y}
          stroke={dim} strokeWidth="0.9" opacity={isDark ? 0.45 : 0.3}
        />
      ))}

      <circle cx={center.x} cy={center.y} r="55" fill="url(#heroGlow)" />

      <circle cx={center.x} cy={center.y} r="10" fill="none" stroke={gold} strokeWidth="1.3" opacity="0.5">
        <animate attributeName="r" values="10;36;10" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={center.x} cy={center.y} r="10" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.3">
        <animate attributeName="r" values="10;58;10" dur="2.8s" begin="0.9s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.8s" begin="0.9s" repeatCount="indefinite" />
      </circle>

      {secondaries.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="2" fill={dim} opacity={isDark ? 0.38 : 0.28} />
      ))}
      {primaries.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={dim} opacity={isDark ? 0.65 : 0.5} />
      ))}

      <circle cx={center.x} cy={center.y} r="8" fill={gold} />
      <circle cx={center.x} cy={center.y} r="3.5" fill={isDark ? '#0a0c10' : '#f4f5f7'} />

      <rect x="0" y="0" width="650" height="420" fill="url(#heroFadeX)" />
      <rect x="0" y="0" width="650" height="420" fill="url(#heroFadeY)" />
    </svg>
  );
};

// ── Get There map visualization (CSS/SVG only) ────────────────────────────────

const MapVisualization: FC<{ isDark: boolean }> = ({ isDark }) => {
  const gold = '#f59e0b';
  const routeColor = isDark ? '#f59e0b' : '#d97706';
  const gridStroke = isDark ? '#ffffff06' : '#00000009';
  const labelColor = isDark ? '#c8d8ee' : '#1e3a5f';

  const you = { x: 185, y: 148 };
  const shelter = { x: 62, y: 70 };
  const food = { x: 292, y: 62 };
  const clinic = { x: 335, y: 142 };

  const pathS = `M ${you.x},${you.y} C ${you.x - 55},${you.y - 25} ${shelter.x + 65},${shelter.y + 32} ${shelter.x},${shelter.y}`;
  const pathF = `M ${you.x},${you.y} C ${you.x + 25},${you.y - 45} ${food.x - 30},${food.y + 42} ${food.x},${food.y}`;
  const pathC = `M ${you.x},${you.y} C ${you.x + 45},${you.y + 8} ${clinic.x - 22},${clinic.y - 8} ${clinic.x},${clinic.y}`;

  const pinColors = { shelter: '#3b82f6', food: isDark ? '#f59e0b' : '#d97706', clinic: '#dc2626' };

  return (
    <svg
      viewBox="0 0 380 215"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '215px', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="mapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke={gridStroke} strokeWidth="1" />
        </pattern>
        <radialGradient id="youGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity={isDark ? '0.35' : '0.22'} />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mapFadeBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="78%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor={isDark ? '#121212' : '#ffffff'} stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="380" height="215" fill="url(#mapGrid)" />

      <path d={pathS} stroke={routeColor} strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.75">
        <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d={pathF} stroke={routeColor} strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.75">
        <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
      </path>
      <path d={pathC} stroke={routeColor} strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.6">
        <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.2s" begin="0.8s" repeatCount="indefinite" />
      </path>

      <circle cx={shelter.x} cy={shelter.y} r="15" fill={isDark ? '#0d1a2e' : '#dbeafe'} stroke={pinColors.shelter} strokeWidth="1.5" />
      <polygon points={`${shelter.x},${shelter.y - 7} ${shelter.x - 6},${shelter.y - 1} ${shelter.x + 6},${shelter.y - 1}`} fill={pinColors.shelter} />
      <rect x={shelter.x - 4} y={shelter.y - 1} width="8" height="6" rx="0.5" fill={pinColors.shelter} />
      <text x={shelter.x} y={shelter.y - 22} textAnchor="middle" fontSize="7.5" fill={labelColor} fontFamily="Poppins, sans-serif" fontWeight="700">Hope Shelter</text>
      <text x={shelter.x} y={shelter.y - 13} textAnchor="middle" fontSize="6.5" fill={isDark ? '#4a7abf' : '#60a5fa'} fontFamily="Poppins, sans-serif">0.4 mi</text>

      <circle cx={food.x} cy={food.y} r="15" fill={isDark ? '#1c1200' : '#fef3c7'} stroke={pinColors.food} strokeWidth="1.5" />
      <line x1={food.x - 3} y1={food.y - 6} x2={food.x - 3} y2={food.y + 6} stroke={pinColors.food} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={food.x + 3} y1={food.y - 6} x2={food.x + 3} y2={food.y + 6} stroke={pinColors.food} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={food.x - 3} y1={food.y - 2} x2={food.x + 3} y2={food.y - 2} stroke={pinColors.food} strokeWidth="1" />
      <text x={food.x} y={food.y - 22} textAnchor="middle" fontSize="7.5" fill={labelColor} fontFamily="Poppins, sans-serif" fontWeight="700">Food Hub</text>
      <text x={food.x} y={food.y - 13} textAnchor="middle" fontSize="6.5" fill={isDark ? '#a07830' : '#d97706'} fontFamily="Poppins, sans-serif">0.6 mi</text>

      <circle cx={clinic.x} cy={clinic.y} r="15" fill={isDark ? '#1a0808' : '#fee2e2'} stroke={pinColors.clinic} strokeWidth="1.5" />
      <line x1={clinic.x} y1={clinic.y - 6} x2={clinic.x} y2={clinic.y + 6} stroke={pinColors.clinic} strokeWidth="2" strokeLinecap="round" />
      <line x1={clinic.x - 6} y1={clinic.y} x2={clinic.x + 6} y2={clinic.y} stroke={pinColors.clinic} strokeWidth="2" strokeLinecap="round" />
      <text x={clinic.x + 22} y={clinic.y - 6} textAnchor="middle" fontSize="7.5" fill={labelColor} fontFamily="Poppins, sans-serif" fontWeight="700">Care First Clinic</text>
      <text x={clinic.x + 22} y={clinic.y + 4} textAnchor="middle" fontSize="6.5" fill={isDark ? '#a04040' : '#dc2626'} fontFamily="Poppins, sans-serif">0.8 mi</text>

      <circle cx={you.x} cy={you.y} r="38" fill="url(#youGlow)" />
      <circle cx={you.x} cy={you.y} r="8" fill="none" stroke={gold} strokeWidth="1.2" opacity="0.5">
        <animate attributeName="r" values="8;24;8" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={you.x} cy={you.y} r="8" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.28">
        <animate attributeName="r" values="8;38;8" dur="2.6s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.28;0;0.28" dur="2.6s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={you.x} cy={you.y} r="8" fill={gold} />
      <circle cx={you.x} cy={you.y} r="3.5" fill={isDark ? '#060d17' : '#eff6ff'} />
      <text x={you.x} y={you.y + 22} textAnchor="middle" fontSize="7" fill={gold} fontFamily="Poppins, sans-serif" fontWeight="800" opacity="0.9" letterSpacing="0.08em">YOUR LOCATION</text>

      <rect x="0" y="0" width="380" height="215" fill="url(#mapFadeBottom)" />
    </svg>
  );
};

// ── Help page ──────────────────────────────────────────────────────────────────

const HelpPage: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Location state
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Activation state — dashboard content only reveals after location is provided
  const [hasLocation, setHasLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Submit ZIP/city — validates non-empty, then activates dashboard
  const handleSubmit = useCallback(() => {
    if (!location.trim()) {
      setLocationError('Please enter a ZIP code or city name.');
      return;
    }
    setLocationError(null);
    setHasLocation(true);
  }, [location]);

  // Browser geolocation — activates dashboard on success
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
        setHasLocation(true);
      },
      () => {
        setLocationError('Location access denied. Try entering a ZIP or city name.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  // ── Design tokens ────────────────────────────────────────────────────────────

  const heroBg = isDark
    ? 'linear-gradient(135deg, #09090b 0%, #0a0c10 55%, #0b0d14 100%)'
    : 'linear-gradient(135deg, #f4f5f7 0%, #f8f9fb 100%)';
  const heroBorder = isDark ? '#1a1e28' : '#dde2ea';
  const heroShadow = isDark ? '4px 4px 0px rgba(0,0,0,0.85)' : '4px 4px 0px rgba(0,0,0,0.05)';

  const card: CSSProperties = isDark ? {
    background: 'linear-gradient(160deg, #161616 0%, #121212 100%)',
    border: '1px solid #252525',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    position: 'relative',
  } : {
    background: '#ffffff',
    border: '1.5px solid #e4e4e4',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    position: 'relative',
  };

  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const mutedText = isDark ? '#555' : '#999';
  const cardText = isDark ? '#dedede' : '#111111';
  const inputBg = isDark ? '#07080b' : '#ffffff';
  const inputBorder = isDark ? '#252a36' : '#d0d4dc';

  // ── Locked panel — shown in place of demo content before location is set ──

  const LockedPanel = ({ minH = 100 }: { minH?: number }) => (
    <div style={{
      padding: '1.75rem 1.4rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.55rem',
      minHeight: minH,
    }}>
      <MapPin size={16} color={mutedText} strokeWidth={1.5} />
      <p style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: '0.78rem',
        color: mutedText,
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.65,
        maxWidth: 280,
      }}>
        Enter your location to see nearby alerts,<br />resources, and transit options.
      </p>
    </div>
  );

  // ── Section header ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SectionHeader = ({ accent, Icon, title, ctaLabel, ctaHref }: { accent: string; Icon: any; title: string; ctaLabel?: string; ctaHref?: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.4rem',
      borderBottom: `1px solid ${divider}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 2, height: 16, background: accent, flexShrink: 0 }} />
        <Icon size={14} color={accent} strokeWidth={2.5} />
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: '0.72rem',
          letterSpacing: '0.15em',
          color: cardText,
        }}>
          {title}
        </span>
        <span style={{
          fontSize: '0.52rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: isDark ? '#363636' : '#ccc',
          border: `1px solid ${isDark ? '#2c2c2c' : '#e0e0e0'}`,
          padding: '1px 4px',
        }}>DEMO</span>
      </div>
      {ctaLabel && ctaHref && hasLocation && (
        <Link href={ctaHref} style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: '0.68rem',
          color: accent,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.15rem',
          opacity: 0.85,
        }}>
          {ctaLabel} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

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
      transition={{ duration: 0.32 }}
    >
      <NavBar variant="help" title="HELP! NEARBY." showMapPin />
      <FeatureToggles bottom={20} right={20} />

      {/* ── Cinematic hero panel ──────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          background: heroBg,
          border: `1px solid ${heroBorder}`,
          boxShadow: heroShadow,
          minHeight: isMobile ? 'auto' : '270px',
        }}
      >
        {/* Left — headline, subheadline, search bar */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: isMobile ? '2rem 1.5rem' : '2.5rem 2.5rem 2.5rem',
          maxWidth: isMobile ? '100%' : '54%',
          minWidth: 280,
        }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: isMobile ? '2.4rem' : 'clamp(2.6rem, 5.5vw, 5rem)',
            lineHeight: 0.93,
            letterSpacing: '-0.03em',
            margin: '0 0 1rem',
            color: cardText,
          }}>
            FIND HELP<br />FASTER.
          </h1>

          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(0.88rem, 1.3vw, 1.05rem)',
            color: mutedText,
            margin: '0 0 1.75rem',
            lineHeight: 1.55,
            maxWidth: 400,
          }}>
            See urgent updates, nearby resources,<br />and how to get there.
          </p>

          {/* Location input — flush joined, Enter submits */}
          <div style={{ display: 'flex', alignItems: 'stretch', maxWidth: 520 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin size={14} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: mutedText,
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Enter ZIP code or city"
                value={location}
                onChange={e => { setLocation(e.target.value); if (locationError) setLocationError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                style={{
                  width: '100%',
                  padding: '0.9rem 0.9rem 0.9rem 2.5rem',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem',
                  backgroundColor: inputBg,
                  color: cardText,
                  border: `1.5px solid ${locationError ? '#dc2626' : inputBorder}`,
                  borderRight: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              style={{
                padding: '0 1.6rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: '0.83rem',
                letterSpacing: '0.06em',
                backgroundColor: '#f59e0b',
                color: '#000',
                border: '1.5px solid #f59e0b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.28)',
              }}
            >
              FIND HELP NEARBY →
            </button>
          </div>

          {/* Inline validation / geolocation error */}
          <AnimatePresence>
            {locationError && (
              <motion.p
                key="loc-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.76rem',
                  color: '#dc2626',
                  margin: '0.45rem 0 0',
                  padding: 0,
                }}
              >
                {locationError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Use my location — inline amber link */}
          <button
            onClick={handleLocate}
            disabled={locating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: locationError ? '0.5rem' : '0.7rem',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.8rem',
              color: '#f59e0b',
              background: 'none',
              border: 'none',
              cursor: locating ? 'wait' : 'pointer',
              padding: 0,
              opacity: 0.85,
              letterSpacing: '0.01em',
            }}
          >
            <Navigation size={12} />
            {locating ? 'Locating…' : '↗ Use my location'}
          </button>
        </div>

        {/* Right — city/network SVG (hidden on mobile) */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '62%',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <HeroNetwork isDark={isDark} />
          </div>
        )}
      </motion.section>

      {/* ── What's Happening Near You strip ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 42,
        marginBottom: '1rem',
        background: isDark
          ? 'linear-gradient(90deg, #111314 0%, #0d0f12 100%)'
          : 'linear-gradient(90deg, #f7f8fa 0%, #f4f5f7 100%)',
        border: `1px solid ${isDark ? '#1e2028' : '#e0e2e8'}`,
        boxShadow: isDark ? '2px 2px 0px rgba(0,0,0,0.5)' : '2px 2px 0px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Left label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0 1rem',
          flexShrink: 0,
          borderRight: `1px solid ${isDark ? '#1e2028' : '#e0e2e8'}`,
          height: '100%',
        }}>
          <Bell size={10} color={isDark ? '#555' : '#aaa'} strokeWidth={2} />
          <span style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: isDark ? '#444' : '#bbb',
            whiteSpace: 'nowrap',
          }}>NEAR YOU</span>
          <span style={{
            fontSize: '0.5rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: isDark ? '#2a2a2a' : '#ddd',
            border: `1px solid ${isDark ? '#252525' : '#e8e8e8'}`,
            padding: '1px 3px',
          }}>DEMO</span>
        </div>

        {/* Ticker / empty state */}
        <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {hasLocation ? (
              <motion.div
                key="ticker-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', animation: 'ticker 42s linear infinite', whiteSpace: 'nowrap' }}
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    paddingRight: '2.8rem',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.72rem',
                    color: isDark ? '#8a9ab0' : '#555',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      backgroundColor: item.dot,
                      flexShrink: 0,
                      display: 'inline-block',
                    }} />
                    {item.text}
                  </span>
                ))}
              </motion.div>
            ) : (
              <motion.span
                key="ticker-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.72rem',
                  color: isDark ? '#333' : '#ccc',
                  paddingLeft: '1rem',
                  letterSpacing: '0.02em',
                }}
              >
                Enter your location above to see what&apos;s happening near you.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Dashboard grid ───────────────────────────────────────────────────── */}
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 5fr) minmax(0, 6fr)',
          gap: '1rem',
          alignItems: 'start',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* 1 · Emergency Alerts */}
          <motion.div
            style={card}
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: isDark ? '4px 6px 0px rgba(0,0,0,0.85)' : '4px 6px 0px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ height: 2, background: '#dc2626' }} />
            <SectionHeader accent="#dc2626" Icon={AlertTriangle} title="EMERGENCY ALERTS" ctaLabel="View all alerts" ctaHref="#" />

            {/* Category chips — always visible, they describe alert types not nearby data */}
            <div style={{
              padding: '0.75rem 1.4rem',
              display: 'flex',
              gap: '0.38rem',
              flexWrap: 'wrap',
              borderBottom: `1px solid ${divider}`,
            }}>
              {ALERT_CATEGORIES.map(({ label, Icon, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.28rem',
                  padding: '0.2rem 0.48rem',
                  border: `1px solid ${color}28`,
                  backgroundColor: color + '0c',
                  fontSize: '0.65rem',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: isDark ? color + 'cc' : color,
                  letterSpacing: '0.04em',
                }}>
                  <Icon size={9} color={isDark ? color + 'cc' : color} />
                  {label}
                </div>
              ))}
            </div>

            {/* Active alerts — locked until location provided */}
            <AnimatePresence mode="wait">
              {hasLocation ? (
                <motion.div
                  key="alerts-content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ padding: '0.9rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}
                >
                  {DEMO_ALERTS.map((alert) => (
                    <div key={alert.id} style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      padding: '0.85rem 1rem',
                      borderLeft: `3px solid ${alert.accentColor}`,
                      background: isDark ? '#0d0d0d' : '#fafafa',
                    }}>
                      <alert.Icon size={14} color={alert.accentColor} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.83rem', color: cardText, marginBottom: '0.2rem' }}>
                          {alert.title}
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.77rem', color: mutedText, lineHeight: 1.5, marginBottom: '0.3rem' }}>
                          {alert.body}
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.64rem', color: mutedText, letterSpacing: '0.02em' }}>
                          Issued: {alert.issued}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="alerts-locked" variants={contentVariants} initial="hidden" animate="visible">
                  <LockedPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 2 · Nearby Help */}
          <motion.div
            style={card}
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: isDark ? '4px 6px 0px rgba(0,0,0,0.85)' : '4px 6px 0px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ height: 2, background: '#d97706' }} />
            <SectionHeader accent="#d97706" Icon={Heart} title="NEARBY HELP" ctaLabel="Browse all resources" ctaHref="/resources" />

            <AnimatePresence mode="wait">
              {hasLocation ? (
                <motion.div key="help-content" variants={contentVariants} initial="hidden" animate="visible">
                  {DEMO_RESOURCES.map((r) => (
                    <div key={r.name} style={{
                      display: 'flex', alignItems: 'center', gap: '0.9rem',
                      padding: '0.82rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                      cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 34, height: 34,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDark ? r.color + '14' : r.color + '0f',
                        border: `1px solid ${r.color}35`,
                        flexShrink: 0,
                      }}>
                        <r.Icon size={14} color={r.color} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: cardText }}>
                          {r.name}
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', color: mutedText, marginTop: '0.08rem' }}>
                          {r.type} · {r.address} · {r.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.74rem', color: mutedText }}>
                          {r.distance}
                        </span>
                        <ChevronRight size={12} color={mutedText} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '1rem 1.4rem' }}>
                    <Link href="/resources" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.62rem',
                      fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                      fontSize: '0.72rem', letterSpacing: '0.1em',
                      color: cardText,
                      border: `1.5px solid ${isDark ? '#272727' : '#e0e0e0'}`,
                      textDecoration: 'none',
                      boxShadow: isDark ? '3px 3px 0px rgba(0,0,0,0.5)' : '3px 3px 0px rgba(0,0,0,0.05)',
                    }}>
                      BROWSE ALL RESOURCES <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="help-locked" variants={contentVariants} initial="hidden" animate="visible">
                  <LockedPanel />
                  <div style={{ padding: '0 1.4rem 1rem' }}>
                    <Link href="/resources" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.62rem',
                      fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                      fontSize: '0.72rem', letterSpacing: '0.1em',
                      color: cardText,
                      border: `1.5px solid ${isDark ? '#272727' : '#e0e0e0'}`,
                      textDecoration: 'none',
                      boxShadow: isDark ? '3px 3px 0px rgba(0,0,0,0.5)' : '3px 3px 0px rgba(0,0,0,0.05)',
                    }}>
                      BROWSE ALL RESOURCES <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 4 · Community Action */}
          <motion.div
            style={{
              ...card,
              background: isDark
                ? 'linear-gradient(145deg, #0c1a12 0%, #101810 55%, #111111 100%)'
                : 'linear-gradient(145deg, #f0fdf6 0%, #ffffff 100%)',
              border: isDark ? '1px solid #1e2b1e' : '1.5px solid #d4edda',
            }}
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: isDark ? '4px 6px 0px rgba(0,0,0,0.85)' : '4px 6px 0px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ height: 2, background: '#059669' }} />
            <SectionHeader accent="#059669" Icon={Users} title="COMMUNITY ACTION" ctaLabel="Get involved" ctaHref="#" />

            <AnimatePresence mode="wait">
              {hasLocation ? (
                <motion.div key="community-content" variants={contentVariants} initial="hidden" animate="visible">
                  {DEMO_COMMUNITY.map((item, i) => {
                    const typeColor = communityTypeColor[item.type];
                    return (
                      <div key={item.title} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                        padding: '0.82rem 1.4rem',
                        borderBottom: i < DEMO_COMMUNITY.length - 1 ? `1px solid ${divider}` : undefined,
                      }}>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.18rem',
                          padding: '0.18rem 0.45rem',
                          background: typeColor + '18',
                          border: `1px solid ${typeColor}38`,
                          color: typeColor,
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.57rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          flexShrink: 0,
                          whiteSpace: 'nowrap' as const,
                        }}>
                          {item.type}
                        </span>
                        <div>
                          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: cardText, marginBottom: '0.12rem' }}>
                            {item.title}
                          </div>
                          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', color: mutedText }}>
                            {item.org} · {item.when}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: '1rem 1.4rem' }}>
                    <button style={{
                      width: '100%', padding: '0.62rem',
                      fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                      fontSize: '0.72rem', letterSpacing: '0.1em',
                      color: '#fff', backgroundColor: '#059669',
                      border: '1.5px solid #059669', cursor: 'pointer',
                      boxShadow: '3px 3px 0px rgba(0,0,0,0.25)',
                    }}>
                      GET INVOLVED →
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="community-locked" variants={contentVariants} initial="hidden" animate="visible">
                  <LockedPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* 3 · Get There */}
          <motion.div
            style={{
              ...card,
              background: isDark
                ? 'linear-gradient(158deg, #060d18 0%, #0a1626 48%, #07101a 100%)'
                : 'linear-gradient(158deg, #eff6ff 0%, #dbeafe 100%)',
              border: isDark ? '1px solid #0f1e32' : '1.5px solid #bfdbfe',
            }}
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: isDark ? '4px 6px 0px rgba(0,0,0,0.9)' : '4px 6px 0px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ height: 2, background: isDark ? '#2563eb' : '#3b82f6' }} />

            {/* Custom header with conditional "Your Location" indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.4rem',
              borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 2, height: 16, background: isDark ? '#60a5fa' : '#2563eb', flexShrink: 0 }} />
                <Bus size={14} color={isDark ? '#60a5fa' : '#2563eb'} strokeWidth={2.5} />
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.15em', color: cardText }}>
                  GET THERE
                </span>
                <span style={{
                  fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: isDark ? '#363636' : '#ccc',
                  border: `1px solid ${isDark ? '#2c2c2c' : '#e0e0e0'}`, padding: '1px 4px',
                }}>DEMO</span>
              </div>
              {/* Your Location indicator — only active after location set */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.66rem',
                  letterSpacing: '0.05em',
                  color: hasLocation ? (isDark ? '#3b5a80' : '#3b82f6') : mutedText,
                }}>
                  {hasLocation ? 'Your Location' : 'Awaiting location'}
                </span>
                <div style={{ position: 'relative', width: 10, height: 10 }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    backgroundColor: hasLocation ? '#f59e0b' : mutedText,
                    opacity: hasLocation ? 1 : 0.35,
                    transition: 'background-color 0.3s, opacity 0.3s',
                  }} />
                  {hasLocation && (
                    <div style={{
                      position: 'absolute', inset: -3,
                      borderRadius: '50%',
                      border: '1px solid #f59e0b',
                      opacity: 0.4,
                      animation: 'pulse 2s ease-out infinite',
                    }} />
                  )}
                </div>
              </div>
            </div>

            {/* Map + transit — locked until location set */}
            <AnimatePresence mode="wait">
              {hasLocation ? (
                <motion.div key="getthere-content" variants={contentVariants} initial="hidden" animate="visible">
                  <MapVisualization isDark={isDark} />

                  {/* Transit info strip */}
                  <div style={{
                    display: 'flex',
                    borderTop: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                    borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                  }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.7rem 1rem',
                      borderRight: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                    }}>
                      <span style={{ fontSize: '1rem' }}>🚶</span>
                      <div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#1d4ed8' }}>Walking</div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#c8d8ee' : '#111' }}>8 min</div>
                      </div>
                    </div>
                    <div style={{
                      flex: 1.4, display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.7rem 1rem',
                      borderRight: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                    }}>
                      <span style={{ fontSize: '1rem' }}>🚌</span>
                      <div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#1d4ed8' }}>Bus Routes</div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#c8d8ee' : '#111' }}>2, 5, 12</div>
                      </div>
                    </div>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.7rem 1rem',
                    }}>
                      <span style={{ fontSize: '1rem' }}>📡</span>
                      <div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#1d4ed8' }}>Next Bus</div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#60a5fa' : '#2563eb' }}>6 min</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.4rem' }}>
                    <button style={{
                      width: '100%', padding: '0.65rem',
                      fontFamily: 'Poppins, sans-serif', fontWeight: 800,
                      fontSize: '0.72rem', letterSpacing: '0.1em',
                      color: '#fff',
                      backgroundColor: isDark ? '#1d4ed8' : '#2563eb',
                      border: `1.5px solid ${isDark ? '#1d4ed8' : '#2563eb'}`,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0px rgba(0,0,0,0.3)',
                    }}>
                      VIEW DIRECTIONS →
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="getthere-locked" variants={contentVariants} initial="hidden" animate="visible">
                  <LockedPanel minH={215} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 5 · Latest Updates */}
          <motion.div
            style={card}
            variants={cardVariants}
            whileHover={{ y: -2, boxShadow: isDark ? '4px 6px 0px rgba(0,0,0,0.85)' : '4px 6px 0px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ height: 2, background: '#ea580c' }} />
            <SectionHeader accent="#ea580c" Icon={Bell} title="LATEST UPDATES" ctaLabel="View all updates" ctaHref="#" />

            <AnimatePresence mode="wait">
              {hasLocation ? (
                <motion.div key="updates-content" variants={contentVariants} initial="hidden" animate="visible">
                  {DEMO_UPDATES.map((u, i) => {
                    const col = updateTypeColor[u.type];
                    return (
                      <div key={u.title} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.8rem',
                        padding: '0.85rem 1.4rem',
                        borderBottom: i < DEMO_UPDATES.length - 1 ? `1px solid ${divider}` : undefined,
                      }}>
                        <div style={{ position: 'relative', flexShrink: 0, marginTop: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: col }} />
                          {u.type === 'critical' && (
                            <div style={{
                              position: 'absolute', inset: -2,
                              borderRadius: '50%',
                              border: `1px solid ${col}`,
                              opacity: 0.4,
                              animation: 'pulse 2s ease-out infinite',
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: cardText, marginBottom: '0.14rem' }}>
                            {u.title}
                          </div>
                          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', color: mutedText }}>
                            {u.detail}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.62rem', color: isDark ? '#303030' : '#c0c0c0', flexShrink: 0, marginTop: 1 }}>
                          {u.ago}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div key="updates-locked" variants={contentVariants} initial="hidden" animate="visible">
                  <LockedPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </motion.div>

      {/* Keyframe for pulse — scoped inline, not global */}
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </motion.main>
  );
};

export default HelpPage;
