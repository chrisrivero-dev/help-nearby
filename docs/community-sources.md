# Community Sources — CommunityPanel Architecture

> **Living document.** This describes the source network behind
> [`CommunityPanel`](../frontend/src/components/help/CommunityPanel.tsx): official
> community events, volunteer opportunities, civic meetings, donation drives,
> celebrations, ceremonies, and source-backed community announcements.
>
> **Last updated:** 2026-06-20

---

## Purpose

`CommunityPanel` is separate from the resource finder. It is not a directory of
fixed service locations like shelters, clinics, food pantries, or libraries.
Instead, it surfaces time-sensitive or action-oriented community items from
official government and civic sources.

The primary source target is **lat/lon- or address-bearing records**. Broad
calendar hubs live in
[`directory.sources.json`](../frontend/src/data/directory.sources.json) and
the `/directory` page, not in `community.sources.json`, until their adapters can
emit an event or opportunity with a real location.

Examples:

- volunteer opportunities and service programs
- food drives and in-kind donation opportunities
- community board or neighborhood council meetings
- public gatherings, ceremonies, parades, and historic celebrations
- mayoral/community affairs announcements
- official parks, library, cultural affairs, and recreation calendars

The panel remains curated: public users only see approved, non-expired
`CommunityOpportunity` records.

---

## Runtime Flow

```
LocationContext
  └─ CommunityPanel
       └─ GET /api/community-opportunities?lat=...&lng=...
            ├─ read community store
            ├─ select community sources for lat/lng jurisdiction stack
            ├─ import source-backed opportunities
            ├─ upsert into store
            └─ return approved, non-expired rows for selected source ids
```

Key files:

- [`community.sources.json`](../frontend/src/data/community.sources.json) —
  source catalog for location-bearing community/event/opportunity feeds only.
- [`directory.sources.json`](../frontend/src/data/directory.sources.json) —
  directory-only catalog for broad official community/event source hubs.
- [`CommunityPanel.tsx`](../frontend/src/components/help/CommunityPanel.tsx) —
  client panel; sends `lat/lng` when location is valid.
- [`/api/community-opportunities`](../frontend/src/app/api/community-opportunities/route.ts) —
  public read route and admin create route.
- [`sources/registry.ts`](../frontend/src/lib/community/sources/registry.ts) —
  jurisdiction-aware source selection.
- [`sources/importer.ts`](../frontend/src/lib/community/sources/importer.ts) —
  import/upsert/expire behavior.
- [`sources/adapters.ts`](../frontend/src/lib/community/sources/adapters.ts) —
  adapter implementations for manual rows, HTML calendars, JSON feeds, and
  RSS/Atom feeds.
- [`types.ts`](../frontend/src/lib/community/types.ts) —
  `CommunityOpportunity` schema.

---

## Source Selection

Community sources use the same jurisdiction resolver model as the resource
network:

- NYC: `place:3651000`
- LA city: `place:0644000`
- LA County: `county:06037`
- State fallback: `state:36`, `state:06`
- National fallback: `us`

Rows in `community.sources.json` are selected only when their `jurisdictionId`
is in the resolved stack for the user’s coordinates. This file may be empty
when no location-bearing community feeds are registered.

This matters because the backing store is global. When coordinates are present,
`/api/community-opportunities` filters public results to the source ids selected
for that location so imported NYC rows do not appear in LA, and vice versa.

---

## Source Row Shape

Each source row includes:

```jsonc
{
  "id": "example-location-bearing-feed",
  "name": "Example Location-Bearing Community Feed",
  "url": "https://example.gov/events.json",
  "sourceType": "json-feed",
  "jurisdictionId": "place:3651000",
  "trust": 85,
  "refresh": "updated by the official publisher",
  "ttlSeconds": 21600,
  "enabled": true,
  "autoApprove": true,
  "requiresLocation": true,
  "notes": "Only register sources here when emitted rows include an address or coordinates.",
  "adapter": { "kind": "json-feed", "url": "https://example.gov/events.json" }
}
```

Important fields:

- `enabled` is the kill switch.
- `autoApprove` controls whether imported rows become visible immediately.
  Official source-backed rows are currently auto-approved; weaker/user/community
  submissions should remain pending.
- `requiresLocation` prevents generic source-hub rows from appearing in the
  public panel. When true, imported items must include coordinates or an
  address.
- `ttlSeconds` controls in-memory fetch caching.
- `adapter.kind` selects the fetch/normalization strategy.

---

## Adapters

Supported adapter kinds:

- `manual` — deterministic source-backed rows stored in the catalog. Use this
  only when the row itself has a real address or coordinates; broad source hubs
  belong in `directory.sources.json`.
- `html-calendar` — fetches an official calendar page, extracts JSON-LD `Event`
  objects when available, and otherwise emits a conservative browseable official
  calendar row when the page is reachable.
- `json-feed` — maps records from a public JSON endpoint using `fieldMap`.
- `rss-atom` — maps RSS/Atom entries into opportunities.

Adapters emit `CommunitySourceItem[]`; normalization turns those into
`CommunityOpportunity` records with source provenance.

---

## Import Behavior

The importer:

- selects sources by coordinates
- fetches each source independently
- normalizes rows into `CommunityOpportunity`
- drops rows from `requiresLocation` sources when they lack coordinates and
  address
- upserts by `(sourceId, externalId)` when available
- otherwise upserts by normalized title, organization, date, address, and URL
- preserves existing moderation status on update
- defaults source-backed rows to `approved` only when `autoApprove: true`
- immediately expires imported records whose `endAt` is in the past
- keeps missing imported records for one import cycle, then expires them if still
  missing on the next import

The store remains the existing dual-mode community store:

- Supabase REST when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- `.data/community-store.json` fallback in local development

---

## Public vs Admin Behavior

Public request:

```http
GET /api/community-opportunities?lat=40.758&lng=-73.9855
```

Returns only:

- approved records
- non-expired records
- records from selected source ids for that location, when coordinates are sent

Admin behavior:

- `GET /api/community-opportunities` with a valid bearer token returns all
  records, including pending and expired.
- `POST /api/community-opportunities` creates an admin-owned record.
- `POST /api/admin/community-opportunities/import` runs the import pipeline for
  supplied coordinates.

---

## Degraded Sources

A source is **degraded** when its adapter fails but the rest of the fan-out
continues.

Typical causes:

- the official site returns `403` to server-side requests
- the site blocks non-browser clients through CDN or bot protection
- the calendar is rendered by client-side JavaScript with no public feed visible
  in raw HTML
- the source has no documented JSON/RSS/iCal endpoint

Known examples:

- `nyc-parks-events` currently returns `403` from server-side probes.
- `la-rec-parks-events` currently returns `403` from server-side probes.

Do not make the whole panel fail because one upstream source fails. The importer
uses independent source checks and returns the rows it can verify.

---

## Adding A Source

1. Add broad official source hubs to
   [`directory.sources.json`](../frontend/src/data/directory.sources.json).
2. Add rows to
   [`community.sources.json`](../frontend/src/data/community.sources.json).
   only when they can emit address- or coordinate-bearing opportunities.
3. Use a jurisdiction id already supported by the resolver.
4. Prefer structured feeds in this order:
   `json-feed` → `rss-atom` → `html-calendar` → `manual`.
5. Prefer sources that accept or return lat/lon, address, or venue location.
   Generic citywide calendars should stay in the directory until a
   location-bearing feed is found.
6. Set `autoApprove: true` only for official source-backed records that are safe
   to show immediately.
7. Keep `requiresLocation: true` for public-facing sources unless there is a
   deliberate product reason to show non-nearby rows.
8. Keep `notes` explicit about limitations, access restrictions, or review
   requirements.
9. Add or update tests when the adapter behavior changes.

---

## Verification

Targeted checks:

```bash
cd frontend
pnpm jest --env=node communitySources route.test
pnpm exec tsc --noEmit
```

Live local checks:

```bash
curl 'http://localhost:3000/api/community-opportunities?lat=40.758&lng=-73.9855'
curl 'http://localhost:3000/api/community-opportunities?lat=34.0537&lng=-118.2427'
```

Expected behavior:

- NYC coordinates return NYC community source rows.
- LA coordinates return LA community source rows.
- Public rows have a real address or coordinates when their source requires
  location.
- A degraded source appears in import metadata but does not suppress healthy
  sources.
- Public responses do not include pending or expired records.
