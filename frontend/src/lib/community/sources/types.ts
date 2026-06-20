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
