# Source Catalog — discovered data sources (LA / NYC / Chicago)

> **Living document.** A running inventory of data sources discovered and vetted
> for the location-aware resource network, whether or not they're wired yet.
> Add a row when you discover a source; promote `candidate → live` when you wire
> it into [`sources.json`](../frontend/src/data/sources.json). To wire one, follow
> §5a of [`location-data-network.md`](./location-data-network.md) (adapter must
> exist + jurisdiction must be resolvable).
>
> **Last updated:** 2026-06-20

## Legend

- **Status** — `live` (in `sources.json`, selected at runtime) · `candidate`
  (vetted or discovered, not wired) · `skip` (won't use — reason given).
- **Vetted** — ✅ confirmed live: geo present, spatial/bbox query returns rows,
  clean name/address fields. ⚠️ partial. ❓ not yet checked.
- **Platform** = adapter `sourceType`. Platform is independent of city: NYC can
  use `arcgis-rest`, LA can use `socrata`.

---

## NYC — `place:3651000`

| Status | Source | Category | Platform | Dataset / layer | Vetted | Notes |
|--------|--------|----------|----------|-----------------|--------|-------|
| live | HRA Benefits Access Centers | social_services | socrata | `9d9t-bmk7` | ✅ | SNAP/cash/Medicaid; ~29 |
| live | DHS Drop-In Centers | shelter | socrata | `bmxf-3rd4` | ✅ | 24/7 |
| live | HRA SNAP Centers | food | socrata | `tc6u-8rnp` | ✅ | food-access enrollment |
| live | Soup Kitchens & Food Pantries (FacDB) | food | socrata | `67g2-p84d` (filtered) | ✅ | 618 distribution sites; text lat/lng → `cast` mode |
| live | Health Centers (enrollment) | health | socrata | `gfej-by6h` | ✅ | city sites; complements HRSA |
| live | Financial Empowerment Centers | social_services | socrata | `dt2z-amuf` | ✅ | free financial counseling |
| live | Citywide Public Computer Centers | library | socrata | `sejx-2gn3` | ✅ | 362 in radius; digital access |
| live | Queens Public Library Branches | library | socrata | `kh3d-xhq7` | ✅ | borough-scoped within NYC |
| live | NYC Aging Senior Centers | social_services | socrata | `ygfr-ij6t` | ✅ | meals/activities for seniors |
| live | DHS Homebase (homelessness prevention) | social_services | socrata | `ntcm-2w4k` | ✅ | eviction prevention |
| live | Family Justice Centers | social_services | socrata | `xggi-kgx9` | ✅ | DV/GBV survivor services |
| live | NYCEM Cooling Centers | cooling | **arcgis-rest** | `CoolingCenters_PROD_view/0` | ✅ | **NYC on ArcGIS** — proves the platform mix; seasonal |
| live | NYC Parks Recreation Centers | recreation | arcgis-rest | `NYC_Parks_Recreation_Center/0` | ✅ | 36 centers; name + map pin (no street addr) |
| live | NYC Community Board Offices | government | socrata | `dy27-rrad` | ✅ | 59 local-government access points |
| candidate | NYC Aging Providers (all sites) | social_services | socrata | `u7wp-np5k` | ✅ | overlaps senior centers (good dedup test) |
| candidate | Child Care Programs (DOHMH) | social_services | socrata | `gy3q-4tzp` | ✅ | 2,592 rows — large; childcare |
| candidate | Workforce1 Career Centers | social_services | socrata | `6smc-7mk6` | ⚠️ | employment; `number`+`street` split address |
| candidate | NYCHA Community Facilities | recreation | socrata | `crns-fw6u` | ⚠️ | no clean single name field |
| candidate | NYCHA Customer Contact Centers | government | socrata | `37fm-7uaa` | ✅ | only ~2 sites |
| candidate | DOHMH HIV Service Directory | health | socrata | `pwts-g83w` | ❓ | needs field check |
| candidate | Women's Resource Network | social_services | socrata | `pqg4-dm6b` | ⚠️ | boolean category cols; address1/city only, no lat/lng |
| candidate | HS Alternatives referral centers | social_services | socrata | `w8dz-xpjh` | ✅ | ~4 sites |
| candidate | NYC Aging contracted programs | social_services | socrata | `cqc8-am9x` | ⚠️ | text lat/lng — now wireable via latlng `cast` mode |
| candidate | Older Adult Center Activities | social_services | socrata | `fzy4-e84j` | ⚠️ | text lat/lng — wireable via `cast` mode |
| candidate | Mayor's Office End DV/GBV | social_services | socrata | `5ziv-wcy4` | ⚠️ | text lat/lng — wireable via `cast` mode |
| skip | Community Food Connection (pantries) | food | socrata | `mpqk-skis` | ❌ | no geo columns (quarterly report) |
| skip | NYCHA Facilities & Service Centers | — | socrata | `d4iy-9uh7` | ❌ | no lat/lng columns |

**NYC categories covered (live):** social_services, shelter, food (×2 — SNAP +
pantries), health, library, cooling, recreation, government. **Platform mix:**
`socrata` (12) + `arcgis-rest` (cooling + recreation) under `place:3651000`.
**Gap after adding first-class `warming`:** no NYC warming-center source wired yet.

---

## LA — `place:0644000` / `county:06037` / `state:06`

| Status | Source | Category | Platform | Dataset / layer | Vetted | Notes |
|--------|--------|----------|----------|-----------------|--------|-------|
| live | LA County EOC cooling centers | cooling | arcgis-rest | `…Cooling_Center_View/0` | ✅ | event-driven; empty outside heat events |
| live | LA County 211 homeless shelters | shelter | arcgis-rest | `LMS_Data_Public/MapServer/158` | ✅ | spatial-filtered 211 directory |
| live | LA County farmers' markets | food | arcgis-rest | `Farmers_Markets_chp/0` | ✅ | many accept SNAP/EBT |
| live | CalOES food banks | food | arcgis-rest | `Food_Banks/0` (state:06) | ✅ | umbrella orgs, coarse |
| live | LA City Rec & Parks | recreation | arcgis-rest | `…/MapServer/4` (place:0644000) | ✅ | double as cooling/warming |
| live | HRSA health centers | health | arcgis-rest | `PrimaryHealthCareFacilities_FS/0` (`us`) | ✅ | national, server-side spatial |
| live | LA County DPSS offices | social_services | arcgis-rest | `DPSS_Offices/FeatureServer/1` | ✅ | CalFresh/CalWORKs/Medi-Cal intake; 42 offices |
| live | LA Public Library branches | library | **socrata** | `a4nt-4gca` (data.lacity.org) | ✅ | **LA on Socrata** — nested `location` point col |
| live | LA Homeless Interim Housing | shelter | arcgis-rest | `Homeless_Interim_Housing/0` | ✅ | 347 sites; name+coords, addr via reconcile w/ 211 |
| candidate | LA County Points of Interest | other | arcgis-rest | `Points_of_Interest/0` | ❓ | broad; cat1/cat2 taxonomy, no `Librar` rows |
| candidate | LA County WIC sites | food | arcgis-rest | _find endpoint_ | ❓ | nutrition for women/children |

**LA categories covered (live):** cooling, shelter (×2), food, recreation, health,
social_services, library. **Platform mix proven:** LA uses both `arcgis-rest`
(8 sources) and `socrata` (LAPL libraries). **Gap:** government — no clean point
source found (LA POI is arts/rec only; ArcGIS surfaces boundary layers, not offices).
Candidate: LA City "neighborhood city halls" if a geocoded feed surfaces.

---

## Chicago — `place:1714000` / `county:17031` / `state:17`

| Status | Source | Category | Platform | Dataset / layer | Vetted | Notes |
|--------|--------|----------|----------|-----------------|--------|-------|
| live | Chicago Public Library branches | library | socrata | `psqp-6rmg` | ✅ | official CPL locations; GeoJSON-style point column |
| live | Chicago Cooling Centers | cooling | socrata | `msrk-w9ih` | ✅ | seasonal DFSS heat-refuge feed |
| live | Chicago Warming Centers | warming | socrata | `h243-v2q5` | ✅ | first-class warming category; seasonal DFSS cold-refuge feed |
| live | Chicago Community Service Centers | social_services | socrata | `bspy-6mw8` | ✅ | DFSS public benefits/emergency assistance centers |
| live | Chicago Primary Care Community Health Centers | health | socrata | `cjg8-dbka` | ✅ | city health-center feed; overlaps HRSA for reconciliation |
| skip | Chicago grocery/food retail datasets | food | socrata | various | ❌ | not food-aid pantry/soup-kitchen coverage |

**Chicago categories covered (live):** library, cooling, warming,
social_services, health. HRSA remains the national health fallback. **Known gap:**
food aid — no clean official pantry feed was verified for v1.

---

## Alerts domain — `alerts.sources.json` (AlertPanel)

> Separate typed registry (see `location-data-network.md` §5b). Emits `WeatherAlert`,
> not `NearbyResource`. National rows always match; city/state rows select by
> jurisdiction like resources. Each item is stamped with its source for per-item
> attribution in the panel.

| Status | Source | Kind | sourceType | jurisdictionId | Vetted | Notes |
|--------|--------|------|------------|----------------|--------|-------|
| live | National Weather Service | weather | nws-weather | `us` | ✅ | active CAP alerts at the point |
| live | USGS Earthquakes | seismic | usgs-earthquake | `us` | ✅ | M3.5+ within 300 km, 7 days |
| live | NASA EONET | natural events | nasa-eonet | `us` | ✅ | wildfire/storm/volcano/landslide/dust |
| live | NOAA NTWC/PTWC | tsunami | noaa-tsunami | `state:06/41/53/02/15/72` | ✅ | coastal CAP messages |
| live | NYPD Complaint Data (YTD) | crime | socrata-local-incident | `place:3651000` | ✅ | `qgea-i56i`; point col `lat_lon` |
| candidate | LAPD Crime 2020–present | crime | socrata-local-incident | `place:0644000` | ⚠️ | `2nrs-mtv8`; **`enabled:false` — dataset FROZEN at 2024-12-30** (LAPD RMS migration); fields verified |
| live | Chicago Crimes (1yr) | crime | socrata-local-incident | `place:1714000` | ✅ | `x2n5-8w5q`; **fresh (2026-06-12)**; Point `location`; field `_primary_decsription` (sic) |
| candidate | NYCEM Emergency Notifications | emergency | socrata-local-incident | `place:3651000` | ⚠️ | `8vv7-7wx3`; **`enabled:false` — export STALE (2025-09-15)**; no geo (city-scoped); real `includeCategories` set |
| live | CAL FIRE Active Incidents | wildfire | calfire | `state:06` | ✅ | active incidents within ~300 km; acres/containment; returns 2026 fires |
| candidate | EPA AirNow | air quality | airnow | `us` | ✅ | AQI ≥ USG only; **needs `AIRNOW_API_KEY`** → `enabled:false` until set |
| live | FEMA Declarations | state of emergency | openfema-declaration | `county:06037` / `county:17031` / `state:36` | ✅ | recent-OR-still-active by FIPS; verified live (Canyon/Hurst/Eaton fires); separate from NewsTicker FEMA |

**Alert types covered (live):** weather, seismic, natural events, tsunami, crime
(NYC existing + Chicago), wildfire (CA), federal disaster declarations
(LA/Chicago/NYC). **Key-gated:** air quality (AirNow). **Wired but disabled
(upstream frozen/stale):** LA crime, NYC emergency notifications — re-enable when
the open-data exports resume. **Backlog:** Chicago OEMC notifications (no clean
dataset), state 511 traffic feeds, CA/LA governor proclamations (RSS only), a
live LAPD crime feed to replace the frozen `2nrs-mtv8`.

---

## Backlog / next discovery

- **Chicago food aid:** locate a clean official pantry/soup-kitchen feed before
  adding `food`; do not use grocery stores as a proxy.
- **LA:** locate live ArcGIS endpoints for libraries, DPSS social services, and WIC
  (fills LA's library + social_services gaps to match NYC breadth).
- **NYC food pantries:** find a geocoded pantry dataset (the FacDB or a Food Help
  NYC export) — current food coverage is SNAP enrollment, not distribution sites.
- **NYC ArcGIS demo:** wire one NYC `arcgis-rest` source (FacDB) to prove the
  platform mix within one city.
- **Cooling/warming:** NYC seasonal cooling-center finder when published for the season.
- **Sub-jurisdiction keys:** Queens Library is NYC-wide today; refine to a Queens
  borough/county key once sub-municipal coverage lands (resolver TODO).
