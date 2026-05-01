# Interactive Map Architecture — Coding Agent Directive

> **Stack:** react-leaflet v4+ · Next.js 14+ (App Router) · TypeScript 5+ · Leaflet 1.9+
> **Version:** 1.0 · March 2026

---

## Table of Contents

1. [Core Agent Directives](#1-core-agent-directives)
2. [Project Architecture & Folder Structure](#2-project-architecture--folder-structure)
3. [API Route Patterns](#3-api-route-patterns)
4. [Data Normalization](#4-data-normalization)
5. [Smooth Map Movement](#5-smooth-map-movement)
6. [Error Handling & Visualization](#6-error-handling--visualization)
7. [GIS Data Integration](#7-gis-data-integration)
8. [Tile Provider Configuration](#8-tile-provider-configuration)
9. [Map State Context](#9-map-state-context)
10. [Full Component Assembly](#10-full-component-assembly)
11. [Agent Rules Summary](#11-agent-rules-summary)

---

## 1. Core Agent Directives

These rules are **non-negotiable constraints** for any coding agent operating on Leaflet/OSM codebases in a Next.js + TypeScript environment.

### 1.1 Leaflet + SSR: The Fundamental Constraint

Leaflet accesses `window` and `document` globals at import time. In Next.js (or any SSR framework), these do not exist on the server. Every Leaflet import must be guarded.

**Rule: Never import leaflet at module top-level in a server-rendered file.**

```ts
// map-helpers.ts

// WRONG — breaks SSR
import L from "leaflet";

// CORRECT — dynamic, client-only
export async function getLeaflet() {
  const L = (await import("leaflet")).default;
  return L;
}
```

**Rule: Use `next/dynamic` with `ssr: false` for map wrapper components.**

```tsx
// components/map/DynamicMap.tsx
import dynamic from "next/dynamic";

export const DynamicMap = dynamic(
  () => import("./MapCore"),
  { ssr: false, loading: () => <MapSkeleton /> }
);
```

### 1.2 react-leaflet v4+ API — `useMap()` replaces `whenCreated`

`whenCreated` was removed in react-leaflet v4. The **only** way to access the `L.Map` instance is via the `useMap()` hook from a child component of `<MapContainer>`.

```tsx
// components/map/MapController.tsx
"use client";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

interface Props {
  center?: [number, number];
  zoom?: number;
  onReady?: (map: L.Map) => void;
}

export function MapController({ center, zoom, onReady }: Props) {
  const map = useMap();

  useEffect(() => { onReady?.(map); }, [map, onReady]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom ?? map.getZoom(), {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [map, center, zoom]);

  return null;
}
```

> **WARNING:** Never store the `L.Map` instance in React state. Use a ref (`useRef<L.Map | null>`) or pass it through context. Storing a mutable Leaflet object in state causes infinite re-renders.

### 1.3 TypeScript Strictness

All map-related code must pass strict TypeScript compilation. Key type sources:

```bash
npm install -D @types/leaflet
# Types: L.Map, L.LatLng, L.LatLngExpression, L.FlyToOptions,
#        L.TileLayerOptions, L.MarkerOptions, L.GeoJSON, etc.
```

Define project-specific GIS types in a central declarations file:

```ts
// types/geo.ts

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface NormalizedAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;       // 2-letter uppercase USPS code
  zip5: string;         // Always 5 digits, zero-padded
  zip4?: string;        // Optional +4 extension
  county?: string;
  fips?: string;        // 5-digit FIPS code
  coords?: GeoPoint;
}

export interface ZipLookupResult {
  zip5: string;
  city: string;
  state: string;
  coords: GeoPoint;
  county?: string;
  timezone?: string;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bounds?: L.LatLngBoundsExpression;
}
```

### 1.4 Error Handling Contract

Every geocoding or network call must implement this pattern:

| Layer      | Responsibility                  | Implementation                            |
|------------|---------------------------------|-------------------------------------------|
| Validation | Reject bad input before network | Regex + type guards at API boundary       |
| Network    | Timeout, retry, abort           | `AbortController` + exponential backoff   |
| Parse      | Validate response shape         | Zod schema or manual type guard           |
| UI         | Non-blocking user feedback      | Toast or inline message, never `alert()`  |

```ts
// lib/map/errors.ts

export type GeoErrorCode =
  | "INVALID_ZIP"
  | "NOT_FOUND"
  | "NETWORK"
  | "PARSE"
  | "TIMEOUT";

export class GeoError extends Error {
  constructor(public code: GeoErrorCode, message: string) {
    super(message);
    this.name = "GeoError";
  }
}
```

```ts
// lib/map/geocode.ts
import { z } from "zod";
import { GeoError } from "./errors";
import { normalizeZip } from "./normalize";
import type { ZipLookupResult } from "@/types/geo";

const ZipResultSchema = z.object({
  places: z.array(z.object({
    latitude: z.string().transform(Number),
    longitude: z.string().transform(Number),
    "place name": z.string(),
    state: z.string(),
    "state abbreviation": z.string(),
  })).min(1),
});

export async function lookupZip(
  zip: string,
  signal?: AbortSignal
): Promise<ZipLookupResult> {
  const clean = normalizeZip(zip);
  if (!clean) throw new GeoError("INVALID_ZIP", `Invalid ZIP: ${zip}`);

  const res = await fetch(
    `https://api.zippopotam.us/us/${clean}`,
    { signal, headers: { Accept: "application/json" } }
  );

  if (res.status === 404) throw new GeoError("NOT_FOUND", `ZIP ${clean} not found`);
  if (!res.ok) throw new GeoError("NETWORK", `HTTP ${res.status}`);

  const parsed = ZipResultSchema.safeParse(await res.json());
  if (!parsed.success) throw new GeoError("PARSE", "Unexpected response shape");

  const place = parsed.data.places[0];
  return {
    zip5: clean,
    city: place["place name"],
    state: place["state abbreviation"],
    coords: { lat: place.latitude, lng: place.longitude },
  };
}
```

---

## 2. Project Architecture & Folder Structure

All map logic is isolated under `lib/map/` and `components/map/` to prevent Leaflet SSR leakage.

```
src/
├── app/
│   ├── (map)/                     # Route group for map pages
│   │   ├── layout.tsx              # Map layout wrapper
│   │   ├── page.tsx                # Main map view
│   │   └── [slug]/page.tsx         # Detail view with map
│   └── api/
│       ├── geocode/
│       │   └── route.ts            # POST: forward geocode
│       ├── reverse-geocode/
│       │   └── route.ts            # POST: reverse geocode
│       ├── zip-lookup/
│       │   └── route.ts            # GET: zip → coords
│       └── tiles/
│           └── route.ts            # Proxy for custom tile sources
│
├── components/
│   ├── map/
│   │   ├── DynamicMap.tsx          # next/dynamic wrapper (ssr:false)
│   │   ├── MapCore.tsx             # <MapContainer> + layers
│   │   ├── MapController.tsx       # useMap() bridge for flyTo/zoom
│   │   ├── MapSkeleton.tsx         # Loading placeholder
│   │   ├── SearchOverlay.tsx       # ZIP/address search UI
│   │   ├── MarkerLayer.tsx         # Clustered markers
│   │   ├── GeoJSONLayer.tsx        # Boundary/polygon rendering
│   │   └── ErrorToast.tsx          # Map-specific error display
│   └── ui/
│       └── ...                     # Shared UI primitives
│
├── lib/
│   ├── map/
│   │   ├── map-context.tsx         # React context for map state
│   │   ├── geocode.ts              # Geocoding functions
│   │   ├── errors.ts               # GeoError class + codes
│   │   ├── normalize.ts            # ZIP, address, coord normalization
│   │   ├── tile-providers.ts       # Tile URL configs
│   │   ├── bounds.ts               # Bounds calculation utilities
│   │   ├── movement.ts             # safeMoveTo, animation helpers
│   │   └── constants.ts            # Default center, zoom, limits
│   └── gis/
│       ├── fips.ts                 # FIPS code lookups
│       ├── census.ts               # Census tract/block group utils
│       ├── parcel.ts               # Parcel boundary utilities
│       └── projections.ts          # CRS transformations (EPSG)
│
├── types/
│   ├── geo.ts                      # GeoPoint, NormalizedAddress, etc.
│   ├── map.ts                      # MapViewState, LayerConfig, etc.
│   └── gis.ts                      # Census, FIPS, parcel types
│
├── data/
│   ├── geojson/                    # Static boundary files
│   └── seeds/                      # ZIP/FIPS reference CSVs
│
└── public/
    └── markers/                    # Custom marker icons (SVG preferred)
```

> **NOTE:** All files under `components/map/` must have `"use client"` directives. All files under `lib/map/` should be pure functions with no React imports (except `map-context.tsx`). This separation ensures tree-shaking and testability.

---

## 3. API Route Patterns

All geocoding hits external services. Proxy through Next.js API routes to protect API keys, enforce rate limits, and normalize responses.

### 3.1 ZIP Lookup Route

```ts
// app/api/zip-lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { normalizeZip } from "@/lib/map/normalize";

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip");
  const clean = normalizeZip(zip ?? "");

  if (!clean) {
    return NextResponse.json(
      { error: "INVALID_ZIP", message: "Provide a 5-digit US ZIP code" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.zippopotam.us/us/${clean}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.status === 404) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: `ZIP ${clean} not found` },
        { status: 404 }
      );
    }
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) throw new Error("Empty response");

    return NextResponse.json({
      zip5: clean,
      city: place["place name"],
      state: place["state abbreviation"],
      coords: {
        lat: parseFloat(place.latitude),
        lng: parseFloat(place.longitude),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "TIMEOUT", message: "Geocoding service timeout" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "NETWORK", message: "Geocoding service unavailable" },
      { status: 502 }
    );
  }
}
```

### 3.2 Forward Geocode Route (Address → Coords)

Nominatim (OpenStreetMap) is the primary free geocoder. Respect the **1 req/sec** rate limit.

```ts
// app/api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string" || query.trim().length < 3) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: "Query too short" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    q: query.trim(),
    format: "jsonv2",
    limit: "5",
    addressdetails: "1",
    countrycodes: "us",
  });

  const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: {
      "User-Agent": "YourApp/1.0 (contact@yourdomain.com)",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "UPSTREAM", message: "Nominatim error" },
      { status: 502 }
    );
  }

  const results = await res.json();
  return NextResponse.json(
    results.map((r: any) => ({
      display: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: r.type,
      address: r.address,
    }))
  );
}
```

> **WARNING:** Nominatim usage policy requires a descriptive `User-Agent` header and max 1 request/second. Violating this will get your IP banned. For > 1 req/sec, self-host Nominatim or use Photon (Komoot).

---

## 4. Data Normalization

### 4.1 ZIP Code Normalization

US ZIP codes are **5-digit strings, not numbers**. Leading zeros are significant (e.g., `01001` = Agawam, MA).

```ts
// lib/map/normalize.ts

/** Strip non-digits, enforce 5-char length, zero-pad left. */
export function normalizeZip(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  // Handle ZIP+4 format (e.g., "30301-1234")
  const zip5 = digits.slice(0, 5);

  if (zip5.length !== 5) return null;

  // Basic range validation: 00501–99950
  const num = parseInt(zip5, 10);
  if (num < 501 || num > 99950) return null;

  return zip5;
}

/** Extract ZIP+4 if present */
export function parseZipPlus4(input: string): {
  zip5: string; zip4?: string
} | null {
  const match = input.match(/^(\d{5})(?:-(\d{4}))?$/);
  if (!match) return null;
  return { zip5: match[1], zip4: match[2] };
}
```

### 4.2 Address Normalization

Addresses should be normalized to **USPS Publication 28** format before geocoding or storage.

| Rule                              | Raw Input              | Normalized      |
|-----------------------------------|------------------------|-----------------|
| Uppercase all text                | `123 Main St`          | `123 MAIN ST`   |
| USPS suffix abbreviation          | `Avenue, Street, Blvd` | `AVE, ST, BLVD` |
| Directional abbreviation          | `North, Southwest`     | `N, SW`          |
| Unit designator                   | `Apartment 4B`         | `APT 4B`         |
| State to 2-letter code            | `Georgia`              | `GA`             |
| Strip trailing whitespace/punct   | `123 Main St. ,`       | `123 MAIN ST`    |
| ZIP always 5 or 5+4              | `3030`                 | INVALID → reject |

> **NOTE:** For production address normalization, use the USPS Address API (free, requires registration) or SmartyStreets. Hand-rolled regex normalization will never cover all USPS edge cases (rural routes, military APO/FPO, PO boxes, etc.).

### 4.3 Coordinate Normalization

```ts
/** Clamp and round coordinates to 6 decimal places (~11cm precision). */
export function normalizeCoords(
  lat: number,
  lng: number
): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [
    Math.round(lat * 1e6) / 1e6,
    Math.round(lng * 1e6) / 1e6,
  ];
}
```

**Precision reference:**

| Decimal Places | Precision | Use Case               |
|----------------|-----------|------------------------|
| 0              | ~111 km   | Country-level          |
| 1              | ~11 km    | City-level             |
| 2              | ~1.1 km   | Neighborhood           |
| 3              | ~110 m    | Street block           |
| 4              | ~11 m     | Building-level         |
| 5              | ~1.1 m    | Parcel boundary        |
| 6              | ~11 cm    | Survey-grade / default |

---

## 5. Smooth Map Movement

Leaflet provides three motion primitives. The choice depends on distance and desired UX.

| Method                     | Behavior                                    | When to Use                              |
|----------------------------|---------------------------------------------|------------------------------------------|
| `setView(latlng, zoom)`    | Instant jump, no animation                  | Initial load, programmatic reset         |
| `panTo(latlng, opts)`      | Smooth CSS translation at current zoom      | Short moves (<2 zoom levels, nearby)     |
| `flyTo(latlng, zoom, opts)`| Animated zoom-out + pan + zoom-in arc       | Long jumps, ZIP/address search results   |

### 5.1 flyTo Best Practices

```ts
// Optimal flyTo parameters for different scenarios

// ZIP code search result (cross-city/state jump)
map.flyTo([lat, lng], 13, {
  duration: 1.5,          // seconds
  easeLinearity: 0.25,    // lower = more curve, higher = more linear
});

// Marker click (nearby, already on screen)
map.flyTo([lat, lng], 16, {
  duration: 0.8,
  easeLinearity: 0.5,
});

// Fit to a set of markers (use flyToBounds instead)
const bounds = L.latLngBounds(points);
map.flyToBounds(bounds, {
  padding: [50, 50],
  maxZoom: 15,
  duration: 1.5,
});
```

### 5.2 Movement Queue Pattern

Calling `flyTo` while a previous animation is in progress causes jank. Cancel the current animation before starting a new one.

```ts
// lib/map/movement.ts

export function safeMoveTo(
  map: L.Map,
  target: [number, number],
  zoom: number,
  opts?: L.FlyToOptions
) {
  // Stop any in-progress animation
  map.stop();

  // Small moves: pan. Large moves: fly.
  const current = map.getCenter();
  const distance = current.distanceTo(L.latLng(target));

  if (distance < 5000) {
    // Under 5km: smooth pan at current or target zoom
    map.panTo(target, { animate: true, duration: 0.5, ...opts });
    if (zoom !== map.getZoom()) {
      map.setZoom(zoom, { animate: true });
    }
  } else {
    map.flyTo(target, zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
      ...opts,
    });
  }
}
```

> **WARNING:** Always call `map.stop()` before initiating a new `flyTo`/`panTo`. Without this, overlapping animations produce jarring intermediate frames.

---

## 6. Error Handling & Visualization

### 6.1 Error Classification

| Category      | Examples                                      | UI Pattern                                        |
|---------------|-----------------------------------------------|---------------------------------------------------|
| Input Error   | Bad ZIP, invalid address, malformed coords    | Inline field validation (red border + message)    |
| Network Error | Timeout, 502, geocoder down, tile 404         | Toast notification with retry action              |
| Render Error  | WebGL context lost, tile load failure         | Overlay with map skeleton fallback                |

### 6.2 Toast Integration Pattern

```tsx
// components/map/ErrorToast.tsx
"use client";
import { useMapErrors } from "@/lib/map/map-context";

export function ErrorToast() {
  const { error, clearError } = useMapErrors();
  if (!error) return null;

  const messages: Record<string, string> = {
    INVALID_ZIP: "Enter a valid 5-digit ZIP code.",
    NOT_FOUND: "That ZIP code was not found.",
    NETWORK: "Map service is temporarily unavailable.",
    TIMEOUT: "Request timed out. Check your connection.",
    PARSE: "Received unexpected data from the server.",
  };

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2
                 bg-red-50 border border-red-200 rounded-lg
                 px-4 py-3 shadow-lg z-[1000] max-w-sm"
    >
      <p className="text-sm text-red-800">
        {messages[error.code] ?? error.message}
      </p>
      <button
        onClick={clearError}
        className="text-xs text-red-600 underline mt-1"
      >
        Dismiss
      </button>
    </div>
  );
}
```

### 6.3 Tile Error Recovery

```tsx
// components/map/ResilientTileLayer.tsx
"use client";
import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";

const PRIMARY_TILES =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const FALLBACK_TILES =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function ResilientTileLayer() {
  const map = useMap();
  const [tileUrl, setTileUrl] = useState(PRIMARY_TILES);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const handleTileError = () => {
      setErrorCount((prev) => {
        if (prev + 1 >= 5 && tileUrl === PRIMARY_TILES) {
          setTileUrl(FALLBACK_TILES);
          return 0;
        }
        return prev + 1;
      });
    };

    map.on("tileerror", handleTileError);
    return () => { map.off("tileerror", handleTileError); };
  }, [map, tileUrl]);

  return <TileLayer url={tileUrl} maxZoom={19} />;
}
```

---

## 7. GIS Data Integration

Foundations for incorporating deep GIS information: census data, parcel boundaries, FIPS codes, and authoritative federal/state datasets.

### 7.1 Open Data Provider Stack

| Provider                  | Data Type                                    | Format              | Access                        |
|---------------------------|----------------------------------------------|---------------------|-------------------------------|
| OpenStreetMap / Nominatim | Geocoding, reverse geocoding, POI            | JSON                | Free (1 req/sec public)       |
| US Census TIGERweb        | Tract, block group, county, ZCTA boundaries  | GeoJSON / Shapefile | Free REST API                 |
| US Census Geocoder        | Address geocoding with FIPS, tract, block     | JSON                | Free (batch + single)         |
| CARTO / CartoDB           | High-quality vector basemap tiles             | Raster PNG / MVT    | Free tier (75k/mo)            |
| Overture Maps             | Building footprints, POI, transportation      | GeoParquet          | Free (AWS/Azure open data)    |
| USGS National Map         | Elevation, hydrology, land cover              | GeoTIFF / WMS       | Free                          |
| OpenTopography            | LiDAR point clouds, DEM                       | LAS / GeoTIFF       | Free (registration)           |
| Regrid / Loveland         | Parcel boundaries (nationwide)                | GeoJSON / API       | Paid (limited free tier)      |
| County GIS portals        | Parcel, zoning, floodplain, plat maps         | Shapefile / GeoJSON | Free (varies by county)       |

### 7.2 Census TIGERweb Integration

The TIGERweb REST API provides authoritative boundaries for every census geography. Essential for any real estate, demographic, or policy application.

```ts
// lib/gis/census.ts
import type { GeoPoint } from "@/types/geo";

const TIGER_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services";

export interface CensusTract {
  geoid: string;      // 11-digit: state(2) + county(3) + tract(6)
  name: string;
  state: string;
  county: string;
  geometry: GeoJSON.MultiPolygon;
}

/** Fetch census tract boundary containing a point. */
export async function getTractByPoint(
  lat: number,
  lng: number
): Promise<CensusTract | null> {
  const url = new URL(
    `${TIGER_BASE}/TIGERweb/tigerWMS_Census2020/MapServer/8/query`
  );
  url.searchParams.set("geometry", `${lng},${lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "GEOID,NAME,STATE,COUNTY");
  url.searchParams.set("f", "geojson");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature) return null;

  return {
    geoid: feature.properties.GEOID,
    name: feature.properties.NAME,
    state: feature.properties.STATE,
    county: feature.properties.COUNTY,
    geometry: feature.geometry,
  };
}
```

### 7.3 FIPS Code Reference

FIPS codes are the **universal join key** across federal datasets. Store them as strings (leading zeros).

| FIPS Level  | Digits | Example          | Description              |
|-------------|--------|------------------|--------------------------|
| State       | 2      | `13`             | Georgia                  |
| County      | 5      | `13021`          | Bibb County, GA          |
| Tract       | 11     | `13021000100`    | Tract 1 in Bibb Co.     |
| Block Group | 12     | `130210001001`   | Block Group 1            |
| Block       | 15     | `130210001001000`| Full census block        |

### 7.4 GeoJSON Rendering on Leaflet

```tsx
// components/map/GeoJSONLayer.tsx
"use client";
import { GeoJSON } from "react-leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import type { Layer, PathOptions } from "leaflet";

interface Props {
  data: GeoJsonObject;
  style?: PathOptions | ((feature?: Feature) => PathOptions);
  onFeatureClick?: (feature: Feature) => void;
}

export function GeoJSONLayer({ data, style, onFeatureClick }: Props) {
  const defaultStyle: PathOptions = {
    color: "#2E75B6",
    weight: 2,
    opacity: 0.7,
    fillOpacity: 0.15,
  };

  return (
    <GeoJSON
      data={data}
      style={style ?? defaultStyle}
      onEachFeature={(feature, layer) => {
        if (onFeatureClick) {
          layer.on("click", () => onFeatureClick(feature));
        }
      }}
    />
  );
}
```

### 7.5 Coordinate Reference Systems

Leaflet uses EPSG:3857 (Web Mercator) for display and EPSG:4326 (WGS84) for lat/lng values. All GIS data must be transformed to **EPSG:4326** before passing to Leaflet.

| CRS           | EPSG  | Units             | Usage                                    |
|---------------|-------|-------------------|------------------------------------------|
| WGS84         | 4326  | Degrees (lat/lng) | GPS, Leaflet coords, GeoJSON default     |
| Web Mercator  | 3857  | Meters            | Tile rendering, Leaflet internal         |
| NAD83         | 4269  | Degrees           | US Census, TIGER, most federal data      |
| State Plane   | Varies| Feet or Meters    | County GIS, survey, parcel data          |

> **WARNING:** NAD83 (EPSG:4269) and WGS84 (EPSG:4326) are practically identical for mapping purposes (sub-meter difference). Most tools treat them interchangeably. **State Plane coordinates MUST be reprojected** — they will be wildly wrong if treated as lat/lng.

```ts
// For CRS transformation in the browser, use proj4js:
// npm install proj4
import proj4 from "proj4";

// Define Georgia West State Plane (NAD83, feet)
proj4.defs("EPSG:2240",
  "+proj=tmerc +lat_0=30 +lon_0=-84.16666666666667 ...");

// Transform State Plane → WGS84
const [lng, lat] = proj4("EPSG:2240", "EPSG:4326", [x, y]);
```

---

## 8. Tile Provider Configuration

Centralize tile provider configs to allow runtime switching and fallback chains.

```ts
// lib/map/tile-providers.ts

export interface TileProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export const TILE_PROVIDERS: Record<string, TileProvider> = {
  cartoVoyager: {
    id: "carto-voyager",
    name: "CARTO Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap © CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  cartoDarkMatter: {
    id: "carto-dark",
    name: "CARTO Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap © CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  osm: {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  stamenTerrain: {
    id: "stamen-terrain",
    name: "Stadia Stamen Terrain",
    url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png",
    attribution: "© Stamen Design © OpenStreetMap",
    maxZoom: 18,
  },
} as const;
```

---

## 9. Map State Context

Centralized React context for map state, error handling, and the `L.Map` instance ref.

```tsx
// lib/map/map-context.tsx
"use client";
import {
  createContext, useContext, useRef, useState, useCallback,
  type ReactNode,
} from "react";
import type { GeoError } from "./errors";

interface MapContextValue {
  mapRef: React.MutableRefObject<L.Map | null>;
  setMapInstance: (map: L.Map) => void;
  isReady: boolean;
  error: GeoError | null;
  setError: (err: GeoError | null) => void;
  clearError: () => void;
  flyTo: (coords: [number, number], zoom?: number) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<GeoError | null>(null);

  const setMapInstance = useCallback((map: L.Map) => {
    mapRef.current = map;
    setIsReady(true);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const flyTo = useCallback((coords: [number, number], zoom = 13) => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.flyTo(coords, zoom, { duration: 1.5, easeLinearity: 0.25 });
  }, []);

  return (
    <MapContext.Provider value={{
      mapRef, setMapInstance, isReady,
      error, setError, clearError, flyTo,
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be inside <MapProvider>");
  return ctx;
}

export function useMapErrors() {
  const { error, clearError } = useMapContext();
  return { error, clearError };
}
```

---

## 10. Full Component Assembly

### MapCore

```tsx
// components/map/MapCore.tsx
"use client";
import { MapContainer } from "react-leaflet";
import { MapController } from "./MapController";
import { ResilientTileLayer } from "./ResilientTileLayer";
import { ErrorToast } from "./ErrorToast";
import { useMapContext } from "@/lib/map/map-context";
import { MAP_DEFAULTS } from "@/lib/map/constants";
import "leaflet/dist/leaflet.css";

export default function MapCore() {
  const { setMapInstance } = useMapContext();

  return (
    <>
      <MapContainer
        center={MAP_DEFAULTS.center}
        zoom={MAP_DEFAULTS.zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapController onReady={setMapInstance} />
        <ResilientTileLayer />
      </MapContainer>
      <ErrorToast />
    </>
  );
}
```

### DynamicMap

```tsx
// components/map/DynamicMap.tsx
import dynamic from "next/dynamic";
import { MapSkeleton } from "./MapSkeleton";

export const DynamicMap = dynamic(
  () => import("./MapCore"),
  { ssr: false, loading: () => <MapSkeleton /> }
);
```

### Constants

```ts
// lib/map/constants.ts
export const MAP_DEFAULTS = {
  center: [32.8407, -83.6324] as [number, number], // Macon, GA
  zoom: 12,
  minZoom: 3,
  maxZoom: 19,
} as const;
```

---

## 11. Agent Rules Summary

Quick-reference checklist for any coding agent modifying this codebase.

### ALWAYS

- Use `next/dynamic` with `ssr: false` for any component importing from `leaflet` or `react-leaflet`
- Access `L.Map` via `useMap()` hook in a child of `<MapContainer>`, never via `whenCreated`
- Store `L.Map` in a ref (`useRef`), never in React state
- Call `map.stop()` before any `flyTo`/`panTo` to prevent animation overlap
- Validate and normalize ZIP codes as 5-digit strings (never `parseInt` for storage)
- Proxy all geocoding through Next.js API routes (never expose third-party keys client-side)
- Use Zod or equivalent to validate external API response shapes
- Include `AbortController` timeouts on all fetch calls (5s default)
- Store coordinates at 6 decimal places as the default precision
- Include a descriptive `User-Agent` header for Nominatim requests

### NEVER

- Import `leaflet` at module top-level in a server-rendered file
- Use `alert()` or `window.confirm()` for map errors
- Treat ZIP codes as numbers (leading zero loss)
- Pass State Plane coordinates directly to Leaflet without reprojection
- Call `flyTo` without first calling `map.stop()`
- Hardcode tile URLs in components — use the centralized `tile-providers` config
- Geocode on every keystroke — debounce (300ms minimum) or search-on-submit
- Store the `L.Map` instance in React state

### PREFER

- CARTO Voyager as default tiles (cleaner than stock OSM, free tier sufficient)
- `flyTo` for search results, `panTo` for nearby marker clicks
- GeoJSON for all boundary rendering (census tracts, parcels, zones)
- Server-side geocoding with cached results for repeated lookups
- Vanilla Extract for styling over Tailwind (project convention)
- `react-leaflet-cluster` for marker clustering when >50 markers
- SVG marker icons over raster PNGs (scale without blur)
- `proj4` for any CRS transformation beyond WGS84/NAD83