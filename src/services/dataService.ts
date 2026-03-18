/**
 * Data Service - Provides access to component database
 *
 * Catalog loading priority (merged by ID, later wins):
 *   1. Local mock data  — 70 curated components with full specs (always bundled)
 *   2. Local scraped catalog — from public/catalog.json (run `npm run scrape`)
 *   3. Supabase DB (primary) — cloud-hosted component catalog
 *   4. AsyncStorage cache — from previous remote fetch
 *   5. GitHub raw catalog (fallback) — fetched weekly in background
 *
 * Write path (after scraping):
 *   scraper → Supabase DB (primary) → GitHub raw (fallback)
 *
 * Debug: prints catalog diagnostics on every boot to the console.
 */

import { Component, ComponentType, Brand } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase, isSupabaseReady, DbComponent } from './supabase';

// ─── Internal state ────────────────────────────────────────────────────────────

let componentsDatabase: Component[] = [];

/** Tracks how the current catalog was loaded (for debug log). */
let catalogSource:
  | 'local-only'
  | 'local+scraped'
  | 'local+scraped+cache'
  | 'local+cache'
  | 'local+remote'
  | 'local+supabase'
  | 'local+scraped+supabase' = 'local-only';

const STORAGE_KEYS = {
  catalog: 'comparex.catalog.v2',
  catalogUpdatedAt: 'comparex.catalog.updatedAt.v2',
} as const;

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Catalog URL resolution ────────────────────────────────────────────────────

function getCatalogUrl(): string | null {
  // 1. Expo public env var  (set in .env as EXPO_PUBLIC_CATALOG_URL)
  const envUrl = process.env.EXPO_PUBLIC_CATALOG_URL;
  if (envUrl && !envUrl.includes('<your-')) return envUrl;

  // 2. app.json / app.config extra
  const extraUrl = (Constants.expoConfig as any)?.extra?.catalogUrl as string | undefined;
  if (extraUrl && !extraUrl.includes('<your-')) return extraUrl;

  // 3. No valid URL configured → return null (app will use local scraped catalog + mock data)
  console.log(
    '[Catalog] EXPO_PUBLIC_CATALOG_URL is not set.\n' +
    '  → Using local scraped catalog (public/catalog.json) + bundled mock data.\n' +
    '  → To enable remote auto-refresh, create a .env file with:\n' +
    '     EXPO_PUBLIC_CATALOG_URL=https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/public/catalog.json'
  );
  return null;
}

// ─── Validation & Hydration ─────────────────────────────────────────────────────

/**
 * Checks if a raw object has the minimum shape to be treated as a component.
 * Scraped entries only have id/name/brand/type/performanceScore — this is enough.
 */
function isComponentLike(x: any): boolean {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.type === 'string' &&
    typeof x.brand === 'string' &&
    typeof x.performanceScore === 'number'
  );
}

/**
 * Adds sensible defaults for any missing required fields on scraped entries.
 * This lets minimal scraped catalog entries (id, name, brand, type, performanceScore)
 * behave as full Component objects throughout the app.
 */
function hydrateComponent(raw: any): Component {
  return {
    id: raw.id,
    name: raw.name,
    brand: raw.brand,
    type: raw.type,
    imageUrl: raw.imageUrl ?? undefined,
    price: raw.price ?? 0,
    releaseDate: raw.releaseDate ?? new Date().toISOString(),
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    performanceScore: raw.performanceScore,
    popularity: raw.popularity ?? 0,
    specs: raw.specs ?? {},
    fullSpecs: raw.fullSpecs ?? {},
    benchmarks: raw.benchmarks ?? [],
    priceHistory: raw.priceHistory ?? [],
    reviews: raw.reviews ?? [],
    compatibleParts: raw.compatibleParts ?? undefined,
  };
}

/**
 * Convert a Supabase DB row into a Component.
 */
function dbRowToComponent(row: DbComponent): Component {
  return hydrateComponent({
    id: row.id,
    name: row.name,
    brand: row.brand,
    type: row.type,
    performanceScore: row.performance_score,
    price: row.price,
    specs: row.specs ?? {},
    benchmarks: row.benchmarks?.list ?? [],
    fullSpecs: row.specs ?? {},
  });
}

// ─── Merge ─────────────────────────────────────────────────────────────────────

function mergeById(local: Component[], remote: Component[]): Component[] {
  const map = new Map<string, Component>();
  for (const c of local) map.set(c.id, c);
  for (const c of remote) map.set(c.id, c);
  return Array.from(map.values());
}

// ─── AsyncStorage cache ────────────────────────────────────────────────────────

async function readCachedCatalog(): Promise<Component[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.catalog);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const filtered = parsed.filter(isComponentLike).map(hydrateComponent);
    return filtered.length ? filtered : null;
  } catch (e) {
    console.warn('[Catalog] Failed to read cache:', e);
    return null;
  }
}

async function writeCachedCatalog(components: Component[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(components));
    await AsyncStorage.setItem(STORAGE_KEYS.catalogUpdatedAt, String(Date.now()));
  } catch (e) {
    console.warn('[Catalog] Failed to write cache:', e);
  }
}

async function getCatalogAgeMs(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.catalogUpdatedAt);
    if (!raw) return null;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return null;
    return Date.now() - ts;
  } catch {
    return null;
  }
}

// ─── Supabase fetch ─────────────────────────────────────────────────────────────

/**
 * Fetch components from Supabase.
 * Returns null if Supabase is not configured or fetch fails.
 */
async function fetchFromSupabase(): Promise<Component[] | null> {
  if (!isSupabaseReady()) return null;

  try {
    console.log('[Catalog] Fetching from Supabase...');

    // Fetch in batches of 1000 (Supabase default limit)
    let allRows: DbComponent[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .range(offset, offset + batchSize - 1)
        .order('performance_score', { ascending: false });

      if (error) {
        console.warn('[Catalog] Supabase fetch error:', error.message);
        return null;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(data as DbComponent[]);
        offset += batchSize;
        if (data.length < batchSize) hasMore = false;
      }
    }

    if (allRows.length === 0) {
      console.log('[Catalog] Supabase returned 0 components');
      return null;
    }

    const components = allRows.map(dbRowToComponent);
    console.log(`[Catalog] Supabase: ${allRows.length} rows → ${components.length} components`);
    return components;
  } catch (e) {
    console.warn('[Catalog] Supabase fetch failed:', e);
    return null;
  }
}

// ─── Remote fetch (GitHub fallback) ─────────────────────────────────────────────

/**
 * Fetches the remote catalog.json from GitHub.
 * Handles two shapes:
 *   - flat array: [...]
 *   - wrapped:    { components: [...], _meta: {...} }
 */
async function fetchRemoteCatalog(): Promise<Component[] | null> {
  const url = getCatalogUrl();
  if (!url) return null;

  console.log(`[Catalog] Fetching remote catalog from: ${url}`);

  try {
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!res.ok) {
      console.warn(`[Catalog] Remote fetch failed: HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    // Handle both shapes
    let rawArray: any[];
    if (Array.isArray(json)) {
      rawArray = json;
    } else if (json && Array.isArray(json.components)) {
      rawArray = json.components;
      if (json._meta) {
        console.log('[Catalog] Remote catalog meta:', JSON.stringify(json._meta));
      }
    } else {
      console.warn('[Catalog] Remote JSON is not an array and has no .components array — ignoring.');
      return null;
    }

    const filtered = rawArray.filter(isComponentLike).map(hydrateComponent);
    console.log(`[Catalog] Remote catalog: ${rawArray.length} raw entries → ${filtered.length} valid components`);

    return filtered.length ? filtered : null;
  } catch (e) {
    console.warn('[Catalog] Remote fetch error:', e);
    return null;
  }
}

// ─── Local JSON catalog loaders ─────────────────────────────────────────────────

/**
 * Loads the four curated JSON data files (cpus, gpus, ram, socs).
 * These are always bundled and provide 150+ real, accurate components with full specs.
 */
function loadLocalJsonCatalog(): Component[] {
  const results: Component[] = [];

  // Helper — processes one JSON file's array into hydrated components
  function loadJson(key: string, raw: any): void {
    try {
      const arr: any[] = Array.isArray(raw) ? raw : (raw?.components ?? []);
      const valid = arr.filter(isComponentLike).map(hydrateComponent);
      console.log(`[Catalog] Loaded ${valid.length} entries from ${key}.json`);
      results.push(...valid);
    } catch (e) {
      console.warn(`[Catalog] Could not process ${key}.json:`, e);
    }
  }

  // Static requires — Metro/webpack MUST see literal strings here
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { loadJson('cpus',  require('../data/cpus.json'));  } catch { /* file missing */ }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { loadJson('gpus',  require('../data/gpus.json'));  } catch { /* file missing */ }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { loadJson('ram',   require('../data/ram.json'));   } catch { /* file missing */ }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { loadJson('socs',  require('../data/socs.json'));  } catch { /* file missing */ }

  return results;
}

// ─── Local scraped catalog loader ───────────────────────────────────────────────

/**
 * Attempts to load the scraped catalog from public/catalog.json.
 * This is bundled at build-time — run `npm run scrape` first to generate it.
 * Returns null if the file doesn't exist or has no valid entries.
 */
function loadLocalScrapedCatalog(): Component[] | null {
  try {
    // Static require — bundled by Metro/webpack at build-time
    const catalogJson = require('../../public/catalog.json');

    let rawArray: any[];
    if (Array.isArray(catalogJson)) {
      rawArray = catalogJson;
    } else if (catalogJson && Array.isArray(catalogJson.components)) {
      rawArray = catalogJson.components;
    } else {
      return null;
    }

    const filtered = rawArray.filter(isComponentLike).map(hydrateComponent);
    return filtered.length > 0 ? filtered : null;
  } catch (e) {
    // File may not exist if scraper hasn't been run
    console.log('[Catalog] No local scraped catalog found (run `npm run scrape` to generate one).');
    return null;
  }
}

// ─── Initialize ────────────────────────────────────────────────────────────────

/**
 * Initialize the component database.
 *
 * Loading priority:
 *   1. Bundled mock data (always — curated 70 components with full specs)
 *   2. Local scraped catalog from public/catalog.json (5000+ if scraper has run)
 *   3. Supabase DB (primary cloud source)
 *   4. AsyncStorage cache (from previous remote fetch)
 *   5. GitHub catalog (weekly fallback)
 *
 * Prints a debug diagnostics block on every boot.
 */
export async function initializeDatabase(): Promise<void> {
  const bootStart = Date.now();

  // 1a. Load bundled mock data (always available — curated with full specs)
  const mockDataModule = require('../data/mockData');
  const mockData = mockDataModule.generateMockData() as Component[];

  // 1b. Load the four curated JSON files (150+ real components, override mock IDs)
  const jsonData = loadLocalJsonCatalog();

  // Merge mock + JSON — JSON wins on duplicate IDs (richer specs)
  const local = mergeById(mockData, jsonData);
  const localCpus = local.filter((c) => c.type === 'CPU').length;
  const localGpus = local.filter((c) => c.type === 'GPU').length;

  // 2. Load local scraped catalog (public/catalog.json)
  const localScraped = loadLocalScrapedCatalog();
  const localScrapedCount = localScraped?.length ?? 0;

  // 3. Try Supabase DB (primary cloud source)
  const supabaseData = await fetchFromSupabase();

  // 4. Load AsyncStorage cache
  const cachedRemote = await readCachedCatalog();

  // 5. Merge everything: mock (base) → scraped (bulk) → supabase/cache (freshest)
  if (supabaseData && localScraped) {
    componentsDatabase = mergeById(mergeById(local, localScraped), supabaseData);
    catalogSource = 'local+scraped+supabase';
  } else if (supabaseData) {
    componentsDatabase = mergeById(local, supabaseData);
    catalogSource = 'local+supabase';
  } else if (localScraped && cachedRemote) {
    componentsDatabase = mergeById(mergeById(local, localScraped), cachedRemote);
    catalogSource = 'local+scraped+cache';
  } else if (localScraped) {
    componentsDatabase = mergeById(local, localScraped);
    catalogSource = 'local+scraped';
  } else if (cachedRemote) {
    componentsDatabase = mergeById(local, cachedRemote);
    catalogSource = 'local+cache';
  } else {
    componentsDatabase = local;
    catalogSource = 'local-only';
  }

  // Cache Supabase data locally for offline use
  if (supabaseData && supabaseData.length > 0) {
    await writeCachedCatalog(supabaseData);
  }

  // 6. Print boot diagnostics
  const age = await getCatalogAgeMs();
  const ageStr = age != null
    ? `${(age / (1000 * 60 * 60)).toFixed(1)} hours ago`
    : 'never';
  const lastUpdatedDate = age != null
    ? new Date(Date.now() - age).toISOString()
    : 'n/a';

  const cpuCount = componentsDatabase.filter((c) => c.type === 'CPU').length;
  const gpuCount = componentsDatabase.filter((c) => c.type === 'GPU').length;
  const ssdCount = componentsDatabase.filter((c) => c.type === 'SSD').length;
  const ramCount = componentsDatabase.filter((c) => c.type === 'RAM').length;
  const otherCount = componentsDatabase.length - cpuCount - gpuCount - ssdCount - ramCount;
  const catalogUrl = getCatalogUrl();

  console.log(
    '\n' +
    '╔══════════════════════════════════════════════════════╗\n' +
    '║           CompareX Catalog Diagnostics               ║\n' +
    '╠══════════════════════════════════════════════════════════╣\n' +
    `║  Source          : ${catalogSource.padEnd(34)}║\n` +
    `║  Total loaded    : ${String(componentsDatabase.length).padEnd(34)}║\n` +
    `║    CPUs          : ${String(cpuCount).padEnd(34)}║\n` +
    `║    GPUs          : ${String(gpuCount).padEnd(34)}║\n` +
    `║    SSDs          : ${String(ssdCount).padEnd(34)}║\n` +
    `║    RAM           : ${String(ramCount).padEnd(34)}║\n` +
    `║    Other         : ${String(otherCount).padEnd(34)}║\n` +
    '╠──────────────────────────────────────────────────────╣\n' +
    `║  Bundled local   : ${String(local.length).padEnd(34)}║\n` +
    `║    (${localCpus} CPUs, ${localGpus} GPUs, ${jsonData.length} from JSON)`.padEnd(55) + '║\n' +
    `║  Scraped local   : ${String(localScrapedCount).padEnd(34)}║\n` +
    `║  Supabase        : ${String(supabaseData?.length ?? 0).padEnd(34)}║\n` +
    `║  Cache entries   : ${String(cachedRemote?.length ?? 0).padEnd(34)}║\n` +
    '╠──────────────────────────────────────────────────────╣\n' +
    `║  Supabase ready  : ${String(isSupabaseReady()).padEnd(34)}║\n` +
    `║  Last remote     : ${ageStr.padEnd(34)}║\n` +
    `║  Last updated    : ${lastUpdatedDate.substring(0, 34).padEnd(34)}║\n` +
    `║  Catalog URL     : ${(catalogUrl ?? '(not configured)').substring(0, 34).padEnd(34)}║\n` +
    `║  Boot time       : ${(Date.now() - bootStart + 'ms').padEnd(34)}║\n` +
    '╚══════════════════════════════════════════════════════════╝\n'
  );

  // 7. Trigger background refresh if stale (GitHub fallback)
  refreshRemoteCatalogIfNeeded().catch((e) => {
    console.warn('[Catalog] Background refresh failed:', e);
  });
}

// ─── Background refresh ────────────────────────────────────────────────────────

/**
 * Refresh remote catalog if it's older than a week.
 * Tries Supabase first, then falls back to GitHub.
 */
export async function refreshRemoteCatalogIfNeeded(force: boolean = false): Promise<void> {
  const age = await getCatalogAgeMs();
  const isStale = age == null || age > ONE_WEEK_MS;

  if (!force && !isStale) {
    console.log('[Catalog] Cache is fresh — skipping remote fetch.');
    return;
  }

  console.log(`[Catalog] Cache is stale (age: ${age ?? 'none'}) — refreshing...`);

  // Try Supabase first
  const supabaseData = await fetchFromSupabase();
  if (supabaseData && supabaseData.length > 0) {
    await writeCachedCatalog(supabaseData);
    const before = componentsDatabase.length;
    componentsDatabase = mergeById(componentsDatabase, supabaseData);
    catalogSource = 'local+supabase';
    console.log(`[Catalog] ✅ Refreshed from Supabase: ${before} → ${componentsDatabase.length} components`);
    return;
  }

  // Fallback to GitHub
  const remote = await fetchRemoteCatalog();
  if (!remote) {
    console.warn('[Catalog] Remote fetch returned nothing — keeping current data.');
    return;
  }

  await writeCachedCatalog(remote);

  const before = componentsDatabase.length;
  componentsDatabase = mergeById(componentsDatabase, remote);
  catalogSource = 'local+remote';

  console.log(`[Catalog] ✅ Refreshed from GitHub: ${before} → ${componentsDatabase.length} components`);
}

// ─── Write to Supabase ──────────────────────────────────────────────────────────

/**
 * Push components to Supabase.
 * Used by the scraper / GitHub Action to update the cloud catalog.
 * Requires service role key (not the anon key).
 */
export async function pushComponentsToSupabase(
  components: Array<{
    id: string;
    type: string;
    name: string;
    brand: string;
    specs: Record<string, any>;
    benchmarks: Record<string, any>;
    performanceScore: number;
    price: number;
  }>,
): Promise<{ inserted: number; errors: number }> {
  if (!isSupabaseReady()) {
    console.warn('[Catalog] Cannot push to Supabase — not configured');
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;
  const batchSize = 100;

  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize).map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      brand: c.brand,
      specs: c.specs,
      benchmarks: c.benchmarks,
      performance_score: c.performanceScore,
      price: c.price,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('components')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.warn(`[Catalog] Supabase upsert batch ${i / batchSize + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`[Catalog] Pushed to Supabase: ${inserted} inserted, ${errors} errors`);
  return { inserted, errors };
}

// ─── Query API ─────────────────────────────────────────────────────────────────

export function getAllComponents(): Component[] {
  return componentsDatabase;
}

export function getComponentsByType(type: ComponentType): Component[] {
  return componentsDatabase.filter((c) => c.type === type);
}

export function getComponentById(id: string): Component | undefined {
  return componentsDatabase.find((c) => c.id === id);
}

export function getComponentsByBrand(brand: Brand): Component[] {
  return componentsDatabase.filter((c) => c.brand === brand);
}

export async function getRecentlyViewed(): Promise<Component[]> {
  return [];
}

export function getTrendingComparisons(): Component[][] {
  if (componentsDatabase.length === 0) return [];

  const pairIds: Array<[string, string]> = [
    ['gpu-rtx-4080-super', 'gpu-rx-7900-xtx'],
    ['cpu-i9-14900k', 'cpu-r9-7950x'],
    ['cpu-r7-7800x3d', 'cpu-i5-13600k'],
    ['gpu-rtx-4070-ti-super', 'gpu-rx-7800-xt'],
  ];

  const pairs: Component[][] = [];
  for (const [aId, bId] of pairIds) {
    const a = getComponentById(aId);
    const b = getComponentById(bId);
    if (a && b) pairs.push([a, b]);
  }

  return pairs;
}

export function getTopGpus(limit: number = 5): Component[] {
  return componentsDatabase
    .filter((c) => c.type === 'GPU')
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, limit);
}

export function getFeaturedDeal(): Component | null {
  if (componentsDatabase.length === 0) return null;

  const withValue = componentsDatabase
    .filter((c) => c.price > 0)
    .map((c) => ({
      component: c,
      valueScore: c.performanceScore / c.price,
    }))
    .sort((a, b) => b.valueScore - a.valueScore);

  return withValue[0]?.component || null;
}

export function searchComponents(query: string): Component[] {
  const lowerQuery = query.toLowerCase();
  return componentsDatabase.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.brand.toLowerCase().includes(lowerQuery) ||
      c.type.toLowerCase().includes(lowerQuery)
  );
}

// ─── Catalog Metadata ──────────────────────────────────────────────────────────

export interface CatalogMeta {
  totalComponents: number;
  cpuCount: number;
  gpuCount: number;
  ssdCount: number;
  otherCount: number;
  lastRemoteUpdate: string | null;
  isStale: boolean;
  source: string;
  supabaseReady: boolean;
}

export async function getCatalogMeta(): Promise<CatalogMeta> {
  const all = componentsDatabase;
  const cpuCount = all.filter((c) => c.type === 'CPU').length;
  const gpuCount = all.filter((c) => c.type === 'GPU').length;
  const ssdCount = all.filter((c) => c.type === 'SSD').length;
  const otherCount = all.length - cpuCount - gpuCount - ssdCount;

  let lastRemoteUpdate: string | null = null;
  let isStale = true;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.catalogUpdatedAt);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts)) {
        lastRemoteUpdate = new Date(ts).toISOString();
        isStale = Date.now() - ts > ONE_WEEK_MS;
      }
    }
  } catch {
    // ignore
  }

  return {
    totalComponents: all.length,
    cpuCount,
    gpuCount,
    ssdCount,
    otherCount,
    lastRemoteUpdate,
    isStale,
    source: catalogSource,
    supabaseReady: isSupabaseReady(),
  };
}
