/**
 * Reset Password Screen
 * Allows users to enter a Firebase reset code and set a new password
 */

import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

interface ResetPasswordScreenProps {
  route?: {
    params?: {
      email?: string;
      token?: string;
    }
  };
  navigation?: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ route, navigation }) => {
  const { resetPassword, isLoading } = useAuth();
  const [token, setToken] = useState(route?.params?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{token?: string; newPassword?: string; confirmPassword?: string}>({});

  const handleSubmit = async () => {
    const newErrors: {token?: string; newPassword?: string; confirmPassword?: string} = {};
    if (!token.trim()) newErrors.token = 'Reset token is required';
    if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await resetPassword(token, newPassword);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          { 
            text: 'Login', 
            onPress: () => navigation?.navigate('Login') 
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the reset code from your email link and your new password</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          label="Reset Code"
          placeholder="Enter reset code"
          value={token}
          onChangeText={(val) => { setToken(val); setErrors(prev => ({ ...prev, token: undefined })); }}
          //autoCapitalize="none"
          editable={!isLoading}
          error={errors.token}
        />

        <TextInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={(val) => { setNewPassword(val); setErrors(prev => ({ ...prev, newPassword: undefined, confirmPassword: undefined })); }}
          secureTextEntry
          editable={!isLoading}
          error={errors.newPassword}
        />

        <TextInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={(val) => { setConfirmPassword(val); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
          secureTextEntry
          editable={!isLoading}
          error={errors.confirmPassword}
        />

        <Button
          title={isLoading ? 'Resetting...' : 'Reset Password'}
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        />

        <TouchableOpacity 
          onPress={() => navigation?.goBack()} 
          style={styles.backButton}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default ResetPasswordScreen;
