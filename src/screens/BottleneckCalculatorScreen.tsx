/**
 * Bottleneck Calculator Screen
 * Matches design: custom header, CPU/GPU selector cards, resolution toggles,
 * use case toggles, instructional text, and results section.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Text, Badge, AdBanner } from '../components';
import { colors, getBrandColor, getScoreColor } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';
import { BottleneckInput, BottleneckResult, Component } from '../types';
import {
  getComponentsByType,
  initializeDatabase,
  searchComponents,
} from '../services/dataService';
import { addBottleneckHistory } from '../services/historyService';
import { calculateBottleneck } from '../utils/bottleneck';
import { formatPrice } from '../utils/formatting';

type BottleneckNavigationProp = StackNavigationProp<RootStackParamList, 'BottleneckCalculator'>;

type UseCase = 'Gaming' | 'Video Editing' | '3D Rendering' | 'General Workstation';

export function BottleneckCalculatorScreen() {
  const navigation = useNavigation<BottleneckNavigationProp>();
  const canGoBack = navigation.canGoBack();

  const [input, setInput] = useState<BottleneckInput>({
    resolution: '1080p',
    useCase: 'Gaming',
    graphicsPreset: 'Ultra',
  });
  const [cpu, setCpu] = useState<Component | null>(null);
  const [gpu, setGpu] = useState<Component | null>(null);
  const [result, setResult] = useState<BottleneckResult | null>(null);

  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectingType, setSelectingType] = useState<'CPU' | 'GPU'>('CPU');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Component[]>([]);

  // Animated gauge
  const gaugeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (cpu && gpu) {
      const bottleneckResult = calculateBottleneck(input, cpu, gpu);
      setResult(bottleneckResult);

      // Animate gauge
      gaugeAnim.setValue(0);
      Animated.timing(gaugeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // store history (fire and forget)
      addBottleneckHistory(cpu, gpu, input, bottleneckResult).catch(() => {});
    } else {
      setResult(null);
    }
  }, [input, cpu, gpu]);

  const handleOpenSearch = (type: 'CPU' | 'GPU') => {
    setSelectingType(type);
    setSearchQuery('');
    setSearchResults(getComponentsByType(type));
    setSearchModalVisible(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults(getComponentsByType(selectingType));
    } else {
      setSearchResults(
        searchComponents(query).filter((c) => c.type === selectingType)
      );
    }
  };

  const handleSelectComponent = (comp: Component) => {
    if (selectingType === 'CPU') {
      setCpu(comp);
    } else {
      setGpu(comp);
    }
    setSearchModalVisible(false);
  };

  const getUseCaseHint = (useCase: UseCase): string => {
    switch (useCase) {
      case 'Gaming':
        return 'For gaming, the GPU usually matters most; aim for a strong GPU with a CPU that does not bottleneck it.';
      case 'Video Editing':
        return 'For video editing, fast CPU cores and plenty of RAM matter most, with GPU helping for effects and previews.';
      case '3D Rendering':
        return 'For 3D rendering, CPU performance is critical for CPU renderers, while GPU is key for GPU-based render engines.';
      case 'General Workstation':
      default:
        return 'For general use, a balanced CPU and GPU is best so neither part sits idle or is heavily bottlenecked.';
    }
  };

  // ----- Resolution & Use Case Labels -----
  const resolutions: Array<{ label: string; value: '1080p' | '1440p' | '4K' }> = [
    { label: '1080p', value: '1080p' },
    { label: '1440p', value: '1440p' },
    { label: '4K', value: '4K' },
  ];

  const useCases: Array<{ label: string; value: UseCase }> = [
    { label: 'Gaming', value: 'Gaming' },
    { label: 'Video Editing', value: 'Video Editing' },
    { label: '3D Rendering', value: '3D Rendering' },
    { label: 'General', value: 'General Workstation' },
  ];

  // ----- Render Helpers -----

  const renderSelectorCard = (
    label: string,
    comp: Component | null,
    type: 'CPU' | 'GPU'
  ) => {
    if (comp) {
      const brandColor = getBrandColor(comp.brand);
      return (
        <View style={styles.selectorSection}>
          <Text variant="caption" color="secondary" style={styles.selectorLabel}>
            {label}
          </Text>
          <TouchableOpacity
            style={styles.filledSelector}
            activeOpacity={0.7}
            onPress={() => handleOpenSearch(type)}
          >
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={{ color: brandColor, fontWeight: '700', letterSpacing: 1 }}>
                {comp.brand.toUpperCase()}
              </Text>
              <Text variant="bodyMedium" color="primary" style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                {comp.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text variant="caption" style={{ color: colors.accent.green }}>
                  {formatPrice(comp.price)}
                </Text>
                <View style={[styles.scoreBadge, { backgroundColor: '#1A2A1A', marginLeft: 8 }]}>
                  <Text variant="caption" style={{ color: getScoreColor(comp.performanceScore), fontWeight: '700', fontSize: 11 }}>
                    {comp.performanceScore}
                  </Text>
                </View>
              </View>
            </View>
            <Text variant="caption" color="secondary" style={{ fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.selectorSection}>
        <Text variant="caption" color="secondary" style={styles.selectorLabel}>
          {label}
        </Text>
        <TouchableOpacity
          style={styles.emptySelector}
          activeOpacity={0.7}
          onPress={() => handleOpenSearch(type)}
        >
          <Text variant="bodySmall" color="secondary" style={{ fontSize: 14, marginRight: 6 }}>
            🔍
          </Text>
          <Text variant="caption" color="secondary" style={styles.emptySelectorText}>
            SELECT A {type}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderToggle = (
    items: Array<{ label: string; value: string }>,
    selectedValue: string,
    onSelect: (value: string) => void,
    columns: number
  ) => {
    return (
      <View style={[styles.toggleRow, columns === 2 && styles.toggleGrid]}>
        {items.map((item, idx) => {
          const isSelected = selectedValue === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.toggleButton,
                columns === 3 && { flex: 1, marginRight: idx < items.length - 1 ? spacing.sm : 0 },
                columns === 2 && styles.toggleButtonHalf,
                isSelected && styles.toggleButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => onSelect(item.value)}
            >
              <Text
                variant="bodySmall"
                style={[
                  styles.toggleText,
                  isSelected && styles.toggleTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderResults = () => {
    if (!result || !cpu || !gpu) return null;

    const maxBottleneck = Math.max(result.cpuBottleneck, result.gpuBottleneck, result.ramBottleneck);
    const tierColor =
      result.tier === 'Severe'
        ? colors.status.danger
        : result.tier === 'Moderate'
        ? colors.accent.amber
        : result.tier === 'Minor'
        ? colors.accent.blue
        : colors.accent.green;

    return (
      <View style={styles.resultsContainer}>
        {/* Bottleneck Gauge */}
        <View style={styles.gaugeSection}>
          <View style={styles.gaugeCircle}>
            <Animated.View
              style={[
                styles.gaugeArc,
                {
                  borderColor: tierColor,
                  transform: [
                    {
                      rotate: gaugeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${Math.min(maxBottleneck * 3.6, 360)}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.gaugeInner}>
              <Text variant="displaySmall" style={{ fontWeight: '700', fontSize: 28, color: tierColor }}>
                {maxBottleneck.toFixed(1)}%
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Bottleneck
              </Text>
            </View>
          </View>

          {/* Tier Badge */}
          <Badge
            variant={
              result.tier === 'Severe'
                ? 'danger'
                : result.tier === 'Moderate'
                ? 'warning'
                : result.tier === 'Minor'
                ? 'info'
                : 'success'
            }
            style={styles.tierBadge}
          >
            {result.tier === 'None' ? 'Balanced' : result.tier} Bottleneck
          </Badge>

          {/* Main message card */}
          <View style={[styles.messageCard, { borderLeftColor: tierColor }]}>
            <Text variant="bodySmall" color="primary" style={styles.messageCardText}>
              {result.message}
            </Text>
          </View>
        </View>

        {/* CPU & GPU Load Cards */}
        <View style={styles.loadCardsRow}>
          <View style={[styles.loadCard, { marginRight: spacing.sm / 2 }]}>
            <Text variant="caption" color="secondary" style={styles.loadCardLabel}>
              CPU LOAD
            </Text>
            <Text variant="displaySmall" style={{ fontWeight: '700', color: result.cpuBottleneck > 20 ? colors.status.danger : colors.accent.blue }}>
              {result.cpuBottleneck.toFixed(1)}%
            </Text>
            <View style={styles.loadBar}>
              <Animated.View
                style={[
                  styles.loadBarFill,
                  {
                    backgroundColor: result.cpuBottleneck > 20 ? colors.status.danger : colors.accent.blue,
                    width: gaugeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(result.cpuBottleneck * 2, 100)}%`],
                    }),
                  },
                ]}
              />
            </View>
            <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 6 }}>
              {cpu.name.split(' ').slice(-2).join(' ')}
            </Text>
          </View>
          <View style={[styles.loadCard, { marginLeft: spacing.sm / 2 }]}>
            <Text variant="caption" color="secondary" style={styles.loadCardLabel}>
              GPU LOAD
            </Text>
            <Text variant="displaySmall" style={{ fontWeight: '700', color: result.gpuBottleneck > 20 ? colors.status.danger : colors.accent.green }}>
              {result.gpuBottleneck.toFixed(1)}%
            </Text>
            <View style={styles.loadBar}>
              <Animated.View
                style={[
                  styles.loadBarFill,
                  {
                    backgroundColor: result.gpuBottleneck > 20 ? colors.status.danger : colors.accent.green,
                    width: gaugeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(result.gpuBottleneck * 2, 100)}%`],
                    }),
                  },
                ]}
              />
            </View>
            <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 6 }}>
              {gpu.name.split(' ').slice(-2).join(' ')}
            </Text>
          </View>
        </View>

        {/* Tips */}
        {result.tips.length > 0 && (
          <View style={styles.tipsSection}>
            <Text variant="caption" color="secondary" style={{ letterSpacing: 1, fontWeight: '700', marginBottom: spacing.sm }}>
              QUICK TIPS
            </Text>
            {result.tips.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <View style={styles.tipIconContainer}>
                  <Text variant="bodySmall" style={{ fontSize: 16 }}>
                    {tip.icon}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySmall" color="primary" style={{ lineHeight: 20 }}>
                    {tip.text}
                  </Text>
                  {tip.isFree && (
                    <View style={styles.freeTag}>
                      <Text variant="caption" style={styles.freeTagText}>
                        FREE
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upgrade Recommendations */}
        {result.upgradeRecommendations && result.upgradeRecommendations.length > 0 && (
          <View style={styles.upgradeSection}>
            <Text variant="caption" color="secondary" style={{ letterSpacing: 1, fontWeight: '700', marginBottom: spacing.sm }}>
              UPGRADE RECOMMENDATIONS
            </Text>
            {result.upgradeRecommendations.map((rec, idx) => (
              <TouchableOpacity
                key={rec.component.id}
                style={styles.upgradeCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (rec.component.type === 'CPU') {
                    setCpu(rec.component);
                  } else if (rec.component.type === 'GPU') {
                    setGpu(rec.component);
                  }
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color="primary" style={{ fontWeight: '700' }} numberOfLines={1}>
                    {rec.component.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text variant="caption" style={{ color: colors.accent.green, marginRight: spacing.md }}>
                      {formatPrice(rec.price)}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Bottleneck: {rec.expectedBottleneckAfter.toFixed(1)}%
                    </Text>
                  </View>
                  {rec.expectedFpsGain && (
                    <Text variant="caption" style={{ color: colors.accent.blue, marginTop: 2 }}>
                      +{rec.expectedFpsGain} FPS estimated gain
                    </Text>
                  )}
                </View>
                <Text variant="bodySmall" color="secondary" style={{ fontSize: 20 }}>
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Performance Projection */}
        {result.performanceProjection.length > 0 && (
          <View style={styles.projectionSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text variant="caption" color="secondary" style={{ letterSpacing: 1, fontWeight: '700' }}>
                {input.useCase === 'Gaming' 
                  ? 'GAME FPS ESTIMATES'
                  : input.useCase === 'Video Editing' || input.useCase === '3D Rendering'
                  ? 'RENDER TIME ESTIMATES'
                  : 'SOFTWARE PERFORMANCE ESTIMATES'}
              </Text>
              {input.useCase === 'Gaming' && (
                <View style={{ flexDirection: 'row' }}>
                  {(['Ultra', 'Medium'] as const).map((preset) => {
                    const active = (input.graphicsPreset ?? 'Ultra') === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.fpsPresetChip,
                          active && styles.fpsPresetChipActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() =>
                          setInput((prev) => ({
                            ...prev,
                            graphicsPreset: preset,
                          }))
                        }
                      >
                        <Text
                          variant="caption"
                          style={[
                            styles.fpsPresetText,
                            active && styles.fpsPresetTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            {result.performanceProjection.map((proj, idx) => {
              // Color coding: for time-based (lower better), green = fast, red = slow
              // For FPS/score (higher better), green = high, red = low
              let valueColor: string = colors.text.primary;
              if (proj.isLowerBetter) {
                // Time-based: lower is better
                const maxValue = Math.max(...result.performanceProjection.filter(p => p.isLowerBetter).map(p => p.value));
                const minValue = Math.min(...result.performanceProjection.filter(p => p.isLowerBetter).map(p => p.value));
                const range = maxValue - minValue;
                if (range > 0) {
                  const ratio = (proj.value - minValue) / range;
                  if (ratio < 0.3) valueColor = colors.accent.green;
                  else if (ratio > 0.7) valueColor = colors.status.danger;
                  else valueColor = colors.accent.amber;
                } else {
                  valueColor = colors.accent.green;
                }
              } else {
                // FPS/score: higher is better
                const sameType = result.performanceProjection.filter(p => !p.isLowerBetter);
                const maxValue = Math.max(...sameType.map(p => p.value));
                const minValue = Math.min(...sameType.map(p => p.value));
                const range = maxValue - minValue;
                if (range > 0) {
                  const ratio = (proj.value - minValue) / range;
                  if (ratio > 0.7) valueColor = colors.accent.green;
                  else if (ratio < 0.3) valueColor = colors.status.danger;
                  else valueColor = colors.accent.amber;
                } else {
                  valueColor = colors.accent.green;
                }
              }

              const isLastRow = idx === result.performanceProjection.length - 1;

              return (
                <View key={idx} style={[styles.projectionRow, isLastRow && styles.projectionRowLast]}>
                  <Text variant="bodySmall" color="secondary" style={{ flex: 1, marginRight: spacing.sm }}>
                    {proj.task}
                  </Text>
                  <Text variant="bodySmall" style={{ fontWeight: '700', color: valueColor, minWidth: 70, textAlign: 'right' }}>
                    {proj.value.toFixed(proj.unit === 'FPS' || proj.unit === 'score' ? 0 : 1)} {proj.unit}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Banner Ad — only shown after results are calculated */}
        <AdBanner />
      </View>
    );
  };

  // ----- Search Modal -----
  const renderSearchModal = () => (
    <Modal
      visible={searchModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSearchModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
            <Text variant="bodyMedium" style={{ color: colors.accent.blue }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text variant="bodyMedium" color="primary" style={{ fontWeight: '700' }}>
            Select {selectingType}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Search Input */}
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${selectingType}s...`}
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>

        {/* Results */}
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
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text variant="bodyMedium" color="secondary">
                No {selectingType}s found
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  // ----- Main Render -----
  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="bodyLarge" color="primary" style={{ fontSize: 22 }}>
              ‹
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBack} />
        )}
        <Text variant="bodyLarge" color="primary" style={styles.headerTitle}>
          Bottleneck Calculator
        </Text>
        <View style={styles.headerBack} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* CPU Selector */}
        {renderSelectorCard('CPU', cpu, 'CPU')}

        {/* GPU Selector */}
        {renderSelectorCard('GPU', gpu, 'GPU')}

        {/* Target Resolution */}
        <View style={styles.section}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            TARGET RESOLUTION
          </Text>
          {renderToggle(
            resolutions,
            input.resolution,
            (val) => setInput({ ...input, resolution: val as '1080p' | '1440p' | '4K' }),
            3
          )}
        </View>

        {/* Use Case */}
        <View style={styles.section}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            USE CASE
          </Text>
          {renderToggle(
            useCases,
            input.useCase,
            (val) => setInput({ ...input, useCase: val as UseCase }),
            2
          )}
          <View style={styles.useCaseHintCard}>
            <Text variant="caption" style={styles.useCaseHintIcon}>💡</Text>
            <Text variant="caption" color="secondary" style={styles.useCaseHintText}>
              {getUseCaseHint(input.useCase as UseCase)}
            </Text>
          </View>
        </View>

        {/* Instructional text + tooltip (when no result) */}
        {!result && (
          <View style={styles.instructionContainer}>
            <Text variant="bodySmall" color="secondary" style={styles.instructionText}>
              Select a CPU and GPU to calculate bottleneck.
            </Text>
            <Text variant="caption" color="secondary" style={styles.instructionSubText}>
              Results update live as you change inputs.
            </Text>
            <Text variant="caption" color="secondary" style={[styles.instructionSubText, { marginTop: 6 }]}>
              As a rule of thumb, bottleneck under 10% is considered good and over 30% is severe and worth upgrading.
            </Text>
          </View>
        )}

        {/* Results */}
        {renderResults()}
      </ScrollView>

      {renderSearchModal()}
    </View>
  );
}

export default BottleneckCalculatorScreen;

// ----- Styles -----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Custom Header
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
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
  },

  // Selector Cards
  selectorSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  selectorLabel: {
    letterSpacing: 1.5,
    fontWeight: '700',
    fontSize: 10,
    marginBottom: 6,
  },
  emptySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: 20,
    paddingHorizontal: spacing.md,
  },
  emptySelectorText: {
    letterSpacing: 1.5,
    fontWeight: '600',
    fontSize: 11,
  },
  filledSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    fontWeight: '700',
    fontSize: 10,
    marginBottom: spacing.sm,
  },
  useCaseHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  useCaseHintIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 1,
  },
  useCaseHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  // Toggle Buttons
  toggleRow: {
    flexDirection: 'row',
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toggleButton: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  toggleButtonHalf: {
    width: '48%',
    marginRight: '2%',
    marginBottom: spacing.sm,
  },
  toggleButtonActive: {
    borderColor: colors.accent.blue,
    backgroundColor: 'rgba(79, 142, 247, 0.08)',
  },
  toggleText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  toggleTextActive: {
    color: colors.accent.blue,
  },

  // Instruction
  instructionContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubText: {
    textAlign: 'center',
    fontSize: 11,
  },

  // Results
  resultsContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  // Gauge
  gaugeSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gaugeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gaugeArc: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: 'inherit',
  },
  gaugeInner: {
    alignItems: 'center',
  },
  tierBadge: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  messageCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.blue,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  messageCardText: {
    lineHeight: 20,
    fontSize: 13,
  },

  // Load Cards
  loadCardsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  loadCard: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  loadCardLabel: {
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 10,
    marginBottom: 6,
  },
  loadBar: {
    height: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  loadBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Weakest Link
  weakestLinkCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // Projection
  projectionSection: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  projectionRowLast: {
    borderBottomWidth: 0,
  },
  fpsPresetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginLeft: spacing.xs,
  },
  fpsPresetChipActive: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blue + '22',
  },
  fpsPresetText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  fpsPresetTextActive: {
    color: colors.accent.blue,
    fontWeight: '700',
  },

  // Tips
  tipsSection: {
    marginBottom: spacing.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  freeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 189, 126, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  freeTagText: {
    color: colors.accent.green,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Upgrade Recommendations
  upgradeSection: {
    marginBottom: spacing.md,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Search Modal
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
