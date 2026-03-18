#!/usr/bin/env ts-node
/**
 * scrapeAll.ts — CompareX Component Catalog Scraper v3.0
 *
 * Primary source: PassMark (CPU + GPU benchmark lists)
 *   → ~5800 CPUs (Intel + AMD + Other — scraped from 3 separate pages)
 *   → ~2800 GPUs with real benchmark scores
 *
 * Secondary source: TechPowerUp (attempted, but often blocked by bot detection)
 *   → Falls back gracefully when TechPowerUp's firewall blocks requests
 *
 * Anti-blocking measures:
 *   - Rotating browser-like User-Agent strings (8 variants, Chrome/Firefox/Safari/Edge 2026)
 *   - 2s delay between requests
 *   - Sequential page fetches (no parallel hammering)
 *   - Automatic retry with exponential backoff (up to 3 attempts)
 *   - HTML page caching to .scrape-cache/
 *   - Accept/Accept-Language headers to look like a real browser
 *
 * Output: public/catalog.json  (~8500+ components)
 *
 * Usage: npm run scrape
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// ─── Config ────────────────────────────────────────────────────────────────────

const DELAY_MS = 2000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 3000;
const CACHE_DIR = path.resolve(__dirname, '..', '.scrape-cache');
const OUT_DIR = path.resolve(__dirname, '..', 'public');
const OUT_FILE = path.join(OUT_DIR, 'catalog.json');

// ─── Rotating User-Agents ──────────────────────────────────────────────────────

const USER_AGENTS = [
  // Chrome 131–133 (Jan–Mar 2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  // Firefox 134 (2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
  // Safari 18 (2025–2026)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
  // Edge 132 (2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0',
];

let uaIndex = 0;
function getNextUserAgent(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

// ─── HTTP helper ───────────────────────────────────────────────────────────────

function fetchPage(url: string, attempt = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const cacheKey = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_').substring(0, 200);
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.html`);

    // Check cache — but invalidate if it's a bot-check page
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile, 'utf8');
      if (cached.length > 500 && !cached.includes('Automated bot check') && !cached.includes('pow-progress-bar')) {
        resolve(cached);
        return;
      } else if (cached.includes('Automated bot check')) {
        // Delete stale bot-check cache so we re-fetch
        try { fs.unlinkSync(cacheFile); } catch {}
      }
    }

    const ua = getNextUserAgent();
    const headers: Record<string, string> = {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        fetchPage(redirectUrl, attempt).then(resolve).catch(reject);
        return;
      }

      // Rate limited or server error → retry
      if (res.statusCode && (res.statusCode === 429 || res.statusCode >= 500)) {
        if (attempt < MAX_RETRIES) {
          const backoff = RETRY_BASE_MS * Math.pow(2, attempt - 1);
          console.warn(`  ⚠ HTTP ${res.statusCode} — retrying in ${backoff / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
          setTimeout(() => fetchPage(url, attempt + 1).then(resolve).catch(reject), backoff);
          return;
        }
        reject(new Error(`HTTP ${res.statusCode} after ${MAX_RETRIES} attempts: ${url}`));
        return;
      }

      if (res.statusCode === 403) {
        console.warn(`  ⛔ HTTP 403 Forbidden: ${url}`);
        resolve('');
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => {
        // Detect bot-check pages and don't cache them
        if (body.includes('Automated bot check') || body.includes('pow-progress-bar')) {
          console.warn(`  ⛔ Bot detection page received from ${url}`);
          resolve(''); // Return empty — will be handled gracefully
          return;
        }
        if (body.length > 500) {
          fs.mkdirSync(CACHE_DIR, { recursive: true });
          fs.writeFileSync(cacheFile, body, 'utf8');
        }
        resolve(body);
      });
    });
    req.on('error', (err) => {
      if (attempt < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        console.warn(`  ⚠ Network error — retrying in ${backoff / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        setTimeout(() => fetchPage(url, attempt + 1).then(resolve).catch(reject), backoff);
        return;
      }
      reject(err);
    });
    req.setTimeout(30000, () => {
      req.destroy();
      if (attempt < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        setTimeout(() => fetchPage(url, attempt + 1).then(resolve).catch(reject), backoff);
        return;
      }
      reject(new Error(`Timeout after ${MAX_RETRIES} attempts: ${url}`));
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CatalogComponent {
  id: string;
  name: string;
  brand: string;
  type: 'CPU' | 'GPU' | 'SSD';
  performanceScore: number;
  passmarkScore: number;
  specs: Record<string, any>;
  source: string;
  scrapedAt: string;
}

// ─── Brand detection ───────────────────────────────────────────────────────────

function detectGpuBrand(name: string): string {
  const l = name.toLowerCase();
  if (l.includes('geforce') || l.includes('nvidia') || l.includes('rtx ') || l.includes('gtx ') || l.includes('quadro') || l.includes('tesla')) return 'NVIDIA';
  if (l.includes('radeon') || l.includes('rx ') || l.includes('vega') || l.includes(' amd')) return 'AMD';
  if (l.includes('arc ') || l.includes('intel')) return 'Intel';
  if (l.includes('mali') || l.includes('adreno') || l.includes('powervr')) return 'Other'; // Mobile GPUs
  return 'Other';
}

function detectCpuBrand(name: string): string {
  const l = name.toLowerCase();
  if (l.includes('core') || l.includes('intel') || l.includes('xeon') || l.includes('pentium') || l.includes('celeron') || l.includes('atom')) return 'Intel';
  if (l.includes('ryzen') || l.includes('amd') || l.includes('athlon') || l.includes('epyc') || l.includes('threadripper') || l.includes('fx-') || l.includes('phenom')) return 'AMD';
  if (l.includes('snapdragon') || l.includes('apple') || l.includes('samsung') || l.includes('mediatek') || l.includes('qualcomm')) return 'Other'; // Mobile
  return 'Other';
}

// ─── Normalized performance score (0–100) from PassMark ────────────────────────

/**
 * Maps a raw PassMark score to our 0–100 performance scale.
 * Uses known reference points:
 *   CPU: i9-14900K ≈ 62,000 → 97,  Ryzen 5 7600 ≈ 28,000 → 80,  Pentium G7400 ≈ 5,000 → 30
 *   GPU: RTX 4090 ≈ 38,000 → 98,   RTX 4060 ≈ 18,000 → 78,  GT 1030 ≈ 3,000 → 25
 */
function passmarkToPerformanceScore(passmark: number, type: 'CPU' | 'GPU'): number {
  if (type === 'CPU') {
    // CPU PassMark range: ~1,000 (old Celeron) to ~90,000+ (Threadripper)
    // Logarithmic scale for better distribution
    const minScore = 1000;
    const maxScore = 90000;
    const clamped = Math.max(minScore, Math.min(maxScore, passmark));
    const logMin = Math.log(minScore);
    const logMax = Math.log(maxScore);
    const normalized = (Math.log(clamped) - logMin) / (logMax - logMin);
    return Math.round(15 + normalized * 83); // Range: 15–98
  } else {
    // GPU PassMark range: ~500 (integrated) to ~40,000+ (RTX 4090)
    const minScore = 500;
    const maxScore = 40000;
    const clamped = Math.max(minScore, Math.min(maxScore, passmark));
    const logMin = Math.log(minScore);
    const logMax = Math.log(maxScore);
    const normalized = (Math.log(clamped) - logMin) / (logMax - logMin);
    return Math.round(15 + normalized * 83);
  }
}

// ─── PassMark scraper ──────────────────────────────────────────────────────────

interface PassMarkEntry {
  name: string;
  score: number;
}

async function scrapePassmarkList(url: string, label: string): Promise<PassMarkEntry[]> {
  const entries: PassMarkEntry[] = [];
  console.log(`[${label}] Fetching: ${url}`);

  try {
    const html = await fetchPage(url);
    await sleep(DELAY_MS);

    if (!html || html.length < 1000) {
      console.warn(`[${label}] Page empty or blocked (${html.length} chars)`);
      return entries;
    }

    // Track which pattern worked
    let patternUsed = 0;

    // Pattern 1: <span class="prdname">Name</span>...</td><td>Score</td>
    const p1 = /<span[^>]*class="prdname"[^>]*>([^<]+)<\/span>[^<]*(?:<\/a>)?\s*<\/td>\s*<td[^>]*>\s*([0-9,]+)\s*<\/td>/gi;
    let match: RegExpExecArray | null;
    while ((match = p1.exec(html)) !== null) {
      const name = match[1].trim();
      const score = parseInt(match[2].replace(/,/g, ''), 10);
      if (!isNaN(score) && name.length > 2) entries.push({ name, score });
    }
    if (entries.length > 0) patternUsed = 1;

    // Pattern 2: <a>Name</a></td><td class="chart">Score</td>
    if (entries.length === 0) {
      const p2 = /<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td[^>]*>\s*([0-9,]+)\s*<\/td>/gi;
      while ((match = p2.exec(html)) !== null) {
        const name = match[1].trim();
        const score = parseInt(match[2].replace(/,/g, ''), 10);
        if (!isNaN(score) && name.length > 2) entries.push({ name, score });
      }
      if (entries.length > 0) patternUsed = 2;
    }

    // Pattern 3: broader name + number in adjacent <td>
    if (entries.length === 0) {
      const p3 = /<td[^>]*>([^<]{3,80})<\/td>\s*<td[^>]*>\s*([0-9,]{3,})\s*<\/td>/gi;
      while ((match = p3.exec(html)) !== null) {
        const name = match[1].trim();
        const score = parseInt(match[2].replace(/,/g, ''), 10);
        // Filter out things that look like component names
        if (!isNaN(score) && score > 100 && name.length > 3 && /[a-zA-Z]/.test(name)) {
          entries.push({ name, score });
        }
      }
      if (entries.length > 0) patternUsed = 3;
    }

    console.log(`[${label}] Parsed ${entries.length} scores (pattern ${patternUsed})`);
  } catch (e) {
    console.error(`[${label}] Failed: ${e}`);
  }

  return entries;
}

// ─── TechPowerUp (secondary, often blocked) ────────────────────────────────────

async function tryTechPowerUp(
  baseUrl: string,
  label: string,
): Promise<PassMarkEntry[]> {
  console.log(`[${label}] Attempting TechPowerUp: ${baseUrl}`);

  try {
    const html = await fetchPage(baseUrl);
    await sleep(DELAY_MS);

    if (!html || html.length < 1000) {
      console.warn(`[${label}] ⛔ TechPowerUp blocked (bot detection). Skipping.`);
      return [];
    }

    // Try to parse GPU/CPU names from their table
    const pattern = /<td[^>]*class="[^"]*name[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/gi;
    const results: PassMarkEntry[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      results.push({ name: match[1].trim(), score: 0 });
    }

    if (results.length > 0) {
      console.log(`[${label}] TechPowerUp returned ${results.length} names (no scores — will merge later)`);
    } else {
      console.warn(`[${label}] TechPowerUp: 0 entries parsed. Likely blocked or changed HTML structure.`);
    }

    return results;
  } catch (e) {
    console.warn(`[${label}] TechPowerUp error: ${e}`);
    return [];
  }
}

// ─── Build catalog components ──────────────────────────────────────────────────

function buildComponents(
  entries: PassMarkEntry[],
  type: 'CPU' | 'GPU',
): CatalogComponent[] {
  const seen = new Set<string>();
  const components: CatalogComponent[] = [];

  for (const entry of entries) {
    const normalName = entry.name.trim();
    const key = normalName.toLowerCase();

    // Skip duplicates
    if (seen.has(key)) continue;
    seen.add(key);

    // Skip mobile/embedded GPUs and very obscure entries
    if (type === 'GPU') {
      const l = key;
      if (l.includes('mali') || l.includes('adreno') || l.includes('powervr') || l.includes('vivante')) continue;
      if (l.includes('apple m') && l.includes('gpu')) continue; // Apple Silicon GPU cores
    }

    const brand = type === 'CPU' ? detectCpuBrand(normalName) : detectGpuBrand(normalName);
    const id = `${type.toLowerCase()}-${normalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '')}`;
    const performanceScore = entry.score > 0 ? passmarkToPerformanceScore(entry.score, type) : 50;

    components.push({
      id,
      name: normalName,
      brand,
      type,
      performanceScore,
      passmarkScore: entry.score,
      specs: {},
      source: 'passmark',
      scrapedAt: new Date().toISOString(),
    });
  }

  return components;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════');
  console.log(' CompareX Catalog Scraper v3.0');
  console.log(' Primary: PassMark · Fallback: TechPowerUp');
  console.log(' 2s delay · rotating UAs · retry with backoff');
  console.log('═══════════════════════════════════════════════════');
  console.log();

  // ── Phase 1: PassMark (primary — this works reliably) ──────
  //
  // IMPORTANT: The regular /cpu_list.php and /gpu_list.php pages may only
  // return a subset (e.g. Intel-only for CPUs). The /CPU_mega_page.html
  // and /GPU_mega_page.html contain ALL brands (Intel + AMD + others).
  // We try mega pages first, fall back to regular list if mega fails.

  console.log('── Phase 1: PassMark benchmark scores (primary) ─');

  // CPU: PassMark splits CPUs by brand on separate pages:
  //   /cpu-list/intel  — Intel CPUs only  (default page)
  //   /cpu-list/amd    — AMD CPUs only
  //   /cpu-list/other  — Others (Qualcomm, Apple, etc.)
  // We scrape all three and merge.

  const cpuPages: Array<{ url: string; label: string }> = [
    { url: 'https://www.cpubenchmark.net/cpu_list.php', label: 'PassMark-CPU-Intel' },
    { url: 'https://www.cpubenchmark.net/cpu-list/amd', label: 'PassMark-CPU-AMD' },
    { url: 'https://www.cpubenchmark.net/cpu-list/other', label: 'PassMark-CPU-Other' },
  ];

  let cpuScores: PassMarkEntry[] = [];
  const cpuNamesSeen = new Set<string>();

  for (const page of cpuPages) {
    const entries = await scrapePassmarkList(page.url, page.label);
    for (const entry of entries) {
      const key = entry.name.toLowerCase();
      if (!cpuNamesSeen.has(key)) {
        cpuNamesSeen.add(key);
        cpuScores.push(entry);
      }
    }
  }

  // GPU: The single gpu_list.php page already contains ALL brands (AMD, NVIDIA, Intel)
  const gpuScores = await scrapePassmarkList(
    'https://www.videocardbenchmark.net/gpu_list.php',
    'PassMark-GPU',
  );

  // Log brand breakdown before building components
  const cpuBrands: Record<string, number> = {};
  for (const e of cpuScores) {
    const b = detectCpuBrand(e.name);
    cpuBrands[b] = (cpuBrands[b] || 0) + 1;
  }
  console.log(`\n[Phase 1] CPU brand breakdown: ${JSON.stringify(cpuBrands)}`);

  const gpuBrands: Record<string, number> = {};
  for (const e of gpuScores) {
    const b = detectGpuBrand(e.name);
    gpuBrands[b] = (gpuBrands[b] || 0) + 1;
  }
  console.log(`[Phase 1] GPU brand breakdown: ${JSON.stringify(gpuBrands)}`);

  const cpuComponents = buildComponents(cpuScores, 'CPU');
  const gpuComponents = buildComponents(gpuScores, 'GPU');

  console.log(`\n[Phase 1] Built ${cpuComponents.length} CPU + ${gpuComponents.length} GPU components from PassMark\n`);

  // ── Phase 2: TechPowerUp (secondary — often blocked) ───────

  console.log('── Phase 2: TechPowerUp specs (secondary) ──────');
  const tpuGpus = await tryTechPowerUp('https://www.techpowerup.com/gpu-specs/', 'TPU-GPU');
  await sleep(DELAY_MS);
  const tpuCpus = await tryTechPowerUp('https://www.techpowerup.com/cpu-specs/', 'TPU-CPU');

  // If TechPowerUp returned names, merge any that PassMark missed
  let tpuAdded = 0;
  const existingCpuNames = new Set(cpuComponents.map((c) => c.name.toLowerCase()));
  const existingGpuNames = new Set(gpuComponents.map((c) => c.name.toLowerCase()));

  for (const entry of tpuCpus) {
    if (!existingCpuNames.has(entry.name.toLowerCase())) {
      cpuComponents.push({
        id: `cpu-${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
        name: entry.name,
        brand: detectCpuBrand(entry.name),
        type: 'CPU',
        performanceScore: 50, // No score available
        passmarkScore: 0,
        specs: {},
        source: 'techpowerup',
        scrapedAt: new Date().toISOString(),
      });
      tpuAdded++;
    }
  }

  for (const entry of tpuGpus) {
    const l = entry.name.toLowerCase();
    if (l.includes('mali') || l.includes('adreno') || l.includes('powervr')) continue;
    if (!existingGpuNames.has(l)) {
      gpuComponents.push({
        id: `gpu-${l.replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
        name: entry.name,
        brand: detectGpuBrand(entry.name),
        type: 'GPU',
        performanceScore: 50,
        passmarkScore: 0,
        specs: {},
        source: 'techpowerup',
        scrapedAt: new Date().toISOString(),
      });
      tpuAdded++;
    }
  }

  console.log(`\n[Phase 2] TechPowerUp added ${tpuAdded} additional components\n`);

  // ── Phase 3: Output ────────────────────────────────────────

  console.log('── Phase 3: Writing catalog ────────────────────');

  const allComponents = [...cpuComponents, ...gpuComponents];

  // Verify known reference components
  const verifyNames = [
    'Intel Core i9-14900K',
    'AMD Ryzen 9 7950X',
    'NVIDIA GeForce RTX 4090',
    'NVIDIA GeForce RTX 4080 SUPER',
    'AMD Radeon RX 7900 XTX',
  ];

  console.log('\n[Verify] Checking known reference components:');
  for (const refName of verifyNames) {
    const found = allComponents.find((c) =>
      c.name.toLowerCase().includes(refName.toLowerCase()) ||
      refName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (found) {
      console.log(`  ✅ ${refName} → score=${found.performanceScore} passmark=${found.passmarkScore}`);
    } else {
      console.log(`  ❌ ${refName} — NOT FOUND`);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = {
    _meta: {
      version: '3.0.0',
      generatedAt: new Date().toISOString(),
      totalComponents: allComponents.length,
      scrapeDurationMs: Date.now() - startTime,
      sources: ['cpubenchmark.net', 'videocardbenchmark.net', 'techpowerup.com'],
      breakdown: {
        CPUs: cpuComponents.length,
        GPUs: gpuComponents.length,
      },
      notes: 'PassMark is primary source. TechPowerUp may be blocked by bot detection.',
    },
    components: allComponents,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();
  console.log('═══════════════════════════════════════════════════');
  console.log(`  ✅ Done in ${elapsed}s`);
  console.log(`  📦 ${allComponents.length} components → ${OUT_FILE}`);
  console.log(`     ${cpuComponents.length} CPUs, ${gpuComponents.length} GPUs`);
  console.log(`  💾 Cache: ${CACHE_DIR}`);
  console.log('═══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
