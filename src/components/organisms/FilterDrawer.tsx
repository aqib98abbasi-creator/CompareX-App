/**
 * Filter Drawer Organism - Persistent bottom drawer for filters
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text, Button, Chip } from '../atoms';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { FilterState, ComponentType, Brand } from '../../types';

export interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableBrands: Brand[];
  priceRange: [number, number];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  availableBrands,
  priceRange,
}) => {
  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleBrand = (brand: Brand) => {
    const brands = filters.brands || [];
    const newBrands = brands.includes(brand)
      ? brands.filter((b) => b !== brand)
      : [...brands, brand];
    updateFilters({ brands: newBrands.length > 0 ? newBrands : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.componentType,
    filters.brands?.length,
    filters.priceRange,
    filters.releaseYear,
    filters.minRating,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text variant="displaySmall" color="primary">
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="small" onPress={clearFilters}>
                Clear All
              </Button>
            )}
          </View>

          <ScrollView style={styles.content}>
            {/* Component Type */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionTitle}>
                Component Type
              </Text>
              <View style={styles.chipContainer}>
                {(['CPU', 'GPU', 'RAM', 'SSD'] as ComponentType[]).map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    selected={filters.componentType === type}
                    onPress={() => updateFilters({ componentType: type })}
                  />
                ))}
              </View>
            </View>

            {/* Brands */}
            {availableBrands.length > 0 && (
              <View style={styles.section}>
                <Text variant="label" color="secondary" style={styles.sectionTitle}>
                  Brands
                </Text>
                <View style={styles.chipContainer}>
                  {availableBrands.slice(0, 10).map((brand) => (
                    <Chip
                      key={brand}
                      label={brand}
                      selected={filters.brands?.includes(brand)}
                      onPress={() => toggleBrand(brand)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Price Range */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionTitle}>
                Price Range
              </Text>
              <View style={styles.priceRange}>
                <Text variant="bodySmall" color="secondary">
                  ${priceRange[0]} - ${priceRange[1]}
                </Text>
                {/* In production, add Slider component here */}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text variant="label" color="secondary" style={styles.sectionTitle}>
                Sort By
              </Text>
              <View style={styles.chipContainer}>
                {(['performance', 'price', 'value', 'popularity', 'newest'] as const).map((sort) => (
                  <Chip
                    key={sort}
                    label={sort.charAt(0).toUpperCase() + sort.slice(1)}
                    selected={filters.sortBy === sort}
                    onPress={() => updateFilters({ sortBy: sort })}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button variant="primary" onPress={onClose} style={styles.applyButton}>
              Apply Filters ({activeFilterCount})
            </Button>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priceRange: {
    padding: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  applyButton: {
    width: '100%',
  },
});
