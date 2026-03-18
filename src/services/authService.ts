/**
 * Auth Service — Supabase Auth with Google & Apple sign-in.
 *
 * Handles:
 *   - Google OAuth via expo-auth-session
 *   - Apple sign-in via expo-apple-authentication (iOS)
 *   - Session persistence via AsyncStorage (handled by supabase client)
 *   - Syncing local history → user_comparisons on login
 *
 * When Supabase is not configured the service is a safe no-op.
 */

import { supabase, isSupabaseReady } from './supabase';
import { getHistory } from './historyService';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// Ensure auth popup is dismissed on web
WebBrowser.maybeCompleteAuthSession();

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

type AuthListener = (state: AuthState) => void;

// ─── Internal state ─────────────────────────────────────────────────────────────

let currentState: AuthState = { user: null, session: null, isLoading: true };
const listeners: Set<AuthListener> = new Set();

function notify() {
  for (const fn of listeners) fn(currentState);
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthStateChange(listener: AuthListener): () => void {
  listeners.add(listener);
  // Fire immediately with current state
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

/** Get current auth state synchronously. */
export function getAuthState(): AuthState {
  return currentState;
}

/** Initialize auth — call once on app boot. */
export async function initAuth(): Promise<void> {
  if (!isSupabaseReady()) {
    currentState = { user: null, session: null, isLoading: false };
    notify();
    return;
  }

  try {
    // Restore session from storage
    const {
      data: { session },
    } = await supabase.auth.getSession();

    currentState = {
      user: session?.user ?? null,
      session,
      isLoading: false,
    };
    notify();

    // Listen for future auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      currentState = {
        user: session?.user ?? null,
        session,
        isLoading: false,
      };
      notify();

      // Sync local history to Supabase on login
      if (session?.user) {
        syncLocalHistoryToCloud(session.user.id).catch(console.warn);
      }
    });
  } catch (e) {
    console.warn('[Auth] Init failed:', e);
    currentState = { user: null, session: null, isLoading: false };
    notify();
  }
}

// ─── Google Sign-In ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  if (!isSupabaseReady()) {
    return { error: { message: 'Supabase not configured', name: 'AuthError', status: 0 } as any };
  }

  try {
    const redirectUri = makeRedirectUri({ preferLocalhost: true });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        // Extract tokens from callback URL
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token') ||
          new URLSearchParams(url.hash.substring(1)).get('access_token');
        const refreshToken = url.searchParams.get('refresh_token') ||
          new URLSearchParams(url.hash.substring(1)).get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          return { error: sessionError };
        }
      }
    }

    return { error: null };
  } catch (e: any) {
    return { error: { message: e.message, name: 'AuthError', status: 0 } as any };
  }
}

// ─── Apple Sign-In ──────────────────────────────────────────────────────────────

export async function signInWithApple(): Promise<{ error: AuthError | null }> {
  if (!isSupabaseReady()) {
    return { error: { message: 'Supabase not configured', name: 'AuthError', status: 0 } as any };
  }

  if (Platform.OS !== 'ios') {
    return { error: { message: 'Apple sign-in is only available on iOS', name: 'AuthError', status: 0 } as any };
  }

  try {
    const redirectUri = makeRedirectUri({ preferLocalhost: true });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('access_token') ||
          new URLSearchParams(url.hash.substring(1)).get('access_token');
        const refreshToken = url.searchParams.get('refresh_token') ||
          new URLSearchParams(url.hash.substring(1)).get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          return { error: sessionError };
        }
      }
    }

    return { error: null };
  } catch (e: any) {
    return { error: { message: e.message, name: 'AuthError', status: 0 } as any };
  }
}

// ─── Sign Out ───────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (!isSupabaseReady()) return;
  await supabase.auth.signOut();
}

// ─── Cloud Sync ─────────────────────────────────────────────────────────────────

/**
 * Push local AsyncStorage history → Supabase user_comparisons table.
 * Called automatically on login.
 */
async function syncLocalHistoryToCloud(userId: string): Promise<void> {
  if (!isSupabaseReady()) return;

  try {
    const history = await getHistory();

    // Sync comparisons
    for (const item of history.comparisons) {
      await supabase.from('user_comparisons').upsert(
        {
          id: item.id,
          user_id: userId,
          component_ids: [item.aId, item.bId],
          comparison_type: 'comparison',
          metadata: { aName: item.aName, bName: item.bName },
          created_at: item.createdAt,
        },
        { onConflict: 'id' },
      );
    }

    // Sync bottleneck checks
    for (const item of history.bottlenecks) {
      await supabase.from('user_comparisons').upsert(
        {
          id: item.id,
          user_id: userId,
          component_ids: [item.cpuId, item.gpuId],
          comparison_type: 'bottleneck',
          metadata: {
            cpuName: item.cpuName,
            gpuName: item.gpuName,
            input: item.input,
            maxBottleneck: item.maxBottleneck,
          },
          created_at: item.createdAt,
        },
        { onConflict: 'id' },
      );
    }

    console.log('[Auth] ✅ Local history synced to cloud');
  } catch (e) {
    console.warn('[Auth] History sync failed:', e);
  }
}

/**
 * Fetch the user's saved comparisons from the cloud.
 * Returns empty array when not logged in or Supabase not configured.
 */
export async function getCloudComparisons(): Promise<
  Array<{
    id: string;
    componentIds: string[];
    type: 'comparison' | 'bottleneck';
    metadata: Record<string, any>;
    createdAt: string;
  }>
> {
  if (!isSupabaseReady() || !currentState.user) return [];

  try {
    const { data, error } = await supabase
      .from('user_comparisons')
      .select('*')
      .eq('user_id', currentState.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('[Auth] Failed to fetch cloud comparisons:', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      componentIds: row.component_ids,
      type: row.comparison_type,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  } catch (e) {
    console.warn('[Auth] Cloud comparisons error:', e);
    return [];
  }
}

/**
 * Save a comparison or bottleneck check to the cloud.
 * No-op when not logged in.
 */
export async function saveToCloud(params: {
  componentIds: string[];
  type: 'comparison' | 'bottleneck';
  metadata: Record<string, any>;
}): Promise<void> {
  if (!isSupabaseReady() || !currentState.user) return;

  try {
    await supabase.from('user_comparisons').insert({
      user_id: currentState.user.id,
      component_ids: params.componentIds,
      comparison_type: params.type,
      metadata: params.metadata,
    });
  } catch (e) {
    console.warn('[Auth] Save to cloud failed:', e);
  }
}
