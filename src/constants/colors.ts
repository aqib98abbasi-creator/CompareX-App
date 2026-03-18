/**
 * CompareX Color System
 * Dark-first design with precise color roles
 *
 * Updated to match the latest product spec.
 */

export const colors = {
  // Background
  background: {
    primary: '#0A0A0A',
    surface: '#111114',
    elevated: '#1A1A1F',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Border
  border: {
    default: '#2A2A30',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#6B6B7B',
    tertiary: '#6B6B7B',
    label: '#4A4A5A',
    inverse: '#0A0A0A',
  },

  // Accent / brand
  accent: {
    blue: '#4F8EF7',
    orange: '#E8593C',
    green: '#2DBD7E',
    amber: '#F5A623',
    // Back-compat alias used by existing components
    brand: '#4F8EF7',
  },

  // Status / semantic
  status: {
    success: '#2DBD7E',
    warning: '#F5A623',
    danger: '#E24B4A',
    info: '#4F8EF7',
  },

  // Score badge specific colors
  scoreBadge: {
    background: '#1A2A1A',
    text: '#2DBD7E',
  },
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = string;

/**
 * Brand-specific colors — used for brand filter chips & badges.
 * Each brand gets a recognisable signature color.
 */
export const brandColors: Record<string, string> = {
  // GPU / CPU brands
  NVIDIA:           '#76B900', // NVIDIA Green
  AMD:              '#ED1C24', // AMD Red
  Intel:            '#0071C5', // Intel Blue
  // Apple / ARM
  Apple:            '#A2AAAD', // Apple Silver
  Other:            '#A2AAAD', // For SoC brands etc.
  Qualcomm:         '#3253DC', // Qualcomm Blue
  // RAM brands
  Corsair:          '#F1C232', // Corsair Yellow
  'G.Skill':        '#E0115F', // G.Skill Ruby
  Kingston:         '#E4002B', // HyperX Red
  Crucial:          '#00B4D8', // Crucial Cyan
  'Team Group':     '#FF6F00', // TeamGroup Orange
  Patriot:          '#1565C0', // Patriot Navy
  // SSD brands
  Samsung:          '#1428A0', // Samsung Blue
  'Western Digital': '#005BBB', // WD Blue
  Seagate:          '#6CC04A', // Seagate Green
  // Motherboard / other
  ASUS:             '#000000', // ASUS Black (we'll render with white text)
  MSI:              '#FF0000', // MSI Red
  Gigabyte:         '#FF5722', // Gigabyte Orange
  ASRock:           '#0D47A1', // ASRock Blue
  EVGA:             '#C62828', // EVGA Red
  NZXT:             '#9B59B6', // NZXT Purple
};

/**
 * Get the signature color for a brand.
 */
export function getBrandColor(brand: string): string {
  // Exact match first
  if (brandColors[brand]) return brandColors[brand];
  // Fuzzy match by checking if brand name is contained
  const upper = brand.toUpperCase();
  if (upper.includes('NVIDIA')) return brandColors.NVIDIA;
  if (upper.includes('AMD')) return brandColors.AMD;
  if (upper.includes('INTEL')) return brandColors.Intel;
  if (upper.includes('CORSAIR')) return brandColors.Corsair;
  if (upper.includes('SAMSUNG')) return brandColors.Samsung;
  if (upper.includes('WESTERN')) return brandColors['Western Digital'];
  return colors.text.secondary;
}

/**
 * Brands that typically appear under each component type.
 * Used for the brand filter chips — sorted by market relevance.
 */
export const BRANDS_BY_TYPE: Record<string, string[]> = {
  GPU:  ['NVIDIA', 'AMD', 'Intel'],
  CPU:  ['Intel', 'AMD', 'Other'],    // "Other" covers Apple/Qualcomm SoCs
  RAM:  ['Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Team Group', 'Patriot'],
  SSD:  ['Samsung', 'Western Digital', 'Seagate', 'Crucial'],
};

export function getScoreColor(score: number): string {
  if (score >= 90) return colors.accent.green;
  if (score >= 75) return colors.accent.blue;
  if (score >= 60) return colors.accent.amber;
  return colors.status.danger;
}
