<style>
/* Gold frame for this doc — fills in on hover (honored by the markdown preview). */
body {
  border: 3px solid #fbbf24;
  border-radius: 6px;
  padding: 16px 24px;
  transition: background-color 0.25s ease, color 0.25s ease;
}
body:hover {
  background-color: #fbbf24;
  color: #000;
}
</style>

# Location-Aware Data Network — Architecture

> **Status:** Living document. This is the source of truth for how Help Nearby
> resolves a location to the right data providers and reconciles their data into
> one trustworthy answer. Update it as the design and implementation evolve —
> do not let code and this doc drift.
>
> **Last updated:** 2026-06-21
> **Owners:** (add names)
> **Related:** [`source-registry.md`](./source-registry.md) (candidate sources),
> [`api/openFEMA.md`](./api/openFEMA.md)

---

## 1. Goal

Searching a location should tap that location's authoritative data network:
**LA → LA's sources, NYC → NYC's sources**, falling back to county → state →
national feeds when no local source covers a point. The registry of sources is
**data, not code**, so the network grows and changes without redeploys.

### Reference targets (build for these two first)

| Hub | Role | Why it's the benchmark |
|-----|------|------------------------|
| **NYC** | Gold standard for **accuracy** | Population-dense; resource data is published at sub-borough granularity. If resolution + multi-source reconciliation work here, they work anywhere. |
| **LA** | Default **hub** | What loads by default; already partly integrated (ArcGIS). Broad-area fallback behavior is exercised here. |

Every solution caters to NYC and LA **first**, then generalizes.

---

## 2. Architecture at a glance

```
            ┌─────────────────────────────────────────────┐
   lat/lng  │ 1. RESOLVER   point → ordered jurisdictions   │
   ────────►│    (place → county → state → national)        │
            └───────────────┬─────────────────────────────┘
                            ▼
            ┌─────────────────────────────────────────────┐
            │ 2. REGISTRY   jurisdiction+category → sources │
            │    (data, not code: JSON/DB rows)             │
            └───────────────┬─────────────────────────────┘
                            ▼
            ┌─────────────────────────────────────────────┐
            │ 3. ADAPTERS   sourceType → fetch fn           │
            │    arcgis | socrata | geojson | rest | places │
            │    all emit NearbyResource                    │
            └───────────────┬─────────────────────────────┘
                            ▼
            ┌─────────────────────────────────────────────┐
            │ 4. RECONCILE  dedupe · trust tiers ·          │
            │    field provenance · freshness               │
            └───────────────┬─────────────────────────────┘
                            ▼
            ┌─────────────────────────────────────────────┐
            │ 5. RELIABILITY  cache · circuit breaker ·     │
            │    timeout · health surface                   │
            └─────────────────────────────────────────────┘
```

The Next.js API route [`/api/nearby-resources`](../frontend/src/app/api/nearby-resources/route.ts)
is the orchestration point. It already does layers 3 + part of 5
(`Promise.allSettled`, per-source meta, degraded flag). This doc describes how
1, 2, 4, and the rest of 5 get built around it.

### Current state vs. target

| Layer | Today | Target |
|-------|-------|--------|
| Resolver | **v2 built (hub coverage)** — [`fipsResolver.ts`](../frontend/src/lib/location/fipsResolver.ts) resolves place → county → state → national from bundled NYC/LA/Chicago polygons + Census fallback. National county bundle still TODO. | full national county bundle + sub-municipal hub layer |
| Registry | **data-driven built** — [`sources.json`](../frontend/src/data/sources.json) + [`registry.ts`](../frontend/src/lib/resources/registry.ts) select by jurisdiction via the resolver. Old bbox `sourceRegistry.ts` deleted. | → DB rows + admin UI |
| Adapters | **`arcgis` + `socrata` built**, dispatched by `sourceType` via [`adapters/index.ts`](../frontend/src/lib/resources/adapters/index.ts) | + `geojson` + `rest` + `places` |
| Reconcile | **built** — [`reconcile.ts`](../frontend/src/lib/resources/reconcile.ts): 2-of-3 entity matching, trust-ranked field merge, per-field provenance, wired into the route before ranking | + freshness/staleness model |
| Reliability | **built** — [`reliability.ts`](../frontend/src/lib/registry/reliability.ts): per-source cache TTL + circuit breaker via `reliableRun`, applied by both registries | + cross-instance store, health admin view |
| Reliability | allSettled + degraded | + per-source cache TTL, circuit breaker, health surface |

---

## 3. Layer 1 — Resolver (location → jurisdictions)

Resolve a point to an **ordered stack of jurisdictions, most-specific first**.
The order *is* the fallback order.

```ts
interface Jurisdiction {
  id: string;                                    // 'place:3651000'
  level: 'place' | 'county' | 'state' | 'national';
  name: string;
  fips: string;
  source: 'local' | 'census-api';
}
// resolveJurisdictions(lat, lng) => [place?, county, state, national]
```

### Coverage keying — options considered

| Option | Test | Verdict |
|--------|------|---------|
| **Bounding box** | 4 comparisons | Keep as cheap *prefilter* only. Rectangles aren't shapes; overlaps unmanaged. |
| **FIPS / GEOID codes** | reverse-geocode → code match | **Primary registry key.** Matches how gov open data is published; gives exact hierarchy + fallback for free. |
| **Polygon (point-in-polygon)** | PIP w/ spatial index | For irregular service areas that don't map to a FIPS unit (transit district, evac zone). Used for the bundled boundaries. |
| **Geohash / tile prefix** | string prefix | Caching/partition key, not human-facing coverage. |
| **Centroid + radius** | one distance calc | Individual facilities w/ a service radius, not jurisdictions. |

**Decision:** hybrid — **FIPS code as the registry key**, **bundled polygons +
PIP** to derive the code locally, **bbox/geohash** as optional prefilter,
**source-side spatial query** (already in `arcgis.ts` via `useSpatialQuery`) for
the actual row filtering. Coverage keying only decides *which sources to call*,
not *which rows to keep* — the upstreams do precise spatial filtering themselves.

### Bundled local lookup + Census API fallback

| Layer | Strategy | Rationale |
|-------|----------|-----------|
| State + County | **Bundle** (~3,200 county polygons, simplified) | Whole-US offline resolution; rarely changes. |
| Place (city) | **Bundle only cities with sources** | 19k US places is too heavy; only target cities matter. Grows with the network. |
| Sub-municipal (hub cities only) | **Bundle high-fidelity** | Density demands finer-than-county (see §4). |
| Miss / ambiguous | **Census geocoder API fallback** | `geocoding.geo.census.gov` resolves exactly; rare path. |

Runtime: build a **Flatbush** bbox index once per cold start, query candidates,
run exact PIP (`@turf/boolean-point-in-polygon`) only on candidates. Cache
resolved stacks in a module-level `Map` (same pattern as
[`locationLookup.ts`](../frontend/src/lib/location/locationLookup.ts)). **The
resolver never throws** — worst case returns `['us']`.

Build pipeline (`scripts/build-coverage.sh`, run ~yearly): Census cartographic
boundary shapefiles → `mapshaper` simplify + field-filter → GeoJSON committed to
`frontend/src/data/geo/`.

---

## 4. Hub geography (the density problem)

**NYC is one place but five counties, published at sub-borough granularity.**
A naive county key splits NYC into five and still isn't fine enough.

| Borough | County (FIPS) | NYC source geography |
|---------|---------------|----------------------|
| Manhattan | New York `36061` | Community District / NTA |
| Brooklyn | Kings `36047` | Community District / NTA |
| Queens | Queens `36081` | Community District / NTA |
| Bronx | Bronx `36005` | Community District / NTA |
| Staten Island | Richmond `36085` | Community District / NTA |

Key IDs:
- **City of NYC** place GEOID `3651000`; **NY state** `36`.
- **City of LA** place GEOID `0644000`; **LA County** `06037`; **CA state** `06`.
- **City of Chicago** place GEOID `1714000`; **Cook County** `17031`; **IL state** `17`.

NYC sub-municipal units: **Community Districts (59)**, **NTAs (~195)**,
**MODZCTA** (NYC-modified ZCTA, used for DOHMH health data).
LA: **council districts**, **neighborhood councils**.

**Resolver implications:**
1. **Place is the primary urban key**, county/state are fallbacks — not the
   reverse.
2. Add an **optional sub-municipal layer for dense hubs only**. Bundle NYC
   Community Districts + LA neighborhoods at high fidelity; rest of US stops at
   county.
3. **Tiered polygon fidelity** — hub cities simplified lightly (`30–50%`), rest
   of US aggressively (`8%`). Border misresolution costs more in a dense hub.
4. **City-native geocoders for the hubs** — **NYC GeoSearch**
   (`geosearch.planninglabs.nyc`, official DCP; returns borough, NTA, BBL,
   rooftop coords) for NYC; **LA County/City GeoHub** geocoders for LA.
   Nominatim/Census everywhere else. Highest-leverage accuracy change.
5. **Density-aware cache rounding** — `toFixed(3)` (~110m) inside hub bboxes,
   `toFixed(2)` (~1.1km) elsewhere. `toFixed(2)` merges distinct NYC
   neighborhoods into one bucket.

---

## 5. Layer 2 — Registry as data

```ts
interface RegisteredSource {
  id: string;
  jurisdictionId: string;        // 'place:3651000' — links to a Jurisdiction
  category: ResourceCategory;
  sourceType: SourceType;        // selects the adapter
  adapterConfig: AdapterConfig;  // layerUrl/fieldMap blob (already exists for arcgis)
  name: string;
  url: string;
  trust: number;                 // precedence for conflict resolution (§7)
  refresh: string;               // drives cache TTL + staleness
  enabled: boolean;              // kill switch without a deploy
}
```

Selection is hierarchy-aware — most-specific match wins per category:

```ts
const stack = await resolveJurisdictions(lat, lng); // [place, county, state, us]
const ids = new Set(stack.map(j => j.id));
const candidates = REGISTRY.filter(
  s => s.enabled && ids.has(s.jurisdictionId) && (!category || s.category === category)
);
```

Migrate storage: hardcoded array → `registry/sources.json` → Supabase table +
admin UI. Adding a city becomes a data edit, not a code change.

---

## 5a. How to register a new source

The live registry is [`frontend/src/data/sources.json`](../frontend/src/data/sources.json)
— an array of rows read by [`registry.ts`](../frontend/src/lib/resources/registry.ts).
Adding a row makes a source live in `/api/nearby-resources` with **no code change**
— **but only if its adapter and jurisdiction coverage already exist** (the two
prerequisites below). This registry governs the resolver-driven resource finder
only; incidents/weather/FEMA/Places still have their own code paths (§2).

### Row schema

```jsonc
{
  "id": "nyc-benefits-access-centers",   // unique, stable; also prefixes resource ids
  "name": "NYC HRA Benefits Access Centers",
  "url": "https://…",                    // human-facing source/provenance page
  "sourceType": "socrata",               // MUST have an adapter (prereq 1)
  "category": "social_services",         // a ResourceCategory in schema.ts
  "jurisdictionId": "place:3651000",     // MUST be resolvable (prereq 2)
  "trust": 80,                           // conflict precedence (see tiers below)
  "refresh": "updated by NYC HRA…",      // free-form; will drive cache TTL (step 4)
  "enabled": true,                       // kill switch — flip to false to disable
  "notes": "…",                          // provenance / caveats for maintainers
  "adapter": { "kind": "socrata", … }    // adapter-specific config (see §6)
}
```

### Prerequisite 1 — the `sourceType` must have an adapter

Adapters live in [`adapters/`](../frontend/src/lib/resources/adapters/) and are
dispatched by [`adapters/index.ts`](../frontend/src/lib/resources/adapters/index.ts).
Today: **`arcgis-rest`** and **`socrata`**. For a new platform (GeoJSON, generic
REST, Google Places): write the adapter (emit `NearbyResource[]`), add it to the
`SourceType` union in [`schema.ts`](../frontend/src/lib/resources/schema.ts) and to
the dispatch + `AdapterConfig` union in `adapters/index.ts`, *then* reference it.

### Prerequisite 2 — the `jurisdictionId` must be resolvable

A source is selected only when its `jurisdictionId` appears in a point's resolved
stack. The resolver currently bundles **hub coverage only**:

| Selectable today | ids |
|---|---|
| Places | `place:3651000` (NYC), `place:0644000` (LA city), `place:1714000` (Chicago) |
| Counties | `county:3600{5}/360{47,61,81}`/`36085` (NYC boroughs), `county:06037` (LA), `county:17031` (Cook) |
| States | `state:36`, `state:06`, `state:17` |
| National | `us` |

A row keyed to anything outside the bundled hub coverage will sit in the file
and **never be selected** until that polygon is added to
[`data/geo/`](../frontend/src/data/geo/) via
[`build-coverage.mjs`](../frontend/scripts/build-coverage.mjs). **`sources.json`
and the resolver's coverage must move together.**

### Trust tiers (the `trust` value)

`city official 80 > county/state official 60–70 > federal 50 > nonprofit aggregator ~40 > crowd tip ~20`.
Higher trust wins field conflicts during reconciliation (§7).

### Checklist

1. Adapter for the `sourceType` exists (else build it — prereq 1).
2. `jurisdictionId` is in the resolver bundle (else add the polygon — prereq 2).
3. `category` is a valid `ResourceCategory`.
4. Verify the upstream endpoint + field names live (probe it like the step-2
   datasets were vetted), set the `adapter` config accordingly.
5. Add the row; run `npm run validate:sources` (confirms selection + a live fetch).
6. Pick `trust` from the tiers; write honest `notes`.

---

## 5b. Multi-registry unification — one resolver, many typed registries

The ultimate flow is **one location in → fan out to every relevant source → render
through the panels**. The mechanism is *not* one giant `sources.json`. Different
panels need different output shapes (a facility you can visit vs. a hazard alert),
so each **panel is fed by its own typed registry**, and all registries share one
front door.

```
                       ┌─────────────────────────────┐
   location (once) ───►│  resolveJurisdictions()      │  ← shared resolver
                       └──────────────┬──────────────┘
                                      ▼
                       ┌─────────────────────────────┐
                       │  shared core (registry/core) │  selectByJurisdiction + fanOut
                       └──┬───────────────────────┬──┘
        ┌─────────────────┘                       └──────────────────┐
        ▼                                                            ▼
  resources registry  → NearbyResource                      alerts registry → WeatherAlert
  (data/sources.json) → reconcile + rank                    (data/alerts.sources.json)
        ▼                                                            ▼
   ResourcesPanel                                              AlertPanel
```

### Shared core ([`lib/registry/core.ts`](../frontend/src/lib/registry/core.ts))
Domain-agnostic. `BaseSourceRow` (the fields every row shares), `selectByJurisdiction`
(resolver-based selection, national `us` rows always match), and `fanOut`
(parallel `Promise.allSettled` + per-source `CheckedSource` health + `degraded`).
No output schema lives here.

### Typed registries (one per panel)
Each owns its `*.sources.json`, its adapters, and its output type:

| Registry | File | Output | Panel |
|---|---|---|---|
| Resources | [`sources.json`](../frontend/src/data/sources.json) + [`registry.ts`](../frontend/src/lib/resources/registry.ts) | `NearbyResource` → reconcile + distance rank | ResourcesPanel |
| Alerts | [`alerts.sources.json`](../frontend/src/data/alerts.sources.json) + [`alerts/registry.ts`](../frontend/src/lib/alerts/registry.ts) | `WeatherAlert` | AlertPanel |
| Community | [`community.sources.json`](../frontend/src/data/community.sources.json) + [`community/sources/`](../frontend/src/lib/community/sources/) | `CommunityOpportunity` → import/merge + moderation | CommunityPanel |

Both now run on the shared core, so adding a domain = a new `*.sources.json` + a
typed registry that calls `selectByJurisdiction` + `fanOut`; the route just maps
the typed output to its panel envelope. Alerts now spans national feeds (NWS,
USGS, NASA EONET, EPA AirNow), state/coastal feeds (NOAA tsunami, CAL FIRE), and
city feeds (NYC/LA/Chicago crime, NYC emergency notifications, FEMA declarations
by county/state) — all registered in `alerts.sources.json` and selected by
jurisdiction, the same scaling story as resources. Each alert is stamped with its
source (`sourceName`/`sourceUrl`) so AlertPanel attributes items individually.
The generic `socrata-local-incident` adapter makes any Socrata incident/notice
dataset a zero-code row; `calfire`/`airnow`/`openfema-declaration` are dedicated
adapters. AirNow needs `AIRNOW_API_KEY` and ships `enabled:false` until it's set.

### What is deliberately NOT in this system
- **NewsTicker / breaking news** ([`/api/fema-disasters`](../frontend/src/app/api/fema-disasters/route.ts))
  is **independent** — it advertises news, not a location-scoped source list, so it
  stays outside the registry pattern.
- **Incidents** — the old `/api/incidents` route + `lib/incidents/*` were an orphaned,
  unconsumed duplicate of the alert path (incidents are just alerts). Removed. The
  static `IncidentCard` + `data/incidents.ts` were also unused and removed.
- **Other app routes** (Places `local-resources`, community store) keep their own
  paths; fold them into typed registries only when a panel needs scoped selection.

---

## 6. Layer 3 — Adapter registry

`queryArcgisLayer` in [`adapters/arcgis.ts`](../frontend/src/lib/resources/adapters/arcgis.ts)
is already config-driven (layer URL + field map + metadata). Generalize to an
interface keyed by `sourceType`:

```ts
type Adapter = (cfg: AdapterConfig, q: NearbyQuery) => Promise<NearbyResource[]>;
const ADAPTERS: Record<SourceType, Adapter> = {
  'arcgis-rest': queryArcgisLayer,
  'socrata':     querySocrata,   // SoQL: $where=within_circle(location,lat,lng,meters)
  'geojson':     queryGeoJson,
  'api':         queryGenericRest,
  'places':      queryPlacesFallback,
};
```

**Socrata is the big unlock:** NYC, SF, Chicago, Seattle, LA, Cook County, and
many states expose Socrata with the same query grammar. One `querySocrata`
adapter ≈ instant coverage for a large swath of US cities, and it's exactly what
NYC Open Data uses.

Every adapter emits the existing
[`NearbyResource`](../frontend/src/lib/resources/schema.ts) shape so the UI/map
share one source of truth.

---

## 7. Layer 4 — Reconciliation (syncing for reliability)

Dense areas mean **the same facility appears in multiple feeds** (city + state +
nonprofit + crowd). Reliability = merging them into one trustworthy record.

1. **Entity resolution.** `computeResourceKey(name,address)` is too brittle for
   NYC ("St. Mary's" vs "Saint Marys", "123 W 42 St" vs "123 West 42nd Street").
   Upgrade to match on **any two of three**: normalized name (lowercase, strip
   punctuation/suffixes) · normalized address (USPS abbreviation rules) ·
   **geospatial proximity** (within ~50m).
2. **Trust tiers** (the `trust` field) decide conflicts deterministically:
   `city official > county/state official > federal (HRSA) > nonprofit aggregator > crowd tip`.
3. **Field-level provenance** — merge into one record but keep per-field source +
   timestamp. Address from the city feed, phone from a nonprofit, "open now"
   from a crowd tip. UI shows "address confirmed by NYC DSS, hours reported by a
   community member 2 days ago."
4. **Freshness / staleness** — per-source TTL from `refresh`; stamp `fetchedAt` +
   upstream `updatedAt`; visibly age out stale data instead of silently serving
   it. Critical where capacity changes hourly.

---

## 8. Layer 5 — Reliability

**Built** — [`lib/registry/reliability.ts`](../frontend/src/lib/registry/reliability.ts),
composed via `reliableRun(run, { cacheKeyFor, ttlSecondsFor, breaker })` and applied
by both registries before `fanOut`:

- ✅ **Cache** — in-memory, keyed per `(sourceId, roundedLatLng, category)`, TTL
  from the row's `ttlSeconds` (default 3600s resources / 300s alerts). A hit
  short-circuits the upstream call.
- ✅ **Circuit breaker** — per `sourceId`; after 3 consecutive failures the circuit
  opens for 60s and the source is skipped with `CircuitOpenError` → marked down +
  `degraded` instantly instead of timing out every request. Half-opens after
  cooldown and recovers on success. Breakers are isolated per source.
- ✅ **Health surface** — [`health.ts`](../frontend/src/lib/registry/health.ts)
  auto-records every fan-out's `CheckedSource`s (last ok/checked, consecutive +
  total failures, failure rate) and merges live circuit state. Exposed via the
  admin-gated [`/api/admin/source-health`](../frontend/src/app/api/admin/source-health/route.ts)
  and the [`/admin/source-health`](../frontend/src/app/admin/source-health/page.tsx)
  dashboard (worst sources first, auto-refresh). Per-instance until the shared
  store lands.

State is module-level (per serverless instance, reset on cold start); a shared
store (Redis) is the multi-instance upgrade. Verified `npm run validate:reliability`
+ jest test
([`reliability.test.ts`](../frontend/src/lib/registry/__tests__/reliability.test.ts)).

---

## 9. Accuracy validation (the "gold standard" gate)

Hold a fixture set of **~30 NYC + ~20 LA** known addresses with their expected
jurisdiction stack. Assert `resolveJurisdictions` returns the right stack. This:
- picks a safe `-simplify` level (more simplification = smaller bundle but border
  points can misresolve to a neighbor — the API fallback won't catch this
  because the local lookup "succeeded"),
- guards against regressions as boundaries/sources change.

A known NYC facility appearing in ≥2 feeds is the fixture for the
reconciliation/dedup tests (§7).

---

## 10. Source inventory

> The full running inventory (live + candidate + skipped, with vetting status)
> lives in [`source-catalog.md`](./source-catalog.md). The summary below is the
> live set; keep `jurisdictionId`, `sourceType`, geography, and overlaps explicit
> so the dedup design stays grounded in real data.

> **Platform note:** `sourceType` (the adapter) is independent of city — NYC can
> use `arcgis-rest` and LA can use `socrata`. Each dataset's platform is just
> wherever it's published. NYC leans Socrata because NYC Open Data is Socrata-hosted,
> but NYC also publishes ArcGIS feature services (DCP/ITS) that register identically.

### NYC — `place:3651000` (live)
| Source | Category | sourceType | id | Notes |
|--------|----------|------------|----|-------|
| HRA Benefits Access Centers | social_services | socrata | `nyc-benefits-access-centers` | SNAP/cash/Medicaid |
| DHS Drop-In Centers | shelter | socrata | `nyc-homeless-drop-in-centers` | 24/7 |
| HRA SNAP Centers | food | socrata | `nyc-snap-centers` | food-access enrollment |
| Health Centers (enrollment) | health | socrata | `nyc-health-coverage-centers` | city sites + national HRSA |
| Financial Empowerment Centers | social_services | socrata | `nyc-financial-empowerment-centers` | 2nd social_services → reconciled |

Fallbacks for NYC points: (future NYS state feeds →) HRSA national.

### NYC community events — `place:3651000` (registry: community)
| Source | Type | sourceType | id | Notes |
|--------|------|------------|----|-------|
| NYC Events Calendar | event | json-feed | `nyc-events-calendar` | **Live.** Official city events `GET api.nyc.gov/calendar/search` (powers nyc.gov "Find Local Events"). `Ocp-Apim-Subscription-Key` from `NYC_API_KEY`; `autoApprove`. Confirmed end-to-end (12 upcoming events/page, today-forward, no lat/lng). First community-registry source. |

### NYC alerts also — `place:3651000` (registry: alerts)
| Source | sourceType | id | Notes |
|--------|------------|----|-------|
| NYC 311 Service Requests | socrata-local-incident | `nyc-311-service-requests` | Non-emergency 311 (dataset `erm2-nwe9`); opt-in situational-awareness, ships `enabled:false`, `includeCategories` curated to infrastructure/hazard types. Zero-code row. |

### NYC also has an ArcGIS source — `place:3651000`
| Source | Category | sourceType | Notes |
|--------|----------|------------|-------|
| NYCEM Cooling Centers | cooling | **arcgis-rest** | proves NYC isn't Socrata-only; seasonal feed |

### LA — `place:0644000` / `county:06037` / `state:06` (live)
| Source | Category | sourceType | jurisdictionId | Notes |
|--------|----------|------------|----------------|-------|
| LA County EOC cooling centers | cooling | arcgis-rest | county:06037 | event-driven; empty outside heat events |
| LA County 211 homeless shelters | shelter | arcgis-rest | county:06037 | spatial-filtered 211 directory |
| LA County farmers' markets | food | arcgis-rest | county:06037 | many accept SNAP/EBT |
| CalOES food banks | food | arcgis-rest | state:06 | umbrella orgs, coarse |
| LA County DPSS offices | social_services | arcgis-rest | county:06037 | CalFresh/CalWORKs/Medi-Cal intake |
| LA City Rec & Parks | recreation | arcgis-rest | place:0644000 | double as cooling/warming centers |
| LA Public Library branches | library | **socrata** | place:0644000 | proves LA isn't ArcGIS-only; nested `location` col |
| HRSA health centers | health | arcgis-rest | `us` | server-side spatial filter |

### Chicago — `place:1714000` / `county:17031` / `state:17` (live)
| Source | Category | sourceType | jurisdictionId | Notes |
|--------|----------|------------|----------------|-------|
| Chicago Public Library branches | library | socrata | place:1714000 | official CPL locations; GeoJSON-style point col |
| Chicago Cooling Centers | cooling | socrata | place:1714000 | seasonal DFSS heat-refuge feed |
| Chicago Warming Centers | warming | socrata | place:1714000 | first-class warming category; seasonal cold-refuge feed |
| Chicago Community Service Centers | social_services | socrata | place:1714000 | DFSS benefits/emergency assistance centers |
| Chicago Primary Care Community Health Centers | health | socrata | place:1714000 | overlaps HRSA by design for reconciliation |
| HRSA health centers | health | arcgis-rest | `us` | national fallback |

---

## 11. Build order (NYC-first — it stresses everything)

1. ✅ **Resolver v2 (hub coverage)** — *done.* Bundled NYC 5-county + LA County
   + Cook County polygons and NYC/LA/Chicago city polygons (TIGERweb),
   dependency-free point-in-polygon,
   density-aware cache, Census API fallback. Validated **45/45** against the
   gold-standard fixtures (`npm run validate:resolver`). Files:
   [`fipsResolver.ts`](../frontend/src/lib/location/fipsResolver.ts),
   [`jurisdiction.ts`](../frontend/src/lib/location/jurisdiction.ts),
   [`geo/pointInPolygon.ts`](../frontend/src/lib/location/geo/pointInPolygon.ts),
   [`data/geo/`](../frontend/src/data/geo/), fixtures + jest test in
   [`lib/location/__tests__/`](../frontend/src/lib/location/__tests__/),
   rebuild script [`build-coverage.mjs`](../frontend/scripts/build-coverage.mjs).
   *Still TODO:* national county bundle, sub-municipal hub layer (Community
   Districts / NTAs). NYC GeoSearch geocoder routing is now wired for NYC-looking
   address queries in [`locationLookup.ts`](../frontend/src/lib/location/locationLookup.ts)
   (no key; falls back to Nominatim).
2. ✅ **Socrata adapter + data-driven registry** — *done.* `sourceType`-dispatched
   adapter registry ([`adapters/index.ts`](../frontend/src/lib/resources/adapters/index.ts)),
   [`socrata.ts`](../frontend/src/lib/resources/adapters/socrata.ts) (point
   `within_circle` + latlng-bbox spatial modes), [`sources.json`](../frontend/src/data/sources.json)
   (NYC HRA Benefits Access Centers + DHS Drop-In Centers, LA sources migrated,
   each keyed by `jurisdictionId` with `trust`/`enabled`), and jurisdiction-based
   selection ([`registry.ts`](../frontend/src/lib/resources/registry.ts)) wired into
   [`/api/nearby-resources`](../frontend/src/app/api/nearby-resources/route.ts).
   Verified live (`npm run validate:sources`): NYC → NYC sources + national HRSA,
   LA → LA sources + national HRSA, Chicago → Chicago sources + national HRSA;
   no hub leaks into another. Old bbox `sourceRegistry.ts` deleted.
3. ✅ **Reconciliation** — *done.* [`reconcile.ts`](../frontend/src/lib/resources/reconcile.ts):
   entity matching on any 2 of {normalized name (Dice ≥0.8), normalized address,
   geo ≤50m}, greedy clustering, trust-ranked field merge with per-field
   provenance + `contributingSources`. Sources stamped with `trust`/`sourceId` in
   the route; reconcile runs before the distance sort. Verified
   (`npm run validate:reconcile`) + jest test
   ([`reconcile.test.ts`](../frontend/src/lib/resources/__tests__/reconcile.test.ts)).
   Schema gained optional `sourceId`/`trust`/`contributingSources`/`fieldProvenance`
   (back-compatible). *Next:* surface provenance in the UI.
4. ✅ **Freshness + circuit breaker** — *done.* Shared
   [`reliability.ts`](../frontend/src/lib/registry/reliability.ts) (cache TTL +
   per-source breaker) applied by the resources and alerts registries. Verified
   (`npm run validate:reliability`). *Remaining:* cross-instance state + health
   admin view.

Each step is independently shippable and each is exercised hardest by NYC — if
it works there it works in LA by construction.

---

## 12. Open decisions

- [ ] County polygon simplification level (validate against §9 fixtures before locking).
- [ ] Registry storage: how long on `sources.json` before moving to Supabase + admin UI.
- [ ] Sub-municipal coverage: Community Districts vs NTAs vs MODZCTA as the NYC key.
- [ ] Geocoder routing: per-hub native geocoder vs single provider — confirm GeoSearch/GeoHub terms.
- [ ] Circuit-breaker state store: in-memory (per serverless instance) vs Redis (shared).

---

## Known issues

- **Jest runner is broken repo-wide** (independent of this work): `jest.config.ts`
  imports `next/jest` (needs `next/jest.js` under ESM) and `jest-environment-jsdom`
  is not installed. The existing `example.test.ts` also fails to run, and it has a
  TS syntax error. Until the runner is fixed, the resolver's accuracy gate runs
  standalone via `npm run validate:resolver`. The jest test
  ([`fipsResolver.test.ts`](../frontend/src/lib/location/__tests__/fipsResolver.test.ts))
  is written and pinned to the `node` environment, ready once the runner works.

## Changelog

- **2026-06-21** — NYC API Portal integration (first community-registry source).
  Reviewed `api-portal.nyc.gov` (Azure APIM; free self-serve subscription key sent
  as `Ocp-Apim-Subscription-Key`). **Community:** wired the **NYC Events Calendar
  API** into the bare Community panel — extended the `json-feed` adapter
  ([`community/sources/{types,adapters}.ts`](../frontend/src/lib/community/sources/))
  with env-substituted request `headers` (`${VAR}`, dropped when unset), `query`
  params with `{today}`/`{today±Nd}` date tokens, and `latitude`/`longitude`/
  `contactPhone`/`contactEmail` field mapping (previously dropped); added the
  `nyc-events-calendar` row + `NYC_API_KEY` to `.env.example`. **Live + confirmed
  end-to-end** against `GET api.nyc.gov/calendar/search` (response `{items,pagination}`,
  12 upcoming events/page, today-forward; items carry no lat/lng so events are
  city-wide for any NYC point). Verified: NYC point → 12 approved events, LA → 0,
  re-import idempotent. **Alerts:** added `nyc-311-service-requests` (Socrata `erm2-nwe9`, live-probed
  fresh) as a zero-code `socrata-local-incident` row — opt-in `enabled:false` with
  `includeCategories` curated to infrastructure/hazard types (311 is non-emergency).
  **Location:** added NYC **GeoSearch** routing (no key) in `locationLookup.ts` for
  NYC-looking address queries, falling back to Nominatim. The Portal's Geoclient/311
  *content* APIs were reviewed and left out (key-gated geocoding duplicate / reference
  content, not location-scoped). Build + resolver/reliability gates green.
- **2026-06-20** — Alert consolidation: `fetchAlerts` now collapses the same
  natural-hazard event reported by multiple sources (e.g. a wildfire from both
  CAL FIRE and NASA EONET) into one highest-trust record. `WeatherAlert` gained
  optional `latitude`/`longitude`/`trust` (stamped by adapters/registry);
  consolidation is scoped to a canonical-hazard allowlist, requires different
  sources, same canonical title, and ~15 km proximity — crime/weather/notice
  lists are never merged. EONET category labels are canonicalized
  (`"Wildfires"` → `"Wildfire"`) so badges and dedup align.
- **2026-06-20** — Alerts expansion: added Chicago crime (live, fresh) as a
  zero-code `socrata-local-incident` row; new `calfire` (CA wildfires, `state:06`),
  `airnow` (EPA AQI, `us`, key-gated `enabled:false`), and `openfema-declaration`
  (FEMA declarations by county/state, recent-OR-still-active) adapters. Added
  per-item `sourceName`/`sourceUrl` to `WeatherAlert` (registry stamps each item;
  AlertPanel shows it per row) and an optional `includeCategories` filter on the
  Socrata incident adapter. LA crime (`2nrs-mtv8`) and NYC emergency notifications
  (`8vv7-7wx3`) were wired but ship **`enabled:false`** — live probing showed both
  open-data exports are frozen/stale (2024-12-30 and 2025-09-15); re-enable when
  they resume. All endpoints live-probed. Files: `lib/alerts/{types,registry}.ts`,
  `data/alerts.sources.json`, `components/help/AlertPanel.tsx`.
- **2026-06-20** — Chicago expansion proof: added Cook County + Chicago city
  resolver coverage, first-class `warming` category, GeoJSON-style Socrata point
  support, and five official Chicago Data Portal sources (library, cooling,
  warming, social_services, health). Food aid intentionally left as a gap until
  a clean pantry/soup-kitchen feed is verified.
- **2026-06-19** — NYC food gap closed: NYC Soup Kitchens & Food Pantries (FacDB,
  618 sites). Added a latlng `cast` mode to the Socrata adapter (`::number`) for
  text-typed lat/lng columns — also un-skips cqc8/fzy4/5ziv. Registry now 23
  sources; NYC covers all 8 non-`other` categories. Only LA `government` remains
  (no clean source found). Build + all gates green.
- **2026-06-19** — More LA/NYC sources: NYC Parks recreation centers (recreation,
  arcgis) + NYC Community Boards (government, socrata) → NYC now 8/9 categories;
  LA interim housing (2nd shelter, arcgis — addr-less, reconciles against the 211
  feed). Registry now 22 sources. Build + all gates green.
- **2026-06-19** — Closed LA gaps + proved platform mix both ways. Added LA County
  DPSS offices (social_services, arcgis) and LA Public Library branches (library,
  **socrata** on data.lacity.org), and NYC Cooling Centers (cooling, **arcgis** —
  NYC's first non-Socrata source). Enhanced the Socrata adapter to support the
  nested `location` point-column type (within_circle + `human_address` extraction),
  unlocking that common dataset class. Registry now 19 sources; NYC 6 categories,
  LA 7. Build + all gates green.
- **2026-06-19** — Added [`source-catalog.md`](./source-catalog.md) living inventory
  (live/candidate/skip + vetting status). Wired 5 more NYC sources: public computer
  centers + Queens library (**new `library` category**), senior centers, Homebase,
  family justice centers. NYC now 11 sources across 5 categories (social_services,
  shelter, food, health, library); registry totals 16. All live-verified.
- **2026-06-19** — Health surface: `lib/registry/health.ts` (auto-recorded by
  `fanOut`) + `breakerSnapshot()` + admin-gated `/api/admin/source-health` +
  `/admin/source-health` dashboard. Expanded sources (LA/NYC focus): NYC SNAP
  (food), NYC health centers (health), NYC financial empowerment (social_services);
  LA County 211 shelters (shelter), LA farmers' markets (food). All vetted live.
  NYC now covers 4 categories (6 sources), LA covers 5 (6 sources). Build + gates green.
- **2026-06-19** — Build order step 4 done: shared reliability wrap
  (`lib/registry/reliability.ts`) — per-source in-memory cache (TTL from
  `ttlSeconds`) + circuit breaker (3 fails → 60s open → half-open) composed via
  `reliableRun`, applied by the resources and alerts registries. Added
  `ttlSeconds` to `BaseSourceRow`, `reliability.test.ts`,
  `scripts/validate-reliability.mjs`, `validate:reliability` script. Build + all
  4 gates green.
- **2026-06-19** — Multi-registry unification (§5b): extracted shared
  `lib/registry/core.ts` (`selectByJurisdiction` + `fanOut`); refactored the
  resources registry + route onto it; added a typed **alerts** registry
  (`lib/alerts/`, `data/alerts.sources.json`) feeding AlertPanel, and refactored
  `/api/weather-alerts` onto it (panel contract preserved). Removed the orphaned
  `/api/incidents` route, `lib/incidents/*`, `data/manual-incidents.json`, and the
  unused `IncidentCard` + `data/incidents.ts`. NewsTicker/FEMA left independent
  (breaking news, not a scoped source list). Build + all gates green.
- **2026-06-19** — Added §5a "How to register a new source" (row schema, the two
  prerequisites — adapter exists + jurisdiction resolvable — trust tiers, checklist).
- **2026-06-19** — Build order step 3 done: reconciliation layer (2-of-3 entity
  matching, trust-ranked field merge, per-field provenance) wired into
  `/api/nearby-resources` before ranking. Added `lib/resources/reconcile.ts`,
  `__tests__/reconcile.test.ts`, `scripts/validate-reconcile.mjs`,
  `validate:reconcile` script; added optional provenance fields to `NearbyResource`.
  Verified via build + gate. Fixed a name-normalization bug (apostrophes are now
  stripped, so "Mary's" → "marys").
- **2026-06-19** — Build order step 2 done: Socrata adapter + `sourceType`-dispatched
  adapter registry + data-driven `sources.json` selected by jurisdiction, wired into
  `/api/nearby-resources`. Added `lib/resources/{registry.ts,adapters/index.ts,adapters/socrata.ts}`,
  `data/sources.json`, `scripts/validate-sources.mjs`, `validate:sources` script; added
  `socrata` to `SourceType`; deleted bbox `sourceRegistry.ts`. Verified live (NYC vs LA).
- **2026-06-19** — Build order step 1 done: hub-coverage resolver v2 + gold-standard
  validation (39/39). Added `src/lib/location/{fipsResolver,jurisdiction}.ts`,
  `geo/pointInPolygon.ts`, `data/geo/{counties,places}.json`, fixtures + jest test,
  `scripts/{validate-resolver,build-coverage}.mjs`, `validate:resolver` npm script.
- **2026-06-19** — Initial draft: architecture, coverage-keying decision,
  bundled-resolver + Census fallback, hub density handling, reconciliation,
  reliability, validation, build order.
