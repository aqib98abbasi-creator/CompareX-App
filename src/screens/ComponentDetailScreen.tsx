/**
 * Component Detail Screen
 * Full detail page: hero, spec table, benchmark bars, reviews, sticky Add to Compare
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Text, Button, Badge } from '../components';
import { colors, getBrandColor, getScoreColor } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';
import { Component } from '../types';
import { getComponentById, initializeDatabase } from '../services/dataService';
import { formatPrice, formatDate } from '../utils/formatting';

type Nav = StackNavigationProp<RootStackParamList, 'ComponentDetail'>;

/* ─── helpers ────────────────────────────────── */

/** Returns false for values we should NOT show (null, undefined, empty string, 0 for optional fields). */
function isValid(v: any): boolean {
  return v !== null && v !== undefined && v !== '' && v !== 'N/A';
}

/** Format a raw value as a human-readable string. */
function fmt(v: any): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Build spec rows from typed specs + fullSpecs, filtering out missing values. */
function specRows(component: Component): Array<{ label: string; value: string; section?: string }> {
  const s = component.specs as any;
  const f = (component.fullSpecs ?? {}) as any;
  const rows: Array<{ label: string; value: string; section?: string }> = [];

  // ── Primary Specs ──────────────────────────────────────────────────────────
  switch (component.type) {
    case 'CPU': {
      if (isValid(s.cores) && isValid(s.threads))
        rows.push({ label: 'Cores / Threads', value: `${s.cores} / ${s.threads}` });
      else if (isValid(s.cores))
        rows.push({ label: 'Cores', value: `${s.cores}` });

      if (isValid(f.cpuCores)) rows.push({ label: 'Core Config', value: fmt(f.cpuCores) });
      if (isValid(s.baseClock)) rows.push({ label: 'Base Clock', value: `${s.baseClock} GHz` });
      if (isValid(s.boostClock)) rows.push({ label: 'Boost Clock', value: `${s.boostClock} GHz` });
      if (isValid(s.tdp)) rows.push({ label: 'TDP', value: `${s.tdp} W` });
      if (isValid(s.socket)) rows.push({ label: 'Socket', value: s.socket });
      if (isValid(s.architecture)) rows.push({ label: 'Architecture', value: s.architecture });
      if (isValid(s.lithography)) rows.push({ label: 'Lithography', value: `${s.lithography} nm` });

      // Cache
      if (s.cache) {
        if (isValid(s.cache.l1)) rows.push({ label: 'L1 Cache', value: `${s.cache.l1} KB` });
        if (isValid(s.cache.l2)) rows.push({ label: 'L2 Cache', value: `${s.cache.l2} MB` });
        if (isValid(s.cache.l3) && s.cache.l3 > 0) rows.push({ label: 'L3 Cache', value: `${s.cache.l3} MB` });
      }

      if (isValid(s.integratedGraphics)) rows.push({ label: 'Integrated GPU', value: s.integratedGraphics });
      if (isValid(f.memoryType)) rows.push({ label: 'Memory Type', value: f.memoryType });
      if (isValid(f.maxMemory)) rows.push({ label: 'Max Memory', value: `${f.maxMemory} GB` });
      if (isValid(f.pcieVersion)) rows.push({ label: 'PCIe Version', value: f.pcieVersion });
      if (isValid(f.memorybandwidthGBs)) rows.push({ label: 'Memory Bandwidth', value: `${f.memorybandwidthGBs} GB/s` });
      if (isValid(f.perf_cores)) rows.push({ label: 'P-Cores', value: `${f.perf_cores}` });
      if (isValid(f.eff_cores)) rows.push({ label: 'E-Cores', value: `${f.eff_cores}` });
      if (isValid(f.unlocked)) rows.push({ label: 'Unlocked', value: f.unlocked ? 'Yes' : 'No' });
      if (isValid(f.neuralEngine)) rows.push({ label: 'Neural Engine / NPU', value: f.neuralEngine });
      if (isValid(f.gpuCores)) rows.push({ label: 'GPU Cores', value: fmt(f.gpuCores) });
      if (isValid(f.transisorsB)) rows.push({ label: 'Transistors', value: `${f.transisorsB}B` });
      if (isValid(f.chipType) && f.chipType !== 'CPU') rows.push({ label: 'Chip Type', value: f.chipType });
      break;
    }

    case 'GPU': {
      if (isValid(s.vram) && isValid(s.memoryType))
        rows.push({ label: 'VRAM', value: `${s.vram} GB ${s.memoryType}` });
      if (isValid(s.memoryBus)) rows.push({ label: 'Memory Bus', value: `${s.memoryBus}-bit` });
      if (isValid(s.memoryBandwidth)) rows.push({ label: 'Bandwidth', value: `${s.memoryBandwidth} GB/s` });
      if (isValid(s.baseClock)) rows.push({ label: 'Base Clock', value: `${s.baseClock} MHz` });
      if (isValid(s.boostClock)) rows.push({ label: 'Boost Clock', value: `${s.boostClock} MHz` });
      if (isValid(s.tdp)) rows.push({ label: 'TDP', value: `${s.tdp} W` });
      if (isValid(s.pcieVersion)) rows.push({ label: 'PCIe', value: s.pcieVersion });
      if (isValid(s.slotSize)) rows.push({ label: 'Slot Size', value: `${s.slotSize} slot` });
      if (isValid(s.cudaCores)) rows.push({ label: 'CUDA Cores', value: `${s.cudaCores}` });
      if (isValid(s.streamProcessors)) rows.push({ label: 'Stream Processors', value: `${s.streamProcessors}` });
      if (isValid(s.architecture)) rows.push({ label: 'Architecture', value: s.architecture });
      if (isValid(s.lithography)) rows.push({ label: 'Lithography', value: `${s.lithography} nm` });
      if (isValid(f.displayOutputs)) rows.push({ label: 'Display Outputs', value: fmt(f.displayOutputs) });
      if (isValid(f.maxResolution)) rows.push({ label: 'Max Resolution', value: f.maxResolution });
      if (isValid(f.releaseYear)) rows.push({ label: 'Release Year', value: `${f.releaseYear}` });
      if (isValid(f.ropsCount)) rows.push({ label: 'ROPs', value: `${f.ropsCount}` });
      if (isValid(f.tmuCount)) rows.push({ label: 'TMUs', value: `${f.tmuCount}` });
      if (isValid(f.tensorCores)) rows.push({ label: 'Tensor Cores', value: `${f.tensorCores}` });
      if (isValid(f.rtCores)) rows.push({ label: 'RT Cores', value: `${f.rtCores}` });
      if (isValid(f.computeUnits)) rows.push({ label: 'Compute Units', value: `${f.computeUnits}` });
      if (isValid(f.infinityCache)) rows.push({ label: 'Infinity Cache', value: `${f.infinityCache} MB` });
      break;
    }

    case 'RAM': {
      if (isValid(s.type)) rows.push({ label: 'Type', value: s.type });
      if (isValid(s.speed)) rows.push({ label: 'Speed', value: `${s.speed} MHz` });
      if (isValid(s.capacity)) rows.push({ label: 'Capacity', value: `${s.capacity} GB` });
      if (isValid(s.casLatency)) rows.push({ label: 'CAS Latency', value: `CL${s.casLatency}` });
      if (isValid(s.voltage)) rows.push({ label: 'Voltage', value: `${s.voltage} V` });
      if (isValid(s.channels)) rows.push({ label: 'Channels', value: `${s.channels}` });
      if (isValid(s.formFactor)) rows.push({ label: 'Form Factor', value: s.formFactor });
      if (isValid(f.timings)) rows.push({ label: 'Timings', value: f.timings });
      if (isValid(f.xmp)) rows.push({ label: 'XMP / EXPO', value: f.xmp });
      if (isValid(f.rgb)) rows.push({ label: 'RGB', value: f.rgb ? 'Yes' : 'No' });
      if (isValid(f.heatSpreader)) rows.push({ label: 'Heat Spreader', value: f.heatSpreader });
      if (isValid(f.series)) rows.push({ label: 'Series', value: f.series });
      break;
    }

    case 'SSD': {
      if (isValid(s.interface)) rows.push({ label: 'Interface', value: s.interface });
      if (isValid(s.formFactor)) rows.push({ label: 'Form Factor', value: s.formFactor });
      if (isValid(s.capacity)) rows.push({ label: 'Capacity', value: `${s.capacity} GB` });
      if (isValid(s.readSpeed)) rows.push({ label: 'Read Speed', value: `${s.readSpeed} MB/s` });
      if (isValid(s.writeSpeed)) rows.push({ label: 'Write Speed', value: `${s.writeSpeed} MB/s` });
      if (isValid(s.nandType)) rows.push({ label: 'NAND Type', value: s.nandType });
      if (isValid(s.endurance)) rows.push({ label: 'Endurance', value: `${s.endurance} TBW` });
      if (isValid(s.controller)) rows.push({ label: 'Controller', value: s.controller });
      if (isValid(f.series)) rows.push({ label: 'Series', value: f.series });
      break;
    }

    default: {
      // Generic fallback — shows all non-null spec fields
      for (const [key, val] of Object.entries(s ?? {})) {
        if (isValid(val) && typeof val !== 'object') {
          rows.push({ label: key.replace(/([A-Z])/g, ' $1').trim(), value: fmt(val) });
        }
      }
      break;
    }
  }

  // ── Universal extras from fullSpecs ────────────────────────────────────────
  const knownFullSpecKeys = new Set([
    'series', 'releaseYear', 'passmarkScore', 'cinebenchR23Single', 'cinebenchR23Multi',
    'memoryType', 'maxMemory', 'pcieVersion', 'perf_cores', 'eff_cores', 'unlocked',
    'neuralEngine', 'gpuCores', 'transisorsB', 'chipType', 'cpuCores', 'memorybandwidthGBs',
    'displayOutputs', 'maxResolution', 'ropsCount', 'tmuCount', 'tensorCores', 'rtCores',
    'computeUnits', 'infinityCache', 'timings', 'xmp', 'rgb', 'heatSpreader', 'note',
  ]);

  for (const [key, val] of Object.entries(f ?? {})) {
    if (knownFullSpecKeys.has(key)) continue; // already shown above (or skip)
    if (!isValid(val) || typeof val === 'object') continue;
    // Humanise the key
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    rows.push({ label, value: fmt(val) });
  }

  // ── Performance note ─────────────────────────────────────────────────────
  if (isValid(f.note)) {
    rows.push({ label: 'Note', value: f.note, section: 'note' });
  }

  // ── Benchmark extras from fullSpecs ──────────────────────────────────────
  if (isValid(f.passmarkScore)) rows.push({ label: 'PassMark Score', value: `${f.passmarkScore}` });
  if (isValid(f.cinebenchR23Single)) rows.push({ label: 'Cinebench R23 (1T)', value: `${f.cinebenchR23Single}` });
  if (isValid(f.cinebenchR23Multi)) rows.push({ label: 'Cinebench R23 (nT)', value: `${f.cinebenchR23Multi}` });
  if (isValid(f.timeSpyScore)) rows.push({ label: '3DMark Time Spy', value: `${f.timeSpyScore}` });
  if (isValid(f.series)) rows.push({ label: 'Series', value: f.series });

  return rows;
}

/* ─── animated benchmark bar ─────────────────── */

function BenchmarkBar({ label, score, maxScore = 100, delay = 0, fillColor }: {
  label: string; score: number; maxScore?: number; delay?: number; fillColor: string;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(score / maxScore, 1),
      duration: 300,
      delay,
      useNativeDriver: false,
    }).start();
  }, [score, maxScore]);

  const pct = Math.round((score / maxScore) * 100);

  return (
    <View style={bStyles.row}>
      <View style={bStyles.labelRow}>
        <Text variant="bodySmall" color="secondary">{label}</Text>
        <Text variant="monoSmall" color="primary">{score}{' '}<Text variant="caption" color="secondary">/ {maxScore}</Text></Text>
      </View>
      <View style={bStyles.track}>
        <Animated.View
          style={[
            bStyles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const bStyles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.background.elevated, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

/* ─── main component ─────────────────────────── */

export function ComponentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { componentId } = route.params as { componentId: string };
  const [component, setComponent] = useState<Component | null>(null);

  useEffect(() => {
    initializeDatabase().then(() => {
      setComponent(getComponentById(componentId) ?? null);
    });
  }, [componentId]);

  if (!component) {
    return (
      <View style={styles.loadingContainer}>
        {/* skeleton placeholder */}
        <View style={styles.skeletonBlock} />
        <View style={[styles.skeletonBlock, { width: '60%' }]} />
        <View style={[styles.skeletonBlock, { width: '40%' }]} />
      </View>
    );
  }

  const brandColor = getBrandColor(component.brand);
  const scoreColor = getScoreColor(component.performanceScore);
  const specs = specRows(component);
  const releaseYear = new Date(component.releaseDate).getFullYear();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.content}
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <View style={[styles.brandLabel, { backgroundColor: brandColor + '22' }]}>
            <Text variant="caption" color="primary" style={{ color: brandColor }}>
              {component.brand.toUpperCase()}
            </Text>
          </View>

          <Text variant="displayMedium" color="primary" style={styles.productName}>
            {component.name}
          </Text>

          <View style={styles.heroRow}>
            <View style={[styles.scoreBadgeLarge, { backgroundColor: scoreColor + '22' }]}>
              <Text variant="displaySmall" color="primary" style={{ color: scoreColor }}>
                {component.performanceScore}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <Text variant="bodyLarge" color="primary" style={styles.price}>
                {formatPrice(component.price)}
              </Text>
              <Text variant="caption" color="secondary">
                Released {releaseYear}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Spec Table ── */}
        <View style={styles.section}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            SPECIFICATIONS
          </Text>
          {specs.map((spec, idx) => (
            <View
              key={idx}
              style={[styles.specRow, idx % 2 === 0 && styles.specRowAlt]}
            >
              <Text variant="bodySmall" color="secondary" style={styles.specLabel}>
                {spec.label}
              </Text>
              <Text variant="monoMedium" color="primary" style={styles.specValue}>
                {spec.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Benchmarks ── */}
        {component.benchmarks.length > 0 && (
          <View style={styles.section}>
            <Text variant="label" color="secondary" style={styles.sectionTitle}>
              BENCHMARKS
            </Text>
            {component.benchmarks.map((bench, idx) => (
              <BenchmarkBar
                key={bench.name}
                label={bench.name}
                score={bench.score}
                maxScore={100}
                delay={idx * 80}
                fillColor={brandColor}
              />
            ))}
          </View>
        )}

        {/* ── Reviews ── */}
        <View style={styles.section}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            REVIEWS
          </Text>
          <View style={styles.reviewCard}>
            <Text variant="displaySmall" color="primary">
              {component.rating.toFixed(1)}
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginLeft: spacing.sm }}>
              ⭐ ({component.reviewCount} reviews)
            </Text>
          </View>
        </View>

        {/* bottom spacer for sticky button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Add to Compare ── */}
      <View style={styles.stickyFooter}>
        <Button
          variant="primary"
          size="large"
          onPress={() =>
            navigation.navigate('Comparison', { componentIds: [component.id] })
          }
          style={styles.stickyButton}
        >
          Add to Compare
        </Button>
      </View>
    </View>
  );
}

export default ComponentDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  /* loading / skeleton */
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  skeletonBlock: {
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.background.elevated,
    marginBottom: spacing.md,
    width: '80%',
  },

  /* hero */
  hero: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  brandLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  productName: {
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroMeta: {},
  price: { fontWeight: '600', marginBottom: 2 },

  /* sections */
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    letterSpacing: 1,
  },

  /* spec table */
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  specRowAlt: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.sm,
  },
  specLabel: { flex: 1 },
  specValue: { flex: 1, textAlign: 'right' },

  /* reviews */
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
  },

  /* sticky footer */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  stickyButton: {
    width: '100%',
  },
});
