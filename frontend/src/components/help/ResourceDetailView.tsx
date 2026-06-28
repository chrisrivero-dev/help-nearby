'use client';

import type { FC } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import type { NearbyResource, SourceType } from '@/lib/resources/schema';
import { CATEGORY_LABELS } from '@/lib/resources/categories';
import { useLocationContext } from './LocationContext';
import type { DetailDescriptor } from './DashboardContext';

// Intentionally duplicated from ResourcesPanel — do not consolidate without
// Mike's sign-off; keeps this view independently reversible.
const formatResourceAddress = (r: NearbyResource): string | null => {
  const street = r.address?.trim();
  if (!street) return null;
  if (/,\s*[A-Z]{2}(\s|$|,)/.test(street)) return street;
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

const formatChecked = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Human-readable labels for sourceType values. These describe the dataset
// format, not a quality or trust score.
const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'arcgis-rest': 'Public GIS dataset',
  socrata: 'Open data portal',
  'open-data': 'Open data portal',
  api: 'API feed',
  'manual-fallback': 'Manually maintained list',
  custom: 'Custom source (user-added)',
};

// Fields with provenance data that are meaningful to show a user.
// lat/lng, city, state, zip, updatedAt are omitted — too technical.
const PROVENANCE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
];

interface ResourceDetailViewProps {
  resource: NearbyResource;
  onClose: () => void;
}

interface ResourceDetailRendererProps {
  descriptor: DetailDescriptor<NearbyResource>;
  onClose: () => void;
}

const SectionLabel: FC<{ children: string }> = ({ children }) => (
  <p
    style={{
      fontFamily: "'Poppins', sans-serif",
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-muted, #888888)',
      margin: '0 0 0.35rem',
    }}
  >
    {children}
  </p>
);

const ProvenanceRow: FC<{ label: string; sourceName: string }> = ({
  label,
  sourceName,
}) => (
  <div
    style={{
      display: 'flex',
      gap: '0.4rem',
      fontFamily: "'Poppins', sans-serif",
      fontSize: '0.64rem',
      lineHeight: 1.5,
      color: 'var(--color-detail, #444444)',
    }}
  >
    <span
      style={{
        color: 'var(--color-muted, #888888)',
        flexShrink: 0,
        minWidth: '3.5rem',
      }}
    >
      {label}:
    </span>
    <span>{sourceName}</span>
  </div>
);

// Renderer registered with the universal DetailView for `kind === 'resource'`.
// Unwraps the descriptor's payload into the existing resource view so the rich
// resource-specific layout below stays intact.
export const ResourceDetailRenderer: FC<ResourceDetailRendererProps> = ({
  descriptor,
  onClose,
}) => <ResourceDetailView resource={descriptor.payload} onClose={onClose} />;

export const ResourceDetailView: FC<ResourceDetailViewProps> = ({
  resource: r,
  onClose,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    latitude: originLat,
    longitude: originLng,
    isValid,
  } = useLocationContext();

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#b8b8b8' : '#888888';
  const detailText = isDark ? '#bdbdbd' : '#444444';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';
  const bg = isDark ? '#181818' : '#ffffff';
  const linkColor = isDark ? '#93c5fd' : '#1d4ed8';

  const address = formatResourceAddress(r);
  const hasDirections =
    isValid &&
    typeof r.latitude === 'number' &&
    typeof r.longitude === 'number' &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng);

  const timestamp = r.isCustom
    ? formatChecked(r.createdAt)
    : formatChecked(r.lastChecked);
  const timestampLabel = r.isCustom ? 'Added' : 'Last checked';
  const categoryLabel = CATEGORY_LABELS[r.category] ?? r.category;
  const sourceTypeLabel = SOURCE_TYPE_LABELS[r.sourceType] ?? r.sourceType;

  // Multi-source: contributingSources is only set when reconciliation ran and
  // found this entity in more than one dataset.
  const multiSource =
    Array.isArray(r.contributingSources) && r.contributingSources.length > 1;

  // Field-level provenance: only set on reconciled records.
  // Filter to user-facing fields that (a) have provenance data AND (b) actually
  // have a value on this record.
  const provenanceRows = PROVENANCE_FIELDS.filter(
    ({ key }) =>
      r.fieldProvenance?.[key] !== undefined &&
      r[key as keyof NearbyResource] !== undefined &&
      r[key as keyof NearbyResource] !== null,
  ).map(({ key, label }) => ({
    label,
    sourceName: r.fieldProvenance![key].sourceName,
    fetchedAt: r.fieldProvenance![key].fetchedAt,
  }));

  const hasFieldProvenance = provenanceRows.length > 0;

  return (
    <div
      style={{
        background: bg,
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '1rem 1.4rem',
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to overview"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: mutedText,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ← BACK
        </button>
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            color: cardText,
          }}
        >
          RESOURCE DETAIL
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Name + category/distance */}
        <div style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: mutedText,
              margin: '0 0 0.3rem',
            }}
          >
            {categoryLabel}
            {typeof r.distanceMiles === 'number'
              ? ` · ${formatDist(r.distanceMiles)}`
              : ''}
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1rem',
              fontWeight: 700,
              color: cardText,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {r.name}
          </p>
        </div>

        {/* Address + Directions */}
        {(address || hasDirections) && (
          <div
            style={{
              borderTop: `1px solid ${divider}`,
              paddingTop: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <SectionLabel>Location</SectionLabel>
            {address && (
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.8rem',
                  color: detailText,
                  margin: '0 0 0.45rem',
                  lineHeight: 1.45,
                }}
              >
                {address}
              </p>
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
                  gap: '0.25rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: linkColor,
                  textDecoration: 'underline',
                }}
              >
                <ExternalLink size={10} /> Get directions
              </a>
            )}
          </div>
        )}

        {/* Phone */}
        {r.phone && (
          <div
            style={{
              borderTop: `1px solid ${divider}`,
              paddingTop: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <SectionLabel>Phone</SectionLabel>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.8rem',
                color: detailText,
                margin: 0,
              }}
            >
              {r.phone}
            </p>
          </div>
        )}

        {/* ── Source information ─────────────────────────────────────────── */}
        <div
          style={{
            borderTop: `1px solid ${divider}`,
            paddingTop: '0.9rem',
          }}
        >
          <SectionLabel>Source information</SectionLabel>

          {/* Primary dataset */}
          <div style={{ marginBottom: '0.55rem' }}>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: mutedText,
                margin: '0 0 0.2rem',
              }}
            >
              Primary dataset
            </p>
            <a
              href={r.website ?? r.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                color: mutedText,
                textDecoration: 'underline',
              }}
            >
              <ExternalLink size={9} /> {r.sourceName}
            </a>
          </div>

          {/* Dataset type */}
          <div style={{ marginBottom: '0.55rem' }}>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: mutedText,
                margin: '0 0 0.2rem',
              }}
            >
              Dataset type
            </p>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                color: detailText,
                margin: 0,
              }}
            >
              {sourceTypeLabel}
            </p>
          </div>

          {/* Last checked / Added */}
          {timestamp && (
            <div style={{ marginBottom: '0.55rem' }}>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: mutedText,
                  margin: '0 0 0.2rem',
                }}
              >
                {timestampLabel}
              </p>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.72rem',
                  color: detailText,
                  margin: 0,
                }}
              >
                {timestamp}
              </p>
            </div>
          )}

          {/* Live data status */}
          <div style={{ marginBottom: '0.9rem' }}>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: mutedText,
                margin: '0 0 0.2rem',
              }}
            >
              Data status
            </p>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                color: detailText,
                margin: 0,
              }}
            >
              {r.isLive
                ? 'Live / source-backed where available'
                : 'Cached or static dataset'}
            </p>
          </div>

          {/* Contributing sources — only shown when the record was found in
              more than one dataset (i.e. reconciliation merged it). */}
          {multiSource && (
            <div
              style={{
                borderTop: `1px solid ${divider}`,
                paddingTop: '0.75rem',
                marginBottom: '0.9rem',
              }}
            >
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: mutedText,
                  margin: '0 0 0.35rem',
                }}
              >
                Found in {r.contributingSources!.length} datasets
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.18rem',
                }}
              >
                {r.contributingSources!.map((name) => (
                  <li
                    key={name}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.7rem',
                      color: detailText,
                      paddingLeft: '0.7rem',
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: mutedText,
                      }}
                    >
                      ·
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Field-level provenance — only shown when the record went through
              reconciliation and provenance data is available for user-facing
              fields. */}
          <div
            style={{
              borderTop: `1px solid ${divider}`,
              paddingTop: '0.75rem',
            }}
          >
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: mutedText,
                margin: '0 0 0.35rem',
              }}
            >
              Field-level attribution
            </p>
            {hasFieldProvenance ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                {provenanceRows.map((row) => (
                  <ProvenanceRow
                    key={row.label}
                    label={row.label}
                    sourceName={row.sourceName}
                  />
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.7rem',
                  color: mutedText,
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Field-level source attribution is not available for this
                listing.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
