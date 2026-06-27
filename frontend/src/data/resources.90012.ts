/**
 * Source-verified pilot resources for ZIP 90012 (Civic Center / Little Tokyo / Chinatown, LA).
 * All coordinates sourced from OpenStreetMap Nominatim geocoding or Apple Maps.
 * All addresses, phones, and hours sourced from each organization's official website.
 * Do not claim live availability — call before visiting.
 */
import type { ProductionResource } from './resources.types';

export const RESOURCES_90012: ProductionResource[] = [
  {
    id: 'csc-la-001',
    name: 'Chinatown Service Center',
    type: 'Health & Social Services',
    category: 'health',
    address: '767 N Hill St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    phone: '(213) 808-1700',
    hours: 'Mon–Fri 8AM–7PM · Sat 8AM–5PM',
    latitude: 34.0626225,
    longitude: -118.2399432,
    sourceUrl: 'https://www.cscla.org/locations',
    verifiedAt: '2026-05-17',
    notes:
      'FQHC — medical, dental, behavioral health, social services. Multilingual (English, Cantonese, Mandarin, Spanish, Vietnamese).',
  },
  {
    id: 'lapl-little-tokyo-001',
    name: 'Little Tokyo Branch Library',
    type: 'Public Library',
    category: 'library',
    address: '203 S Los Angeles St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    phone: '(213) 612-0525',
    hours: 'Mon & Wed 10AM–8PM · Tue & Thu 12PM–8PM · Fri–Sat 9:30AM–5:30PM',
    latitude: 34.050071,
    longitude: -118.2438831,
    sourceUrl: 'https://www.lapl.org/branches/little-tokyo',
    verifiedAt: '2026-05-17',
  },
  {
    id: 'ltsc-001',
    name: 'Little Tokyo Service Center',
    type: 'Social Services & Community Support',
    category: 'social_services',
    address: '231 E 3rd St, Suite G-106',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90013',
    phone: '(213) 473-3030',
    hours: 'Mon–Fri 9AM–12PM, 1PM–4PM',
    latitude: 34.0482236,
    longitude: -118.2438433,
    sourceUrl: 'https://www.ltsc.org/contact/',
    verifiedAt: '2026-05-17',
    notes:
      'Multilingual social services — care management, mental health, senior services, domestic violence support.',
  },
  {
    id: 'jwch-downtown-001',
    name: 'JWCH Center for Community Health',
    type: 'Community Health Clinic',
    category: 'health',
    address: '522 S San Pedro St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90013',
    phone: '(866) 733-5924',
    hours: 'Mon–Tue 7AM–8PM · Wed 8AM–8PM · Thu–Fri 7AM–6PM · Sat 8AM–5PM',
    latitude: 34.0436591,
    longitude: -118.2441353,
    sourceUrl: 'https://jwchinstitute.org/home/locations-no-dropdowns/',
    verifiedAt: '2026-05-17',
    notes:
      'FQHC — primary care, dental, HIV care, behavioral health. Sliding-scale fees.',
  },
  {
    id: 'dpss-civic-center-14',
    name: 'DPSS Civic Center District Office 14',
    type: 'Public Benefits (CalFresh, Medi-Cal, GR)',
    category: 'government',
    address: '813 E 4th Pl',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90013',
    phone: '(866) 613-3777',
    hours: 'Mon–Fri 8AM–5PM',
    latitude: 34.0443348,
    longitude: -118.2358086,
    sourceUrl: 'https://dpss.lacounty.gov/en/resources/offices.html',
    verifiedAt: '2026-05-17',
    notes:
      'In-person assistance with CalFresh, General Relief, Medi-Cal, and GROW.',
  },
];
