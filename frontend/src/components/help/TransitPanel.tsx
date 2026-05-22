'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import type {
  NearbyResource,
  NearbyResponse,
  ResourceCategory,
  SourceMeta,
} from '@/lib/resources/schema';

type PinBucket = 'food' | 'health' | 'cooling' | 'recreation' | 'other';

const bucketFor = (category: ResourceCategory): PinBucket => {
  switch (category) {
    case 'food':
      return 'food';
    case 'health':
      return 'health';
    case 'cooling':
      return 'cooling';
    case 'recreation':
      return 'recreation';
    default:
      return 'other';
  }
};

const PIN_POSITIONS = [
  { x: 62, y: 70, labelAnchor: 'middle' as const, labelDx: 0, labelDy: -22 },
  { x: 292, y: 62, labelAnchor: 'middle' as const, labelDx: 0, labelDy: -22 },
  { x: 335, y: 142, labelAnchor: 'middle' as const, labelDx: -8, labelDy: -22 },
];

const bucketColor = (b: PinBucket, isDark: boolean) => {
  switch (b) {
    case 'food':
      return { stroke: isDark ? '#f59e0b' : '#d97706', fill: isDark ? '#1c1200' : '#fef3c7', label: isDark ? '#a07830' : '#d97706' };
    case 'health':
      return { stroke: '#dc2626', fill: isDark ? '#1a0808' : '#fee2e2', label: isDark ? '#a04040' : '#dc2626' };
    case 'cooling':
      return { stroke: '#3b82f6', fill: isDark ? '#0d1a2e' : '#dbeafe', label: isDark ? '#4a7abf' : '#3b82f6' };
    case 'recreation':
      return { stroke: '#16a34a', fill: isDark ? '#0a1f12' : '#dcfce7', label: isDark ? '#4ea776' : '#16a34a' };
    case 'other':
    default:
      return { stroke: isDark ? '#9ca3af' : '#6b7280', fill: isDark ? '#1a1a1a' : '#f3f4f6', label: isDark ? '#9ca3af' : '#6b7280' };
  }
};

const truncate = (s: string, n = 16) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const formatCategory = (c: ResourceCategory): string =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());

// Diversity-aware top-3 picker.
// Input is assumed sorted by distance ascending (the API already does this).
// Pass 1 picks the nearest resource from each distinct bucket so the panel
// shows variety when it exists. Pass 2 fills any remaining slots with the
// nearest leftovers, deduping by normalized name+address to avoid showing
// the same building twice. Pass 3 is a safety net that just appends by id.
const pickDiverseTopThree = (list: NearbyResource[]): NearbyResource[] => {
  const picked: NearbyResource[] = [];
  const usedIds = new Set<string>();
  const usedBuckets = new Set<PinBucket>();
  const usedNameAddr = new Set<string>();

  const normKey = (r: NearbyResource) =>
    `${(r.name ?? '').trim().toLowerCase()}|${(r.address ?? '').trim().toLowerCase()}`;

  for (const r of list) {
    if (picked.length >= 3) break;
    const b = bucketFor(r.category);
    const key = normKey(r);
    if (usedBuckets.has(b)) continue;
    if (usedNameAddr.has(key)) continue;
    picked.push(r);
    usedIds.add(r.id);
    usedBuckets.add(b);
    usedNameAddr.add(key);
  }

  if (picked.length < 3) {
    for (const r of list) {
      if (picked.length >= 3) break;
      if (usedIds.has(r.id)) continue;
      const key = normKey(r);
      if (usedNameAddr.has(key)) continue;
      picked.push(r);
      usedIds.add(r.id);
      usedNameAddr.add(key);
    }
  }

  if (picked.length < 3) {
    for (const r of list) {
      if (picked.length >= 3) break;
      if (usedIds.has(r.id)) continue;
      picked.push(r);
      usedIds.add(r.id);
    }
  }

  return picked;
};

const formatDist = (mi?: number) => {
  if (typeof mi !== 'number' || !Number.isFinite(mi)) return '';
  if (mi < 0.1) return '< 0.1 mi';
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
};

const PinGlyph: FC<{ x: number; y: number; bucket: PinBucket; color: string }> = ({ x, y, bucket, color }) => {
  switch (bucket) {
    case 'food':
      return (
        <>
          <line x1={x - 3} y1={y - 6} x2={x - 3} y2={y + 6} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x + 3} y1={y - 6} x2={x + 3} y2={y + 6} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - 3} y1={y - 2} x2={x + 3} y2={y - 2} stroke={color} strokeWidth="1" />
        </>
      );
    case 'health':
      return (
        <>
          <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'cooling':
      return (
        <>
          <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case 'recreation':
      return <circle cx={x} cy={y} r="4" fill="none" stroke={color} strokeWidth="1.5" />;
    case 'other':
    default:
      return <circle cx={x} cy={y} r="3" fill={color} />;
  }
};

interface MapVisualizationProps {
  isDark: boolean;
  resources: NearbyResource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MapVisualization: FC<MapVisualizationProps> = ({
  isDark,
  resources,
  selectedId,
  onSelect,
}) => {
  const gold = '#f59e0b';
  const routeColor = isDark ? '#f59e0b' : '#d97706';
  const gridStroke = isDark ? '#ffffff06' : '#00000009';
  const labelColor = isDark ? '#c8d8ee' : '#1e3a5f';

  const you = { x: 185, y: 148 };
  const pinned = resources.slice(0, 3).map((r, i) => ({
    resource: r,
    pos: PIN_POSITIONS[i],
    bucket: bucketFor(r.category),
  }));

  const makePath = (target: { x: number; y: number }) => {
    const dx = target.x - you.x;
    const dy = target.y - you.y;
    const cx1 = you.x + dx * 0.3 + (dy > 0 ? 20 : -20);
    const cy1 = you.y + dy * 0.3;
    const cx2 = target.x - dx * 0.3;
    const cy2 = target.y - dy * 0.3 + (dy > 0 ? -10 : 10);
    return `M ${you.x},${you.y} C ${cx1},${cy1} ${cx2},${cy2} ${target.x},${target.y}`;
  };

  return (
    <svg
      viewBox="0 0 380 215"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '215px', display: 'block' }}
      role="img"
      aria-label="Map of nearby resources"
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

      <rect
        width="380"
        height="215"
        fill="url(#mapGrid)"
        pointerEvents="none"
      />

      {pinned.map((p, i) => (
        <path
          key={`path-${i}`}
          d={makePath(p.pos)}
          stroke={routeColor}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 3"
          opacity={0.75 - i * 0.05}
          pointerEvents="none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-8"
            dur="1.2s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
        </path>
      ))}

      {pinned.map((p, i) => {
        const colors = bucketColor(p.bucket, isDark);
        const isSelected = selectedId === p.resource.id;
        return (
          <g
            key={`pin-${i}`}
            role="button"
            tabIndex={0}
            aria-label={`Select ${p.resource.name}`}
            aria-pressed={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(p.resource.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(p.resource.id);
              }
            }}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            {/* Hit target FIRST and large enough to cover icon + label area.
                Subsequent visual children are decorative only. */}
            <rect
              x={p.pos.x - 30}
              y={p.pos.y + p.pos.labelDy - 6}
              width={60}
              height={30 + Math.abs(p.pos.labelDy) + 6}
              fill="transparent"
              pointerEvents="all"
            />
            <circle
              cx={p.pos.x}
              cy={p.pos.y}
              r={30}
              fill="transparent"
              pointerEvents="all"
            />
            {isSelected && (
              <>
                <circle
                  cx={p.pos.x}
                  cy={p.pos.y}
                  r="22"
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="2"
                  opacity="0.7"
                  pointerEvents="none"
                >
                  <animate
                    attributeName="r"
                    values="20;26;20"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0.25;0.7"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={p.pos.x}
                  cy={p.pos.y}
                  r="18"
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="1"
                  opacity="0.4"
                  pointerEvents="none"
                />
              </>
            )}
            <circle
              cx={p.pos.x}
              cy={p.pos.y}
              r={isSelected ? 17 : 15}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={isSelected ? 3 : 1.5}
              pointerEvents="none"
            />
            <g pointerEvents="none">
              <PinGlyph x={p.pos.x} y={p.pos.y} bucket={p.bucket} color={colors.stroke} />
            </g>
            <text
              x={p.pos.x + p.pos.labelDx}
              y={p.pos.y + p.pos.labelDy}
              textAnchor={p.pos.labelAnchor}
              fontSize="7.5"
              fill={labelColor}
              fontFamily="'Poppins', sans-serif"
              fontWeight={isSelected ? '800' : '700'}
              pointerEvents="none"
            >
              {truncate(p.resource.name)}
            </text>
            {typeof p.resource.distanceMiles === 'number' && (
              <text
                x={p.pos.x + p.pos.labelDx}
                y={p.pos.y + p.pos.labelDy + 9}
                textAnchor={p.pos.labelAnchor}
                fontSize="6.5"
                fill={colors.label}
                fontFamily="'Poppins', sans-serif"
                pointerEvents="none"
              >
                {formatDist(p.resource.distanceMiles)}
              </text>
            )}
          </g>
        );
      })}

      <g pointerEvents="none">
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
      <text
        x={you.x}
        y={you.y + 22}
        textAnchor="middle"
        fontSize="7"
        fill={gold}
        fontFamily="'Poppins', sans-serif"
        fontWeight="800"
        opacity="0.9"
        letterSpacing="0.08em"
      >
        YOUR LOCATION
      </text>
      </g>

      <rect
        x="0"
        y="0"
        width="380"
        height="215"
        fill="url(#mapFadeBottom)"
        pointerEvents="none"
      />
    </svg>
  );
};

export const TransitPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, latitude, longitude, isValid } = useLocationContext();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const [resources, setResources] = useState<NearbyResource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | 'transit'>('walking');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setResources(null);
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radiusMiles: '10',
      });
      const res = await fetch(`/api/nearby-resources?${params.toString()}`);
      if (!res.ok) {
        setResources([]);
        setSources([]);
        return;
      }
      const data = (await res.json()) as NearbyResponse;
      setResources(data.resources ?? []);
      setSources(data.sources ?? []);
    } catch {
      setResources([]);
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!zip) {
      setResources(null);
      setSources([]);
      return;
    }
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchNearby(latitude, longitude);
    } else {
      setResources([]);
      setSources([]);
    }
  }, [zip, isValid, latitude, longitude, fetchNearby]);

  const topThree = useMemo(
    () => pickDiverseTopThree(resources ?? []),
    [resources],
  );
  const isLive = topThree.length > 0;

  useEffect(() => {
    if (!selectedId) return;
    if (!topThree.some((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [topThree, selectedId]);

  const selected = useMemo(
    () => topThree.find((r) => r.id === selectedId) ?? topThree[0],
    [topThree, selectedId],
  );

  const directionsUrl = useMemo(() => {
    if (!selected || typeof selected.latitude !== 'number' || typeof selected.longitude !== 'number') {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${selected.latitude},${selected.longitude}&travelmode=${travelMode}`;
  }, [selected, latitude, longitude, travelMode]);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';

  const LockedPanel = ({ minH = 100 }: { minH?: number }) => (
    <div
      style={{
        padding: '1.75rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.55rem',
        minHeight: minH,
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
        Enter your location to see nearby locations.
      </p>
    </div>
  );

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
      <motion.div
        style={{
          background: isDark ? '#121212' : '#ffffff',
          border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
          position: 'relative',
          zIndex: 2,
        }}
        whileHover={{ x: -4, y: -4 }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 0,
                background: isLive ? '#22c55e' : '#ef4444',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              WHERE? NEARBY!
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
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
                    {sources.length === 0 ? (
                      <li style={{ fontSize: '0.68rem', color: mutedText, lineHeight: 1.4 }}>
                        No live sources for this area yet.
                      </li>
                    ) : (
                      sources.map((s) => (
                        <li
                          key={s.id}
                          style={{ fontSize: '0.68rem', color: mutedText, lineHeight: 1.4 }}
                        >
                          {s.name} {s.ok ? '' : '(failed)'}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9L12 15L18 9" />
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <>
              {!zip ? (
                <motion.div
                  key="getthere-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LockedPanel minH={215} />
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="getthere-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 215,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.78rem',
                      color: mutedText,
                    }}
                  >
                    Searching for nearby locations...
                  </span>
                </motion.div>
              ) : isLive ? (
                <motion.div
                  key="getthere-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MapVisualization
                    isDark={isDark}
                    resources={topThree}
                    selectedId={selected?.id ?? null}
                    onSelect={(id) => setSelectedId(id)}
                  />

                  <div
                    style={{
                      display: 'flex',
                      borderTop: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                      borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                    }}
                  >
                    {(
                      [
                        { mode: 'walking', label: 'Walk', icon: '🚶' },
                        { mode: 'driving', label: 'Drive', icon: '🚗' },
                        { mode: 'transit', label: 'Transit', icon: '🚌' },
                      ] as const
                    ).map((opt, idx, arr) => {
                      const active = travelMode === opt.mode;
                      return (
                        <button
                          key={opt.mode}
                          type="button"
                          onClick={() => setTravelMode(opt.mode)}
                          aria-pressed={active}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.7rem 1rem',
                            background: active
                              ? isDark
                                ? '#0f1e32'
                                : '#dbeafe'
                              : 'transparent',
                            border: 'none',
                            borderRight:
                              idx < arr.length - 1
                                ? `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`
                                : 'none',
                            cursor: 'pointer',
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: active ? 800 : 700,
                            fontSize: '0.72rem',
                            letterSpacing: '0.08em',
                            color: active
                              ? isDark
                                ? '#93c5fd'
                                : '#1d4ed8'
                              : mutedText,
                          }}
                        >
                          <span style={{ fontSize: '0.95rem' }}>{opt.icon}</span>
                          <span>{opt.label.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selected && (
                    <div
                      style={{
                        padding: '0.85rem 1.4rem',
                        borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.58rem',
                          letterSpacing: '0.12em',
                          fontWeight: 800,
                          color: mutedText,
                          marginBottom: '0.3rem',
                        }}
                      >
                        SELECTED
                      </div>
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          color: cardText,
                          lineHeight: 1.3,
                        }}
                      >
                        {selected.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.7rem',
                          color: isDark ? '#93c5fd' : '#1d4ed8',
                          fontWeight: 700,
                          marginTop: '0.2rem',
                        }}
                      >
                        {typeof selected.distanceMiles === 'number'
                          ? `${formatDist(selected.distanceMiles)} · `
                          : ''}
                        {formatCategory(selected.category)}
                      </div>
                      {selected.address && (
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.7rem',
                            color: mutedText,
                            marginTop: '0.2rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {selected.address}
                        </div>
                      )}
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.62rem',
                          color: mutedText,
                          marginTop: '0.25rem',
                        }}
                      >
                        Source: {selected.sourceName}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '0.8rem 1.4rem 1rem' }}>
                    <div
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.66rem',
                        color: mutedText,
                        textAlign: 'center',
                        marginBottom: '0.55rem',
                        lineHeight: 1.5,
                      }}
                    >
                      Opens directions in Google Maps.
                    </div>
                    <button
                      type="button"
                      disabled={!directionsUrl}
                      onClick={() => {
                        if (directionsUrl) {
                          window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        letterSpacing: '0.1em',
                        color: '#fff',
                        backgroundColor: directionsUrl ? (isDark ? '#1d4ed8' : '#2563eb') : (isDark ? '#333' : '#9ca3af'),
                        border: `1.5px solid ${directionsUrl ? (isDark ? '#1d4ed8' : '#2563eb') : (isDark ? '#333' : '#9ca3af')}`,
                        cursor: directionsUrl ? 'pointer' : 'not-allowed',
                        boxShadow: directionsUrl ? '3px 3px 0px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {directionsUrl
                        ? 'OPEN DIRECTIONS IN GOOGLE MAPS →'
                        : 'DIRECTIONS UNAVAILABLE'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="getthere-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '1.75rem 1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 215,
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
                    No nearby locations available yet.
                  </p>
                </motion.div>
              )}
            </>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
