export interface NormalizedLocation {
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

/**
 * Result returned when searching a category (e.g., shelter, food) for a ZIP code.
 * Extends NormalizedLocation with a human‑readable display name taken from
 * Nominatim’s `display_name` field.
 */
export interface CategoryResult extends NormalizedLocation {
  /** Full display name of the place (e.g., “Food Bank, Main St, Boston, MA, USA”) */
  displayName: string;
}
