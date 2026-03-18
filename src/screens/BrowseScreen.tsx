/**
 * Browse & Filter Screen
 * Matches design: custom header, search bar, category chips,
 * sort options with results count, component cards list.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Text } from '../components';
import { ComponentCard } from '../components/molecules';
import { FilterDrawer } from '../components/organisms';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';
import { Component, ComponentType, FilterState } from '../types';
import {
  getAllComponents,
  getComponentsByType,
  initializeDatabase,
} from '../services/dataService';
import {
  filterComponents,
  sortComponents,
  getPriceRange,
  getAvailableBrands,
} from '../utils/filters';
import { createSearchIndex, searchComponents } from '../utils/search';

type BrowseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Browse'>;

type SortOption = 'performance' | 'price' | 'price_high' | 'value' | 'newest';

const HIT_SLOP_10 = { top: 10, bottom: 10, left: 10, right: 10 } as const;

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: 'Performance', value: 'performance' },
  { label: 'Price: Low', value: 'price' },
  { label: 'Price: High', value: 'price_high' },
  { label: 'Value', value: 'value' },
  { label: 'Newest', value: 'newest' },
];

export function BrowseScreen() {
  const navigation = useNavigation<BrowseScreenNavigationProp>();
  const route = useRoute();
  const canGoBack = navigation.canGoBack();

  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('performance');

  useEffect(() => {
    initializeDatabase().then(() => {
      const params = route.params as { componentType?: ComponentType };
      let initial = getAllComponents();

      if (params?.componentType) {
        initial = initial.filter((c) => c.type === params.componentType);
        setFilters({ componentType: params.componentType });
      }

      setAllComponents(initial);
      setFilteredComponents(initial);
      setSearchIndex(createSearchIndex(initial));
    });
  }, [route.params]);

  useEffect(() => {
    let results = [...allComponents];

    // Apply search
    if (searchQuery.trim() && searchIndex) {
      const searchResults = searchComponents(searchIndex, searchQuery);
      results = results.filter((c) =>
        searchResults.some((r) => r.id === c.id)
      );
    }

    // Apply filters
    results = filterComponents(results, filters);

    // Apply sorting
    if (sortBy === 'price_high') {
      results = sortComponents(results, 'price');
      results.reverse();
    } else {
      results = sortComponents(results, sortBy === 'price' ? 'price' : sortBy as any);
    }

    setFilteredComponents(results);
  }, [allComponents, filters, searchQuery, searchIndex, sortBy]);

  const priceRange = useMemo(() => getPriceRange(allComponents), [allComponents]);
  const availableBrands = useMemo(
    () => getAvailableBrands(allComponents, filters.componentType),
    [allComponents, filters.componentType]
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => navigation.goBack()}
            hitSlop={HIT_SLOP_10}
          >
            <Text variant="bodyLarge" color="primary" style={styles.headerBackIcon}>
              ‹
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBack} />
        )}
        <Text variant="bodyLarge" color="primary" style={styles.headerTitle}>
          Browse
        </Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setFilterDrawerVisible(true)}
          activeOpacity={0.7}
          hitSlop={HIT_SLOP_10}
        >
          <Text variant="bodyLarge" color="secondary" style={styles.headerFilterIcon}>
            ☰
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text variant="bodySmall" color="secondary" style={styles.searchIcon}>
            🔍
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search components..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortOptions}
        >
          <Text variant="caption" color="secondary" style={styles.sortIcon}>
            ↕
          </Text>
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSortBy(opt.value)}
                style={styles.sortOption}
                activeOpacity={0.7}
              >
                <Text
                  variant="bodySmall"
                  style={[
                    styles.sortText,
                    active && styles.sortTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {active && <View style={styles.sortUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text variant="caption" color="secondary" style={styles.resultCount}>
          {filteredComponents.length} results
        </Text>
      </View>

      {/* Component List */}
      <FlatList
        data={filteredComponents}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        bounces={true}
        renderItem={({ item }) => (
          <ComponentCard
            component={item}
            onPress={() =>
              navigation.navigate('ComponentDetail' as any, {
                componentId: item.id,
              })
            }
            onAddToComparison={() =>
              navigation.navigate('Comparison' as any, {
                componentIds: [item.id],
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" color="secondary">
              No components found
            </Text>
            <Text
              variant="bodySmall"
              color="secondary"
              style={styles.emptySubtext}
            >
              Try adjusting your filters or search query
            </Text>
          </View>
        }
      />

      {/* Filter Drawer */}
      <FilterDrawer
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        filters={filters}
        onFiltersChange={(newFilters: FilterState) => setFilters(newFilters)}
        availableBrands={availableBrands}
        priceRange={priceRange}
      />
    </View>
  );
}

export default BrowseScreen;

/* ─── Styles ──────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'web' ? 16 : 50,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFilterIcon: {
    fontSize: 18,
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: 0,
  },

  // Category Chips
  categoryChips: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent.blue,
    borderColor: colors.accent.blue,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.primary,
  },

  // Sort Row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  sortOption: {
    marginRight: spacing.md,
    paddingVertical: 4,
  },
  sortText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sortTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  sortUnderline: {
    height: 2,
    backgroundColor: colors.text.primary,
    borderRadius: 1,
    marginTop: 2,
  },
  resultCount: {
    fontSize: 11,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },

  // Empty
  emptyState: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptySubtext: {
    marginTop: spacing.sm,
  },
});
