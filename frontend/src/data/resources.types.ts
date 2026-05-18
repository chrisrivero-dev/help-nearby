export interface ProductionResource {
  id: string;
  name: string;
  type: string;
  category: 'health' | 'social_services' | 'library' | 'government';
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  hours: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  verifiedAt: string; // ISO date, e.g. "2026-05-17"
  notes?: string;
}
