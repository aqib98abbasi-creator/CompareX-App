/**
 * AdBanner — A single AdMob banner ad component.
 *
 * Only renders when EXPO_PUBLIC_ADMOB_ID is set.
 * Falls back to an empty View on web or when the ad fails to load.
 *
 * Usage:
 *   <AdBanner />
 *
 * The ad unit ID is read from EXPO_PUBLIC_ADMOB_ID env var.
 * For testing, use Google's test ad unit IDs:
 *   Android: ca-app-pub-3940256099942544/6300978111
 *   iOS:     ca-app-pub-3940256099942544/2934735716
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

// ─── Config ─────────────────────────────────────────────────────────────────────

const AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_ID ?? '';
const isAdConfigured = Boolean(AD_UNIT_ID) && Platform.OS !== 'web';

// ─── Conditional import ─────────────────────────────────────────────────────────
// react-native-google-mobile-ads is not available on web, so we guard the import.

let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const gma = require('react-native-google-mobile-ads');
    BannerAd = gma.BannerAd;
    BannerAdSize = gma.BannerAdSize;
  } catch {
    // Library not linked — happens in Expo Go (requires dev client / EAS build)
    console.log('[AdBanner] react-native-google-mobile-ads not available (expected in Expo Go)');
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const AdBanner: React.FC = () => {
  const [adError, setAdError] = useState(false);

  // Don't render anything if not configured, on web, or if the library isn't available
  if (!isAdConfigured || !BannerAd || !BannerAdSize || adError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error: any) => {
          console.log('[AdBanner] Failed to load:', error?.message ?? error);
          setAdError(true);
        }}
      />
    </View>
  );
};

export default AdBanner;

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
});
