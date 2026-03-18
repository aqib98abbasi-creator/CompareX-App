/**
 * Chip Atom - Dismissible filter/tag chip
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  onDismiss?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  onDismiss,
  selected = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.base, selected && styles.selected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text variant="bodySmall" color={selected ? 'primary' : 'secondary'}>
        {label}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="bodySmall" color="secondary">×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: {
    backgroundColor: colors.accent.brand,
    borderColor: colors.accent.brand,
  },
  dismiss: {
    marginLeft: spacing.xs,
    paddingLeft: spacing.xs,
  },
});
