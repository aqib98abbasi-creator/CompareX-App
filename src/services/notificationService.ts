/**
 * Notification Service — Expo Push Notifications
 *
 * Handles:
 *   - Requesting permission + registering device token on boot
 *   - Saving token to Supabase push_tokens table
 *   - Listening for incoming notifications
 *
 * Notification triggers (server-side, documented here for reference):
 *   - New components added to catalog
 *   - Price drops > 10% on saved/alerted components
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase, isSupabaseReady } from './supabase';
import { getAuthState } from './authService';

// ─── Configuration ──────────────────────────────────────────────────────────────

// Set notification behavior when app is in foreground (native only)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface NotificationData {
  type: 'new_components' | 'price_drop' | 'general';
  componentId?: string;
  message?: string;
}

type NotificationListener = (data: NotificationData) => void;
const listeners: Set<NotificationListener> = new Set();

// ─── Internal state ─────────────────────────────────────────────────────────────

let expoPushToken: string | null = null;
let notificationListener: Notifications.Subscription | null = null;
let responseListener: Notifications.Subscription | null = null;

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Initialize push notifications — call once on app boot.
 * Requests permission, gets token, saves to Supabase.
 */
export async function initNotifications(): Promise<void> {
  try {
    // Only register on physical devices
    if (!Device.isDevice) {
      console.log('[Notifications] Push notifications require a physical device. Skipping registration.');
      return;
    }

    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted.');
      return;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });

    expoPushToken = tokenData.data;
    console.log('[Notifications] Push token:', expoPushToken);

    // Android channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F8EF7',
      });

      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications when tracked component prices drop',
      });

      await Notifications.setNotificationChannelAsync('catalog-updates', {
        name: 'Catalog Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Notifications when new components are added',
      });
    }

    // Save token to Supabase
    await saveTokenToCloud();

    // Listen for incoming notifications
    notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as NotificationData;
      console.log('[Notifications] Received:', data);
      for (const fn of listeners) fn(data);
    });

    // Listen for notification tap responses
    responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      console.log('[Notifications] Tapped:', data);
      for (const fn of listeners) fn(data);
    });

    console.log('[Notifications] ✅ Initialized');
  } catch (e) {
    console.warn('[Notifications] Init error:', e);
  }
}

/** Get the current push token (null if not registered). */
export function getPushToken(): string | null {
  return expoPushToken;
}

/** Subscribe to notification events. Returns unsubscribe function. */
export function onNotification(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Clean up notification listeners. */
export function cleanupNotifications(): void {
  if (notificationListener) {
    Notifications.removeNotificationSubscription(notificationListener);
    notificationListener = null;
  }
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
    responseListener = null;
  }
}

// ─── Token persistence ──────────────────────────────────────────────────────────

/**
 * Save the push token to Supabase.
 * Links token to user_id if logged in.
 */
async function saveTokenToCloud(): Promise<void> {
  if (!isSupabaseReady() || !expoPushToken) return;

  try {
    const auth = getAuthState();

    await supabase.from('push_tokens').upsert(
      {
        token: expoPushToken,
        user_id: auth.user?.id ?? null,
        platform: Platform.OS,
      },
      { onConflict: 'token' },
    );

    console.log('[Notifications] Token saved to cloud');
  } catch (e) {
    console.warn('[Notifications] Failed to save token:', e);
  }
}

/**
 * Update the user_id on the push token after login.
 */
export async function linkTokenToUser(userId: string): Promise<void> {
  if (!isSupabaseReady() || !expoPushToken) return;

  try {
    await supabase
      .from('push_tokens')
      .update({ user_id: userId })
      .eq('token', expoPushToken);
  } catch (e) {
    console.warn('[Notifications] Failed to link token:', e);
  }
}

// ─── Schedule local notification (for testing) ──────────────────────────────────

export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CompareX',
      body: 'This is a test notification!',
      data: { type: 'general' } as NotificationData,
    },
    trigger: { seconds: 2 },
  });
}
