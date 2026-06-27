'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import type { CommunityTip, ListingIssueReport } from '@/lib/community/types';

const REJECTION_REASONS = [
  'spam',
  'unsafe',
  'unverifiable',
  'pii',
  'off_topic',
  'duplicate',
] as const;
type RejectionReason = (typeof REJECTION_REASONS)[number];

const REPORT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved_fixed', label: 'Resolved — Fixed' },
  { value: 'resolved_unverified', label: 'Resolved — Could not verify' },
  { value: 'dismissed', label: 'Dismissed' },
] as const;

// ── Styles ────────────────────────────────────────────────────────────────────
const FONT = "'Poppins', sans-serif";
const BG = '#0a0a0a';
const SURFACE = '#121212';
const BORDER = '#232323';
const TEXT = '#d4d4d4';
const MUTED = '#555';
const GOLD = '#f59e0b';
const RED = '#ef4444';
const GREEN = '#22c55e';

function badge(status: string) {
  const map: Record<string, string> = {
    pending: '#fbbf24',
    approved: GREEN,
    rejected: RED,
    needs_review: '#6366f1',
    open: '#fbbf24',
    investigating: '#6366f1',
    resolved_fixed: GREEN,
    resolved_unverified: MUTED,
    dismissed: MUTED,
  };
  return map[status] ?? MUTED;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminCommunityQueue: FC = () => {
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('hn-admin-token') ?? '')
      : '',
  );
  const [tokenInput, setTokenInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'tips' | 'reports'>('tips');

  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [reports, setReports] = useState<ListingIssueReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingTip, setEditingTip] = useState<{
    id: string;
    body: string;
  } | null>(null);
  const [rejectingTip, setRejectingTip] = useState<{
    id: string;
    reason: RejectionReason | '';
  } | null>(null);

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  async function loadTips(t: string) {
    setLoading(true);
    setError('');
    try {
      const [tRes, rRes] = await Promise.all([
        fetch('/api/community-tips?resourceKeys=ALL_PENDING', {
          headers: { Authorization: `Bearer ${t}` },
        }),
        fetch('/api/resource-reports', {
          headers: { Authorization: `Bearer ${t}` },
        }),
      ]);

      // Tips come from the store endpoint via admin — we use a dedicated store read
      // The public GET only returns approved+filtered tips; for admin we need all
      const tipsRes = await fetch('/api/admin/community-tips', {
        headers: { Authorization: `Bearer ${t}` },
      });

      if (tipsRes.status === 403 || rRes.status === 403) {
        setError('Invalid admin token.');
        setAuthed(false);
        return;
      }

      if (tipsRes.ok) {
        const d = await tipsRes.json();
        setTips(d.tips ?? []);
      }
      if (rRes.ok) {
        const d = await rRes.json();
        setReports(d.reports ?? []);
      }
      setAuthed(true);
    } catch {
      setError('Failed to load. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    sessionStorage.setItem('hn-admin-token', t);
    setToken(t);
    loadTips(t);
  }

  useEffect(() => {
    if (token) loadTips(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moderateTip(
    id: string,
    action: 'approve' | 'reject' | 'needs_review',
    reason?: string,
    editedBody?: string,
  ) {
    const res = await fetch(`/api/community-tips/${id}/moderate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action, reason, editedBody }),
    });
    if (res.ok) loadTips(token);
  }

  async function updateReport(id: string, status: string) {
    const res = await fetch(`/api/resource-reports/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadTips(token);
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <form
          onSubmit={handleTokenSubmit}
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            padding: '2rem',
            maxWidth: 360,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h1
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              color: TEXT,
              margin: 0,
            }}
          >
            HELP NEARBY · ADMIN
          </h1>
          {error && (
            <p
              style={{
                fontFamily: FONT,
                fontSize: '0.7rem',
                color: RED,
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin token"
            required
            style={{
              fontFamily: FONT,
              fontSize: '0.75rem',
              color: TEXT,
              background: '#111',
              border: `1px solid ${BORDER}`,
              padding: '0.5rem 0.75rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              color: '#000',
              background: GOLD,
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            ENTER
          </button>
        </form>
      </div>
    );
  }

  const pendingTips = tips.filter(
    (t) => t.status === 'pending' || t.status === 'needs_review',
  );
  const openReports = reports.filter(
    (r) => r.status === 'open' || r.status === 'investigating',
  );

  // ── Queue ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: TEXT,
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
          }}
        >
          HELP NEARBY · COMMUNITY QUEUE
        </span>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('hn-admin-token');
            setAuthed(false);
            setToken('');
          }}
          style={{
            fontFamily: FONT,
            fontSize: '0.65rem',
            color: MUTED,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 2rem',
          display: 'flex',
          gap: '0',
        }}
      >
        {(['tips', 'reports'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              fontFamily: FONT,
              fontWeight: tab === t ? 700 : 400,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              color: tab === t ? GOLD : MUTED,
              background: 'none',
              border: 'none',
              borderBottom:
                tab === t ? `2px solid ${GOLD}` : '2px solid transparent',
              padding: '0.75rem 1.25rem',
              cursor: 'pointer',
            }}
          >
            {t === 'tips'
              ? `TIPS ${pendingTips.length > 0 ? `(${pendingTips.length})` : ''}`
              : `LISTING ISSUES ${openReports.length > 0 ? `(${openReports.length})` : ''}`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => loadTips(token)}
          style={{
            fontFamily: FONT,
            fontSize: '0.65rem',
            color: MUTED,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: 900 }}>
        {tab === 'tips' && (
          <>
            {tips.length === 0 && !loading && (
              <p style={{ fontSize: '0.75rem', color: MUTED }}>
                No submissions yet.
              </p>
            )}
            {tips
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((tip) => (
                <div
                  key={tip.id}
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    padding: '1rem 1.25rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: badge(tip.status),
                            border: `1px solid ${badge(tip.status)}`,
                            padding: '0.1rem 0.4rem',
                          }}
                        >
                          {tip.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: MUTED }}>
                          {fmt(tip.createdAt)}
                        </span>
                        {tip.submitterName && (
                          <span style={{ fontSize: '0.65rem', color: MUTED }}>
                            · {tip.submitterName}
                          </span>
                        )}
                        {tip.visitedOn && (
                          <span style={{ fontSize: '0.65rem', color: MUTED }}>
                            · visited {tip.visitedOn}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: TEXT,
                          margin: '0 0 0.35rem 0',
                          lineHeight: 1.5,
                        }}
                      >
                        {tip.body}
                      </p>
                      {tip.originalBody && (
                        <p
                          style={{
                            fontSize: '0.65rem',
                            color: MUTED,
                            margin: '0 0 0.35rem 0',
                            fontStyle: 'italic',
                          }}
                        >
                          Original: {tip.originalBody}
                        </p>
                      )}
                      <p
                        style={{ fontSize: '0.65rem', color: MUTED, margin: 0 }}
                      >
                        <strong>{tip.resourceSnapshot.name}</strong>
                        {tip.resourceSnapshot.address &&
                          ` · ${tip.resourceSnapshot.address}`}
                        {' · '}source: {tip.resourceSnapshot.sourceName}
                      </p>
                      {tip.submitterEmail && (
                        <p
                          style={{
                            fontSize: '0.62rem',
                            color: MUTED,
                            margin: '0.2rem 0 0 0',
                          }}
                        >
                          Contact: {tip.submitterEmail}
                        </p>
                      )}
                      {tip.rejectionReason && (
                        <p
                          style={{
                            fontSize: '0.62rem',
                            color: RED,
                            margin: '0.2rem 0 0 0',
                          }}
                        >
                          Rejected: {tip.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Moderation actions */}
                  {(tip.status === 'pending' ||
                    tip.status === 'needs_review') && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => moderateTip(tip.id, 'approve')}
                        style={actionBtn(GREEN)}
                      >
                        APPROVE
                      </button>

                      {rejectingTip?.id === tip.id ? (
                        <>
                          <select
                            value={rejectingTip.reason}
                            onChange={(e) =>
                              setRejectingTip({
                                id: tip.id,
                                reason: e.target.value as RejectionReason,
                              })
                            }
                            style={selectStyle}
                          >
                            <option value="">Select reason</option>
                            {REJECTION_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (rejectingTip.reason) {
                                moderateTip(
                                  tip.id,
                                  'reject',
                                  rejectingTip.reason,
                                );
                                setRejectingTip(null);
                              }
                            }}
                            disabled={!rejectingTip.reason}
                            style={actionBtn(RED)}
                          >
                            CONFIRM REJECT
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingTip(null)}
                            style={ghostBtn}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRejectingTip({ id: tip.id, reason: '' })
                          }
                          style={actionBtn(RED)}
                        >
                          REJECT
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => moderateTip(tip.id, 'needs_review')}
                        style={actionBtn('#6366f1')}
                      >
                        NEEDS REVIEW
                      </button>

                      {editingTip?.id === tip.id ? (
                        <>
                          <textarea
                            value={editingTip.body}
                            onChange={(e) =>
                              setEditingTip({
                                id: tip.id,
                                body: e.target.value.slice(0, 280),
                              })
                            }
                            rows={2}
                            style={{ ...textareaStyle, minWidth: 240 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              moderateTip(
                                tip.id,
                                'approve',
                                undefined,
                                editingTip.body,
                              );
                              setEditingTip(null);
                            }}
                            style={actionBtn(GOLD)}
                          >
                            SAVE & APPROVE
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTip(null)}
                            style={ghostBtn}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTip({ id: tip.id, body: tip.body })
                          }
                          style={ghostBtn}
                        >
                          Edit & approve
                        </button>
                      )}
                    </div>
                  )}

                  {tip.status === 'approved' && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => moderateTip(tip.id, 'reject', 'other')}
                        style={actionBtn(RED)}
                      >
                        UNPUBLISH
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </>
        )}

        {tab === 'reports' && (
          <>
            {reports.length === 0 && !loading && (
              <p style={{ fontSize: '0.75rem', color: MUTED }}>
                No issue reports yet.
              </p>
            )}
            {reports
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((report) => (
                <div
                  key={report.id}
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    padding: '1rem 1.25rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: badge(report.status),
                        border: `1px solid ${badge(report.status)}`,
                        padding: '0.1rem 0.4rem',
                      }}
                    >
                      {report.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: MUTED }}>
                      {fmt(report.createdAt)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: TEXT,
                        fontWeight: 700,
                        background: '#1a1a1a',
                        padding: '0.1rem 0.4rem',
                      }}
                    >
                      {report.issueType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: TEXT,
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    <strong>{report.resourceSnapshot.name}</strong>
                    {report.resourceSnapshot.address &&
                      ` · ${report.resourceSnapshot.address}`}
                  </p>
                  {report.detail && (
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: MUTED,
                        margin: '0 0 0.5rem 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {report.detail}
                    </p>
                  )}
                  <div
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                  >
                    {REPORT_STATUSES.filter(
                      (s) => s.value !== report.status,
                    ).map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => updateReport(report.id, s.value)}
                        style={ghostBtn}
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const actionBtn = (color: string): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: '0.6rem',
  letterSpacing: '0.08em',
  color: '#000',
  background: color,
  border: 'none',
  padding: '0.28rem 0.65rem',
  cursor: 'pointer',
});

const ghostBtn: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '0.62rem',
  color: MUTED,
  background: 'none',
  border: `1px solid ${BORDER}`,
  padding: '0.25rem 0.55rem',
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '0.65rem',
  color: TEXT,
  background: '#111',
  border: `1px solid ${BORDER}`,
  padding: '0.25rem 0.4rem',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '0.7rem',
  color: TEXT,
  background: '#111',
  border: `1px solid ${BORDER}`,
  padding: '0.35rem 0.5rem',
  resize: 'vertical',
  outline: 'none',
};

export default AdminCommunityQueue;
