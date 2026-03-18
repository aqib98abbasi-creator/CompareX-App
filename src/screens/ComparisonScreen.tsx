/**
 * Comparison Screen
 * Matches design: filled cards, CompareX Index scores, animated benchmark bars,
 * full spec table, value analysis.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Text } from '../components';
import { colors, getBrandColor, getScoreColor } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';
import { Component } from '../types';
import {
  getComponentById,
  initializeDatabase,
  getAllComponents,
  searchComponents,
} from '../services/dataService';
import { addComparisonHistory } from '../services/historyService';
import { formatPrice } from '../utils/formatting';

type ComparisonNavigationProp = StackNavigationProp<RootStackParamList, 'Comparison'>;

const HIT_SLOP_10 = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function withAlpha(hex: string, alpha: number): string {
  // Supports #RRGGBB. Falls back to original if not a 6-digit hex.
  if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  const aa = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${hex}${aa}`; // #RRGGBBAA
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export function ComparisonScreen() {
  const navigation = useNavigation<ComparisonNavigationProp>();
  const route = useRoute();
  const { componentIds } = (route.params as { componentIds?: string[] }) || {};
  const canGoBack = navigation.canGoBack();

  const [partA, setPartA] = useState<Component | null>(null);
  const [partB, setPartB] = useState<Component | null>(null);
  const [activeType, setActiveType] = useState<'GPU' | 'CPU' | 'RAM' | 'SSD'>('GPU');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<'A' | 'B'>('B');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Component[]>([]);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

  // Animation refs & cached data
  const barAnim = useRef(new Animated.Value(0)).current;
  const allComponentsRef = useRef<Component[]>([]);

  useEffect(() => {
    initializeDatabase().then(() => {
      const all = getAllComponents();
      allComponentsRef.current = all;

      if (componentIds && componentIds.length >= 2) {
        const a = getComponentById(componentIds[0]);
        const b = getComponentById(componentIds[1]);
        if (a) setPartA(a);
        if (b) setPartB(b);

        // infer active type from incoming parts when possible
        const inferred = (a || b)?.type;
        if (inferred === 'GPU' || inferred === 'CPU' || inferred === 'RAM' || inferred === 'SSD') {
          setActiveType(inferred);
        }
      } else if (componentIds && componentIds.length === 1) {
        const a = getComponentById(componentIds[0]);
        if (a) setPartA(a);

        if (a && (a.type === 'GPU' || a.type === 'CPU' || a.type === 'RAM' || a.type === 'SSD')) {
          setActiveType(a.type);
        }
      }
    });
  }, [componentIds]);

  // Animate bars & store history when both selected
  useEffect(() => {
    if (partA && partB) {
      barAnim.setValue(0);
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // fire and forget – we don't care about awaiting
      addComparisonHistory(partA, partB).catch(() => {});
    }
  }, [partA, partB]);

  /* ── Search helpers ── */

  const handleOpenSearch = (slot: 'A' | 'B') => {
    setSelectingSlot(slot);
    setSearchQuery('');
    const pool = allComponentsRef.current.filter((c) => c.type === activeType);
    setSearchResults(pool.slice(0, 20));
    setSearchModalVisible(true);
  };

  const handleSelectComponent = (comp: Component) => {
    if (selectingSlot === 'A') setPartA(comp);
    else setPartB(comp);
    setSearchModalVisible(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      const pool = allComponentsRef.current.filter((c) => c.type === activeType);
      setSearchResults(pool.slice(0, 20));
    } else {
      const results = searchComponents(query).filter((c) => c.type === activeType);
      setSearchResults(results);
    }
  };

  const handleSwap = () => {
    const t = partA;
    setPartA(partB);
    setPartB(t);
  };

  const hasBothParts = partA !== null && partB !== null;

  const handleTypeChange = (type: 'GPU' | 'CPU' | 'RAM' | 'SSD') => {
    if (activeType === type) return;
    setActiveType(type);
    // reset selections when changing category to avoid mixed-type comparisons
    setPartA(null);
    setPartB(null);
  };

  const comparisonModel = useMemo(() => {
    if (!partA || !partB) return null;
    const scoreA = partA.performanceScore;
    const scoreB = partB.performanceScore;
    const diff = scoreB > 0 ? ((scoreA - scoreB) / scoreB) * 100 : 0;

    return {
      scoreA,
      scoreB,
      diff,
      diffSign: diff >= 0 ? '+' : '',
      diffColor: diff >= 0 ? colors.accent.green : colors.accent.orange,
      benchmarks: getBenchmarkComparisons(partA, partB),
      specRows: getSpecTableRows(partA, partB),
      valueA: scoreA / (partA.price || 1),
      valueB: scoreB / (partB.price || 1),
      brandColorA: getBrandColor(partA.brand),
      brandColorB: getBrandColor(partB.brand),
    };
  }, [partA, partB]);

  /* ══════════════════════════════════════════════════════════
     Render: Filled / Empty Card
     ══════════════════════════════════════════════════════════ */

  const renderFilledCard = (comp: Component, slot: 'A' | 'B') => {
    const brandColor = getBrandColor(comp.brand);
    const scoreColor = getScoreColor(comp.performanceScore);
    const scoreBg = scoreBadgeBg(comp.performanceScore);

    return (
      <TouchableOpacity
        style={styles.filledCard}
        activeOpacity={0.7}
        onPress={() => handleOpenSearch(slot)}
      >
        <Text variant="caption" style={[styles.brandLabel, { color: brandColor }]}>
          {comp.brand.toUpperCase()}
        </Text>
        <Text variant="bodyMedium" color="primary" style={styles.cardName} numberOfLines={2}>
          {comp.name}
        </Text>
        <View style={styles.priceRow}>
          <Text variant="bodySmall" style={styles.cardPrice}>
            {formatPrice(comp.price)}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreBg }]}>
            <Text variant="caption" style={[styles.cardScoreText, { color: scoreColor }]}>
              {comp.performanceScore}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyCard = (slot: 'A' | 'B') => (
    <TouchableOpacity
      style={styles.emptyCard}
      activeOpacity={0.7}
      onPress={() => handleOpenSearch(slot)}
    >
      <Text variant="bodyLarge" color="secondary" style={styles.emptyIcon}>
        🔍
      </Text>
      <Text variant="caption" color="secondary" style={styles.emptyLabel}>
        SELECT PART {slot}
      </Text>
    </TouchableOpacity>
  );

  /* ══════════════════════════════════════════════════════════
     Render: Full Comparison Result
     ══════════════════════════════════════════════════════════ */

  const renderComparisonResult = () => {
    if (!partA || !partB || !comparisonModel) return null;

    return (
      <>
        {/* ── CompareX Index ── */}
        <View style={styles.indexCard}>
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            COMPAREX INDEX
          </Text>
          <View style={styles.indexRow}>
            {/* Part A */}
            <View style={styles.indexSide}>
              <Text variant="displaySmall" style={[styles.indexScore, { color: getScoreColor(comparisonModel.scoreA) }]}>
                {comparisonModel.scoreA}
              </Text>
              <Text variant="caption" color="secondary" style={styles.indexName} numberOfLines={2}>
                {shortName(partA.name)}
              </Text>
            </View>

            {/* VS */}
            <View style={styles.indexVs}>
              <Text variant="caption" color="secondary">VS</Text>
              <Text variant="caption" style={[styles.indexDiff, { color: comparisonModel.diffColor }]}>
                {comparisonModel.diffSign}{comparisonModel.diff.toFixed(1)}%
              </Text>
            </View>

            {/* Part B */}
            <View style={styles.indexSide}>
              <Text variant="displaySmall" style={[styles.indexScore, { color: getScoreColor(comparisonModel.scoreB) }]}>
                {comparisonModel.scoreB}
              </Text>
              <Text variant="caption" color="secondary" style={styles.indexName} numberOfLines={2}>
                {shortName(partB.name)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Benchmarks ── */}
        <View style={styles.benchCard}>
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            BENCHMARKS
          </Text>
          {comparisonModel.benchmarks.map((bm) => {
            const maxVal = Math.max(bm.valueA, bm.valueB, 1);
            const pctA = bm.valueA / maxVal;
            const pctB = bm.valueB / maxVal;
            const bmDiff = bm.valueB > 0 ? ((bm.valueA - bm.valueB) / bm.valueB) * 100 : 0;
            const bmDiffSign = bmDiff >= 0 ? '+' : '';
            const bmDiffColor = bmDiff >= 0 ? colors.accent.green : colors.accent.orange;
            const aColor = getBrandColor(partA.brand);
            const sameBrand = partA.brand === partB.brand;
            // If both are the same brand, make B visually distinct while staying \"on-brand\"
            const bColor = sameBrand ? withAlpha(aColor, 0.55) : getBrandColor(partB.brand);
            const bOutline = sameBrand ? aColor : 'transparent';

            return (
              <View key={bm.label} style={styles.bmGroup}>
                {/* Label + diff */}
                <View style={styles.bmHeader}>
                  <Text variant="caption" color="secondary" style={styles.bmLabel}>
                    {bm.label}
                  </Text>
                  <Text variant="caption" style={{ color: bmDiffColor, fontWeight: '600', fontSize: 11 }}>
                    {bmDiffSign}{bmDiff.toFixed(1)}%
                  </Text>
                </View>
                {/* Bar A */}
                <View style={styles.bmBarRow}>
                  <Animated.View
                    style={[
                      styles.bmBar,
                      {
                        backgroundColor: aColor,
                        width: barAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${pctA * 100}%`],
                        }),
                      },
                    ]}
                  />
                  <Text variant="caption" color="primary" style={styles.bmScore}>
                    {bm.displayA}
                  </Text>
                </View>
                {/* Bar B */}
                <View style={styles.bmBarRow}>
                  <Animated.View
                    style={[
                      styles.bmBar,
                      {
                        backgroundColor: bColor,
                        borderWidth: sameBrand ? 1 : 0,
                        borderColor: bOutline,
                        width: barAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', `${pctB * 100}%`],
                        }),
                      },
                    ]}
                  />
                  <Text variant="caption" color="primary" style={styles.bmScore}>
                    {bm.displayB}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Show only differences toggle ── */}
        <TouchableOpacity
          style={styles.diffToggle}
          activeOpacity={0.7}
          onPress={() => setShowOnlyDiffs(!showOnlyDiffs)}
        >
          <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>
            {showOnlyDiffs ? 'Show all specs' : 'Show only differences'}
          </Text>
        </TouchableOpacity>

        {/* ── Spec Table ── */}
        <View style={styles.specTable}>
          {/* Header */}
          <View style={styles.specHeaderRow}>
            <View style={styles.specLabelCol}>
              <Text variant="caption" color="secondary" style={styles.specHeaderText}>SPEC</Text>
            </View>
            <View style={styles.specValCol}>
              <Text variant="caption" style={[styles.specHeaderText, { color: comparisonModel.brandColorA }]}>
                {partA.brand.toUpperCase()}
              </Text>
            </View>
            <View style={styles.specValCol}>
              <Text variant="caption" style={[styles.specHeaderText, { color: comparisonModel.brandColorB }]}>
                {partB.brand.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Rows */}
          {comparisonModel.specRows
            .filter((r) => !showOnlyDiffs || r.valA !== r.valB)
            .map((row, idx) => (
              <View key={idx} style={[styles.specRow, idx % 2 === 0 && styles.specRowAlt]}>
                <View style={styles.specLabelCol}>
                  <Text variant="caption" color="secondary" style={styles.specLabelText}>
                    {row.label}
                  </Text>
                </View>
                <View style={styles.specValCol}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.specValText,
                      row.winnerIdx === 0 && { color: colors.text.primary, fontWeight: '700' },
                      row.winnerIdx !== 0 && { color: colors.text.secondary },
                    ]}
                  >
                    {row.valA}
                  </Text>
                </View>
                <View style={styles.specValCol}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.specValText,
                      row.winnerIdx === 1 && { color: colors.text.primary, fontWeight: '700' },
                      row.winnerIdx !== 1 && { color: colors.text.secondary },
                    ]}
                  >
                    {row.valB}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* ── Value Analysis ── */}
        <View style={styles.valueCard}>
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            VALUE ANALYSIS
          </Text>
          <View style={styles.valueRow}>
            {/* Part A */}
            <View style={styles.valueSide}>
              <Text variant="caption" color="secondary">Price</Text>
              <Text variant="bodyLarge" color="primary" style={styles.valuePrice}>
                {formatPrice(partA.price)}
              </Text>
              <Text variant="caption" color="secondary">Value Score</Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: comparisonModel.valueA >= comparisonModel.valueB ? colors.accent.blue : colors.text.secondary,
                  fontWeight: '700',
                  fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
                }}
              >
                {(comparisonModel.valueA * 100).toFixed(1)}
              </Text>
            </View>
            {/* Part B */}
            <View style={styles.valueSide}>
              <Text variant="caption" color="secondary">Price</Text>
              <Text variant="bodyLarge" color="primary" style={styles.valuePrice}>
                {formatPrice(partB.price)}
              </Text>
              <Text variant="caption" color="secondary">Value Score</Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: comparisonModel.valueB >= comparisonModel.valueA ? colors.accent.green : colors.text.secondary,
                  fontWeight: '700',
                  fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
                }}
              >
                {(comparisonModel.valueB * 100).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  /* ══════════════════════════════════════════════════════════
     Render: Search Modal
     ══════════════════════════════════════════════════════════ */

  const renderSearchModal = () => (
    <Modal
      visible={searchModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSearchModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
            <Text variant="bodyMedium" style={{ color: colors.accent.blue }}>Cancel</Text>
          </TouchableOpacity>
          <Text variant="bodyMedium" color="primary" style={{ fontWeight: '700' }}>
            Select Part {selectingSlot}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search components..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => {
            const brandColor = getBrandColor(item.brand);
            return (
              <TouchableOpacity
                style={styles.searchResultItem}
                activeOpacity={0.7}
                onPress={() => handleSelectComponent(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={{ color: brandColor }}>
                    {item.brand}
                  </Text>
                  <Text variant="bodyMedium" color="primary" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text variant="caption" style={{ color: colors.accent.green, marginRight: 8 }}>
                      {formatPrice(item.price)}
                    </Text>
                    <Text variant="caption" style={{ color: getScoreColor(item.performanceScore) }}>
                      Score: {item.performanceScore}
                    </Text>
                  </View>
                </View>
                <View style={styles.typeChip}>
                  <Text variant="caption" color="secondary">{item.type}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text variant="bodyMedium" color="secondary">No components found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  /* ══════════════════════════════════════════════════════════
     Main Render
     ══════════════════════════════════════════════════════════ */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            hitSlop={HIT_SLOP_10}
          >
            <Text variant="bodyLarge" color="primary" style={{ fontSize: 22 }}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
        <Text variant="bodyLarge" color="primary" style={styles.headerTitle}>Compare</Text>
        <TouchableOpacity style={styles.headerBtn} hitSlop={HIT_SLOP_10}>
          <Text variant="bodyLarge" color="secondary" style={{ fontSize: 16 }}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Type filter row */}
      <View style={styles.typeFilterRow}>
        {(['GPU', 'CPU', 'RAM', 'SSD'] as const).map((type) => {
          const isActive = activeType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, isActive && styles.typeChipActive]}
              activeOpacity={0.7}
              onPress={() => handleTypeChange(type)}
            >
              <Text
                variant="caption"
                style={[
                  styles.typeChipText,
                  isActive && styles.typeChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cards */}
        <View style={styles.cardsRow}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            {partA ? renderFilledCard(partA, 'A') : renderEmptyCard('A')}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            {partB ? renderFilledCard(partB, 'B') : renderEmptyCard('B')}
          </View>
        </View>

        {/* Swap */}
        {hasBothParts && (
          <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
            <Text variant="caption" style={{ color: colors.accent.blue }}>⇄ Swap</Text>
          </TouchableOpacity>
        )}

        {/* Instruction when only one part */}
        {!hasBothParts && (
          <View style={styles.instructionBox}>
            <Text variant="bodySmall" color="secondary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
              Select two components to compare them side by side.
            </Text>
            <TouchableOpacity
              style={styles.selectBtn}
              activeOpacity={0.7}
              onPress={() => handleOpenSearch(partA ? 'B' : 'A')}
            >
              <Text variant="bodyMedium" style={{ color: colors.accent.blue, fontWeight: '600' }}>
                Select Part {partA ? 'B' : 'A'}  →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full comparison */}
        {hasBothParts && (
          <View style={styles.resultWrap}>
            {renderComparisonResult()}
          </View>
        )}
      </ScrollView>

      {renderSearchModal()}
    </View>
  );
}

export default ComparisonScreen;

/* ═══════════════════════════════════════════════════════════
   DATA HELPERS
   ═══════════════════════════════════════════════════════════ */

function scoreBadgeBg(score: number): string {
  if (score >= 90) return '#1A2A1A';
  if (score >= 75) return '#1A1A2A';
  if (score >= 60) return '#2A2A1A';
  return '#2A1A1A';
}

function shortName(name: string): string {
  // Strip brand prefix for display
  return name
    .replace(/^NVIDIA\s+/i, '')
    .replace(/^AMD\s+/i, '')
    .replace(/^Intel\s+/i, '')
    .replace(/^Samsung\s+/i, '')
    .replace(/^Corsair\s+/i, '')
    .trim();
}

interface BenchmarkComparison {
  label: string;
  valueA: number;
  valueB: number;
  displayA: string;
  displayB: string;
}

function getBenchmarkComparisons(a: Component, b: Component): BenchmarkComparison[] {
  const results: BenchmarkComparison[] = [];

  // Pair benchmarks by name
  const bNamesA = a.benchmarks.map((bm) => bm.name);
  const bNamesB = b.benchmarks.map((bm) => bm.name);
  const allNames = [...new Set([...bNamesA, ...bNamesB])];

  for (const name of allNames) {
    const bmA = a.benchmarks.find((bm) => bm.name === name);
    const bmB = b.benchmarks.find((bm) => bm.name === name);
    if (bmA || bmB) {
      const label = name
        .replace(/^3DMark\s*/i, '3DMARK')
        .replace('Cinebench R23 (Single)', 'CINEBENCH SINGLE')
        .replace('Cinebench R23 (Multi)', 'CINEBENCH MULTI')
        .toUpperCase();
      results.push({
        label,
        valueA: bmA?.score ?? 0,
        valueB: bmB?.score ?? 0,
        displayA: `${bmA?.score ?? 0}`,
        displayB: `${bmB?.score ?? 0}`,
      });
    }
  }

  return results;
}

interface SpecTableRow {
  label: string;
  valA: string;
  valB: string;
  winnerIdx: number | null; // 0 = A wins, 1 = B wins, null = tie/N/A
}

function getSpecTableRows(a: Component, b: Component): SpecTableRow[] {
  const rows: SpecTableRow[] = [];
  const sA = a.specs as any;
  const sB = b.specs as any;
  const fsA = (a.fullSpecs || {}) as any;
  const fsB = (b.fullSpecs || {}) as any;

  if (a.type === 'GPU' && b.type === 'GPU') {
    push('VRAM', `${sA.vram} GB ${sA.memoryType || ''}`, `${sB.vram} GB ${sB.memoryType || ''}`, sA.vram, sB.vram, 'higher');
    push('MEMORY BUS', `${sA.memoryBus}-bit`, `${sB.memoryBus}-bit`, sA.memoryBus, sB.memoryBus, 'higher');
    push('TDP', `${sA.tdp}W`, `${sB.tdp}W`, sA.tdp, sB.tdp, 'lower');
    push('CUDA CORES', sA.cudaCores ? `${sA.cudaCores}` : '—', sB.cudaCores ? `${sB.cudaCores}` : '—', sA.cudaCores || 0, sB.cudaCores || 0, 'higher');
    push('BOOST CLOCK', `${(sA.boostClock / 1000).toFixed(2)} GHz`, `${(sB.boostClock / 1000).toFixed(2)} GHz`, sA.boostClock, sB.boostClock, 'higher');
    push('MEMORY BANDWIDTH', `${sA.memoryBandwidth} GB/s`, `${sB.memoryBandwidth} GB/s`, sA.memoryBandwidth || 0, sB.memoryBandwidth || 0, 'higher');
    push('LITHOGRAPHY', fsA.lithography ? `${fsA.lithography}nm` : '—', fsB.lithography ? `${fsB.lithography}nm` : '—', fsA.lithography || 99, fsB.lithography || 99, 'lower');
    push('SLOT SIZE', sA.slotSize ? `${sA.slotSize} Slot` : '—', sB.slotSize ? `${sB.slotSize} Slot` : '—', null, null, null);
    push('STREAM PROCESSORS', sA.streamProcessors ? `${sA.streamProcessors}` : '—', sB.streamProcessors ? `${sB.streamProcessors}` : '—', sA.streamProcessors || 0, sB.streamProcessors || 0, 'higher');
  } else if (a.type === 'CPU' && b.type === 'CPU') {
    push('CORES', `${sA.cores}`, `${sB.cores}`, sA.cores, sB.cores, 'higher');
    push('THREADS', `${sA.threads}`, `${sB.threads}`, sA.threads, sB.threads, 'higher');
    push('BASE CLOCK', `${sA.baseClock} GHz`, `${sB.baseClock} GHz`, sA.baseClock, sB.baseClock, 'higher');
    push('BOOST CLOCK', `${sA.boostClock} GHz`, `${sB.boostClock} GHz`, sA.boostClock, sB.boostClock, 'higher');
    push('TDP', `${sA.tdp}W`, `${sB.tdp}W`, sA.tdp, sB.tdp, 'lower');
    push('SOCKET', sA.socket || '—', sB.socket || '—', null, null, null);
    push('L3 CACHE', sA.cache?.l3 ? `${sA.cache.l3} MB` : '—', sB.cache?.l3 ? `${sB.cache.l3} MB` : '—', sA.cache?.l3 || 0, sB.cache?.l3 || 0, 'higher');
    push('ARCHITECTURE', sA.architecture || '—', sB.architecture || '—', null, null, null);
  } else if (a.type === 'RAM' && b.type === 'RAM') {
    push('TYPE', sA.type || '—', sB.type || '—', null, null, null);
    push('CAPACITY', `${sA.capacity} GB`, `${sB.capacity} GB`, sA.capacity, sB.capacity, 'higher');
    push('SPEED', `${sA.speed} MHz`, `${sB.speed} MHz`, sA.speed, sB.speed, 'higher');
    push('CAS LATENCY', `CL${sA.casLatency}`, `CL${sB.casLatency}`, sA.casLatency, sB.casLatency, 'lower');
  } else if (a.type === 'SSD' && b.type === 'SSD') {
    push('INTERFACE', sA.interface || '—', sB.interface || '—', null, null, null);
    push('READ SPEED', `${sA.readSpeed} MB/s`, `${sB.readSpeed} MB/s`, sA.readSpeed, sB.readSpeed, 'higher');
    push('WRITE SPEED', `${sA.writeSpeed} MB/s`, `${sB.writeSpeed} MB/s`, sA.writeSpeed, sB.writeSpeed, 'higher');
    push('CAPACITY', `${sA.capacity} GB`, `${sB.capacity} GB`, sA.capacity, sB.capacity, 'higher');
  } else {
    // Generic: just show price & score
    push('PRICE', formatPrice(a.price), formatPrice(b.price), a.price, b.price, 'lower');
    push('SCORE', `${a.performanceScore}`, `${b.performanceScore}`, a.performanceScore, b.performanceScore, 'higher');
  }

  return rows;

  function push(
    label: string,
    valA: string,
    valB: string,
    numA: number | null,
    numB: number | null,
    better: 'higher' | 'lower' | null
  ) {
    let winnerIdx: number | null = null;
    if (numA != null && numB != null && better) {
      if (numA !== numB) {
        if (better === 'higher') winnerIdx = numA > numB ? 0 : 1;
        else winnerIdx = numA < numB ? 0 : 1;
      }
    }
    rows.push({ label, valA, valB, winnerIdx });
  }
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'web' ? 16 : 50,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
  },

  /* Type filter */
  typeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.xs,
    backgroundColor: colors.background.surface,
  },
  typeChipActive: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blue + '22',
  },
  typeChipText: {
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text.secondary,
  },
  typeChipTextActive: {
    color: colors.accent.blue,
    fontWeight: '700',
  },

  /* Cards */
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  filledCard: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  emptyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed' as any,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  brandLabel: {
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 11,
    marginBottom: 4,
  },
  cardName: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrice: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  cardScoreText: {
    fontWeight: '700',
    fontSize: 11,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  emptyLabel: {
    letterSpacing: 1.5,
    fontWeight: '600',
    fontSize: 10,
  },

  /* Swap */
  swapBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  /* Instruction */
  instructionBox: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: colors.accent.blue,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Results wrapper */
  resultWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },

  /* Shared section label */
  sectionLabel: {
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  /* CompareX Index */
  indexCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indexSide: {
    flex: 1,
    alignItems: 'center',
  },
  indexVs: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  indexScore: {
    fontWeight: '700',
    fontSize: 32,
  },
  indexName: {
    textAlign: 'center',
    marginTop: 4,
  },
  indexDiff: {
    fontWeight: '700',
    fontSize: 12,
  },

  /* Benchmarks */
  benchCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bmGroup: {
    marginBottom: spacing.md,
  },
  bmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bmLabel: {
    letterSpacing: 0.5,
    fontWeight: '600',
    fontSize: 11,
  },
  bmBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bmBar: {
    height: 10,
    borderRadius: 5,
  },
  bmScore: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 44,
  },

  /* Diff toggle */
  diffToggle: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },

  /* Spec table */
  specTable: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  specHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.default,
  },
  specLabelCol: {
    flex: 1.3,
    justifyContent: 'center',
  },
  specValCol: {
    flex: 1,
    justifyContent: 'center',
  },
  specHeaderText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  specRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  specLabelText: {
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  specValText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },

  /* Value Analysis */
  valueCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  valueRow: {
    flexDirection: 'row',
  },
  valueSide: {
    flex: 1,
  },
  valuePrice: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 8,
    marginTop: 2,
  },

  /* Search Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'web' ? 16 : 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  searchInputWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  searchInput: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
});
