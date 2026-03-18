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
 * Brand-to-color helpers
 */
export function getBrandColor(brand: string): string {
  const upper = brand.toUpperCase();
  if (upper.includes('NVIDIA') || upper.includes('INTEL')) {
    return colors.accent.blue;
  }
  if (upper.includes('AMD')) {
    return colors.accent.orange;
  }
  return colors.text.secondary;
}

export function getScoreColor(score: number): string {
  if (score >= 90) return colors.accent.green;
  if (score >= 75) return colors.accent.blue;
  if (score >= 60) return colors.accent.amber;
  return colors.status.danger;
}
