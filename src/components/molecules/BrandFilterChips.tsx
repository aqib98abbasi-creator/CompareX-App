/**
 * BrandFilterChips — Horizontal scrollable brand pills with signature colors & counts.
 *
 * Usage:
 *   <BrandFilterChips
 *     brands={['NVIDIA', 'AMD', 'Intel']}
 *     counts={{ NVIDIA: 22, AMD: 18, Intel: 4 }}
 *     selected="NVIDIA"          // null = "All"
 *     onSelect={(brand) => …}    // null = user tapped "All"
 *   />
 */

import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../atoms';
import { colors, brandColors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

export interface BrandFilterChipsProps {
  /** Ordered list of brand names to display. */
  brands: string[];
  /** Component count per brand — shown as badge. */
  counts: Record<string, number>;
  /** Currently selected brand, or null for "All". */
  selected: string | null;
  /** Called when user taps a brand chip. `null` means "All". */
  onSelect: (brand: string | null) => void;
  /** Total count for the "All" chip. */
  totalCount?: number;
}

export function BrandFilterChips({
  brands,
  counts,
  selected,
  onSelect,
  totalCount,
}: BrandFilterChipsProps) {
  const allCount = totalCount ?? Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[
            styles.chip,
            selected === null && styles.chipSelectedAll,
          ]}
          activeOpacity={0.7}
          onPress={() => onSelect(null)}
        >
          <Text
            variant="caption"
            style={[
              styles.chipLabel,
              selected === null && styles.chipLabelSelected,
            ]}
          >
            All
          </Text>
          <View style={[styles.countBadge, selected === null && styles.countBadgeSelected]}>
            <Text variant="caption" style={[styles.countText, selected === null && styles.countTextSelected]}>
              {allCount}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Brand chips */}
        {brands.map((brand) => {
          const isActive = selected === brand;
          const brandColor = brandColors[brand] ?? colors.text.secondary;
          const count = counts[brand] ?? 0;

          if (count === 0) return null; // Don't show brands with 0 components

          return (
            <TouchableOpacity
              key={brand}
              style={[
                styles.chip,
                isActive && { backgroundColor: brandColor + '22', borderColor: brandColor },
              ]}
              activeOpacity={0.7}
              onPress={() => onSelect(isActive ? null : brand)}
            >
              {/* Color dot */}
              <View style={[styles.dot, { backgroundColor: brandColor }]} />
              <Text
                variant="caption"
                style={[
                  styles.chipLabel,
                  isActive && { color: brandColor },
                ]}
              >
                {brand}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isActive && { backgroundColor: brandColor + '33' },
                ]}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.countText,
                    isActive && { color: brandColor },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipSelectedAll: {
    backgroundColor: colors.accent.blue + '22',
    borderColor: colors.accent.blue,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  chipLabelSelected: {
    color: colors.accent.blue,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: colors.background.elevated,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: colors.accent.blue + '33',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  countTextSelected: {
    color: colors.accent.blue,
  },
});
