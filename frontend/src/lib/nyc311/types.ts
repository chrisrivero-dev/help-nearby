/**
 * NYC 311 vertical — its own item shape, kept separate from the community
 * opportunity model even though it reuses the generic registry core
 * (`selectByJurisdiction`/`fanOut`), the reliability layer, and the shared
 * `json-feed` adapter. One NYC-only source row lives in
 * `src/data/nyc311.sources.json` (jurisdiction `place:3651000`).
 */
export interface NYC311Item {
  id: string;
  /** Headline — e.g. the 311 complaint type ("Noise - Residential"). */
  title: string;
  /** Source-native tag shown as a chip — e.g. the request status. */
  category?: string;
  description?: string;
  /** Responsible agency / publisher. */
  organizationName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  /** ISO timestamp the record was reported/created upstream. */
  reportedAt?: string;
  website?: string;
  sourceUrl?: string;
  sourceId?: string;
  sourceName?: string;
  externalId?: string;
}
