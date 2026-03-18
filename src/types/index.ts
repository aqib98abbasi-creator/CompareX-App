/**
 * CompareX Type Definitions
 * Core data models and interfaces
 */

export type ComponentType =
  | 'CPU'
  | 'GPU'
  | 'RAM'
  | 'Motherboard'
  | 'SSD'
  | 'HDD'
  | 'PSU'
  | 'Case'
  | 'CPU Cooler'
  | 'Keyboard'
  | 'Monitor';

export type Brand =
  | 'Intel'
  | 'AMD'
  | 'NVIDIA'
  | 'Corsair'
  | 'Kingston'
  | 'ASUS'
  | 'MSI'
  | 'Gigabyte'
  | 'Samsung'
  | 'Western Digital'
  | 'Seagate'
  | 'EVGA'
  | 'Thermaltake'
  | 'Cooler Master'
  | 'Noctua'
  | 'Logitech'
  | 'Razer'
  | 'LG'
  | 'Acer'
  | 'Dell'
  | 'G.Skill'
  | 'Crucial'
  | 'Team Group'
  | 'Patriot'
  | 'ASRock'
  | 'Fractal Design'
  | 'NZXT'
  | 'Lian Li'
  | 'Phanteks'
  | 'be quiet!'
  | 'Arctic'
  | 'SteelSeries'
  | 'HyperX'
  | 'Toshiba'
  | 'Other';

export interface BaseComponent {
  id: string;
  name: string;
  brand: Brand;
  type: ComponentType;
  imageUrl?: string;
  price: number;
  releaseDate: string; // ISO date string
  rating: number; // 0-5
  reviewCount: number;
  performanceScore: number; // 0-100
  popularity: number; // 0-100
}

// CPU Specific Specs
export interface CPUSpecs {
  cores: number;
  threads: number;
  baseClock: number; // GHz
  boostClock: number; // GHz
  tdp: number; // Watts
  socket: string; // e.g., "LGA1700", "AM5"
  cache: {
    l1: number; // KB
    l2: number; // KB
    l3: number; // MB
  };
  architecture: string; // e.g., "Raptor Lake", "Zen 4"
  lithography: number; // nm
  integratedGraphics?: string;
}

// GPU Specific Specs
export interface GPUSpecs {
  vram: number; // GB
  memoryType: string; // e.g., "GDDR6X", "GDDR6"
  memoryBus: number; // bits
  memoryBandwidth: number; // GB/s
  tdp: number; // Watts
  cudaCores?: number; // NVIDIA
  streamProcessors?: number; // AMD
  baseClock: number; // MHz
  boostClock: number; // MHz
  slotSize: number; // PCIe slots occupied
  pcieVersion: string; // e.g., "PCIe 4.0"
}

// RAM Specific Specs
export interface RAMSpecs {
  type: 'DDR4' | 'DDR5';
  speed: number; // MHz
  casLatency: number; // CL
  capacity: number; // GB
  channels: number; // 1, 2, 4
  voltage: number; // V
  formFactor: 'DIMM' | 'SODIMM';
}

// SSD Specific Specs
export interface SSDSpecs {
  interface: 'NVMe' | 'SATA';
  formFactor: string; // e.g., "M.2 2280", "2.5\""
  capacity: number; // GB
  readSpeed: number; // MB/s
  writeSpeed: number; // MB/s
  nandType: string; // e.g., "TLC", "QLC"
  endurance: number; // TBW (Terabytes Written)
  controller?: string;
}

// Motherboard Specific Specs
export interface MotherboardSpecs {
  socket: string;
  chipset: string;
  formFactor: string; // e.g., "ATX", "mATX", "ITX"
  pcieGen: string; // e.g., "PCIe 5.0"
  pcieSlots: number;
  m2Slots: number;
  ramSlots: number;
  maxRam: number; // GB
  ramType: 'DDR4' | 'DDR5';
  sataPorts: number;
  usbPorts: {
    usb2: number;
    usb3: number;
    usbC: number;
  };
}

// HDD Specific Specs
export interface HDDSpecs {
  capacity: number; // GB
  rpm: number; // 5400, 7200
  cache: number; // MB
  interface: 'SATA' | 'SAS';
  formFactor: '3.5"' | '2.5"';
}

// PSU Specific Specs
export interface PSUSpecs {
  wattage: number;
  efficiency: string; // e.g., "80+ Gold", "80+ Platinum"
  modular: 'Full' | 'Semi' | 'No';
  formFactor: string; // e.g., "ATX"
  connectors: {
    cpu: number;
    pcie: number;
    sata: number;
    molex: number;
  };
}

// Case Specific Specs
export interface CaseSpecs {
  formFactor: string[]; // e.g., ["ATX", "mATX"]
  dimensions: {
    height: number; // mm
    width: number; // mm
    depth: number; // mm
  };
  maxGpuLength: number; // mm
  maxCoolerHeight: number; // mm
  driveBays: {
    internal35: number;
    internal25: number;
    external35: number;
  };
  fanSupport: {
    front: number;
    top: number;
    rear: number;
    bottom: number;
  };
}

// CPU Cooler Specific Specs
export interface CoolerSpecs {
  type: 'Air' | 'AIO' | 'Custom Loop';
  socket: string[];
  tdp: number; // Watts
  noiseLevel: number; // dB
  dimensions?: {
    height: number; // mm
    width: number; // mm
    depth: number; // mm
  };
  radiatorSize?: string; // e.g., "240mm", "360mm"
}

// Keyboard Specific Specs
export interface KeyboardSpecs {
  type: 'Mechanical' | 'Membrane' | 'Hybrid';
  switches?: string; // e.g., "Cherry MX Red"
  layout: string; // e.g., "Full-size", "TKL", "60%"
  connectivity: string[]; // e.g., ["USB", "Wireless", "Bluetooth"]
  backlight: boolean;
  rgb: boolean;
}

// Monitor Specific Specs
export interface MonitorSpecs {
  size: number; // inches
  resolution: string; // e.g., "2560x1440"
  refreshRate: number; // Hz
  panelType: 'IPS' | 'VA' | 'TN' | 'OLED';
  responseTime: number; // ms
  brightness: number; // nits
  contrast: string; // e.g., "1000:1"
  colorGamut: string; // e.g., "sRGB 99%"
  connectivity: string[]; // e.g., ["HDMI 2.1", "DisplayPort 1.4", "USB-C"]
  hdr: boolean;
  curved: boolean;
}

export type ComponentSpecs =
  | CPUSpecs
  | GPUSpecs
  | RAMSpecs
  | SSDSpecs
  | MotherboardSpecs
  | HDDSpecs
  | PSUSpecs
  | CaseSpecs
  | CoolerSpecs
  | KeyboardSpecs
  | MonitorSpecs;

export interface Component extends BaseComponent {
  specs: ComponentSpecs;
  fullSpecs: Record<string, any>; // Complete spec sheet
  benchmarks: Benchmark[];
  priceHistory: PricePoint[];
  reviews: Review[];
  compatibleParts?: string[]; // Component IDs
}

export interface Benchmark {
  name: string; // e.g., "Cinebench R23 Multi", "3DMark Time Spy"
  score: number;
  category: 'CPU' | 'GPU' | 'Memory' | 'Storage' | 'Synthetic';
  unit?: string; // e.g., "points", "FPS"
  gameFps?: {
    game: string;
    resolution: '1080p' | '1440p' | '4K';
    settings: string; // e.g., "Ultra"
    fps: number;
  }[];
}

export interface PricePoint {
  date: string; // ISO date
  price: number;
  retailer?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  verifiedBuild: boolean;
  rating: number; // 1-5
  title: string;
  content: string;
  date: string; // ISO date
  helpful: number;
  build?: {
    components: string[]; // Component IDs
  };
}

export interface FilterState {
  componentType?: ComponentType;
  brands?: Brand[];
  priceRange?: [number, number];
  specs?: Record<string, any>;
  releaseYear?: number;
  minRating?: number;
  sortBy?: 'performance' | 'price' | 'value' | 'popularity' | 'newest';
}

export interface ComparisonItem {
  component: Component;
  position: 'A' | 'B' | 'C';
}

export interface BottleneckInput {
  cpu?: string; // Component ID
  gpu?: string; // Component ID
  ramSpeed?: number; // MHz
  ramCapacity?: number; // GB
  resolution: '1080p' | '1440p' | '4K';
  useCase: 'Gaming' | 'Video Editing' | '3D Rendering' | 'General Workstation' | 'Streaming';
  graphicsPreset?: 'Ultra' | 'Medium';
}

export interface BottleneckResult {
  cpuBottleneck: number; // Percentage
  gpuBottleneck: number; // Percentage
  ramBottleneck: number; // Percentage
  weakestLink: 'CPU' | 'GPU' | 'RAM' | 'None';
  tier: 'None' | 'Minor' | 'Moderate' | 'Severe';
  message: string; // Main message for the bottleneck scenario
  tips: Array<{
    text: string;
    icon: string;
    isFree: boolean;
  }>;
  upgradeRecommendations?: Array<{
    component: Component;
    expectedBottleneckAfter: number; // Percentage after upgrade
    expectedFpsGain?: number; // Estimated FPS improvement
    price: number;
  }>;
  performanceProjection: {
    task: string;
    value: number;
    unit: string;
    isLowerBetter?: boolean; // For time-based metrics (lower = better)
  }[];
}
