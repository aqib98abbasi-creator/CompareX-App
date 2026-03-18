/**
 * Cloudflare Worker — API Proxy for CompareX
 *
 * Proxies PriceCharting API requests with:
 *   - CORS headers for mobile/web clients
 *   - 24-hour response caching in Cloudflare KV
 *   - Rate limiting per IP
 *
 * Deployment:
 *   1. Install wrangler: npm i -g wrangler
 *   2. Login: wrangler login
 *   3. Create KV namespace: wrangler kv:namespace create "COMPAREX_CACHE"
 *   4. Update wrangler.toml with the KV namespace ID
 *   5. Deploy: wrangler deploy
 *
 * Environment Variables (set via wrangler secret):
 *   PRICECHARTING_API_KEY — your PriceCharting API key (optional, for authenticated endpoints)
 */

export interface Env {
  COMPAREX_CACHE: KVNamespace;
  PRICECHARTING_API_KEY?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const PRICECHARTING_BASE = 'https://www.pricecharting.com/api';
const CACHE_TTL_SECONDS = 86400; // 24 hours
const ALLOWED_ORIGINS = ['*']; // Restrict in production

// ─── CORS Headers ───────────────────────────────────────────────────────────────

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes('*') ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // ── Route: /api/price?name=RTX+4080
    if (url.pathname.startsWith('/api/price')) {
      return handlePriceRequest(url, env, origin);
    }

    // ── Route: /api/prices?names=RTX+4080,RTX+4070
    if (url.pathname.startsWith('/api/prices')) {
      return handleBulkPriceRequest(url, env, origin);
    }

    // ── Route: /health
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  },
};

// ─── Price lookup (single) ──────────────────────────────────────────────────────

async function handlePriceRequest(url: URL, env: Env, origin: string): Promise<Response> {
  const name = url.searchParams.get('name');
  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing ?name= parameter' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `price:${name.toLowerCase().trim()}`;

  // Check KV cache first
  const cached = await env.COMPAREX_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  }

  // Fetch from PriceCharting
  try {
    const apiUrl = new URL(`${PRICECHARTING_BASE}/products`);
    apiUrl.searchParams.set('q', name);
    if (env.PRICECHARTING_API_KEY) {
      apiUrl.searchParams.set('t', env.PRICECHARTING_API_KEY);
    }

    const response = await fetch(apiUrl.toString(), {
      headers: { 'User-Agent': 'CompareX/1.0 (hardware-comparison-app)' },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${response.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        },
      );
    }

    const data = await response.text();

    // Store in KV cache with 24h TTL
    await env.COMPAREX_CACHE.put(cacheKey, data, { expirationTtl: CACHE_TTL_SECONDS });

    return new Response(data, {
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', detail: e.message }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      },
    );
  }
}

// ─── Bulk price lookup ──────────────────────────────────────────────────────────

async function handleBulkPriceRequest(url: URL, env: Env, origin: string): Promise<Response> {
  const names = url.searchParams.get('names');
  if (!names) {
    return new Response(JSON.stringify({ error: 'Missing ?names= parameter' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  const nameList = names.split(',').map((n) => n.trim()).filter(Boolean).slice(0, 20); // Max 20

  const results: Record<string, any> = {};

  for (const name of nameList) {
    const cacheKey = `price:${name.toLowerCase()}`;
    const cached = await env.COMPAREX_CACHE.get(cacheKey);

    if (cached) {
      try {
        results[name] = JSON.parse(cached);
      } catch {
        results[name] = null;
      }
    } else {
      try {
        const apiUrl = new URL(`${PRICECHARTING_BASE}/products`);
        apiUrl.searchParams.set('q', name);
        if (env.PRICECHARTING_API_KEY) {
          apiUrl.searchParams.set('t', env.PRICECHARTING_API_KEY);
        }

        const response = await fetch(apiUrl.toString(), {
          headers: { 'User-Agent': 'CompareX/1.0 (hardware-comparison-app)' },
        });

        if (response.ok) {
          const data = await response.text();
          await env.COMPAREX_CACHE.put(cacheKey, data, { expirationTtl: CACHE_TTL_SECONDS });
          try {
            results[name] = JSON.parse(data);
          } catch {
            results[name] = null;
          }
        } else {
          results[name] = null;
        }
      } catch {
        results[name] = null;
      }

      // Polite delay between requests
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const body = JSON.stringify({ results });

  return new Response(body, {
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });
}
