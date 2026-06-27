import type {
  CommunityStore,
  CommunityTip,
  ListingIssueReport,
  CommunityOpportunity,
  LocalUpdate,
} from './types';

// ─── Supabase REST helpers (no npm package — raw fetch) ───────────────────────
// Used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
// The service role key is server-only; never expose to the browser.

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL;
}

function supabaseKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl() && supabaseKey());
}

function supabaseHeaders(): Record<string, string> {
  return {
    apikey: supabaseKey()!,
    Authorization: `Bearer ${supabaseKey()}`,
    'Content-Type': 'application/json',
  };
}

async function sbSelectAll<T>(table: string): Promise<T[]> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}?select=record`, {
    headers: supabaseHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`supabase:select:${table}:${res.status}`);
  const rows = (await res.json()) as { record: T }[];
  return rows.map((r) => r.record);
}

async function sbUpsertAll(
  table: string,
  items: Array<{ id: string }>,
): Promise<void> {
  if (items.length === 0) return;
  const body = items.map((item) => ({ id: item.id, record: item }));
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`supabase:upsert:${table}:${res.status}`);
}

// ─── File-store fallback (development only) ───────────────────────────────────

// Lazy-require node:fs so this module can be imported in environments where the
// node: protocol is available (Next.js API routes) without erroring if the
// Supabase path is taken.
async function fileStoreRead(): Promise<CommunityStore> {
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  const dataDir = path.join(process.cwd(), '.data');
  const storeFile = path.join(dataDir, 'community-store.json');
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(storeFile, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CommunityStore>;
    return {
      tips: parsed.tips ?? [],
      reports: parsed.reports ?? [],
      opportunities: parsed.opportunities ?? [],
      updates: parsed.updates ?? [],
    };
  } catch {
    return { tips: [], reports: [], opportunities: [], updates: [] };
  }
}

async function fileStoreWrite(data: CommunityStore): Promise<void> {
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  const dataDir = path.join(process.cwd(), '.data');
  const storeFile = path.join(dataDir, 'community-store.json');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storeFile, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readStore(): Promise<CommunityStore> {
  if (isSupabaseConfigured()) {
    const [tips, reports, opportunities, updates] = await Promise.all([
      sbSelectAll<CommunityTip>('community_tips'),
      sbSelectAll<ListingIssueReport>('resource_reports'),
      sbSelectAll<CommunityOpportunity>('community_opportunities'),
      sbSelectAll<LocalUpdate>('local_updates'),
    ]);
    return { tips, reports, opportunities, updates };
  }
  return fileStoreRead();
}

export async function writeStore(data: CommunityStore): Promise<void> {
  if (isSupabaseConfigured()) {
    await Promise.all([
      sbUpsertAll('community_tips', data.tips),
      sbUpsertAll('resource_reports', data.reports),
      sbUpsertAll('community_opportunities', data.opportunities),
      sbUpsertAll('local_updates', data.updates),
    ]);
    return;
  }
  return fileStoreWrite(data);
}
