'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Plus, Search, X } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { useDetail } from './DashboardContext';
import type { DetailDescriptor, GroundingItem } from './DashboardContext';
import { usePublishGrounding } from '@/lib/chat/usePublishGrounding';
import { NeoPanel } from './NeoPanel';
import { PanelHeader } from './PanelHeader';
import { usePanelControl } from './PanelControlContext';
import {
  PanelStatusSquare,
  PanelRefreshButton,
  PanelInfoPopover,
} from './PanelStatusControls';
import type { NearbyResource, ResourceCategory } from '@/lib/resources/schema';
import { CATEGORY_LABELS } from '@/lib/resources/categories';
import { useProgressiveNearbyResources } from '@/lib/resources/useNearbyResources';
import type { CommunityTip } from '@/lib/community/types';
import { ResourceCardCommunityNotes } from './ResourceCardCommunityNotes';
import { SubmitTipForm } from './SubmitTipForm';
import { ReportListingIssueModal } from './ReportListingIssueModal';
import { AddSource } from './AddSource';

const RESOURCES_PAGE_SIZE = 10;
const EMPTY_RESOURCE_CATEGORIES: ResourceCategory[] = [];

// Returns the best available address string for display. Rules:
//  1. If the address field already looks complete (contains a 2-letter state
//     abbreviation), show it as-is.
//  2. If city/state fields are present, append them to the street.
//  3. Otherwise show the raw street address — never invent city/state.
const formatResourceAddress = (r: NearbyResource): string | null => {
  const street = r.address?.trim();
  if (!street) return null;

  // Already complete: address contains ", ST" or ", ST " pattern
  if (/,\s*[A-Z]{2}(\s|$|,)/.test(street)) return street;

  // Build from separate fields if available
  if (r.city && r.state) {
    const zipPart = r.zip ? ` ${r.zip.split('-')[0]}` : '';
    return `${street}, ${r.city}, ${r.state}${zipPart}`;
  }

  return street;
};

const formatDist = (mi: number) =>
  mi < 0.1
    ? '< 0.1 mi'
    : mi < 10
      ? `${mi.toFixed(1)} mi`
      : `${Math.round(mi)} mi`;

const formatChecked = (iso?: string) => {
  if (!iso) return '';
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

// One-line summary of a resource for the chat (and the detail descriptor's
// groundingSummary). Reuses the same address/distance formatting as the cards.
const resourceGroundingText = (r: NearbyResource): string => {
  const parts = [r.name];
  const categoryLabel = CATEGORY_LABELS[r.category] ?? r.category;
  if (categoryLabel) parts.push(categoryLabel);
  if (typeof r.distanceMiles === 'number')
    parts.push(formatDist(r.distanceMiles));
  const address = formatResourceAddress(r);
  if (address) parts.push(address);
  if (r.phone) parts.push(r.phone);
  return parts.join(' · ');
};

// Build the panel-agnostic detail descriptor for a resource row, so opening from
// a card click and opening from a chat marker produce identical detail items.
const toResourceDescriptor = (
  r: NearbyResource,
): DetailDescriptor<NearbyResource> => ({
  kind: 'resource',
  id: r.id,
  title: r.name,
  payload: r,
  groundingSummary: resourceGroundingText(r),
});

interface ResourceCardProps {
  r: NearbyResource;
  isLast: boolean;
  isDark: boolean;
  originLat: number;
  originLng: number;
  tips: CommunityTip[];
  isSelected?: boolean;
  onSelect?: () => void;
}

const ResourceCard: FC<ResourceCardProps> = ({
  r,
  isLast,
  isDark,
  originLat,
  originLng,
  tips,
  isSelected = false,
  onSelect,
}) => {
  const [showTipForm, setShowTipForm] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const detailText = isDark ? '#bdbdbd' : '#444444';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';
  const linkColor = isDark ? '#93c5fd' : '#1d4ed8';

  const address = formatResourceAddress(r);
  const hasCommunity = r.resource_key !== undefined;
  const hasDirections =
    typeof r.latitude === 'number' &&
    typeof r.longitude === 'number' &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng);

  const actionButtonStyle = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.62rem',
    color: mutedText,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '0.9rem 1.4rem',
        borderBottom: isLast ? undefined : `1px solid ${divider}`,
        borderLeft: isSelected ? '3px solid #C9A227' : undefined,
        boxSizing: 'border-box',
        background: isSelected
          ? isDark
            ? 'rgba(251,191,36,0.06)'
            : 'rgba(251,191,36,0.08)'
          : undefined,
        cursor: onSelect ? 'pointer' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              color: cardText,
            }}
          >
            {r.name}
          </div>
          {(address || hasDirections) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.6rem',
                flexWrap: 'wrap',
                marginTop: '0.14rem',
              }}
            >
              {address && (
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.7rem',
                    color: detailText,
                  }}
                >
                  {address}
                </span>
              )}
              {hasDirections && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${r.latitude},${r.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open directions to ${r.name} in Google Maps`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: linkColor,
                    textDecoration: 'underline',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={9} /> Directions
                </a>
              )}
            </div>
          )}
          {r.phone && (
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.7rem',
                color: detailText,
                marginTop: '0.1rem',
              }}
            >
              {r.phone}
            </div>
          )}
          {hasCommunity && <ResourceCardCommunityNotes tips={tips} />}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.3rem',
            flexShrink: 0,
            paddingTop: '0.1rem',
          }}
        >
          {typeof r.distanceMiles === 'number' && (
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '0.74rem',
                color: detailText,
              }}
            >
              {formatDist(r.distanceMiles)}
            </span>
          )}
          {hasCommunity && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTipForm((v) => !v);
                }}
                style={actionButtonStyle}
              >
                {showTipForm
                  ? 'Cancel tip'
                  : tips.length === 0
                    ? 'Share a tip'
                    : 'Add a tip'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReport((v) => !v);
                }}
                style={actionButtonStyle}
              >
                {showReport ? 'Cancel report' : 'Report issue'}
              </button>
            </>
          )}
        </div>
      </div>

      {showTipForm && (
        <SubmitTipForm resource={r} onClose={() => setShowTipForm(false)} />
      )}
      {showReport && (
        <ReportListingIssueModal
          resource={r}
          onClose={() => setShowReport(false)}
        />
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
          href={r.website ?? r.sourceUrl}
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
          <ExternalLink size={9} /> Source: {r.sourceName}
        </a>
        {r.isCustom && r.createdAt ? (
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: mutedText,
            }}
          >
            Added {formatChecked(r.createdAt)}
          </span>
        ) : r.lastChecked ? (
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: mutedText,
            }}
          >
            Last checked {formatChecked(r.lastChecked)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

interface LockedPanelProps {
  mutedText: string;
  minH?: number;
}

const LockedPanel: FC<LockedPanelProps> = ({ mutedText, minH = 100 }) => (
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
    {/* Heart icon removed for neutral style */}
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
      Enter your location to see nearby alerts,
      <br />
      resources, and transit options.
    </p>
  </div>
);

interface PaginationControlsProps {
  page: number;
  shownTotalPages: number;
  filteredTotal: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  nearbyPageLocked: boolean;
  divider: string;
  mutedText: string;
  cardText: string;
  isDark: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const PaginationControls: FC<PaginationControlsProps> = ({
  page,
  shownTotalPages,
  filteredTotal,
  hasPreviousPage,
  hasNextPage,
  nearbyPageLocked,
  divider,
  mutedText,
  cardText,
  isDark,
  onPreviousPage,
  onNextPage,
}) => (
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <button
        type="button"
        onClick={onPreviousPage}
        disabled={!hasPreviousPage || nearbyPageLocked}
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '0.25rem 0.55rem',
          cursor:
            !hasPreviousPage || nearbyPageLocked ? 'not-allowed' : 'pointer',
          border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
          background: 'transparent',
          color: !hasPreviousPage || nearbyPageLocked ? mutedText : cardText,
          opacity: !hasPreviousPage || nearbyPageLocked ? 0.45 : 1,
        }}
      >
        Prev
      </button>
      <button
        type="button"
        onClick={onNextPage}
        disabled={!hasNextPage || nearbyPageLocked}
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '0.25rem 0.55rem',
          cursor: !hasNextPage || nearbyPageLocked ? 'not-allowed' : 'pointer',
          border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
          background: 'transparent',
          color: !hasNextPage || nearbyPageLocked ? mutedText : cardText,
          opacity: !hasNextPage || nearbyPageLocked ? 0.45 : 1,
        }}
      >
        Next
      </button>
    </div>
  </div>
);

interface ResourcesPanelProps {
  /** When false (mobile, no detail column), rows don't open the DetailView. */
  detailEnabled?: boolean;
}

interface ResourcesPanelFiltersState {
  locationKey: string;
  query: string;
  activeCategories: ResourceCategory[];
  page: number;
}

export const ResourcesPanel: FC<ResourcesPanelProps> = ({
  detailEnabled = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { latitude, longitude, isValid, isResolvingLocation } =
    useLocationContext();
  const { detail, openDetail } = useDetail();
  const selectedResourceId =
    detail?.kind === 'resource' ? detail.id : undefined;

  const [expandedState, setExpandedState] = useState({
    value: true,
    signalNonce: 0,
  });
  const [showAddSource, setShowAddSource] = useState(false);
  const [filters, setFilters] = useState<ResourcesPanelFiltersState>({
    locationKey: '',
    query: '',
    activeCategories: [],
    page: 1,
  });

  const nearby = useProgressiveNearbyResources({
    latitude,
    longitude,
    enabled: isValid,
  });
  const nearbyResources = useMemo(
    () => (!isValid && !isResolvingLocation ? [] : nearby.resources),
    [isValid, isResolvingLocation, nearby.resources],
  );
  const nearbyLoading =
    isResolvingLocation ||
    nearby.isLoading ||
    (nearby.isFetching && nearbyResources === null);
  const nearbyRefreshing = nearby.isFetching;
  const nearbyPageLocked = nearby.isInitialLoading;
  const nearbyDegraded = nearby.degraded;
  const sources = nearby.sources;
  const refreshNearby = nearby.refresh;
  const locationKey =
    isValid && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? `${latitude.toFixed(3)},${longitude.toFixed(3)}`
      : '';

  const filtersMatchLocation = filters.locationKey === locationKey;
  const query = filtersMatchLocation ? filters.query : '';
  const activeCategories = filtersMatchLocation
    ? filters.activeCategories
    : EMPTY_RESOURCE_CATEGORIES;
  const page = filtersMatchLocation ? filters.page : 1;

  const handleRefresh = useCallback(() => {
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      refreshNearby();
    }
  }, [isValid, latitude, longitude, refreshNearby]);

  const handleSourceAdded = useCallback(async () => {
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      await refreshNearby();
    }
  }, [isValid, latitude, longitude, refreshNearby]);

  const resourceRenderKey = (r: NearbyResource, index: number) =>
    `${r.sourceName}:${r.id}:${r.latitude ?? ''}:${r.longitude ?? ''}:${index}`;

  // Categories actually present in the current results, in canonical order.
  const availableCategories = useMemo<ResourceCategory[]>(() => {
    if (!nearbyResources) return [];
    const present = new Set(nearbyResources.map((r) => r.category));
    return (Object.keys(CATEGORY_LABELS) as ResourceCategory[]).filter((c) =>
      present.has(c),
    );
  }, [nearbyResources]);

  // Apply the keyword + category filters client-side.
  const filteredResources = useMemo(() => {
    if (!nearbyResources) return nearbyResources;
    const q = query.trim().toLowerCase();
    return nearbyResources.filter((r) => {
      if (activeCategories.length > 0 && !activeCategories.includes(r.category))
        return false;
      if (!q) return true;
      const haystack = [
        r.name,
        r.address,
        r.city,
        r.state,
        r.zip,
        r.phone,
        r.sourceName,
        r.customCategoryLabel,
        CATEGORY_LABELS[r.category],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [nearbyResources, query, activeCategories]);

  const filteredTotal = filteredResources?.length ?? 0;
  const totalPages =
    filteredTotal === 0 ? 0 : Math.ceil(filteredTotal / RESOURCES_PAGE_SIZE);
  const shownTotalPages = Math.max(totalPages, 1);
  const visiblePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const hasPreviousPage = visiblePage > 1;
  const hasNextPage = visiblePage < totalPages;

  const pagedResources = useMemo(() => {
    if (!filteredResources) return filteredResources;
    const offset = (visiblePage - 1) * RESOURCES_PAGE_SIZE;
    return filteredResources.slice(offset, offset + RESOURCES_PAGE_SIZE);
  }, [filteredResources, visiblePage]);

  const resourceKeys = useMemo(
    () =>
      (pagedResources ?? [])
        .map((r) => r.resource_key)
        .filter((k): k is string => Boolean(k)),
    [pagedResources],
  );

  const { data: communityTips = {} } = useQuery({
    queryKey: ['community-tips', resourceKeys],
    queryFn: async () => {
      if (resourceKeys.length === 0) return {};
      const params = new URLSearchParams({
        resourceKeys: resourceKeys.join(','),
      });
      const res = await fetch(`/api/community-tips?${params.toString()}`);
      if (!res.ok) return {};
      const data = (await res.json()) as {
        tips: Record<string, CommunityTip[]>;
      };
      return data.tips ?? {};
    },
    enabled: resourceKeys.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const setQueryForLocation = useCallback(
    (nextQuery: string) => {
      setFilters((prev) => ({
        locationKey,
        query: nextQuery,
        activeCategories:
          prev.locationKey === locationKey ? prev.activeCategories : [],
        page: 1,
      }));
    },
    [locationKey],
  );

  const clearFiltersForLocation = useCallback(() => {
    setFilters({
      locationKey,
      query: '',
      activeCategories: [],
      page: 1,
    });
  }, [locationKey]);

  const toggleCategory = useCallback(
    (c: ResourceCategory) => {
      setFilters((prev) => {
        const currentCategories =
          prev.locationKey === locationKey ? prev.activeCategories : [];
        return {
          locationKey,
          query: prev.locationKey === locationKey ? prev.query : '',
          activeCategories: currentCategories.includes(c)
            ? currentCategories.filter((x) => x !== c)
            : [...currentCategories, c],
          page: 1,
        };
      });
    },
    [locationKey],
  );

  const setPageForLocation = useCallback(
    (nextPage: number) => {
      setFilters((prev) => ({
        locationKey,
        query: prev.locationKey === locationKey ? prev.query : '',
        activeCategories:
          prev.locationKey === locationKey ? prev.activeCategories : [],
        page: Math.max(1, nextPage),
      }));
    },
    [locationKey],
  );

  const filtersActive = query.trim().length > 0 || activeCategories.length > 0;

  // Grounding snapshot of the filtered list so the chat panel can see (and open)
  // the resources currently shown here. Resources carry a descriptor, so they
  // remain openable from chat markers.
  const groundingItems = useMemo<GroundingItem[] | null>(
    () =>
      filteredResources?.map((r) => ({
        descriptor: toResourceDescriptor(r),
        groundingText: resourceGroundingText(r),
      })) ?? null,
    [filteredResources],
  );
  const groundingFilters = useMemo(
    () => ({
      query: query.trim() || undefined,
      categories: activeCategories.length
        ? activeCategories.map((c) => CATEGORY_LABELS[c] ?? c)
        : undefined,
    }),
    [query, activeCategories],
  );
  usePublishGrounding(
    'resources',
    'Resources',
    groundingItems,
    groundingFilters,
  );

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';

  // Report live status (green / connected source) and respond to the
  // sidebar's expand/collapse-all control.
  const panelControl = usePanelControl();
  const panelLive = sources.some((s) => s.ok) && !nearbyRefreshing;
  useEffect(() => {
    panelControl?.reportStatus('resources', {
      available: true,
      live: panelLive,
      loading: nearbyRefreshing,
      ok: sources.some((s) => s.ok),
    });
  }, [panelControl, panelLive, nearbyRefreshing, sources]);
  const expandNonce = panelControl?.expandSignal.nonce ?? 0;
  const expandValue = panelControl?.expandSignal.value ?? true;
  const isExpanded =
    expandNonce !== 0 && expandedState.signalNonce !== expandNonce
      ? expandValue
      : expandedState.value;
  const setIsExpandedForSignal = useCallback(
    (value: boolean) => {
      setExpandedState({
        value,
        signalNonce: expandNonce,
      });
    },
    [expandNonce],
  );

  return (
    <NeoPanel isExpanded={isExpanded}>
      {/* Section Header */}
      <PanelHeader
        divider={divider}
        isDark={isDark}
        onClick={() => setIsExpandedForSignal(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Status indicator - left of title. */}
          {(nearbyLoading || sources.length > 0) && (
            <PanelStatusSquare
              loading={nearbyRefreshing}
              ok={sources.some((s) => s.ok)}
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
            RESOURCES! NEARBY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Add button - left of refresh button */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowAddSource(true);
            }}
            aria-label="Add custom source"
            title="Add custom source"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: `1px solid ${isDark ? '#2a2a2a' : '#dddddd'}`,
              background: 'transparent',
              color: mutedText,
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            <Plus size={13} />
          </button>
          {/* Manual refresh — bypasses the cache. Left of the info icon. */}
          {isValid && (
            <PanelRefreshButton
              loading={nearbyRefreshing}
              onRefresh={handleRefresh}
              isDark={isDark}
              label="Refresh resources"
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

      <AnimatePresence mode="wait">
        {isExpanded && (
          <>
            {/* Not yet activated */}
            {!isValid && !isResolvingLocation ? (
              <motion.div
                key="help-locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ padding: '1rem' }}
              >
                <LockedPanel mutedText={mutedText} />
              </motion.div>
            ) : nearbyLoading ? (
              <motion.div
                key="help-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '1.4rem',
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
                  Searching nearest resources...
                </span>
              </motion.div>
            ) : nearbyResources !== null && nearbyResources.length === 0 ? (
              <motion.div
                key="help-unavailable"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ padding: '1.2rem 1.4rem' }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.78rem',
                    color: mutedText,
                    lineHeight: 1.5,
                  }}
                >
                  No live data sources cover this area yet. As more public
                  agencies publish open data, results will appear here.
                </span>
              </motion.div>
            ) : nearbyResources !== null && nearbyResources.length > 0 ? (
              <motion.div
                key="help-real"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                      onChange={(e) => setQueryForLocation(e.target.value)}
                      placeholder="Filter by name, street, ZIP, or source…"
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
                        onClick={clearFiltersForLocation}
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
                  {availableCategories.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                      }}
                    >
                      {availableCategories.map((c) => {
                        const active = activeCategories.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCategory(c)}
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
                                  ? '#C9A227'
                                  : isDark
                                    ? '#3A3A3A'
                                    : '#d0d0d0'
                              }`,
                              background: active ? '#C9A227' : 'transparent',
                              color: active ? '#111' : mutedText,
                            }}
                          >
                            {CATEGORY_LABELS[c]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {nearbyDegraded && (
                  <div
                    style={{
                      padding: '0.6rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.66rem',
                      letterSpacing: '0.06em',
                      color: '#C9A227',
                      background: isDark ? '#141414' : '#F1F1EC',
                    }}
                  >
                    LIVE DATA UNAVAILABLE — SHOWING LAST-KNOWN INFORMATION
                  </div>
                )}
                {nearby.isExpanding && (
                  <div
                    style={{
                      padding: '0.5rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#C9A227',
                      background: isDark ? '#141414' : '#F1F1EC',
                    }}
                  >
                    {nearby.isStaleWhileLoading
                      ? 'UPDATING NEAREST RESOURCES'
                      : 'EXPANDING SEARCH AREA'}
                    {!nearby.isStaleWhileLoading && nearby.loadedRadiusMiles
                      ? ` — ${nearby.loadedRadiusMiles} MI LOADED`
                      : ''}
                  </div>
                )}
                <PaginationControls
                  page={visiblePage}
                  shownTotalPages={shownTotalPages}
                  filteredTotal={filteredTotal}
                  hasPreviousPage={hasPreviousPage}
                  hasNextPage={hasNextPage}
                  nearbyPageLocked={nearbyPageLocked}
                  divider={divider}
                  mutedText={mutedText}
                  cardText={cardText}
                  isDark={isDark}
                  onPreviousPage={() => setPageForLocation(visiblePage - 1)}
                  onNextPage={() => setPageForLocation(visiblePage + 1)}
                />
                {(pagedResources ?? []).length === 0 ? (
                  <div style={{ padding: '1.2rem 1.4rem' }}>
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.78rem',
                        color: mutedText,
                        lineHeight: 1.5,
                      }}
                    >
                      No results match your filters.
                    </span>
                  </div>
                ) : (
                  (pagedResources ?? []).map((r, i, arr) => (
                    <ResourceCard
                      key={resourceRenderKey(r, i)}
                      r={r}
                      isLast={i === arr.length - 1}
                      isDark={isDark}
                      originLat={latitude}
                      originLng={longitude}
                      tips={
                        r.resource_key !== undefined
                          ? (communityTips[r.resource_key] ?? [])
                          : []
                      }
                      isSelected={selectedResourceId === r.id}
                      onSelect={
                        detailEnabled
                          ? () => openDetail(toResourceDescriptor(r))
                          : undefined
                      }
                    />
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="help-locked-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ padding: '1rem' }}
              >
                <LockedPanel mutedText={mutedText} />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
      {showAddSource && (
        <AddSource
          isDark={isDark}
          onClose={() => setShowAddSource(false)}
          onAdded={handleSourceAdded}
        />
      )}
    </NeoPanel>
  );
};
