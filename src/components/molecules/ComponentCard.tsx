/**
 * Component Card Molecule
 * Matches browse screen design: brand•series, name, score badge,
 * horizontal spec row, Details + Add buttons.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Text } from '../atoms';
import { colors, getBrandColor, getScoreColor } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { Component } from '../../types';
import { formatPrice } from '../../utils/formatting';

export interface ComponentCardProps {
  component: Component;
  onPress: () => void;
  onAddToComparison?: () => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onPress,
  onAddToComparison,
}) => {
  const scoreColor = getScoreColor(component.performanceScore);
  const brandColor = getBrandColor(component.brand);
  const series = getSeriesLabel(component);
  const specs = getKeySpecs(component);

  return (
    <View style={styles.card}>
      {/* Top row: brand • series  |  score badge */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Text variant="caption" style={[styles.brandText, { color: brandColor }]}>
            {component.brand.toUpperCase()}
          </Text>
          {series ? (
            <>
              <Text variant="caption" style={[styles.dot, { color: brandColor }]}> • </Text>
              <Text variant="caption" style={[styles.seriesText, { color: brandColor }]}>
                {series}
              </Text>
            </>
          ) : null}
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreBadgeBg(component.performanceScore) }]}>
          <Text variant="bodySmall" style={[styles.scoreText, { color: scoreColor }]}>
            {component.performanceScore}
          </Text>
        </View>
      </View>

      {/* Component name */}
      <Text variant="bodyLarge" color="primary" style={styles.compName} numberOfLines={1}>
        {component.name}
      </Text>

      {/* Specs row */}
      <View style={styles.specsRow}>
        {specs.map((spec, idx) => (
          <View
            key={`${spec.label}-${idx}`}
            style={[styles.specCol, idx < specs.length - 1 && styles.specColSpacer]}
          >
            <Text variant="caption" color="secondary" style={styles.specLabel}>
              {spec.label}
            </Text>
            <Text variant="bodySmall" color="primary" style={styles.specValue}>
              {spec.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom row: Details button + Add button */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.detailsButton}
          activeOpacity={0.7}
          onPress={onPress}
        >
          <Text variant="bodySmall" color="secondary" style={styles.detailsText}>
            Details  ›
          </Text>
        </TouchableOpacity>
        {onAddToComparison && (
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={onAddToComparison}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="bodyLarge" color="primary" style={styles.addIcon}>
              +
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ─── Helpers ─────────────────────────────────────────────── */

function scoreBadgeBg(score: number): string {
  if (score >= 90) return '#1A2A1A';
  if (score >= 75) return '#1A1A2A';
  if (score >= 60) return '#2A2A1A';
  return '#2A1A1A';
}

function getSeriesLabel(component: Component): string {
  const series = (component.fullSpecs as any)?.series;
  if (series) return series.toUpperCase();

  // Fallback: derive from name
  if (component.type === 'GPU') {
    if (component.name.includes('RTX 40')) return 'RTX 40 SERIES';
    if (component.name.includes('RTX 30')) return 'RTX 30 SERIES';
    if (component.name.includes('RX 7')) return 'RX 7000 SERIES';
    if (component.name.includes('RX 6')) return 'RX 6000 SERIES';
    if (component.name.includes('Arc')) return 'ARC SERIES';
  }
  if (component.type === 'CPU') {
    const s = component.specs as any;
    if (s.architecture) return s.architecture.toUpperCase();
  }
  return '';
}

interface SpecItem {
  label: string;
  value: string;
}

function getKeySpecs(component: Component): SpecItem[] {
  const specs: SpecItem[] = [];
  const s = component.specs as any;

  switch (component.type) {
    case 'GPU':
      specs.push(
        { label: 'VRAM', value: `${s.vram} GB ${s.memoryType || ''}`.trim() },
        { label: 'MEMORY BUS', value: `${s.memoryBus}-bit` },
        { label: 'TDP', value: `${s.tdp}W` },
        { label: 'PRICE', value: formatPrice(component.price) }
      );
      break;
    case 'CPU':
      specs.push(
        { label: 'CORES', value: `${s.cores}` },
        { label: 'THREADS', value: `${s.threads}` },
        { label: 'TDP', value: `${s.tdp}W` },
        { label: 'PRICE', value: formatPrice(component.price) }
      );
      break;
    case 'RAM':
      specs.push(
        { label: 'TYPE', value: s.type || '-' },
        { label: 'CAPACITY', value: `${s.capacity} GB` },
        { label: 'SPEED', value: `${s.speed} MHz` },
        { label: 'PRICE', value: formatPrice(component.price) }
      );
      break;
    case 'SSD':
      specs.push(
        { label: 'INTERFACE', value: `${s.interface || ''} ${s.formFactor || ''}`.trim() },
        { label: 'READ SPEED', value: `${s.readSpeed} MB/s` },
        { label: 'WRITE SPEED', value: `${s.writeSpeed} MB/s` },
        { label: 'PRICE', value: formatPrice(component.price) }
      );
      break;
    default:
      specs.push(
        { label: 'TYPE', value: component.type },
        { label: 'PRICE', value: formatPrice(component.price) }
      );
  }

  return specs;
}

/* ─── Styles ──────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 10,
  },
  dot: {
    fontSize: 10,
  },
  seriesText: {
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  scoreText: {
    fontWeight: '700',
  },

  // Name
  compName: {
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.md,
  },

  // Specs
  specsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  specCol: {
    // no flex - sizes itself
  },
  specColSpacer: {
    marginRight: spacing.lg,
  },
  specLabel: {
    letterSpacing: 0.5,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
    color: colors.text.secondary,
  },
  specValue: {
    fontWeight: '600',
    fontSize: 12,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  detailsText: {
    fontWeight: '600',
    fontSize: 13,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 20,
  },
});
