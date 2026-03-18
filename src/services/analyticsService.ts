/**
 * Analytics Service — PostHog event tracking.
 *
 * Tracked events:
 *   - component_viewed       { componentId, componentName, type }
 *   - comparison_started     { componentIds }
 *   - comparison_completed   { componentIds, winner }
 *   - bottleneck_calculated  { cpuId, gpuId, resolution, useCase, tier, percent }
 *   - search_performed       { query, resultCount }
 *
 * Falls back to console.log when EXPO_PUBLIC_POSTHOG_KEY is not set.
 */

import PostHog from 'posthog-react-native';

// ─── Config ─────────────────────────────────────────────────────────────────────

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

const isConfigured = Boolean(POSTHOG_KEY);

// ─── PostHog Client ─────────────────────────────────────────────────────────────

let posthog: PostHog | null = null;

/** Initialize PostHog — call once on app boot. */
export async function initAnalytics(): Promise<void> {
  if (!isConfigured) {
    console.log(
      '[Analytics] PostHog not configured (EXPO_PUBLIC_POSTHOG_KEY missing).\n' +
        '  → Events will be logged to console only.',
    );
    return;
  }

  try {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Flush events every 30s or when 20 events queued
      flushAt: 20,
      flushInterval: 30000,
    });
    console.log('[Analytics] ✅ PostHog initialized');
  } catch (e) {
    console.warn('[Analytics] PostHog init failed:', e);
  }
}

// ─── Generic capture ────────────────────────────────────────────────────────────

function capture(event: string, properties?: Record<string, any>): void {
  if (posthog) {
    posthog.capture(event, properties);
  } else {
    console.log(`[Analytics] ${event}`, properties ?? '');
  }
}

// ─── Typed event helpers ────────────────────────────────────────────────────────

export function trackComponentViewed(params: {
  componentId: string;
  componentName: string;
  type: string;
}): void {
  capture('component_viewed', params);
}

export function trackComparisonStarted(params: {
  componentIds: string[];
}): void {
  capture('comparison_started', params);
}

export function trackComparisonCompleted(params: {
  componentIds: string[];
  winner?: string;
}): void {
  capture('comparison_completed', params);
}

export function trackBottleneckCalculated(params: {
  cpuId: string;
  gpuId: string;
  resolution: string;
  useCase: string;
  tier: string;
  percent: number;
}): void {
  capture('bottleneck_calculated', params);
}

export function trackSearchPerformed(params: {
  query: string;
  resultCount: number;
}): void {
  capture('search_performed', params);
}

// ─── User identification ────────────────────────────────────────────────────────

export function identifyUser(userId: string, traits?: Record<string, any>): void {
  if (posthog) {
    posthog.identify(userId, traits);
  }
}

export function resetUser(): void {
  if (posthog) {
    posthog.reset();
  }
}

// ─── Screen tracking ────────────────────────────────────────────────────────────

export function trackScreen(screenName: string, properties?: Record<string, any>): void {
  if (posthog) {
    posthog.screen(screenName, properties);
  }
}

// ─── Cleanup ────────────────────────────────────────────────────────────────────

export async function flushAnalytics(): Promise<void> {
  if (posthog) {
    await posthog.flush();
  }
}
