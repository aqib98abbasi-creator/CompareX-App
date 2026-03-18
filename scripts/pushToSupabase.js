#!/usr/bin/env node
/**
 * Push scraped catalog to Supabase.
 * Used by the GitHub Action after scraping.
 *
 * Env vars (set as GitHub Secrets):
 *   SUPABASE_URL         — Supabase project URL
 *   SUPABASE_SERVICE_KEY — Supabase service role key (NOT anon key)
 *
 * Usage:
 *   node scripts/pushToSupabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Config ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  console.error('   Set them as GitHub Secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ─── Load catalog ───────────────────────────────────────────────────────────────

const catalogPath = path.resolve(__dirname, '..', 'public', 'catalog.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`❌ Catalog not found at ${catalogPath}`);
  console.error('   Run "npm run scrape" first.');
  process.exit(1);
}

const catalogJson = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

let components;
if (Array.isArray(catalogJson)) {
  components = catalogJson;
} else if (catalogJson && Array.isArray(catalogJson.components)) {
  components = catalogJson.components;
} else {
  console.error('❌ Invalid catalog format.');
  process.exit(1);
}

console.log(`📦 Loaded ${components.length} components from catalog.json`);

// ─── Push to Supabase ───────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const batchSize = 200;
  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize).map((c) => ({
      id: c.id,
      type: c.type || 'Other',
      name: c.name,
      brand: c.brand || 'Other',
      specs: c.specs || c.fullSpecs || {},
      benchmarks: { list: c.benchmarks || [], passmarkScore: c.passmarkScore },
      performance_score: c.performanceScore || 0,
      price: c.price || 0,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('components')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`  ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(components.length / batchSize)} (${inserted} inserted)\r`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n📊 Push complete in ${elapsed}s:`);
  console.log(`   ✅ Inserted/updated: ${inserted}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Also push price history for components with price > 0
  const priceEntries = components
    .filter((c) => c.price > 0)
    .map((c) => ({
      component_id: c.id,
      price: c.price,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }));

  if (priceEntries.length > 0) {
    console.log(`\n💰 Pushing ${priceEntries.length} price history entries...`);

    for (let i = 0; i < priceEntries.length; i += batchSize) {
      const batch = priceEntries.slice(i, i + batchSize);

      // Use upsert with the unique constraint (component_id, date)
      const { error } = await supabase
        .from('price_history')
        .upsert(batch, { onConflict: 'component_id,date', ignoreDuplicates: true });

      if (error && !error.message.includes('duplicate')) {
        console.error(`  ❌ Price batch error:`, error.message);
      }
    }

    console.log('   ✅ Price history updated');
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
