# Source Catalog — discovered data sources (LA / NYC)

> **Living document.** A running inventory of data sources discovered and vetted
> for the location-aware resource network, whether or not they're wired yet.
> Add a row when you discover a source; promote `candidate → live` when you wire
> it into [`sources.json`](../frontend/src/data/sources.json). To wire one, follow
> §5a of [`location-data-network.md`](./location-data-network.md) (adapter must
> exist + jurisdiction must be resolvable).
>
> **Last updated:** 2026-06-19

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
pantries), health, library, cooling, recreation, government — **all 8 of 9
non-`other` categories**. **Platform mix:** `socrata` (12) + `arcgis-rest` (cooling
+ recreation) under `place:3651000`. **No remaining gaps.**

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

## Backlog / next discovery

- **LA:** locate live ArcGIS endpoints for libraries, DPSS social services, and WIC
  (fills LA's library + social_services gaps to match NYC breadth).
- **NYC food pantries:** find a geocoded pantry dataset (the FacDB or a Food Help
  NYC export) — current food coverage is SNAP enrollment, not distribution sites.
- **NYC ArcGIS demo:** wire one NYC `arcgis-rest` source (FacDB) to prove the
  platform mix within one city.
- **Cooling/warming:** NYC seasonal cooling-center finder when published for the season.
- **Sub-jurisdiction keys:** Queens Library is NYC-wide today; refine to a Queens
  borough/county key once sub-municipal coverage lands (resolver TODO).
