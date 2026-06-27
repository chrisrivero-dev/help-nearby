'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';

// ── Styles (match admin/community-queue) ────────────────────────────────────
const FONT = "'Poppins', sans-serif";
const BG = '#0a0a0a';
const SURFACE = '#121212';
const BORDER = '#232323';
const TEXT = '#d4d4d4';
const MUTED = '#555';
const GREEN = '#22c55e';
const AMBER = '#fbbf24';
const RED = '#ef4444';

type HealthStatus = 'healthy' | 'degraded' | 'circuit_open';

interface SourceHealthRow {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  status: HealthStatus;
  ok: boolean;
  lastCheckedAt: string;
  lastOkAt: string | null;
  consecutiveFailures: number;
  totalChecks: number;
  totalFailures: number;
  failureRate: number;
  circuitOpen: boolean;
  circuitOpenUntil: string | null;
}

interface HealthResponse {
  generatedAt: string;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    circuitOpen: number;
  };
  sources: SourceHealthRow[];
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: GREEN,
  degraded: AMBER,
  circuit_open: RED,
};
const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  circuit_open: 'Circuit open',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const AdminSourceHealth: FC = () => {
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('hn-admin-token') ?? '')
      : '',
  );
  const [tokenInput, setTokenInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/source-health', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.status === 403) {
        setAuthed(false);
        setError('Invalid admin token');
        return;
      }
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        return;
      }
      setData((await res.json()) as HealthResponse);
      setAuthed(true);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  // Auto-refresh while authed.
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [authed, load]);

  const saveToken = () => {
    const t = tokenInput.trim();
    if (!t) return;
    sessionStorage.setItem('hn-admin-token', t);
    setToken(t);
  };

  const wrap: React.CSSProperties = {
    minHeight: '100vh',
    background: BG,
    color: TEXT,
    fontFamily: FONT,
    padding: '2rem',
  };

  if (!authed && !data) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
          Source Health
        </h1>
        <p style={{ color: MUTED, marginBottom: '1rem' }}>Enter admin token.</p>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveToken()}
          placeholder="ADMIN_TOKEN"
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            color: TEXT,
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            width: 320,
            fontFamily: FONT,
          }}
        />
        <button
          onClick={saveToken}
          style={{
            marginLeft: 8,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            color: TEXT,
            padding: '0.6rem 1rem',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
        {error && <p style={{ color: RED, marginTop: '1rem' }}>{error}</p>}
      </div>
    );
  }

  const s = data?.summary;
  return (
    <div style={wrap}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.4rem' }}>Source Health</h1>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            color: TEXT,
            padding: '0.3rem 0.8rem',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {data && (
          <span style={{ color: MUTED, fontSize: '0.8rem' }}>
            updated {fmt(data.generatedAt)} · auto-refresh 15s
          </span>
        )}
      </div>

      {s && (
        <p style={{ color: MUTED, marginBottom: '1rem', fontSize: '0.9rem' }}>
          {s.total} sources ·{' '}
          <span style={{ color: GREEN }}>{s.healthy} healthy</span> ·{' '}
          <span style={{ color: AMBER }}>{s.degraded} degraded</span> ·{' '}
          <span style={{ color: RED }}>{s.circuitOpen} circuit-open</span>
        </p>
      )}
      {error && <p style={{ color: RED }}>{error}</p>}

      {data && data.sources.length === 0 && (
        <p style={{ color: MUTED }}>
          No observations yet this instance. Hit /api/nearby-resources or
          /api/weather-alerts to populate.
        </p>
      )}

      {data && data.sources.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
          }}
        >
          <thead>
            <tr style={{ textAlign: 'left', color: MUTED }}>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Source</th>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th style={{ padding: '0.5rem' }}>Last OK</th>
              <th style={{ padding: '0.5rem' }}>Last check</th>
              <th style={{ padding: '0.5rem' }}>Consec. fails</th>
              <th style={{ padding: '0.5rem' }}>Fail rate</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((src) => (
              <tr key={src.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '0.5rem' }}>
                  <span
                    style={{
                      color: STATUS_COLOR[src.status],
                      border: `1px solid ${STATUS_COLOR[src.status]}`,
                      borderRadius: 6,
                      padding: '0.1rem 0.5rem',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {STATUS_LABEL[src.status]}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <div>{src.name}</div>
                  <div style={{ color: MUTED, fontSize: '0.75rem' }}>
                    {src.id}
                  </div>
                </td>
                <td style={{ padding: '0.5rem', color: MUTED }}>
                  {src.sourceType}
                </td>
                <td style={{ padding: '0.5rem' }}>{fmt(src.lastOkAt)}</td>
                <td style={{ padding: '0.5rem' }}>{fmt(src.lastCheckedAt)}</td>
                <td
                  style={{
                    padding: '0.5rem',
                    color: src.consecutiveFailures ? AMBER : MUTED,
                  }}
                >
                  {src.consecutiveFailures}
                </td>
                <td style={{ padding: '0.5rem', color: MUTED }}>
                  {(src.failureRate * 100).toFixed(0)}% ({src.totalFailures}/
                  {src.totalChecks})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSourceHealth;
