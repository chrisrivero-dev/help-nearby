import type {
  CommunityAdapterConfig,
  CommunitySourceItem,
  HtmlCalendarAdapterConfig,
  JsonFeedAdapterConfig,
  RssAtomAdapterConfig,
} from './types';
import { normalizeIsoDate } from './normalize';

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHtmlText(value: string | undefined): string | undefined {
  const cleaned = value
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
}

function collectJsonLdEvents(html: string): CommunitySourceItem[] {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!scripts) return [];

  const items: CommunitySourceItem[] = [];
  for (const script of scripts) {
    const raw = script
      .replace(/^<script[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim();
    try {
      const parsed = JSON.parse(raw) as unknown;
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length > 0) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        const record = node as Record<string, unknown>;
        if (Array.isArray(record['@graph'])) queue.push(...record['@graph']);
        const type = record['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (!types.some((t) => String(t).toLowerCase() === 'event')) continue;
        const location =
          record.location && typeof record.location === 'object'
            ? (record.location as Record<string, unknown>)
            : {};
        const address =
          location.address && typeof location.address === 'object'
            ? (location.address as Record<string, unknown>)
            : undefined;
        items.push({
          externalId: String(record['@id'] ?? record.url ?? record.name ?? ''),
          title: String(record.name ?? ''),
          type: 'event',
          description:
            typeof record.description === 'string'
              ? record.description
              : undefined,
          venueName:
            typeof location.name === 'string' ? location.name : undefined,
          address: address
            ? [
                address.streetAddress,
                address.addressLocality,
                address.addressRegion,
                address.postalCode,
              ]
                .filter(Boolean)
                .join(', ')
            : typeof location.address === 'string'
              ? location.address
              : undefined,
          startAt:
            typeof record.startDate === 'string'
              ? normalizeIsoDate(record.startDate)
              : undefined,
          endAt:
            typeof record.endDate === 'string'
              ? normalizeIsoDate(record.endDate)
              : undefined,
          sourceUrl: typeof record.url === 'string' ? record.url : undefined,
        });
      }
    } catch {
      // Ignore malformed embedded JSON-LD from upstream pages.
    }
  }
  return items.filter((item) => item.title.trim());
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`community_source_fetch:${res.status}:${url}`);
  return res.text();
}

function field(record: Record<string, unknown>, key?: string): unknown {
  if (!key) return undefined;
  return key.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[part];
  }, record);
}

function arrayAtPath(root: unknown, path?: string): unknown[] {
  const value = path ? field(root as Record<string, unknown>, path) : root;
  return Array.isArray(value) ? value : [];
}

function numField(
  record: Record<string, unknown>,
  key?: string,
): number | undefined {
  const raw = field(record, key);
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// Expand `{today}` / `{today+Nd}` / `{today-Nd}` to an ISO `YYYY-MM-DD` date.
function expandDateTokens(value: string, now: Date): string {
  return value.replace(/\{today(?:([+-]\d+)d)?\}/g, (_m, offset?: string) => {
    const d = new Date(now);
    if (offset) d.setUTCDate(d.getUTCDate() + parseInt(offset, 10));
    return d.toISOString().slice(0, 10);
  });
}

// Substitute `${VAR}` from process.env; drop any header whose env var is unset
// so a key-gated source is skipped rather than sent without credentials.
function resolveHeaders(
  headers?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(headers ?? {})) {
    let missing = false;
    const resolved = rawValue.replace(/\$\{(\w+)\}/g, (_m, name: string) => {
      const v = process.env[name];
      if (v === undefined || v === '') {
        missing = true;
        return '';
      }
      return v;
    });
    if (missing) continue;
    out[key] = resolved;
  }
  return out;
}

function buildJsonUrl(config: JsonFeedAdapterConfig, now: Date): string {
  if (!config.query) return config.url;
  const url = new URL(config.url);
  for (const [key, rawValue] of Object.entries(config.query)) {
    url.searchParams.set(key, expandDateTokens(rawValue, now));
  }
  return url.toString();
}

async function runJson(
  config: JsonFeedAdapterConfig,
): Promise<CommunitySourceItem[]> {
  const url = buildJsonUrl(config, new Date());
  const res = await fetch(url, {
    headers: resolveHeaders(config.headers),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`community_json_fetch:${res.status}:${url}`);
  const json = (await res.json()) as unknown;
  return arrayAtPath(json, config.arrayPath).map((raw) => {
    const record =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const map = config.fieldMap ?? {};
    return {
      externalId: String(
        field(record, map.externalId) ?? field(record, 'id') ?? '',
      ),
      title: String(field(record, map.title) ?? field(record, 'title') ?? ''),
      // Pass the raw type/default through; normalizeCommunityItem maps it to the
      // enum. (mapCommunityType never returns nullish, so a `?? defaultType`
      // fallback here would be dead code.)
      type: (field(record, map.type) ??
        field(record, 'type') ??
        config.defaultType) as CommunitySourceItem['type'],
      category: String(field(record, map.category) ?? ''),
      dateLabel: String(field(record, map.dateLabel) ?? ''),
      timeLabel: String(field(record, map.timeLabel) ?? ''),
      website: String(field(record, map.website) ?? ''),
      organizationName:
        String(field(record, map.organizationName) ?? '') ||
        config.organizationName,
      description: String(field(record, map.description) ?? ''),
      venueName: String(field(record, map.venueName) ?? ''),
      address: String(field(record, map.address) ?? ''),
      latitude: numField(record, map.latitude),
      longitude: numField(record, map.longitude),
      startAt: String(
        field(record, map.startAt) ?? field(record, 'startAt') ?? '',
      ),
      endAt: String(field(record, map.endAt) ?? field(record, 'endAt') ?? ''),
      sourceUrl: String(
        field(record, map.sourceUrl) ?? field(record, 'url') ?? '',
      ),
      contactPhone: String(field(record, map.contactPhone) ?? ''),
      contactEmail: String(field(record, map.contactEmail) ?? ''),
    };
  });
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function tag(block: string, names: string[]): string | undefined {
  for (const name of names) {
    const match = block.match(
      new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'),
    );
    if (match)
      return decodeXml(match[1])
        .replace(/<[^>]+>/g, ' ')
        .trim();
  }
  return undefined;
}

async function runRss(
  config: RssAtomAdapterConfig,
): Promise<CommunitySourceItem[]> {
  const xml = await fetchText(config.url);
  const blocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ??
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ??
    [];
  return blocks
    .map((block) => ({
      externalId: tag(block, ['guid', 'id', 'link']),
      title: tag(block, ['title']) ?? '',
      type: config.defaultType ?? 'event',
      organizationName: config.organizationName,
      description: tag(block, ['description', 'summary', 'content']),
      startAt: tag(block, ['startDate', 'published', 'pubDate', 'updated']),
      sourceUrl: tag(block, ['link']),
    }))
    .filter((item) => item.title.trim());
}

async function runHtml(
  config: HtmlCalendarAdapterConfig,
): Promise<CommunitySourceItem[]> {
  const html = await fetchText(config.url);
  const jsonLd = collectJsonLdEvents(html);
  if (jsonLd.length > 0) {
    return jsonLd.map((item) => ({
      ...item,
      type: item.type ?? config.defaultType ?? 'event',
      organizationName: item.organizationName ?? config.organizationName,
      sourceUrl: item.sourceUrl ?? config.url,
    }));
  }

  const title =
    cleanHtmlText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) ||
    cleanHtmlText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) ||
    `Events from ${config.organizationName ?? 'this official source'}`;
  return [
    {
      externalId: `${config.url}#calendar`,
      title,
      type: config.defaultType ?? 'event',
      organizationName: config.organizationName,
      description: `Official calendar source for community events and public gatherings.`,
      sourceUrl: config.url,
    },
  ];
}

export function runCommunityAdapter(
  config: CommunityAdapterConfig,
): Promise<CommunitySourceItem[]> {
  switch (config.kind) {
    case 'manual':
      return Promise.resolve(config.items);
    case 'html-calendar':
      return runHtml(config);
    case 'json-feed':
      return runJson(config);
    case 'rss-atom':
      return runRss(config);
    default: {
      const _exhaustive: never = config;
      throw new Error(
        `unknown community adapter: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}
