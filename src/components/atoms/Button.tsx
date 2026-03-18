/**
 * Button Atom - Base button component
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const sizeStyle =
    size === 'small' ? styles.sizeSmall :
    size === 'large' ? styles.sizeLarge :
    styles.sizeMedium;

  const buttonStyle = [
    styles.base,
    styles[variant],
    sizeStyle,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textColor: keyof typeof colors.text = variant === 'primary' ? 'inverse' : 'primary';
  const textVariant = size === 'large' ? 'bodyLarge' : size === 'small' ? 'bodySmall' : 'bodyMedium';

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.text.inverse : colors.accent.brand}
        />
      ) : (
        <Text variant={textVariant} color={textColor} style={styles.text}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.accent.blue,
  },
  secondary: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.brand,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sizeSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  sizeMedium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  sizeLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});
