/**
 * CompareX Animation System
 * Fade + translate-Y(8px) on screen transitions
 * Bar charts animate width on mount (300ms ease-out)
 * Bottleneck gauges animate arc on result load
 */

export const animations = {
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  translateY: {
    screenTransition: 8,
  },
} as const;
