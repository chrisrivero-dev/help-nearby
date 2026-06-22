import type { BaseSourceRow } from '@/lib/registry/core';
import type { CommunityOpportunity } from '../types';

export type CommunitySourceType =
  | 'manual'
  | 'html-calendar'
  | 'json-feed'
  | 'rss-atom';

export type CommunityOpportunityType = CommunityOpportunity['type'];

export interface CommunitySourceItem {
  externalId?: string;
  title: string;
  type?: CommunityOpportunityType | string;
  /** Source-native category, shown as the tag (e.g. NYC "Street and Neighborhood"). */
  category?: string;
  /** Human date label as published by the source (e.g. NYC "Jun 21"). */
  dateLabel?: string;
  /** Human time label as published by the source (e.g. NYC "5:30am to 7:30pm"). */
  timeLabel?: string;
  /** Event website (distinct from the source/permalink page). */
  website?: string;
  organizationName?: string;
  description?: string;
  venueName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startAt?: string;
  endAt?: string;
  sourceUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface ManualAdapterConfig {
  kind: 'manual';
  items: CommunitySourceItem[];
}

export interface HtmlCalendarAdapterConfig {
  kind: 'html-calendar';
  url: string;
  defaultType?: CommunityOpportunityType;
  organizationName?: string;
}

export interface JsonFeedAdapterConfig {
  kind: 'json-feed';
  url: string;
  arrayPath?: string;
  fieldMap?: Partial<Record<keyof CommunitySourceItem, string>>;
  /**
   * Request headers. Values may reference an env var with `${VAR_NAME}`; the
   * token is substituted from `process.env` at fetch time, and the header is
   * dropped entirely when the referenced var is unset (so a key-gated source
   * degrades to skipped rather than sending a bare/invalid request).
   */
  headers?: Record<string, string>;
  /**
   * Query params appended to `url`. Values support date tokens `{today}` and
   * `{today+Nd}` / `{today-Nd}` (expanded to ISO `YYYY-MM-DD`) so a feed can
   * pull a rolling date window without a static URL.
   */
  query?: Record<string, string>;
  defaultType?: CommunityOpportunityType;
  organizationName?: string;
}

export interface RssAtomAdapterConfig {
  kind: 'rss-atom';
  url: string;
  defaultType?: CommunityOpportunityType;
  organizationName?: string;
}

export type CommunityAdapterConfig =
  | ManualAdapterConfig
  | HtmlCalendarAdapterConfig
  | JsonFeedAdapterConfig
  | RssAtomAdapterConfig;

export interface CommunitySourceRow extends BaseSourceRow {
  sourceType: CommunitySourceType;
  autoApprove?: boolean;
  requiresLocation?: boolean;
  adapter: CommunityAdapterConfig;
}

export interface SelectedCommunitySource {
  id: string;
  name: string;
  url: string;
  sourceType: CommunitySourceType;
  trust: number;
  ttlSeconds?: number;
  autoApprove: boolean;
  requiresLocation: boolean;
  fetch: () => Promise<CommunitySourceItem[]>;
}
