/**
 * CompareX Real Mock Data (static, accurate, deterministic)
 *
 * Curated dataset with real-world PC hardware specs.
 * GPUs (22), CPUs (21), RAM (12), SSDs (12), Motherboards (10), PSUs (8), Coolers (6)
 */

import {
  Component,
  Brand,
  CPUSpecs,
  GPUSpecs,
  RAMSpecs,
  SSDSpecs,
  Benchmark,
  PricePoint,
  Review,
} from '../types';

/* ─── helpers ─────────────────────────────────────────────── */

type GpuBench = { threeDMark: number; rasterization: number; rayTracing: number; powerEfficiency: number };
type CpuBench = { cinebenchSingle: number; cinebenchMulti: number; passmark: number; gaming: number };

function iso(y: number, m = 1, d = 1) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}

function priceHistory(price: number, year: number): PricePoint[] {
  return [
    { date: iso(year, 1), price, retailer: 'MSRP' },
    { date: iso(year, 6), price: Math.round(price * 0.95), retailer: 'Amazon' },
    { date: iso(year, 12), price: Math.round(price * 0.9), retailer: 'Newegg' },
  ];
}

function review(id: string, rating = 4.6): Review[] {
  return [
    { id: `r-${id}-1`, userId: 'u1', userName: 'PCBuilder', verifiedBuild: true, rating: 5, title: 'Excellent!', content: 'Top-tier performance, runs cool under load.', date: iso(2025, 2, 10), helpful: 24 },
    { id: `r-${id}-2`, userId: 'u2', userName: 'TechReviewer', verifiedBuild: false, rating, title: 'Great value', content: 'Very solid for the price. Highly recommend.', date: iso(2025, 3, 5), helpful: 18 },
  ];
}

function gpuBench(b: GpuBench): Benchmark[] {
  return [
    { name: '3DMark Time Spy', score: b.threeDMark, category: 'GPU', unit: 'pts' },
    { name: 'Rasterization', score: b.rasterization, category: 'GPU', unit: 'index' },
    { name: 'Ray Tracing', score: b.rayTracing, category: 'GPU', unit: 'index' },
    { name: 'Power Efficiency', score: b.powerEfficiency, category: 'GPU', unit: 'index' },
  ];
}

function cpuBench(b: CpuBench): Benchmark[] {
  return [
    { name: 'Cinebench R23 (Single)', score: b.cinebenchSingle, category: 'CPU', unit: 'pts' },
    { name: 'Cinebench R23 (Multi)', score: b.cinebenchMulti, category: 'CPU', unit: 'pts' },
    { name: 'PassMark', score: b.passmark, category: 'CPU', unit: 'pts' },
    { name: 'Gaming Index', score: b.gaming, category: 'CPU', unit: 'index' },
  ];
}

function base(p: {
  id: string; name: string; brand: Brand; type: Component['type'];
  price: number; year: number; score: number; pop?: number; rating?: number; reviews?: number;
}): Omit<Component, 'specs' | 'fullSpecs' | 'benchmarks' | 'priceHistory' | 'reviews'> {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    type: p.type,
    price: p.price,
    releaseDate: iso(p.year),
    rating: p.rating ?? 4.5,
    reviewCount: p.reviews ?? 150,
    performanceScore: p.score,
    popularity: p.pop ?? p.score,
  };
}

/* ═══════════════════════════════════════════════════════════
   GPUs (22)
   ═══════════════════════════════════════════════════════════ */

const gpus: Component[] = [
  // --- NVIDIA RTX 40 Series ---
  {
    ...base({ id: 'gpu-rtx-4090', name: 'NVIDIA GeForce RTX 4090', brand: 'NVIDIA', type: 'GPU', price: 1599, year: 2022, score: 99, pop: 98 }),
    specs: { vram: 24, memoryType: 'GDDR6X', memoryBus: 384, memoryBandwidth: 1008, tdp: 450, cudaCores: 16384, baseClock: 2235, boostClock: 2520, slotSize: 3.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 100, rasterization: 100, rayTracing: 100, powerEfficiency: 78 } },
    benchmarks: gpuBench({ threeDMark: 100, rasterization: 100, rayTracing: 100, powerEfficiency: 78 }),
    priceHistory: priceHistory(1599, 2022), reviews: review('gpu-rtx-4090'),
  },
  {
    ...base({ id: 'gpu-rtx-4080-super', name: 'NVIDIA GeForce RTX 4080 Super', brand: 'NVIDIA', type: 'GPU', price: 999, year: 2024, score: 92, pop: 95 }),
    specs: { vram: 16, memoryType: 'GDDR6X', memoryBus: 256, memoryBandwidth: 736, tdp: 320, cudaCores: 10240, baseClock: 2295, boostClock: 2550, slotSize: 3, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 90, rasterization: 92, rayTracing: 88, powerEfficiency: 82 } },
    benchmarks: gpuBench({ threeDMark: 90, rasterization: 92, rayTracing: 88, powerEfficiency: 82 }),
    priceHistory: priceHistory(999, 2024), reviews: review('gpu-rtx-4080-super'),
  },
  {
    ...base({ id: 'gpu-rtx-4080', name: 'NVIDIA GeForce RTX 4080', brand: 'NVIDIA', type: 'GPU', price: 1199, year: 2022, score: 89 }),
    specs: { vram: 16, memoryType: 'GDDR6X', memoryBus: 256, memoryBandwidth: 716.8, tdp: 320, cudaCores: 9728, baseClock: 2205, boostClock: 2505, slotSize: 3, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 87, rasterization: 89, rayTracing: 84, powerEfficiency: 80 } },
    benchmarks: gpuBench({ threeDMark: 87, rasterization: 89, rayTracing: 84, powerEfficiency: 80 }),
    priceHistory: priceHistory(1199, 2022), reviews: review('gpu-rtx-4080'),
  },
  {
    ...base({ id: 'gpu-rtx-4070-ti-super', name: 'NVIDIA GeForce RTX 4070 Ti Super', brand: 'NVIDIA', type: 'GPU', price: 799, year: 2024, score: 84, pop: 90 }),
    specs: { vram: 16, memoryType: 'GDDR6X', memoryBus: 256, memoryBandwidth: 672, tdp: 285, cudaCores: 8448, baseClock: 2340, boostClock: 2610, slotSize: 3, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 82, rasterization: 84, rayTracing: 80, powerEfficiency: 83 } },
    benchmarks: gpuBench({ threeDMark: 82, rasterization: 84, rayTracing: 80, powerEfficiency: 83 }),
    priceHistory: priceHistory(799, 2024), reviews: review('gpu-rtx-4070-ti-super'),
  },
  {
    ...base({ id: 'gpu-rtx-4070-ti', name: 'NVIDIA GeForce RTX 4070 Ti', brand: 'NVIDIA', type: 'GPU', price: 799, year: 2023, score: 82 }),
    specs: { vram: 12, memoryType: 'GDDR6X', memoryBus: 192, memoryBandwidth: 504, tdp: 285, cudaCores: 7680, baseClock: 2310, boostClock: 2610, slotSize: 3, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 80, rasterization: 82, rayTracing: 78, powerEfficiency: 82 } },
    benchmarks: gpuBench({ threeDMark: 80, rasterization: 82, rayTracing: 78, powerEfficiency: 82 }),
    priceHistory: priceHistory(799, 2023), reviews: review('gpu-rtx-4070-ti'),
  },
  {
    ...base({ id: 'gpu-rtx-4070-super', name: 'NVIDIA GeForce RTX 4070 Super', brand: 'NVIDIA', type: 'GPU', price: 599, year: 2024, score: 78, pop: 88 }),
    specs: { vram: 12, memoryType: 'GDDR6X', memoryBus: 192, memoryBandwidth: 504, tdp: 220, cudaCores: 7168, baseClock: 1980, boostClock: 2475, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 76, rasterization: 78, rayTracing: 74, powerEfficiency: 84 } },
    benchmarks: gpuBench({ threeDMark: 76, rasterization: 78, rayTracing: 74, powerEfficiency: 84 }),
    priceHistory: priceHistory(599, 2024), reviews: review('gpu-rtx-4070-super'),
  },
  {
    ...base({ id: 'gpu-rtx-4070', name: 'NVIDIA GeForce RTX 4070', brand: 'NVIDIA', type: 'GPU', price: 549, year: 2023, score: 74, pop: 86 }),
    specs: { vram: 12, memoryType: 'GDDR6X', memoryBus: 192, memoryBandwidth: 504, tdp: 200, cudaCores: 5888, baseClock: 1920, boostClock: 2475, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 72, rasterization: 74, rayTracing: 70, powerEfficiency: 86 } },
    benchmarks: gpuBench({ threeDMark: 72, rasterization: 74, rayTracing: 70, powerEfficiency: 86 }),
    priceHistory: priceHistory(549, 2023), reviews: review('gpu-rtx-4070'),
  },
  {
    ...base({ id: 'gpu-rtx-4060-ti', name: 'NVIDIA GeForce RTX 4060 Ti', brand: 'NVIDIA', type: 'GPU', price: 399, year: 2023, score: 66, pop: 82 }),
    specs: { vram: 8, memoryType: 'GDDR6', memoryBus: 128, memoryBandwidth: 288, tdp: 160, cudaCores: 4352, baseClock: 2310, boostClock: 2535, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 64, rasterization: 66, rayTracing: 58, powerEfficiency: 90 } },
    benchmarks: gpuBench({ threeDMark: 64, rasterization: 66, rayTracing: 58, powerEfficiency: 90 }),
    priceHistory: priceHistory(399, 2023), reviews: review('gpu-rtx-4060-ti'),
  },
  {
    ...base({ id: 'gpu-rtx-4060', name: 'NVIDIA GeForce RTX 4060', brand: 'NVIDIA', type: 'GPU', price: 299, year: 2023, score: 60, pop: 84 }),
    specs: { vram: 8, memoryType: 'GDDR6', memoryBus: 128, memoryBandwidth: 272, tdp: 115, cudaCores: 3072, baseClock: 1830, boostClock: 2460, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 40', lithography: 4, benchmarks: { threeDMark: 58, rasterization: 60, rayTracing: 52, powerEfficiency: 92 } },
    benchmarks: gpuBench({ threeDMark: 58, rasterization: 60, rayTracing: 52, powerEfficiency: 92 }),
    priceHistory: priceHistory(299, 2023), reviews: review('gpu-rtx-4060'),
  },
  // --- NVIDIA RTX 30 Series ---
  {
    ...base({ id: 'gpu-rtx-3090', name: 'NVIDIA GeForce RTX 3090', brand: 'NVIDIA', type: 'GPU', price: 1499, year: 2020, score: 80 }),
    specs: { vram: 24, memoryType: 'GDDR6X', memoryBus: 384, memoryBandwidth: 936, tdp: 350, cudaCores: 10496, baseClock: 1395, boostClock: 1695, slotSize: 3, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 30', lithography: 8, benchmarks: { threeDMark: 78, rasterization: 82, rayTracing: 68, powerEfficiency: 64 } },
    benchmarks: gpuBench({ threeDMark: 78, rasterization: 82, rayTracing: 68, powerEfficiency: 64 }),
    priceHistory: priceHistory(1499, 2020), reviews: review('gpu-rtx-3090'),
  },
  {
    ...base({ id: 'gpu-rtx-3080', name: 'NVIDIA GeForce RTX 3080', brand: 'NVIDIA', type: 'GPU', price: 699, year: 2020, score: 76, pop: 85 }),
    specs: { vram: 10, memoryType: 'GDDR6X', memoryBus: 320, memoryBandwidth: 760, tdp: 320, cudaCores: 8704, baseClock: 1440, boostClock: 1710, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 30', lithography: 8, benchmarks: { threeDMark: 74, rasterization: 78, rayTracing: 64, powerEfficiency: 66 } },
    benchmarks: gpuBench({ threeDMark: 74, rasterization: 78, rayTracing: 64, powerEfficiency: 66 }),
    priceHistory: priceHistory(699, 2020), reviews: review('gpu-rtx-3080'),
  },
  {
    ...base({ id: 'gpu-rtx-3070', name: 'NVIDIA GeForce RTX 3070', brand: 'NVIDIA', type: 'GPU', price: 499, year: 2020, score: 70, pop: 82 }),
    specs: { vram: 8, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 448, tdp: 220, cudaCores: 5888, baseClock: 1500, boostClock: 1725, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 30', lithography: 8, benchmarks: { threeDMark: 68, rasterization: 72, rayTracing: 56, powerEfficiency: 72 } },
    benchmarks: gpuBench({ threeDMark: 68, rasterization: 72, rayTracing: 56, powerEfficiency: 72 }),
    priceHistory: priceHistory(499, 2020), reviews: review('gpu-rtx-3070'),
  },
  // --- AMD Radeon RX 7000 / 6000 ---
  {
    ...base({ id: 'gpu-rx-7900-xtx', name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', type: 'GPU', price: 999, year: 2022, score: 90, pop: 92 }),
    specs: { vram: 24, memoryType: 'GDDR6', memoryBus: 384, memoryBandwidth: 960, tdp: 355, streamProcessors: 6144, baseClock: 1855, boostClock: 2499, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 5, benchmarks: { threeDMark: 88, rasterization: 93, rayTracing: 74, powerEfficiency: 76 } },
    benchmarks: gpuBench({ threeDMark: 88, rasterization: 93, rayTracing: 74, powerEfficiency: 76 }),
    priceHistory: priceHistory(999, 2022), reviews: review('gpu-rx-7900-xtx'),
  },
  {
    ...base({ id: 'gpu-rx-7900-xt', name: 'AMD Radeon RX 7900 XT', brand: 'AMD', type: 'GPU', price: 799, year: 2022, score: 86 }),
    specs: { vram: 20, memoryType: 'GDDR6', memoryBus: 320, memoryBandwidth: 800, tdp: 315, streamProcessors: 5376, baseClock: 1500, boostClock: 2400, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 5, benchmarks: { threeDMark: 84, rasterization: 88, rayTracing: 70, powerEfficiency: 75 } },
    benchmarks: gpuBench({ threeDMark: 84, rasterization: 88, rayTracing: 70, powerEfficiency: 75 }),
    priceHistory: priceHistory(799, 2022), reviews: review('gpu-rx-7900-xt'),
  },
  {
    ...base({ id: 'gpu-rx-7800-xt', name: 'AMD Radeon RX 7800 XT', brand: 'AMD', type: 'GPU', price: 499, year: 2023, score: 78, pop: 88 }),
    specs: { vram: 16, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 624, tdp: 263, streamProcessors: 3840, baseClock: 1295, boostClock: 2430, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 5, benchmarks: { threeDMark: 76, rasterization: 82, rayTracing: 62, powerEfficiency: 78 } },
    benchmarks: gpuBench({ threeDMark: 76, rasterization: 82, rayTracing: 62, powerEfficiency: 78 }),
    priceHistory: priceHistory(499, 2023), reviews: review('gpu-rx-7800-xt'),
  },
  {
    ...base({ id: 'gpu-rx-7700-xt', name: 'AMD Radeon RX 7700 XT', brand: 'AMD', type: 'GPU', price: 449, year: 2023, score: 72 }),
    specs: { vram: 12, memoryType: 'GDDR6', memoryBus: 192, memoryBandwidth: 432, tdp: 245, streamProcessors: 3456, baseClock: 1700, boostClock: 2544, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 5, benchmarks: { threeDMark: 70, rasterization: 75, rayTracing: 56, powerEfficiency: 79 } },
    benchmarks: gpuBench({ threeDMark: 70, rasterization: 75, rayTracing: 56, powerEfficiency: 79 }),
    priceHistory: priceHistory(449, 2023), reviews: review('gpu-rx-7700-xt'),
  },
  {
    ...base({ id: 'gpu-rx-7600-xt', name: 'AMD Radeon RX 7600 XT', brand: 'AMD', type: 'GPU', price: 329, year: 2024, score: 62, pop: 80 }),
    specs: { vram: 16, memoryType: 'GDDR6', memoryBus: 128, memoryBandwidth: 288, tdp: 190, streamProcessors: 2048, baseClock: 1720, boostClock: 2755, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 6, benchmarks: { threeDMark: 60, rasterization: 64, rayTracing: 42, powerEfficiency: 81 } },
    benchmarks: gpuBench({ threeDMark: 60, rasterization: 64, rayTracing: 42, powerEfficiency: 81 }),
    priceHistory: priceHistory(329, 2024), reviews: review('gpu-rx-7600-xt'),
  },
  {
    ...base({ id: 'gpu-rx-7600', name: 'AMD Radeon RX 7600', brand: 'AMD', type: 'GPU', price: 269, year: 2023, score: 58, pop: 78 }),
    specs: { vram: 8, memoryType: 'GDDR6', memoryBus: 128, memoryBandwidth: 288, tdp: 165, streamProcessors: 2048, baseClock: 1720, boostClock: 2655, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 7000', lithography: 6, benchmarks: { threeDMark: 56, rasterization: 60, rayTracing: 38, powerEfficiency: 82 } },
    benchmarks: gpuBench({ threeDMark: 56, rasterization: 60, rayTracing: 38, powerEfficiency: 82 }),
    priceHistory: priceHistory(269, 2023), reviews: review('gpu-rx-7600'),
  },
  {
    ...base({ id: 'gpu-rx-6900-xt', name: 'AMD Radeon RX 6900 XT', brand: 'AMD', type: 'GPU', price: 999, year: 2020, score: 76 }),
    specs: { vram: 16, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 512, tdp: 300, streamProcessors: 5120, baseClock: 1825, boostClock: 2250, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 6000', lithography: 7, benchmarks: { threeDMark: 74, rasterization: 78, rayTracing: 48, powerEfficiency: 70 } },
    benchmarks: gpuBench({ threeDMark: 74, rasterization: 78, rayTracing: 48, powerEfficiency: 70 }),
    priceHistory: priceHistory(999, 2020), reviews: review('gpu-rx-6900-xt'),
  },
  {
    ...base({ id: 'gpu-rx-6800-xt', name: 'AMD Radeon RX 6800 XT', brand: 'AMD', type: 'GPU', price: 649, year: 2020, score: 74 }),
    specs: { vram: 16, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 512, tdp: 300, streamProcessors: 4608, baseClock: 1825, boostClock: 2250, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 6000', lithography: 7, benchmarks: { threeDMark: 72, rasterization: 76, rayTracing: 46, powerEfficiency: 71 } },
    benchmarks: gpuBench({ threeDMark: 72, rasterization: 76, rayTracing: 46, powerEfficiency: 71 }),
    priceHistory: priceHistory(649, 2020), reviews: review('gpu-rx-6800-xt'),
  },
  // --- NVIDIA RTX 30 Series (continued) ---
  {
    ...base({ id: 'gpu-rtx-3060-ti', name: 'NVIDIA GeForce RTX 3060 Ti', brand: 'NVIDIA', type: 'GPU', price: 399, year: 2020, score: 64, pop: 80 }),
    specs: { vram: 8, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 448, tdp: 200, cudaCores: 4864, baseClock: 1410, boostClock: 1665, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 30', lithography: 8, benchmarks: { threeDMark: 62, rasterization: 66, rayTracing: 48, powerEfficiency: 74 } },
    benchmarks: gpuBench({ threeDMark: 62, rasterization: 66, rayTracing: 48, powerEfficiency: 74 }),
    priceHistory: priceHistory(399, 2020), reviews: review('gpu-rtx-3060-ti'),
  },
  {
    ...base({ id: 'gpu-rtx-3060', name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'NVIDIA', type: 'GPU', price: 329, year: 2021, score: 54, pop: 82 }),
    specs: { vram: 12, memoryType: 'GDDR6', memoryBus: 192, memoryBandwidth: 360, tdp: 170, cudaCores: 3584, baseClock: 1320, boostClock: 1777, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RTX 30', lithography: 8, benchmarks: { threeDMark: 52, rasterization: 56, rayTracing: 38, powerEfficiency: 76 } },
    benchmarks: gpuBench({ threeDMark: 52, rasterization: 56, rayTracing: 38, powerEfficiency: 76 }),
    priceHistory: priceHistory(329, 2021), reviews: review('gpu-rtx-3060'),
  },
  // --- AMD Radeon RX 6000 (continued) ---
  {
    ...base({ id: 'gpu-rx-6700-xt', name: 'AMD Radeon RX 6700 XT', brand: 'AMD', type: 'GPU', price: 479, year: 2021, score: 62, pop: 75 }),
    specs: { vram: 12, memoryType: 'GDDR6', memoryBus: 192, memoryBandwidth: 384, tdp: 230, streamProcessors: 2560, baseClock: 2321, boostClock: 2581, slotSize: 2.5, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'RX 6000', lithography: 7, benchmarks: { threeDMark: 60, rasterization: 64, rayTracing: 36, powerEfficiency: 73 } },
    benchmarks: gpuBench({ threeDMark: 60, rasterization: 64, rayTracing: 36, powerEfficiency: 73 }),
    priceHistory: priceHistory(479, 2021), reviews: review('gpu-rx-6700-xt'),
  },
  // --- Intel Arc ---
  {
    ...base({ id: 'gpu-arc-a770', name: 'Intel Arc A770 16GB', brand: 'Intel', type: 'GPU', price: 349, year: 2022, score: 56, pop: 60 }),
    specs: { vram: 16, memoryType: 'GDDR6', memoryBus: 256, memoryBandwidth: 560, tdp: 225, baseClock: 2100, boostClock: 2100, slotSize: 2, pcieVersion: 'PCIe 4.0' } satisfies GPUSpecs,
    fullSpecs: { series: 'Arc A-Series', lithography: 6, benchmarks: { threeDMark: 54, rasterization: 58, rayTracing: 50, powerEfficiency: 60 } },
    benchmarks: gpuBench({ threeDMark: 54, rasterization: 58, rayTracing: 50, powerEfficiency: 60 }),
    priceHistory: priceHistory(349, 2022), reviews: review('gpu-arc-a770', 4.0),
  },
];

/* ═══════════════════════════════════════════════════════════
   CPUs (21)
   ═══════════════════════════════════════════════════════════ */

const cpus: Component[] = [
  // --- Intel 14th/13th/12th Gen ---
  {
    ...base({ id: 'cpu-i9-14900k', name: 'Intel Core i9-14900K', brand: 'Intel', type: 'CPU', price: 589, year: 2023, score: 95, pop: 96 }),
    specs: { cores: 24, threads: 32, baseClock: 3.2, boostClock: 6.0, tdp: 125, socket: 'LGA1700', cache: { l1: 2048, l2: 32768, l3: 36 }, architecture: 'Raptor Lake Refresh', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i9 14th Gen', benchmarks: { cinebenchSingle: 100, cinebenchMulti: 96, passmark: 97, gaming: 96 } },
    benchmarks: cpuBench({ cinebenchSingle: 100, cinebenchMulti: 96, passmark: 97, gaming: 96 }),
    priceHistory: priceHistory(589, 2023), reviews: review('cpu-i9-14900k'),
  },
  {
    ...base({ id: 'cpu-i9-13900k', name: 'Intel Core i9-13900K', brand: 'Intel', type: 'CPU', price: 589, year: 2022, score: 92 }),
    specs: { cores: 24, threads: 32, baseClock: 3.0, boostClock: 5.8, tdp: 125, socket: 'LGA1700', cache: { l1: 2048, l2: 32768, l3: 36 }, architecture: 'Raptor Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i9 13th Gen', benchmarks: { cinebenchSingle: 96, cinebenchMulti: 95, passmark: 94, gaming: 93 } },
    benchmarks: cpuBench({ cinebenchSingle: 96, cinebenchMulti: 95, passmark: 94, gaming: 93 }),
    priceHistory: priceHistory(589, 2022), reviews: review('cpu-i9-13900k'),
  },
  {
    ...base({ id: 'cpu-i7-14700k', name: 'Intel Core i7-14700K', brand: 'Intel', type: 'CPU', price: 409, year: 2023, score: 88, pop: 90 }),
    specs: { cores: 20, threads: 28, baseClock: 3.4, boostClock: 5.6, tdp: 125, socket: 'LGA1700', cache: { l1: 1536, l2: 28672, l3: 33 }, architecture: 'Raptor Lake Refresh', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i7 14th Gen', benchmarks: { cinebenchSingle: 95, cinebenchMulti: 90, passmark: 88, gaming: 92 } },
    benchmarks: cpuBench({ cinebenchSingle: 95, cinebenchMulti: 90, passmark: 88, gaming: 92 }),
    priceHistory: priceHistory(409, 2023), reviews: review('cpu-i7-14700k'),
  },
  {
    ...base({ id: 'cpu-i7-13700k', name: 'Intel Core i7-13700K', brand: 'Intel', type: 'CPU', price: 409, year: 2022, score: 86 }),
    specs: { cores: 16, threads: 24, baseClock: 3.4, boostClock: 5.4, tdp: 125, socket: 'LGA1700', cache: { l1: 1280, l2: 24576, l3: 30 }, architecture: 'Raptor Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i7 13th Gen', benchmarks: { cinebenchSingle: 92, cinebenchMulti: 88, passmark: 86, gaming: 90 } },
    benchmarks: cpuBench({ cinebenchSingle: 92, cinebenchMulti: 88, passmark: 86, gaming: 90 }),
    priceHistory: priceHistory(409, 2022), reviews: review('cpu-i7-13700k'),
  },
  {
    ...base({ id: 'cpu-i5-14600k', name: 'Intel Core i5-14600K', brand: 'Intel', type: 'CPU', price: 319, year: 2023, score: 82, pop: 88 }),
    specs: { cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.3, tdp: 125, socket: 'LGA1700', cache: { l1: 1152, l2: 20480, l3: 24 }, architecture: 'Raptor Lake Refresh', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i5 14th Gen', benchmarks: { cinebenchSingle: 90, cinebenchMulti: 80, passmark: 82, gaming: 88 } },
    benchmarks: cpuBench({ cinebenchSingle: 90, cinebenchMulti: 80, passmark: 82, gaming: 88 }),
    priceHistory: priceHistory(319, 2023), reviews: review('cpu-i5-14600k'),
  },
  {
    ...base({ id: 'cpu-i5-13600k', name: 'Intel Core i5-13600K', brand: 'Intel', type: 'CPU', price: 319, year: 2022, score: 80, pop: 86 }),
    specs: { cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.1, tdp: 125, socket: 'LGA1700', cache: { l1: 1152, l2: 20480, l3: 24 }, architecture: 'Raptor Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i5 13th Gen', benchmarks: { cinebenchSingle: 88, cinebenchMulti: 79, passmark: 80, gaming: 87 } },
    benchmarks: cpuBench({ cinebenchSingle: 88, cinebenchMulti: 79, passmark: 80, gaming: 87 }),
    priceHistory: priceHistory(319, 2022), reviews: review('cpu-i5-13600k'),
  },
  {
    ...base({ id: 'cpu-i9-12900k', name: 'Intel Core i9-12900K', brand: 'Intel', type: 'CPU', price: 589, year: 2021, score: 84 }),
    specs: { cores: 16, threads: 24, baseClock: 3.2, boostClock: 5.2, tdp: 125, socket: 'LGA1700', cache: { l1: 1280, l2: 14336, l3: 30 }, architecture: 'Alder Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i9 12th Gen', benchmarks: { cinebenchSingle: 86, cinebenchMulti: 85, passmark: 84, gaming: 86 } },
    benchmarks: cpuBench({ cinebenchSingle: 86, cinebenchMulti: 85, passmark: 84, gaming: 86 }),
    priceHistory: priceHistory(589, 2021), reviews: review('cpu-i9-12900k'),
  },
  {
    ...base({ id: 'cpu-i7-12700k', name: 'Intel Core i7-12700K', brand: 'Intel', type: 'CPU', price: 409, year: 2021, score: 78 }),
    specs: { cores: 12, threads: 20, baseClock: 3.6, boostClock: 5.0, tdp: 125, socket: 'LGA1700', cache: { l1: 1024, l2: 12288, l3: 25 }, architecture: 'Alder Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i7 12th Gen', benchmarks: { cinebenchSingle: 84, cinebenchMulti: 78, passmark: 78, gaming: 84 } },
    benchmarks: cpuBench({ cinebenchSingle: 84, cinebenchMulti: 78, passmark: 78, gaming: 84 }),
    priceHistory: priceHistory(409, 2021), reviews: review('cpu-i7-12700k'),
  },
  {
    ...base({ id: 'cpu-i5-12600k', name: 'Intel Core i5-12600K', brand: 'Intel', type: 'CPU', price: 289, year: 2021, score: 74, pop: 80 }),
    specs: { cores: 10, threads: 16, baseClock: 3.7, boostClock: 4.9, tdp: 125, socket: 'LGA1700', cache: { l1: 896, l2: 9728, l3: 20 }, architecture: 'Alder Lake', lithography: 10 } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i5 12th Gen', benchmarks: { cinebenchSingle: 82, cinebenchMulti: 70, passmark: 74, gaming: 80 } },
    benchmarks: cpuBench({ cinebenchSingle: 82, cinebenchMulti: 70, passmark: 74, gaming: 80 }),
    priceHistory: priceHistory(289, 2021), reviews: review('cpu-i5-12600k'),
  },
  {
    ...base({ id: 'cpu-i5-12400', name: 'Intel Core i5-12400', brand: 'Intel', type: 'CPU', price: 199, year: 2022, score: 68, pop: 82 }),
    specs: { cores: 6, threads: 12, baseClock: 2.5, boostClock: 4.4, tdp: 65, socket: 'LGA1700', cache: { l1: 480, l2: 7680, l3: 18 }, architecture: 'Alder Lake', lithography: 10, integratedGraphics: 'UHD 730' } satisfies CPUSpecs,
    fullSpecs: { series: 'Core i5 12th Gen', benchmarks: { cinebenchSingle: 76, cinebenchMulti: 60, passmark: 68, gaming: 72 } },
    benchmarks: cpuBench({ cinebenchSingle: 76, cinebenchMulti: 60, passmark: 68, gaming: 72 }),
    priceHistory: priceHistory(199, 2022), reviews: review('cpu-i5-12400'),
  },
  // --- AMD Ryzen 7000 / 5000 ---
  {
    ...base({ id: 'cpu-r9-7950x', name: 'AMD Ryzen 9 7950X', brand: 'AMD', type: 'CPU', price: 549, year: 2022, score: 94, pop: 92 }),
    specs: { cores: 16, threads: 32, baseClock: 4.5, boostClock: 5.7, tdp: 170, socket: 'AM5', cache: { l1: 1024, l2: 16384, l3: 64 }, architecture: 'Zen 4', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 9 7000', benchmarks: { cinebenchSingle: 93, cinebenchMulti: 100, passmark: 98, gaming: 90 } },
    benchmarks: cpuBench({ cinebenchSingle: 93, cinebenchMulti: 100, passmark: 98, gaming: 90 }),
    priceHistory: priceHistory(549, 2022), reviews: review('cpu-r9-7950x'),
  },
  {
    ...base({ id: 'cpu-r9-7900x', name: 'AMD Ryzen 9 7900X', brand: 'AMD', type: 'CPU', price: 449, year: 2022, score: 90 }),
    specs: { cores: 12, threads: 24, baseClock: 4.7, boostClock: 5.6, tdp: 170, socket: 'AM5', cache: { l1: 768, l2: 12288, l3: 64 }, architecture: 'Zen 4', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 9 7000', benchmarks: { cinebenchSingle: 92, cinebenchMulti: 91, passmark: 92, gaming: 88 } },
    benchmarks: cpuBench({ cinebenchSingle: 92, cinebenchMulti: 91, passmark: 92, gaming: 88 }),
    priceHistory: priceHistory(449, 2022), reviews: review('cpu-r9-7900x'),
  },
  {
    ...base({ id: 'cpu-r7-7800x3d', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', type: 'CPU', price: 449, year: 2023, score: 92, pop: 98 }),
    specs: { cores: 8, threads: 16, baseClock: 4.2, boostClock: 5.0, tdp: 120, socket: 'AM5', cache: { l1: 512, l2: 8192, l3: 96 }, architecture: 'Zen 4 (3D V-Cache)', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 7 7000X3D', benchmarks: { cinebenchSingle: 90, cinebenchMulti: 80, passmark: 86, gaming: 100 } },
    benchmarks: cpuBench({ cinebenchSingle: 90, cinebenchMulti: 80, passmark: 86, gaming: 100 }),
    priceHistory: priceHistory(449, 2023), reviews: review('cpu-r7-7800x3d'),
  },
  {
    ...base({ id: 'cpu-r7-7700x', name: 'AMD Ryzen 7 7700X', brand: 'AMD', type: 'CPU', price: 349, year: 2022, score: 84 }),
    specs: { cores: 8, threads: 16, baseClock: 4.5, boostClock: 5.4, tdp: 105, socket: 'AM5', cache: { l1: 512, l2: 8192, l3: 32 }, architecture: 'Zen 4', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 7 7000', benchmarks: { cinebenchSingle: 88, cinebenchMulti: 78, passmark: 82, gaming: 88 } },
    benchmarks: cpuBench({ cinebenchSingle: 88, cinebenchMulti: 78, passmark: 82, gaming: 88 }),
    priceHistory: priceHistory(349, 2022), reviews: review('cpu-r7-7700x'),
  },
  {
    ...base({ id: 'cpu-r5-7600x', name: 'AMD Ryzen 5 7600X', brand: 'AMD', type: 'CPU', price: 299, year: 2022, score: 78, pop: 86 }),
    specs: { cores: 6, threads: 12, baseClock: 4.7, boostClock: 5.3, tdp: 105, socket: 'AM5', cache: { l1: 384, l2: 6144, l3: 32 }, architecture: 'Zen 4', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 5 7000', benchmarks: { cinebenchSingle: 86, cinebenchMulti: 68, passmark: 74, gaming: 84 } },
    benchmarks: cpuBench({ cinebenchSingle: 86, cinebenchMulti: 68, passmark: 74, gaming: 84 }),
    priceHistory: priceHistory(299, 2022), reviews: review('cpu-r5-7600x'),
  },
  {
    ...base({ id: 'cpu-r9-5950x', name: 'AMD Ryzen 9 5950X', brand: 'AMD', type: 'CPU', price: 799, year: 2020, score: 86 }),
    specs: { cores: 16, threads: 32, baseClock: 3.4, boostClock: 4.9, tdp: 105, socket: 'AM4', cache: { l1: 1024, l2: 8192, l3: 64 }, architecture: 'Zen 3', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 9 5000', benchmarks: { cinebenchSingle: 78, cinebenchMulti: 88, passmark: 86, gaming: 78 } },
    benchmarks: cpuBench({ cinebenchSingle: 78, cinebenchMulti: 88, passmark: 86, gaming: 78 }),
    priceHistory: priceHistory(799, 2020), reviews: review('cpu-r9-5950x'),
  },
  {
    ...base({ id: 'cpu-r9-5900x', name: 'AMD Ryzen 9 5900X', brand: 'AMD', type: 'CPU', price: 549, year: 2020, score: 82 }),
    specs: { cores: 12, threads: 24, baseClock: 3.7, boostClock: 4.8, tdp: 105, socket: 'AM4', cache: { l1: 768, l2: 6144, l3: 64 }, architecture: 'Zen 3', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 9 5000', benchmarks: { cinebenchSingle: 76, cinebenchMulti: 82, passmark: 80, gaming: 78 } },
    benchmarks: cpuBench({ cinebenchSingle: 76, cinebenchMulti: 82, passmark: 80, gaming: 78 }),
    priceHistory: priceHistory(549, 2020), reviews: review('cpu-r9-5900x'),
  },
  {
    ...base({ id: 'cpu-r7-5800x3d', name: 'AMD Ryzen 7 5800X3D', brand: 'AMD', type: 'CPU', price: 449, year: 2022, score: 84, pop: 88 }),
    specs: { cores: 8, threads: 16, baseClock: 3.4, boostClock: 4.5, tdp: 105, socket: 'AM4', cache: { l1: 512, l2: 4096, l3: 96 }, architecture: 'Zen 3 (3D V-Cache)', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 7 5000X3D', benchmarks: { cinebenchSingle: 74, cinebenchMulti: 72, passmark: 78, gaming: 92 } },
    benchmarks: cpuBench({ cinebenchSingle: 74, cinebenchMulti: 72, passmark: 78, gaming: 92 }),
    priceHistory: priceHistory(449, 2022), reviews: review('cpu-r7-5800x3d'),
  },
  {
    ...base({ id: 'cpu-r7-5700x', name: 'AMD Ryzen 7 5700X', brand: 'AMD', type: 'CPU', price: 299, year: 2022, score: 74, pop: 80 }),
    specs: { cores: 8, threads: 16, baseClock: 3.4, boostClock: 4.6, tdp: 65, socket: 'AM4', cache: { l1: 512, l2: 4096, l3: 32 }, architecture: 'Zen 3', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 7 5000', benchmarks: { cinebenchSingle: 70, cinebenchMulti: 70, passmark: 72, gaming: 76 } },
    benchmarks: cpuBench({ cinebenchSingle: 70, cinebenchMulti: 70, passmark: 72, gaming: 76 }),
    priceHistory: priceHistory(299, 2022), reviews: review('cpu-r7-5700x'),
  },
  {
    ...base({ id: 'cpu-r5-5600x', name: 'AMD Ryzen 5 5600X', brand: 'AMD', type: 'CPU', price: 199, year: 2020, score: 72, pop: 90 }),
    specs: { cores: 6, threads: 12, baseClock: 3.7, boostClock: 4.6, tdp: 65, socket: 'AM4', cache: { l1: 384, l2: 3072, l3: 32 }, architecture: 'Zen 3', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 5 5000', benchmarks: { cinebenchSingle: 72, cinebenchMulti: 60, passmark: 70, gaming: 80 } },
    benchmarks: cpuBench({ cinebenchSingle: 72, cinebenchMulti: 60, passmark: 70, gaming: 80 }),
    priceHistory: priceHistory(199, 2020), reviews: review('cpu-r5-5600x'),
  },
  {
    ...base({ id: 'cpu-r5-5600', name: 'AMD Ryzen 5 5600', brand: 'AMD', type: 'CPU', price: 149, year: 2022, score: 68, pop: 88 }),
    specs: { cores: 6, threads: 12, baseClock: 3.5, boostClock: 4.4, tdp: 65, socket: 'AM4', cache: { l1: 384, l2: 3072, l3: 32 }, architecture: 'Zen 3', lithography: 7 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 5 5000', benchmarks: { cinebenchSingle: 68, cinebenchMulti: 56, passmark: 66, gaming: 76 } },
    benchmarks: cpuBench({ cinebenchSingle: 68, cinebenchMulti: 56, passmark: 66, gaming: 76 }),
    priceHistory: priceHistory(149, 2022), reviews: review('cpu-r5-5600'),
  },
  {
    ...base({ id: 'cpu-r5-7600', name: 'AMD Ryzen 5 7600', brand: 'AMD', type: 'CPU', price: 229, year: 2023, score: 76, pop: 84 }),
    specs: { cores: 6, threads: 12, baseClock: 3.8, boostClock: 5.1, tdp: 65, socket: 'AM5', cache: { l1: 384, l2: 6144, l3: 32 }, architecture: 'Zen 4', lithography: 5 } satisfies CPUSpecs,
    fullSpecs: { series: 'Ryzen 5 7000', benchmarks: { cinebenchSingle: 84, cinebenchMulti: 66, passmark: 72, gaming: 82 } },
    benchmarks: cpuBench({ cinebenchSingle: 84, cinebenchMulti: 66, passmark: 72, gaming: 82 }),
    priceHistory: priceHistory(229, 2023), reviews: review('cpu-r5-7600'),
  },
];

/* ═══════════════════════════════════════════════════════════
   RAM (12)
   ═══════════════════════════════════════════════════════════ */

const rams: Component[] = [
  { ...base({ id: 'ram-corsair-ddr5-6400', name: 'Corsair Vengeance 32GB DDR5-6400 CL32', brand: 'Corsair', type: 'RAM', price: 149, year: 2023, score: 83 }),
    specs: { type: 'DDR5', speed: 6400, casLatency: 32, capacity: 32, channels: 2, voltage: 1.40, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Vengeance' }, benchmarks: [], priceHistory: priceHistory(149, 2023), reviews: review('ram-corsair-ddr5-6400') },
  { ...base({ id: 'ram-corsair-ddr5-5600', name: 'Corsair Vengeance 32GB DDR5-5600 CL36', brand: 'Corsair', type: 'RAM', price: 109, year: 2022, score: 78 }),
    specs: { type: 'DDR5', speed: 5600, casLatency: 36, capacity: 32, channels: 2, voltage: 1.25, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Vengeance' }, benchmarks: [], priceHistory: priceHistory(109, 2022), reviews: review('ram-corsair-ddr5-5600') },
  { ...base({ id: 'ram-corsair-ddr4-3600', name: 'Corsair Vengeance 32GB DDR4-3600 CL18', brand: 'Corsair', type: 'RAM', price: 79, year: 2021, score: 68 }),
    specs: { type: 'DDR4', speed: 3600, casLatency: 18, capacity: 32, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Vengeance' }, benchmarks: [], priceHistory: priceHistory(79, 2021), reviews: review('ram-corsair-ddr4-3600') },
  { ...base({ id: 'ram-corsair-ddr4-3200-16', name: 'Corsair Vengeance 16GB DDR4-3200 CL16', brand: 'Corsair', type: 'RAM', price: 45, year: 2020, score: 58, pop: 85 }),
    specs: { type: 'DDR4', speed: 3200, casLatency: 16, capacity: 16, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Vengeance' }, benchmarks: [], priceHistory: priceHistory(45, 2020), reviews: review('ram-corsair-ddr4-3200-16') },
  { ...base({ id: 'ram-gskill-z5-6000', name: 'G.Skill Trident Z5 32GB DDR5-6000 CL36', brand: 'G.Skill', type: 'RAM', price: 129, year: 2022, score: 80 }),
    specs: { type: 'DDR5', speed: 6000, casLatency: 36, capacity: 32, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Trident Z5' }, benchmarks: [], priceHistory: priceHistory(129, 2022), reviews: review('ram-gskill-z5-6000') },
  { ...base({ id: 'ram-gskill-z5-5600', name: 'G.Skill Trident Z5 32GB DDR5-5600 CL36', brand: 'G.Skill', type: 'RAM', price: 109, year: 2022, score: 76 }),
    specs: { type: 'DDR5', speed: 5600, casLatency: 36, capacity: 32, channels: 2, voltage: 1.25, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Trident Z5' }, benchmarks: [], priceHistory: priceHistory(109, 2022), reviews: review('ram-gskill-z5-5600') },
  { ...base({ id: 'ram-gskill-ripjaws-3600', name: 'G.Skill Ripjaws V 32GB DDR4-3600 CL16', brand: 'G.Skill', type: 'RAM', price: 89, year: 2021, score: 70, pop: 82 }),
    specs: { type: 'DDR4', speed: 3600, casLatency: 16, capacity: 32, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Ripjaws V' }, benchmarks: [], priceHistory: priceHistory(89, 2021), reviews: review('ram-gskill-ripjaws-3600') },
  { ...base({ id: 'ram-kingston-ddr5-6000', name: 'Kingston Fury Beast 32GB DDR5-6000 CL36', brand: 'Kingston', type: 'RAM', price: 119, year: 2022, score: 79 }),
    specs: { type: 'DDR5', speed: 6000, casLatency: 36, capacity: 32, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Fury Beast' }, benchmarks: [], priceHistory: priceHistory(119, 2022), reviews: review('ram-kingston-ddr5-6000') },
  { ...base({ id: 'ram-kingston-ddr5-5600', name: 'Kingston Fury Beast 32GB DDR5-5600 CL40', brand: 'Kingston', type: 'RAM', price: 99, year: 2022, score: 74 }),
    specs: { type: 'DDR5', speed: 5600, casLatency: 40, capacity: 32, channels: 2, voltage: 1.25, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Fury Beast' }, benchmarks: [], priceHistory: priceHistory(99, 2022), reviews: review('ram-kingston-ddr5-5600') },
  { ...base({ id: 'ram-kingston-ddr4-3200', name: 'Kingston Fury Beast 32GB DDR4-3200 CL16', brand: 'Kingston', type: 'RAM', price: 69, year: 2020, score: 62 }),
    specs: { type: 'DDR4', speed: 3200, casLatency: 16, capacity: 32, channels: 2, voltage: 1.35, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Fury Beast' }, benchmarks: [], priceHistory: priceHistory(69, 2020), reviews: review('ram-kingston-ddr4-3200') },
  { ...base({ id: 'ram-crucial-ddr5-5600', name: 'Crucial 32GB DDR5-5600 CL46', brand: 'Crucial', type: 'RAM', price: 89, year: 2023, score: 72, pop: 78 }),
    specs: { type: 'DDR5', speed: 5600, casLatency: 46, capacity: 32, channels: 2, voltage: 1.10, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Standard' }, benchmarks: [], priceHistory: priceHistory(89, 2023), reviews: review('ram-crucial-ddr5-5600') },
  { ...base({ id: 'ram-gskill-z5-rgb-6400', name: 'G.Skill Trident Z5 RGB 32GB DDR5-6400 CL32', brand: 'G.Skill', type: 'RAM', price: 159, year: 2023, score: 84, pop: 80 }),
    specs: { type: 'DDR5', speed: 6400, casLatency: 32, capacity: 32, channels: 2, voltage: 1.40, formFactor: 'DIMM' } satisfies RAMSpecs,
    fullSpecs: { series: 'Trident Z5 RGB' }, benchmarks: [], priceHistory: priceHistory(159, 2023), reviews: review('ram-gskill-z5-rgb-6400') },
];

/* ═══════════════════════════════════════════════════════════
   SSDs (12)
   ═══════════════════════════════════════════════════════════ */

const ssds: Component[] = [
  { ...base({ id: 'ssd-990-pro-2tb', name: 'Samsung 990 Pro 2TB', brand: 'Samsung', type: 'SSD', price: 179, year: 2022, score: 94 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 2000, readSpeed: 7450, writeSpeed: 6900, nandType: 'TLC', endurance: 1200, controller: 'Samsung' } as SSDSpecs,
    fullSpecs: { series: '990 Pro' }, benchmarks: [], priceHistory: priceHistory(179, 2022), reviews: review('ssd-990-pro-2tb') },
  { ...base({ id: 'ssd-990-pro-1tb', name: 'Samsung 990 Pro 1TB', brand: 'Samsung', type: 'SSD', price: 109, year: 2022, score: 92 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 7450, writeSpeed: 6900, nandType: 'TLC', endurance: 600, controller: 'Samsung' } as SSDSpecs,
    fullSpecs: { series: '990 Pro' }, benchmarks: [], priceHistory: priceHistory(109, 2022), reviews: review('ssd-990-pro-1tb') },
  { ...base({ id: 'ssd-wd-sn850x-2tb', name: 'WD Black SN850X 2TB', brand: 'Western Digital', type: 'SSD', price: 159, year: 2022, score: 92 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 2000, readSpeed: 7300, writeSpeed: 6600, nandType: 'TLC', endurance: 1200, controller: 'WD' } as SSDSpecs,
    fullSpecs: { series: 'Black SN850X' }, benchmarks: [], priceHistory: priceHistory(159, 2022), reviews: review('ssd-wd-sn850x-2tb') },
  { ...base({ id: 'ssd-wd-sn850x-1tb', name: 'WD Black SN850X 1TB', brand: 'Western Digital', type: 'SSD', price: 99, year: 2022, score: 90 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 7300, writeSpeed: 6600, nandType: 'TLC', endurance: 600, controller: 'WD' } as SSDSpecs,
    fullSpecs: { series: 'Black SN850X' }, benchmarks: [], priceHistory: priceHistory(99, 2022), reviews: review('ssd-wd-sn850x-1tb') },
  { ...base({ id: 'ssd-firecuda-530-1tb', name: 'Seagate FireCuda 530 1TB', brand: 'Seagate', type: 'SSD', price: 119, year: 2021, score: 88 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 7300, writeSpeed: 6000, nandType: 'TLC', endurance: 1275, controller: 'Phison' } as SSDSpecs,
    fullSpecs: { series: 'FireCuda 530' }, benchmarks: [], priceHistory: priceHistory(119, 2021), reviews: review('ssd-firecuda-530-1tb') },
  { ...base({ id: 'ssd-980-pro-1tb', name: 'Samsung 980 Pro 1TB', brand: 'Samsung', type: 'SSD', price: 99, year: 2020, score: 86 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 7000, writeSpeed: 5000, nandType: 'TLC', endurance: 600, controller: 'Samsung' } as SSDSpecs,
    fullSpecs: { series: '980 Pro' }, benchmarks: [], priceHistory: priceHistory(99, 2020), reviews: review('ssd-980-pro-1tb') },
  { ...base({ id: 'ssd-wd-sn770-2tb', name: 'WD Black SN770 2TB', brand: 'Western Digital', type: 'SSD', price: 119, year: 2022, score: 84 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 2000, readSpeed: 5150, writeSpeed: 4850, nandType: 'TLC', endurance: 1200, controller: 'WD' } as SSDSpecs,
    fullSpecs: { series: 'Black SN770' }, benchmarks: [], priceHistory: priceHistory(119, 2022), reviews: review('ssd-wd-sn770-2tb') },
  { ...base({ id: 'ssd-wd-sn770-1tb', name: 'WD Black SN770 1TB', brand: 'Western Digital', type: 'SSD', price: 69, year: 2022, score: 82, pop: 88 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 5150, writeSpeed: 4900, nandType: 'TLC', endurance: 600, controller: 'WD' } as SSDSpecs,
    fullSpecs: { series: 'Black SN770' }, benchmarks: [], priceHistory: priceHistory(69, 2022), reviews: review('ssd-wd-sn770-1tb') },
  { ...base({ id: 'ssd-870-evo-1tb', name: 'Samsung 870 EVO 1TB', brand: 'Samsung', type: 'SSD', price: 89, year: 2021, score: 70, pop: 85 }),
    specs: { interface: 'SATA', formFactor: '2.5"', capacity: 1000, readSpeed: 560, writeSpeed: 530, nandType: 'TLC', endurance: 600, controller: 'Samsung' } as SSDSpecs,
    fullSpecs: { series: '870 EVO' }, benchmarks: [], priceHistory: priceHistory(89, 2021), reviews: review('ssd-870-evo-1tb') },
  { ...base({ id: 'ssd-870-evo-2tb', name: 'Samsung 870 EVO 2TB', brand: 'Samsung', type: 'SSD', price: 149, year: 2021, score: 72 }),
    specs: { interface: 'SATA', formFactor: '2.5"', capacity: 2000, readSpeed: 560, writeSpeed: 530, nandType: 'TLC', endurance: 1200, controller: 'Samsung' } as SSDSpecs,
    fullSpecs: { series: '870 EVO' }, benchmarks: [], priceHistory: priceHistory(149, 2021), reviews: review('ssd-870-evo-2tb') },
  { ...base({ id: 'ssd-crucial-p5-plus-1tb', name: 'Crucial P5 Plus 1TB', brand: 'Crucial', type: 'SSD', price: 79, year: 2021, score: 80, pop: 76 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 1000, readSpeed: 6600, writeSpeed: 5000, nandType: 'TLC', endurance: 600, controller: 'Micron' } as SSDSpecs,
    fullSpecs: { series: 'P5 Plus' }, benchmarks: [], priceHistory: priceHistory(79, 2021), reviews: review('ssd-crucial-p5-plus-1tb') },
  { ...base({ id: 'ssd-firecuda-530-2tb', name: 'Seagate FireCuda 530 2TB', brand: 'Seagate', type: 'SSD', price: 199, year: 2021, score: 90 }),
    specs: { interface: 'NVMe', formFactor: 'M.2 2280', capacity: 2000, readSpeed: 7300, writeSpeed: 6900, nandType: 'TLC', endurance: 2550, controller: 'Phison' } as SSDSpecs,
    fullSpecs: { series: 'FireCuda 530' }, benchmarks: [], priceHistory: priceHistory(199, 2021), reviews: review('ssd-firecuda-530-2tb') },
];

/* ═══════════════════════════════════════════════════════════
   Public export
   ═══════════════════════════════════════════════════════════ */

const ALL_COMPONENTS: Component[] = [
  ...gpus,
  ...cpus,
  ...rams,
  ...ssds,
];

export function generateMockData(): Component[] {
  return ALL_COMPONENTS;
}

export { ALL_COMPONENTS, gpus, cpus, rams, ssds };
