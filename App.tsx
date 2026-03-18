/**
 * CompareX App Entry Point
 *
 * Initializes all backend services:
 *   - Sentry (error monitoring)
 *   - PostHog (analytics)
 *   - Supabase Auth (session restore)
 *   - Push Notifications (device token registration)
 *   - Component database (local → Supabase → GitHub)
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { colors } from './src/constants/colors';

// ─── Services ───────────────────────────────────────────────────────────────────
import { initializeDatabase } from './src/services/dataService';
import { initAuth } from './src/services/authService';
import { initAnalytics } from './src/services/analyticsService';
import { initNotifications } from './src/services/notificationService';

// ─── Sentry ─────────────────────────────────────────────────────────────────────
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for
    // performance monitoring. Adjust in production.
    tracesSampleRate: 1.0,
    // Capture unhandled promise rejections
    enableAutoPerformanceTracing: true,
    // Debug mode — set to false in production
    debug: __DEV__,
    // Only send errors in production
    enabled: !__DEV__,
    // App environment
    environment: __DEV__ ? 'development' : 'production',
  });
} else {
  console.log(
    '[Sentry] EXPO_PUBLIC_SENTRY_DSN not set. Error monitoring disabled.\n' +
      '  → See docs/SETUP.md for configuration instructions.',
  );
}

// ─── App Component ──────────────────────────────────────────────────────────────

function AppRoot() {
  useEffect(() => {
    // Boot all services in parallel (order doesn't matter — each is independent)
    const boot = async () => {
      try {
        await Promise.all([
          initializeDatabase(),
          initAuth(),
          initAnalytics(),
          initNotifications(),
        ]);
        console.log('[App] ✅ All services initialized');
      } catch (e) {
        console.warn('[App] Service init error:', e);
        if (SENTRY_DSN) {
          Sentry.captureException(e);
        }
      }
    };

    boot();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <AppNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// Wrap with Sentry if configured
const App = SENTRY_DSN ? Sentry.wrap(AppRoot) : AppRoot;
export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
