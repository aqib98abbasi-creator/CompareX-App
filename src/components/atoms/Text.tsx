/**
 * Text Atom - Base text component with typography variants
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography } from '../../constants/typography';
import { colors } from '../../constants/colors';

export type TextVariant = 
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'monoLarge'
  | 'monoMedium'
  | 'monoSmall'
  | 'label'
  | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof typeof colors.text;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const variantStyle = getVariantStyle(variant);
  const colorStyle = { color: colors.text[color] };

  return (
    <RNText style={[variantStyle, colorStyle, style]} {...props}>
      {children}
    </RNText>
  );
};

function getVariantStyle(variant: TextVariant) {
  switch (variant) {
    case 'displayLarge':
      return typography.display.large;
    case 'displayMedium':
      return typography.display.medium;
    case 'displaySmall':
      return typography.display.small;
    case 'bodyLarge':
      return typography.body.large;
    case 'bodyMedium':
      return typography.body.medium;
    case 'bodySmall':
      return typography.body.small;
    case 'monoLarge':
      return typography.mono.large;
    case 'monoMedium':
      return typography.mono.medium;
    case 'monoSmall':
      return typography.mono.small;
    case 'label':
      return typography.label;
    case 'caption':
      return typography.caption;
    default:
      return typography.body.medium;
  }
}
