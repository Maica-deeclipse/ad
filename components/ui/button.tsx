/**
 * Button Component
 * Reusable button with different variants
 */

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/colors';
import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  size = 'medium',
}) => {
  const handlePress = (event?: any) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onPress();
  };

  const getBackgroundColor = (): string => {
    if (disabled) return Colors.border;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return Colors.secondary; // Use gold for primary and secondary
      case 'danger':
        return Colors.rejected;
      case 'success':
        return Colors.approved;
      default:
        return Colors.secondary;
    }
  };

  const isSmall = size === 'small';
  const paddingVertical = isSmall ? Spacing.sm : Spacing.md;
  const paddingHorizontal = isSmall ? Spacing.md : Spacing.lg;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.8 : 1,
          paddingVertical,
          paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: isSmall ? Typography.caption.fontSize : Typography.body.fontSize,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textInverse, // White text works with this gold
    fontWeight: '700',
  },
});
