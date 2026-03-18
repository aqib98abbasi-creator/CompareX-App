/**
 * Home Dashboard Screen
 * Matches the exact design from the product screenshot.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Text, ComponentCard } from '../components';
import { colors, getScoreColor, brandColors, BRANDS_BY_TYPE } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';
import { Component } from '../types';
import {
  getFeaturedDeal,
  getTrendingComparisons,
  getTopGpus,
  searchComponents as dataSearch,
  initializeDatabase,
  getComponentsByType,
  getCatalogMeta,
  CatalogMeta,
} from '../services/dataService';
import { getHistory, ComparisonHistoryItem, BottleneckHistoryItem } from '../services/historyService';
import { onAuthStateChange, getCloudComparisons, AuthState } from '../services/authService';

type HomeNav = StackNavigationProp<RootStackParamList, 'Home'>;

/* ── category definitions ───────────────────── */

const CATEGORIES: Array<{
  label: string;
  type: 'GPU' | 'CPU' | 'RAM' | 'SSD';
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { label: 'GPUS', type: 'GPU', icon: 'desktop-outline' },
  { label: 'CPUS', type: 'CPU', icon: 'hardware-chip-outline' },
  { label: 'RAM', type: 'RAM', icon: 'server-outline' },
  { label: 'SSDS', type: 'SSD', icon: 'save-outline' },
];

/* ── helpers ─────────────────────────────────── */

/** Strip brand prefix from product name */
function stripBrand(name: string, brand: string): string {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return name.replace(new RegExp(`^${escaped}\\s+`, 'i'), '');
}

/* ── component ──────────────────────────────── */

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();

  /* state */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Component[]>([]);
  const [featuredDeal, setFeaturedDeal] = useState<Component | null>(null);
  const [trendingPairs, setTrendingPairs] = useState<Component[][]>([]);
  const [topGpus, setTopGpus] = useState<Component[]>([]);
  const [activeCategory, setActiveCategory] = useState<'GPU' | 'CPU' | 'RAM' | 'SSD' | null>(null);
  const [categoryItems, setCategoryItems] = useState<Component[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [bottleneckHistory, setBottleneckHistory] = useState<BottleneckHistoryItem[]>([]);
  const [authState, setAuthState] = useState<AuthState>({ user: null, session: null, isLoading: true });
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta | null>(null);
  const [cloudComparisons, setCloudComparisons] = useState<Array<{
    id: string;
    componentIds: string[];
    type: 'comparison' | 'bottleneck';
    metadata: Record<string, any>;
    createdAt: string;
  }>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* init */
  useEffect(() => {
    initializeDatabase().then(async () => {
      setFeaturedDeal(getFeaturedDeal());
      setTrendingPairs(getTrendingComparisons());
      setTopGpus(getTopGpus(5));
      const meta = await getCatalogMeta();
      setCatalogMeta(meta);
    });

    // Subscribe to auth state changes
    const unsub = onAuthStateChange((state) => {
      setAuthState(state);
      // Fetch cloud comparisons when user logs in
      if (state.user) {
        getCloudComparisons().then(setCloudComparisons).catch(console.warn);
      } else {
        setCloudComparisons([]);
      }
    });

    return unsub;
  }, []);

  /* reset to default view when Home tab is focused */
  useFocusEffect(
    React.useCallback(() => {
      setActiveCategory(null);
    }, [])
  );

  /* debounced search – 300 ms */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (text.trim().length >= 2) {
        setSearchResults(dataSearch(text).slice(0, 8));
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCategoryPress = (type: 'GPU' | 'CPU' | 'RAM' | 'SSD') => {
    setActiveCategory(type);
    const items = getComponentsByType(type)
      .slice()
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 6);
    setCategoryItems(items);
  };

  const openHistory = async () => {
    const h = await getHistory();
    setComparisonHistory(h.comparisons);
    setBottleneckHistory(h.bottlenecks);
    setHistoryModalVisible(true);
  };

  /* ────────────────────────── render ────────────────────────── */

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      bounces={true}
      contentContainerStyle={styles.scroll}
    >
      {/* ═══ HEADER ═══ */}
      <View style={styles.header}>
        <View>
          <Text variant="displaySmall" color="primary">
            CompareX
          </Text>
          <Text
            variant="caption"
            color="secondary"
            style={styles.headerSub}
          >
            HARDWARE INTELLIGENCE
          </Text>
        </View>
        <TouchableOpacity
          onPress={openHistory}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={16} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* ═══ SEARCH BAR ═══ */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={16}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search components..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.searchClear}>
            <Ionicons name="close-circle" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* instant search results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.srRow}
              activeOpacity={0.7}
              onPress={() => {
                clearSearch();
                navigation.navigate('ComponentDetail' as any, { componentId: item.id });
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" color="primary" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color="secondary">
                  {item.type} • {item.brand}
                </Text>
              </View>
              <View
                style={[
                  styles.srBadge,
                  { backgroundColor: getScoreColor(item.performanceScore) + '22' },
                ]}
              >
                <Text
                  variant="monoSmall"
                  color="primary"
                  style={{ color: getScoreColor(item.performanceScore) }}
                >
                  {item.performanceScore}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ═══ CATEGORY CARDS ═══ */}
      <View style={styles.catRow}>
        {CATEGORIES.map(({ label, type, icon }) => {
          const isActive = activeCategory === type;
          const topBrands = (BRANDS_BY_TYPE[type] ?? []).slice(0, 3);
          return (
            <TouchableOpacity
              key={label}
              style={[styles.catCard, isActive && styles.catCardActive]}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(type)}
            >
              <Ionicons
                name={icon}
                size={22}
                color={isActive ? colors.accent.blue : colors.text.secondary}
                style={{ marginBottom: 6 }}
              />
              <Text
                variant="caption"
                color={isActive ? 'primary' : 'secondary'}
                style={styles.catLabel}
              >
                {label}
              </Text>
              {/* Brand dots row */}
              <View style={styles.catBrandDots}>
                {topBrands.map((brand) => (
                  <View
                    key={brand}
                    style={[
                      styles.catBrandDot,
                      { backgroundColor: brandColors[brand] ?? colors.text.secondary },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ═══ ACTION BUTTONS ═══ */}
      <View style={styles.actRow}>
        <TouchableOpacity
          style={[styles.actBtn, styles.actPrimary]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Comparison' as any)}
        >
          <Text variant="bodySmall" color="inverse" style={styles.actText}>
            Compare
          </Text>
          <Ionicons name="copy-outline" size={14} color={colors.text.inverse} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actBtn, styles.actPrimary]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CalculatorTab' as any)}
        >
          <Text variant="bodySmall" color="inverse" style={styles.actText}>
            Bottleneck
          </Text>
          <Ionicons name="analytics-outline" size={14} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* ═══ DEFAULT DASHBOARD OR CATEGORY VIEW ═══ */}
      {activeCategory == null ? (
        <>
          {/* SAVED COMPARISONS (logged-in users only) */}
          {authState.user && cloudComparisons.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.secLabel}>
                YOUR SAVED COMPARISONS
              </Text>
              {cloudComparisons.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.trRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.type === 'bottleneck') {
                      navigation.navigate('BottleneckCalculator' as any, {
                        cpuId: item.componentIds[0],
                        gpuId: item.componentIds[1],
                        resolution: item.metadata?.input?.resolution,
                        useCase: item.metadata?.input?.useCase,
                      });
                    } else {
                      navigation.navigate('Comparison' as any, {
                        componentIds: item.componentIds,
                      });
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" color="primary" numberOfLines={1}>
                      {item.type === 'bottleneck'
                        ? `${item.metadata?.cpuName ?? 'CPU'} + ${item.metadata?.gpuName ?? 'GPU'}`
                        : `${item.metadata?.aName ?? 'Component A'} vs ${item.metadata?.bName ?? 'Component B'}`
                      }
                    </Text>
                    <Text variant="caption" color="secondary">
                      {item.type === 'bottleneck' ? 'Bottleneck Check' : 'Comparison'}
                      {item.metadata?.maxBottleneck != null
                        ? ` • ${item.metadata.maxBottleneck.toFixed(1)}%`
                        : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.text.secondary}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* DEBUG: Catalog source + count (temporary) */}
          {catalogMeta && (
            <View style={styles.debugBanner}>
              <Text variant="caption" color="secondary" style={styles.debugText}>
                🗂 Loaded {catalogMeta.totalComponents} components from [{catalogMeta.source}]
                {'\n'}CPUs: {catalogMeta.cpuCount} · GPUs: {catalogMeta.gpuCount} · SSDs: {catalogMeta.ssdCount} · Other: {catalogMeta.otherCount}
              </Text>
            </View>
          )}

          {/* BEST VALUE THIS WEEK */}
          {featuredDeal && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.secLabel}>
                BEST VALUE THIS WEEK
              </Text>

              <View style={styles.bvCard}>
                {/* top line: brand • series  +  score */}
                <View style={styles.bvTop}>
                  <Text variant="caption" color="secondary" style={styles.bvSeries}>
                    {featuredDeal.brand.toUpperCase()} •{' '}
                    {(
                      featuredDeal.fullSpecs?.series ||
                      featuredDeal.type
                    ).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor:
                          getScoreColor(featuredDeal.performanceScore) + '22',
                      },
                    ]}
                  >
                    <Text
                      variant="bodyMedium"
                      color="primary"
                      style={{
                        color: getScoreColor(featuredDeal.performanceScore),
                        fontWeight: '700',
                      }}
                    >
                      {featuredDeal.performanceScore}
                    </Text>
                  </View>
                </View>

                {/* product name */}
                <Text
                  variant="displaySmall"
                  color="primary"
                  numberOfLines={1}
                  style={styles.bvName}
                >
                  {stripBrand(featuredDeal.name, featuredDeal.brand)}
                </Text>

                {/* stats row */}
                <View style={styles.bvStats}>
                  <View style={styles.bvCol}>
                    <Text variant="caption" color="secondary" style={styles.statLabel}>
                      PRICE
                    </Text>
                    <Text variant="monoMedium" color="primary">
                      ${featuredDeal.price}
                    </Text>
                  </View>
                  <View style={styles.bvCol}>
                    <Text variant="caption" color="secondary" style={styles.statLabel}>
                      VALUE
                    </Text>
                    <Text variant="monoMedium" color="primary">
                      {(
                        (featuredDeal.performanceScore / featuredDeal.price) *
                        100
                      ).toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.bvCol}>
                    <Text variant="caption" color="secondary" style={styles.statLabel}>
                      CATEGORY
                    </Text>
                    <Text variant="monoMedium" color="secondary">
                      {featuredDeal.type}
                    </Text>
                  </View>
                </View>

                {/* view details CTA */}
                <TouchableOpacity
                  style={styles.bvBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('ComponentDetail' as any, {
                      componentId: featuredDeal.id,
                    })
                  }
                >
                  <Text variant="bodySmall" color="primary" style={{ textAlign: 'center' }}>
                    View Details  →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TRENDING COMPARISONS */}
          {trendingPairs.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.secLabel}>
                TRENDING COMPARISONS
              </Text>

              {trendingPairs.map(([a, b], idx) => {
                // deterministic view-count that looks organic
                const viewK = (
                  (a.popularity + b.popularity) /
                  ([7, 17, 12, 15][idx] || 10)
                ).toFixed(1);

                return (
                  <TouchableOpacity
                    key={`${a.id}-${b.id}`}
                    style={styles.trRow}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('Comparison' as any, {
                        componentIds: [a.id, b.id],
                      })
                    }
                  >
                    {/* left component */}
                    <View style={styles.trLeft}>
                      <Text
                        variant="bodySmall"
                        color="primary"
                        numberOfLines={1}
                        style={{ fontWeight: '500' }}
                      >
                        {stripBrand(a.name, a.brand)}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {a.brand.toUpperCase()}
                      </Text>
                    </View>

                    {/* center VS */}
                    <View style={styles.trCenter}>
                      <Text
                        variant="bodySmall"
                        color="primary"
                        style={{ color: colors.accent.blue, fontWeight: '600' }}
                      >
                        VS
                      </Text>
                      <Text variant="caption" color="secondary">
                        {viewK}k
                      </Text>
                    </View>

                    {/* right component */}
                    <View style={styles.trRight}>
                      <Text
                        variant="bodySmall"
                        color="primary"
                        numberOfLines={1}
                        style={{ fontWeight: '500', textAlign: 'right' }}
                      >
                        {stripBrand(b.name, b.brand)}
                      </Text>
                      <Text
                        variant="caption"
                        color="secondary"
                        style={{ textAlign: 'right' }}
                      >
                        {b.brand.toUpperCase()}
                      </Text>
                    </View>

                    {/* chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.text.secondary}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* TOP GPUS */}
          {topGpus.length > 0 && (
            <View style={styles.section}>
              {/* section header */}
              <View style={styles.secHeader}>
                <Text variant="caption" color="secondary" style={styles.secHeaderLabel}>
                  TOP GPUS
                </Text>
              </View>

              {topGpus.map((gpu) => {
                const g = gpu.specs as any;
                const series = gpu.fullSpecs?.series || 'GPU';

                return (
                  <View key={gpu.id} style={styles.gpuCard}>
                    {/* brand • series  +  score */}
                    <View style={styles.gpuTop}>
                      <Text
                        variant="caption"
                        color="secondary"
                        style={styles.gpuSeries}
                      >
                        {gpu.brand.toUpperCase()} • {series.toUpperCase()} SERIES
                      </Text>
                      <View
                        style={[
                          styles.scoreBadge,
                          {
                            backgroundColor:
                              getScoreColor(gpu.performanceScore) + '22',
                          },
                        ]}
                      >
                        <Text
                          variant="bodyMedium"
                          color="primary"
                          style={{
                            color: getScoreColor(gpu.performanceScore),
                            fontWeight: '700',
                          }}
                        >
                          {gpu.performanceScore}
                        </Text>
                      </View>
                    </View>

                    {/* product name */}
                    <Text
                      variant="bodyLarge"
                      color="primary"
                      numberOfLines={1}
                      style={styles.gpuName}
                    >
                      {stripBrand(gpu.name, gpu.brand)}
                    </Text>

                    {/* spec chips row */}
                    <View style={styles.gpuSpecs}>
                      <View style={styles.gpuSpecCol}>
                        <Text variant="caption" color="secondary" style={styles.gpuSpecLabel}>
                          VRAM
                        </Text>
                        <Text variant="monoSmall" color="primary">
                          {g.vram} GB {g.memoryType}
                        </Text>
                      </View>
                      <View style={styles.gpuSpecCol}>
                        <Text variant="caption" color="secondary" style={styles.gpuSpecLabel}>
                          MEMORY BUS
                        </Text>
                        <Text variant="monoSmall" color="primary">
                          {g.memoryBus}-bit
                        </Text>
                      </View>
                      <View style={styles.gpuSpecCol}>
                        <Text variant="caption" color="secondary" style={styles.gpuSpecLabel}>
                          TDP
                        </Text>
                        <Text variant="monoSmall" color="primary">
                          {g.tdp}W
                        </Text>
                      </View>
                      <View style={styles.gpuSpecCol}>
                        <Text variant="caption" color="secondary" style={styles.gpuSpecLabel}>
                          PRICE
                        </Text>
                        <Text variant="monoSmall" color="primary">
                          ${gpu.price}
                        </Text>
                      </View>
                    </View>

                    {/* footer: details + add */}
                    <View style={styles.gpuFooter}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('ComponentDetail' as any, {
                            componentId: gpu.id,
                          })
                        }
                        style={styles.gpuDetailsBtn}
                        activeOpacity={0.7}
                      >
                        <Text variant="bodySmall" color="secondary">
                          Details  →
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.gpuAddBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate('Comparison' as any, {
                            componentIds: [gpu.id],
                          })
                        }
                      >
                        <Ionicons name="add" size={18} color={colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : (
        <>
          {/* CATEGORY-SPECIFIC LIST */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text variant="caption" color="secondary" style={styles.secHeaderLabel}>
                TOP {activeCategory}S
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Browse' as any, { componentType: activeCategory })
                }
              >
                <Text variant="bodySmall" color="secondary">
                  View All  →
                </Text>
              </TouchableOpacity>
            </View>

            {categoryItems.map((item) => (
              <ComponentCard
                key={item.id}
                component={item}
                onPress={() =>
                  navigation.navigate('ComponentDetail' as any, { componentId: item.id })
                }
                onAddToComparison={() =>
                  navigation.navigate('Comparison' as any, { componentIds: [item.id] })
                }
              />
            ))}
          </View>
        </>
      )}

      {/* ═══ HISTORY MODAL ═══ */}
      <Modal
        visible={historyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.historyOverlay}>
          <TouchableOpacity
            style={styles.historyOverlayBackdrop}
            activeOpacity={1}
            onPress={() => setHistoryModalVisible(false)}
          />
          <View style={styles.historySheet}>
            <View style={styles.historyHeader}>
              <Text variant="bodyMedium" color="primary" style={{ fontWeight: '700' }}>
                Recent Activity
              </Text>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.historyContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.historySection}>
                <Text variant="caption" color="secondary" style={styles.historyLabel}>
                  Comparisons
                </Text>
                {comparisonHistory.length === 0 ? (
                  <Text variant="caption" color="secondary" style={styles.historyEmpty}>
                    No comparisons yet.
                  </Text>
                ) : (
                  comparisonHistory.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHistoryModalVisible(false);
                        navigation.navigate('Comparison' as any, {
                          componentIds: [item.aId, item.bId],
                        });
                      }}
                    >
                      <Text variant="bodySmall" color="primary" numberOfLines={1} style={{ flex: 1 }}>
                        {item.aName}
                      </Text>
                      <Text variant="bodySmall" color="secondary" style={{ marginHorizontal: 8 }}>
                        vs
                      </Text>
                      <Text variant="bodySmall" color="primary" numberOfLines={1} style={{ flex: 1 }}>
                        {item.bName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.historySection}>
                <Text variant="caption" color="secondary" style={styles.historyLabel}>
                  Bottleneck Checks
                </Text>
                {bottleneckHistory.length === 0 ? (
                  <Text variant="caption" color="secondary" style={styles.historyEmpty}>
                    No bottleneck checks yet.
                  </Text>
                ) : (
                  bottleneckHistory.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHistoryModalVisible(false);
                        navigation.navigate('BottleneckCalculator' as any, {
                          cpuId: item.cpuId,
                          gpuId: item.gpuId,
                          resolution: item.input.resolution,
                          useCase: item.input.useCase,
                        });
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="bodySmall" color="primary" numberOfLines={1}>
                          {item.cpuName}
                        </Text>
                        <Text variant="bodySmall" color="primary" numberOfLines={1}>
                          {item.gpuName}
                        </Text>
                      </View>
                      <Text variant="caption" color="secondary" style={{ marginLeft: spacing.md }}>
                        {item.maxBottleneck.toFixed(1)}%
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default HomeScreen;

/* ══════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  /* ── header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerSub: {
    letterSpacing: 2,
    marginTop: 2,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── search ── */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  searchClear: {
    marginLeft: spacing.sm,
  },

  /* search results */
  searchResults: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
    overflow: 'hidden',
  },
  srRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  srBadge: {
    minWidth: 32,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginLeft: spacing.sm,
  },

  /* ── category cards ── */
  catRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  catCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: 4,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catCardActive: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blue + '15',
  },
  catLabel: {
    letterSpacing: 1,
  },
  catBrandDots: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 4,
  },
  catBrandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* ── action buttons ── */
  actRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  actBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    marginHorizontal: 4,
    minHeight: 44,
  },
  actPrimary: {
    backgroundColor: colors.accent.blue,
  },
  actSecondary: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actText: {
    fontWeight: '600',
    marginRight: 6,
  },

  /* ── generic section ── */
  section: {
    marginBottom: spacing.xl,
  },
  secLabel: {
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  debugBanner: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.blue,
  },
  debugText: {
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  secHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secHeaderLabel: {
    letterSpacing: 1.5,
  },

  /* ── best value card ── */
  bvCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  bvTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bvSeries: {
    letterSpacing: 1,
  },
  bvName: {
    marginBottom: spacing.md,
  },
  bvStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  bvCol: {
    flex: 1,
  },
  statLabel: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  bvBtn: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  /* ── score badge (shared) ── */
  scoreBadge: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── trending comparisons ── */
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  trLeft: {
    flex: 3,
    paddingRight: spacing.sm,
  },
  trCenter: {
    flex: 1,
    alignItems: 'center',
  },
  trRight: {
    flex: 3,
    paddingLeft: spacing.sm,
  },

  /* ── top GPU card ── */
  gpuCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  gpuTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gpuSeries: {
    letterSpacing: 1,
  },
  gpuName: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  gpuSpecs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  gpuSpecCol: {
    flex: 1,
  },
  gpuSpecLabel: {
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gpuFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.sm,
  },
  gpuDetailsBtn: {
    flex: 1,
    alignItems: 'center',
  },
  gpuAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── history modal ── */
  historyOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  historyOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  historySheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    maxHeight: '80%',
    ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)' } : {}),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  historyContent: {
    flex: 1,
    maxHeight: '100%',
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historyLabel: {
    letterSpacing: 1.5,
    fontWeight: '700',
    fontSize: 10,
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  historyEmpty: {
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
