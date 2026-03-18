/**
 * Badge Atom - Small status indicator
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Per-variant text colors — matching colored text on tinted background (dark-mode pattern). */
const variantTextColor: Record<BadgeVariant, string> = {
  default: colors.text.secondary,
  success: colors.accent.green,
  warning: colors.accent.amber,
  danger: colors.status.danger,
  info: colors.accent.blue,
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  style,
}) => {
  const textColor: TextStyle = { color: variantTextColor[variant] };

  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text variant="caption" style={[styles.text, textColor]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.background.elevated,
  },
  success: {
    backgroundColor: colors.scoreBadge.background,
  },
  warning: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  danger: {
    backgroundColor: 'rgba(226, 75, 74, 0.15)',
  },
  info: {
    backgroundColor: 'rgba(79, 142, 247, 0.12)',
  },
  text: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
