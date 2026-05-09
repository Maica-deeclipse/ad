/**
 * TextInput Component
 * Reusable text input with styling
 */

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/colors';
import React from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onKeyPress?: (event: any) => void;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  style?: ViewStyle;
  error?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  onSubmitEditing,
  onKeyPress,
  label,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  style,
  error,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onKeyPress={onKeyPress}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        placeholderTextColor={Colors.textLight}
        style={[
          styles.input,
          multiline && styles.multiline,
          !editable && styles.disabled,
          !!error && styles.inputError,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    color: Colors.text,
  },
  multiline: {
    paddingVertical: Spacing.md,
    height: 100,
    textAlignVertical: 'top',
  },
  disabled: {
    backgroundColor: Colors.background,
    color: Colors.textLight,
  },
  inputError: {
    borderColor: Colors.rejected,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.rejected,
    marginTop: Spacing.xs,
  },
});
