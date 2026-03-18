/**
 * CompareX Typography System
 * Display: Bold, modern sans
 * Body: Regular weight, high legibility
 * Mono: Spec values, numbers, benchmarks
 */

export const typography = {
  // Display fonts (Sora, DM Sans, or Plus Jakarta Sans)
  display: {
    large: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    medium: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    small: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
  },

  // Body fonts
  body: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
    },
  },

  // Monospace (JetBrains Mono, IBM Plex Mono)
  mono: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
      fontFamily: 'monospace',
    },
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      fontFamily: 'monospace',
    },
    small: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      fontFamily: 'monospace',
    },
  },

  // Labels and captions
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },

  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
} as const;
