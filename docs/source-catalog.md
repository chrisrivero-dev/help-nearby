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
| live | Health Centers (enrollment) | health | socrata | `gfej-by6h` | ✅ | city sites; complements HRSA |
| live | Financial Empowerment Centers | social_services | socrata | `dt2z-amuf` | ✅ | free financial counseling |
| live | Citywide Public Computer Centers | library | socrata | `sejx-2gn3` | ✅ | 362 in radius; digital access |
| live | Queens Public Library Branches | library | socrata | `kh3d-xhq7` | ✅ | borough-scoped within NYC |
| live | NYC Aging Senior Centers | social_services | socrata | `ygfr-ij6t` | ✅ | meals/activities for seniors |
| live | DHS Homebase (homelessness prevention) | social_services | socrata | `ntcm-2w4k` | ✅ | eviction prevention |
| live | Family Justice Centers | social_services | socrata | `xggi-kgx9` | ✅ | DV/GBV survivor services |
| candidate | NYC Aging Providers (all sites) | social_services | socrata | `u7wp-np5k` | ✅ | overlaps senior centers (good dedup test) |
| candidate | Child Care Programs (DOHMH) | social_services | socrata | `gy3q-4tzp` | ✅ | 2,592 rows — large; childcare |
| candidate | Workforce1 Career Centers | social_services | socrata | `6smc-7mk6` | ⚠️ | employment; `number`+`street` split address |
| candidate | NYCHA Community Facilities | recreation | socrata | `crns-fw6u` | ⚠️ | no clean single name field |
| candidate | NYCHA Customer Contact Centers | government | socrata | `37fm-7uaa` | ✅ | only ~2 sites |
| candidate | DOHMH HIV Service Directory | health | socrata | `pwts-g83w` | ❓ | needs field check |
| candidate | Women's Resource Network | social_services | socrata | `pqg4-dm6b` | ⚠️ | boolean category cols; address1/city only, no lat/lng |
| candidate | HS Alternatives referral centers | social_services | socrata | `w8dz-xpjh` | ✅ | ~4 sites |
| skip | NYC Aging contracted programs | — | socrata | `cqc8-am9x` | ⚠️ | lat/lng stored as text → SoQL type mismatch |
| skip | Older Adult Center Activities | — | socrata | `fzy4-e84j` | ⚠️ | lat/lng stored as text |
| skip | Mayor's Office End DV/GBV | — | socrata | `5ziv-wcy4` | ⚠️ | lat/lng stored as text |
| skip | Community Food Connection (pantries) | food | socrata | `mpqk-skis` | ❌ | no geo columns (quarterly report) |
| skip | NYCHA Facilities & Service Centers | — | socrata | `d4iy-9uh7` | ❌ | no lat/lng columns |

**NYC categories covered (live):** social_services, shelter, food, health, library.
**Gaps to fill:** cooling/warming centers, government, recreation, dedicated food
pantries. **Also available on ArcGIS** (not yet wired): NYC DCP Facilities Database
(FacDB) and NYCHA layers publish `arcgis-rest` endpoints that register identically.

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
| candidate | LA Homeless Interim Housing | shelter | arcgis-rest | `Homeless_Interim_Housing/0` | ❓ | LA County current interim housing |
| candidate | LA County Points of Interest | other | arcgis-rest | `Points_of_Interest/0` | ❓ | broad; needs category mapping |
| candidate | LA County / City libraries | library | arcgis-rest | _find endpoint_ | ❓ | fills LA library gap |
| candidate | LA County DPSS offices | social_services | arcgis-rest | _find endpoint_ | ❓ | fills LA social_services gap |
| candidate | LA County WIC sites | food | arcgis-rest | _find endpoint_ | ❓ | nutrition for women/children |

**LA categories covered (live):** cooling, shelter, food, recreation, health.
**Gaps to fill:** library, social_services, government.

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
