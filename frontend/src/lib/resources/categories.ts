/**
 * Single source of truth for resource-category presentation metadata.
 *
 * The `ResourceCategory` union in schema.ts is the type-level source of truth;
 * this module supplies the display labels, map-marker colors, and the curated
 * embed subset that the UI layers share. Because the maps are typed as
 * `Record<ResourceCategory, …>`, adding a category to the schema enum without a
 * label/color here is a compile error — so a category can never be half-added.
 *
 * Adding/expanding a category is now a 1-file edit (schema enum + this module);
 * the embed surface opts in explicitly via EMBED_CATEGORIES.
 */
import type { ResourceCategory } from './schema';

/** Canonical labels in canonical display order (drives filter ordering). */
export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  health: 'Health',
  social_services: 'Social Services',
  library: 'Library',
  government: 'Government',
  cooling: 'Cooling',
  warming: 'Warming',
  shelter: 'Shelter',
  food: 'Food',
  recreation: 'Recreation',
  other: 'Other',
};

/** Map-marker colors, one per category. */
export const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  health: '#ef4444',
  social_services: '#C9A227',
  library: '#8b5cf6',
  government: '#64748b',
  cooling: '#06b6d4',
  warming: '#e11d48',
  shelter: '#0ea5e9',
  food: '#22c55e',
  recreation: '#84cc16',
  other: '#f97316',
};

/**
 * Curated, audience-facing subset offered by the embeddable widget. Only
 * categories with broad live coverage are listed so an embed never advertises
 * an empty filter; labels may differ from CATEGORY_LABELS (e.g. recreation →
 * "Parks & Community").
 */
export const EMBED_CATEGORIES: { id: ResourceCategory; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'warming', label: 'Warming' },
  { id: 'recreation', label: 'Parks & Community' },
];
