import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottleneckInput, BottleneckResult, Component } from '../types';

const KEYS = {
  comparisons: 'comparex.history.comparisons.v1',
  bottlenecks: 'comparex.history.bottlenecks.v1',
} as const;

export interface ComparisonHistoryItem {
  id: string;
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  createdAt: string;
}

export interface BottleneckHistoryItem {
  id: string;
  cpuId: string;
  gpuId: string;
  cpuName: string;
  gpuName: string;
  input: BottleneckInput;
  maxBottleneck: number;
  createdAt: string;
}

const MAX_ITEMS = 5;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function addComparisonHistory(a: Component, b: Component): Promise<void> {
  const existing = (await readJson<ComparisonHistoryItem[]>(KEYS.comparisons)) ?? [];
  const now = new Date().toISOString();
  const id = `${a.id}-${b.id}-${now}`;
  const next: ComparisonHistoryItem[] = [
    {
      id,
      aId: a.id,
      bId: b.id,
      aName: a.name,
      bName: b.name,
      createdAt: now,
    },
    ...existing.filter((item) => !(item.aId === a.id && item.bId === b.id)),
  ].slice(0, MAX_ITEMS);
  await writeJson(KEYS.comparisons, next);
}

export async function addBottleneckHistory(
  cpu: Component,
  gpu: Component,
  input: BottleneckInput,
  result: BottleneckResult
): Promise<void> {
  const existing = (await readJson<BottleneckHistoryItem[]>(KEYS.bottlenecks)) ?? [];
  const now = new Date().toISOString();
  const id = `${cpu.id}-${gpu.id}-${now}`;
  const maxBottleneck = Math.max(
    result.cpuBottleneck,
    result.gpuBottleneck,
    result.ramBottleneck
  );
  const next: BottleneckHistoryItem[] = [
    {
      id,
      cpuId: cpu.id,
      gpuId: gpu.id,
      cpuName: cpu.name,
      gpuName: gpu.name,
      input,
      maxBottleneck,
      createdAt: now,
    },
    ...existing,
  ].slice(0, MAX_ITEMS);
  await writeJson(KEYS.bottlenecks, next);
}

export async function getHistory() {
  const [comparisons, bottlenecks] = await Promise.all([
    readJson<ComparisonHistoryItem[]>(KEYS.comparisons),
    readJson<BottleneckHistoryItem[]>(KEYS.bottlenecks),
  ]);
  return {
    comparisons: comparisons ?? [],
    bottlenecks: bottlenecks ?? [],
  };
}

