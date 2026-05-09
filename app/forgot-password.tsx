/**
 * Forgot Password Screen
 * Allows users to request a password reset email
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

interface ForgotPasswordScreenProps {
  navigation?: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    setEmailError('');

    try {
      await forgotPassword(email);
      Alert.alert(
        'Email Sent',
        'If an account exists for this email, you will receive a password reset link.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation?.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
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
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={(val) => { setEmail(val); if (val.trim()) setEmailError(''); }}
          keyboardType="email-address"
         // autoCapitalize="none"
          editable={!isLoading}
          error={emailError || undefined}
        />

        <Button
          title={isLoading ? 'Sending...' : 'Send Reset Link'}
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        />

        <TouchableOpacity 
          onPress={() => navigation?.goBack()} 
          style={styles.backButton}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
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

export default ForgotPasswordScreen;
