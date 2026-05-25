export type IncidentSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export type IncidentStatus = 'active' | 'monitoring' | 'resolved';

export type IncidentCategory =
  | 'hazmat'
  | 'fire'
  | 'weather'
  | 'evacuation'
  | 'shelter-in-place'
  | 'other';

export type IncidentSourceKind = 'api' | 'manual-source-backed';

export interface IncidentSource {
  name: string;
  url: string;
  kind: IncidentSourceKind;
  fetchedAt: string;
}

export interface IncidentItem {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: IncidentCategory;
  area: string;
  geometry: unknown | null;
  effective: string | null;
  expires: string | null;
  instructions: string;
  source: IncidentSource;
}

export interface CheckedSource {
  name: string;
  ok: boolean;
  kind: 'api' | 'manual';
}

export interface IncidentApiResponse {
  incidents: IncidentItem[];
  checkedSources: CheckedSource[];
  generatedAt: string;
  message?: string;
  error?: string;
}

export interface ManualIncidentEntry {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: IncidentCategory;
  area: string;
  lat: number;
  lng: number;
  radiusKm: number;
  effective: string | null;
  expires: string | null;
  instructions: string;
  source: {
    name: string;
    url: string;
    verifiedAt: string;
  };
}
