// src/data/incidents.ts
//
// Incident Mode — Phase 1, minimal safe version.
// Hand-edited registry of active emergencies surfaced on the Help page.
// Only official government, public-safety, and Cal OES sources are referenced.
// News outlets (LA Times, ABC7, AP, Reuters, etc.) are intentionally excluded.

export type IncidentStatus = 'active' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface IncidentSource {
  org: string;
  label: string;
  url: string;
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  title: string;
  shortDescription: string;
  jurisdiction: {
    city: string;
    county: string;
    state: string;
  };
  lastVerifiedAt: string; // ISO8601
  evacuationMapUrl: string; // official city/county evac or emergency page
  sources: IncidentSource[]; // official only
}

export const INCIDENTS: Incident[] = [
  {
    id: 'ca-oc-gardengrove-chem-2026-05-23',
    status: 'active',
    severity: 'emergency',
    title: 'Garden Grove Chemical Tank Incident',
    shortDescription:
      'State of Emergency proclaimed in Orange County in response to an ongoing chemical incident in Garden Grove. Refer to official sources for evacuation areas and shelter locations.',
    jurisdiction: {
      city: 'Garden Grove',
      county: 'Orange',
      state: 'CA',
    },
    lastVerifiedAt: '2026-05-24T00:00:00Z',
    evacuationMapUrl: 'https://ggcity.org/emergency',
    sources: [
      {
        org: 'Office of the Governor of California',
        label: 'State of Emergency Proclamation (May 23, 2026)',
        url: 'https://www.gov.ca.gov/2026/05/23/governor-newsom-proclaims-state-of-emergency-in-orange-county-in-response-to-ongoing-chemical-incident-in-garden-grove-makes-additional-shelter-sites-available/',
      },
      {
        org: 'City of Garden Grove',
        label: 'City Emergency Information',
        url: 'https://ggcity.org/emergency',
      },
      {
        org: 'Orange County Sheriff’s Department',
        label: 'OCSD Alerts & Advisories',
        url: 'https://www.ocsheriff.gov/',
      },
      {
        org: 'Orange County Fire Authority',
        label: 'OCFA News & Incident Updates',
        url: 'https://www.ocfa.org/',
      },
      {
        org: 'California Governor’s Office of Emergency Services',
        label: 'Cal OES News',
        url: 'https://news.caloes.ca.gov/',
      },
    ],
  },
];

export function getActiveIncidents(): Incident[] {
  return INCIDENTS.filter((i) => i.status === 'active');
}
