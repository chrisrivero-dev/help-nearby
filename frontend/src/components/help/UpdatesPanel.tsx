'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import type { LocalUpdate } from '@/lib/community/types';
import type { GroundingItem } from './DashboardContext';
import { usePublishGrounding } from '@/lib/chat/usePublishGrounding';

const GOLD_COLOR = '#FFB000';

// One-line summary of a local update for the chat grounding bus.
function updateGroundingText(u: LocalUpdate): string {
  const head = [u.title, u.description].filter(Boolean).join(' — ');
  return u.sourceName ? `${head} (source: ${u.sourceName})` : head;
}

function timeAgo(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return undefined;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const UpdatesPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const hasLocation = !!zip;
  const [isExpanded, setIsExpanded] = useState(false);
  const [items, setItems] = useState<LocalUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#9a9a9a' : '#999';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';
  const isLive = items.length > 0;

  // Fetch real, approved, non-expired updates. No demo fallback — an empty
  // result renders the empty state.
  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/local-updates')
      .then((r) => (r.ok ? r.json() : { updates: [] }))
      .then((d: { updates?: LocalUpdate[] }) => {
        setItems(Array.isArray(d.updates) ? d.updates : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, []);

  // Load lazily once the panel is opened with a location set.
  useEffect(() => {
    if (!isExpanded || !hasLocation || loaded) return;
    load();
  }, [isExpanded, hasLocation, loaded, load]);

  const handleRefresh = useCallback(() => {
    if (hasLocation) load();
  }, [hasLocation, load]);

  // Publish the loaded updates to the chat so it can see what's shown here.
  const groundingItems = useMemo<GroundingItem[] | null>(
    () =>
      items.length > 0
        ? items.map((u) => ({ groundingText: updateGroundingText(u) }))
        : null,
    [items],
  );
  usePublishGrounding('updates', 'Updates', groundingItems);

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
  const panelLive = isLive && !loading;
  useEffect(() => {
    panelControl?.reportStatus('updates', {
      available: true,
      live: panelLive,
      loading,
      ok: isLive,
    });
  }, [panelControl, panelLive, loading, isLive]);
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
          <PanelStatusSquare loading={loading} ok={isLive} isDark={isDark} />
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              color: cardText,
            }}
          >
            UPDATES! NEARBY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Manual refresh — left of the info icon */}
          {hasLocation && (
            <PanelRefreshButton
              loading={loading}
              onRefresh={handleRefresh}
              isDark={isDark}
              label="Refresh updates"
            />
          )}
          <PanelInfoPopover isDark={isDark} title="VERIFIED UPDATES">
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
              <li
                style={{
                  fontSize: '0.68rem',
                  color: mutedText,
                  lineHeight: 1.4,
                }}
              >
                Only admin-verified, non-expired local updates appear here. Each
                carries a named source.
              </li>
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
            key="updates-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!hasLocation ? (
              <EmptyOrLocked text="Enter your location to see latest updates." />
            ) : loading ? (
              <EmptyOrLocked text="Loading local updates…" />
            ) : items.length === 0 ? (
              <EmptyOrLocked text="No verified local updates are currently listed nearby." />
            ) : (
              <>
                {items.map((u, i) => {
                  const ago = timeAgo(u.startsAt ?? u.updatedAt ?? u.createdAt);
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        padding: '0.85rem 1.4rem',
                        borderBottom:
                          i < items.length - 1
                            ? `1px solid ${divider}`
                            : undefined,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: cardText,
                            marginBottom: '0.14rem',
                          }}
                        >
                          {u.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.7rem',
                            color: mutedText,
                          }}
                        >
                          {u.description}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: mutedText,
                            marginTop: '0.2rem',
                          }}
                        >
                          Source:{' '}
                          {u.sourceUrl ? (
                            <a
                              href={u.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: GOLD_COLOR,
                                textDecoration: 'none',
                              }}
                            >
                              {u.sourceName}
                            </a>
                          ) : (
                            u.sourceName
                          )}
                        </div>
                      </div>
                      {ago ? (
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: mutedText,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {ago}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </NeoPanel>
  );
};
