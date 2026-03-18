/**
 * Supabase Client — single instance shared across the app.
 *
 * Reads URL + anon key from Expo public env vars:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * Falls back to a no-op stub when env vars are missing so the app
 * doesn't crash in dev / local-only mode.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Env vars ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn(
    '[Supabase] ⚠ EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not set.\n' +
      '  → Auth, cloud sync, and Supabase features are disabled.\n' +
      '  → See docs/SETUP.md for configuration instructions.',
  );
}

// ─── Client ─────────────────────────────────────────────────────────────────────

/**
 * The singleton Supabase client.
 * When env vars are missing we still create a client (it will fail on actual
 * requests), but every consumer checks `isSupabaseReady()` first.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // not needed in React Native
    },
  },
);

/** Returns true when Supabase env vars are configured. */
export function isSupabaseReady(): boolean {
  return isConfigured;
}

// ─── Database Types ─────────────────────────────────────────────────────────────

export interface DbComponent {
  id: string;
  type: string;
  name: string;
  brand: string;
  specs: Record<string, any>;
  benchmarks: Record<string, any>;
  performance_score: number;
  price: number;
  updated_at: string;
}

export interface DbUserComparison {
  id: string;
  user_id: string;
  component_ids: string[];
  comparison_type: 'comparison' | 'bottleneck';
  metadata: Record<string, any>;
  created_at: string;
}

export interface DbPriceHistory {
  id: string;
  component_id: string;
  price: number;
  date: string;
}
