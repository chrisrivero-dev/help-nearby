import type {
  NearbyQuery,
  NearbyResource,
  ResourceCategory,
  SourceType,
} from './schema';
import { queryArcgisLayer } from './adapters/arcgis';

/**
 * Coverage bounding box in WGS84. A query point must fall inside the bbox
 * for the adapter to run. This is a cheap first cut; replace with polygon
 * coverage when we need finer borders.
 */
export interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface RegisteredSource {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  category: ResourceCategory;
  /** 'global' or a bbox in WGS84. */
  coverage: BBox | 'global';
  /** Free-form refresh expectation (informational, not enforced). */
  refresh: string;
  notes?: string;
  /** Returns normalized resources or throws on failure. */
  fetch: (q: NearbyQuery) => Promise<NearbyResource[]>;
}

const LA_CITY_BBOX: BBox = {
  minLat: 33.7,
  maxLat: 34.34,
  minLng: -118.67,
  maxLng: -118.15,
};
const LA_COUNTY_BBOX: BBox = {
  minLat: 32.79,
  maxLat: 34.82,
  minLng: -118.95,
  maxLng: -117.65,
};
const CA_BBOX: BBox = {
  minLat: 32.5,
  maxLat: 42.01,
  minLng: -124.5,
  maxLng: -114.13,
};
const CIVIC_CENTER_BBOX: BBox = {
  minLat: 34.03,
  maxLat: 34.07,
  minLng: -118.26,
  maxLng: -118.22,
};

function pointInBBox(lat: number, lng: number, b: BBox): boolean {
  return (
    lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng
  );
}

export function isCovered(
  source: RegisteredSource,
  lat: number,
  lng: number,
): boolean {
  return source.coverage === 'global' || pointInBBox(lat, lng, source.coverage);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Live sources                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

const laCountyCoolingCenters: RegisteredSource = {
  id: 'la-county-cooling-centers',
  name: 'LA County Office of Emergency Management',
  url: 'https://ready.lacounty.gov/heat/',
  sourceType: 'arcgis-rest',
  category: 'cooling',
  coverage: LA_COUNTY_BBOX,
  refresh:
    'event-driven — populated by LA County EOC during active heat events',
  notes:
    'Authoritative LA County cooling-center feed published by the County EOC. Returns 0 features outside an active heat event by design; do NOT synthesize rows when empty.',
  fetch: (q) =>
    queryArcgisLayer(
      {
        layerUrl:
          'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Public_Emergency_Map_Cooling_Center_View/FeatureServer/0/query',
        fieldMap: {
          name: 'LocatName',
          address: 'FullAddress',
          website: 'URL',
          updatedAt: 'last_edited_date',
        },
        source: {
          id: 'la-county-cooling-centers',
          name: 'LA County Office of Emergency Management',
          url: 'https://ready.lacounty.gov/heat/',
          sourceType: 'arcgis-rest',
          category: 'cooling',
        },
      },
      q,
    ),
};

const caloesFoodBanks: RegisteredSource = {
  id: 'caloes-food-banks',
  name: 'California Office of Emergency Services',
  url: 'https://www.caloes.ca.gov/',
  sourceType: 'arcgis-rest',
  category: 'food',
  coverage: CA_BBOX,
  refresh: 'infrequent (dataset published Jan 2019)',
  notes:
    'Regional food banks statewide. Lists umbrella organizations rather than every individual distribution pantry; coarse but authoritative coverage.',
  fetch: (q) =>
    queryArcgisLayer(
      {
        layerUrl:
          'https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Food_Banks/FeatureServer/0/query',
        fieldMap: {
          name: 'Name',
          address: 'Address',
          phone: 'Phone',
          website: 'Webpage',
        },
        source: {
          id: 'caloes-food-banks',
          name: 'California Office of Emergency Services',
          url: 'https://www.caloes.ca.gov/',
          sourceType: 'arcgis-rest',
          category: 'food',
        },
      },
      q,
    ),
};

const hrsaHealthCenters: RegisteredSource = {
  id: 'hrsa-health-center-sites',
  name: 'HRSA Health Care Service Delivery Sites',
  url: 'https://data.hrsa.gov/topics/health-centers',
  sourceType: 'arcgis-rest',
  category: 'health',
  coverage: 'global',
  refresh:
    'updated by HRSA on an ongoing basis as grantees report site changes',
  notes:
    'Federally funded community health centers (FQHCs, look-alikes, migrant, homeless, public-housing, school-based). Safety-net primary care nationwide; uses server-side spatial filter so a national dataset returns only nearby rows.',
  fetch: (q) =>
    queryArcgisLayer(
      {
        layerUrl:
          'https://gisportal.hrsa.gov/server/rest/services/HealthCareFacilities/PrimaryHealthCareFacilities_FS/MapServer/0/query',
        fieldMap: {
          name: 'SITE_NM',
          address: 'SITE_ADDRESS',
          phone: 'SITE_PHONE_NUM',
          website: 'SITE_URL',
        },
        useSpatialQuery: true,
        where: "HCC_STATUS_DESC='Active'",
        source: {
          id: 'hrsa-health-center-sites',
          name: 'HRSA Health Care Service Delivery Sites',
          url: 'https://data.hrsa.gov/topics/health-centers',
          sourceType: 'arcgis-rest',
          category: 'health',
        },
      },
      q,
    ),
};

const laRecParksFacilities: RegisteredSource = {
  id: 'la-city-rec-parks-facilities',
  name: 'City of Los Angeles Department of Recreation and Parks',
  url: 'https://www.laparks.org/',
  sourceType: 'arcgis-rest',
  category: 'recreation',
  coverage: LA_CITY_BBOX,
  refresh: 'updated by LA City as facilities change',
  notes:
    'Recreation centers, pools, senior centers and community facilities. Many of these double as cooling/warming centers in extreme weather.',
  fetch: (q) =>
    queryArcgisLayer(
      {
        layerUrl:
          'https://maps.lacity.org/lahub/rest/services/Recreation_and_Parks_Department/MapServer/4/query',
        fieldMap: {
          name: 'LocationName',
          address: 'Address',
          phone: 'Phone',
          website: 'Website',
          latitude: 'GeoLat',
          longitude: 'GeoLong',
        },
        source: {
          id: 'la-city-rec-parks-facilities',
          name: 'City of Los Angeles Department of Recreation and Parks',
          url: 'https://www.laparks.org/',
          sourceType: 'arcgis-rest',
          category: 'recreation',
        },
      },
      q,
    ),
};

/* ──────────────────────────────────────────────────────────────────────── */

export const LIVE_SOURCES: RegisteredSource[] = [
  laCountyCoolingCenters,
  caloesFoodBanks,
  laRecParksFacilities,
  hrsaHealthCenters,
];

export function liveSourcesFor(
  lat: number,
  lng: number,
  category?: ResourceCategory,
): RegisteredSource[] {
  return LIVE_SOURCES.filter(
    (s) => isCovered(s, lat, lng) && (!category || s.category === category),
  );
}
