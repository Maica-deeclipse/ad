/**
 * Admin Settings Screen
 * Allows admin to manage their account profile, change password, and logout.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface AdminSettingsScreenProps {
  navigation?: any;
}

const AdminSettingsScreen: React.FC<AdminSettingsScreenProps> = () => {
  const { user, updateAccountSettings, logout, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 480 ? Spacing.sm : Spacing.md;

  const [settingsName, setSettingsName] = useState(user?.name || '');
  const [settingsEmail, setSettingsEmail] = useState(user?.email || '');
  const [settingsPhone, setSettingsPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsErrors, setSettingsErrors] = useState<{
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    setSettingsName(user?.name || '');
    setSettingsEmail(user?.email || '');
    setSettingsPhone(user?.phone || '');
  }, [user?.name, user?.email, user?.phone]);

  const handleSaveSettings = async () => {
    const nextErrors: typeof settingsErrors = {};

    if (!settingsName.trim()) nextErrors.name = 'Name is required';
    if (!settingsEmail.trim()) nextErrors.email = 'Email is required';
    else if (!settingsEmail.includes('@')) nextErrors.email = 'Please enter a valid email';
    if (newPassword && newPassword.length < 6) nextErrors.newPassword = 'New password must be at least 6 characters';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    const emailChanged = settingsEmail.trim().toLowerCase() !== (user?.email || '').toLowerCase();
    const passwordChanged = newPassword.trim().length > 0;
    if ((emailChanged || passwordChanged) && !currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required for email or password changes';
    }

    setSettingsErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateAccountSettings({
        name: settingsName,
        email: settingsEmail,
        phone: settingsPhone,
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your account settings were updated.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Unable to update account settings');
    }
  };

  const confirmLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      Alert.alert('Logout Failed', error?.message || 'Unable to log out right now.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        void confirmLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void confirmLogout() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: horizontalPadding }]}
      >
      <View style={styles.formShell}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Text style={styles.sectionSubtitle}>
            Update your profile details. Current password is required for email or password changes.
          </Text>

          <Card>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={settingsName}
              onChangeText={(value) => {
                setSettingsName(value);
                setSettingsErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={settingsErrors.name}
            />
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={settingsEmail}
              onChangeText={(value) => {
                setSettingsEmail(value);
                setSettingsErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              error={settingsErrors.email}
            />
            <TextInput
              label="Phone Number"
              placeholder="Enter your phone number"
              value={settingsPhone}
              onChangeText={setSettingsPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              label="Current Password"
              placeholder="Required for email or password changes"
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                setSettingsErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }}
              secureTextEntry
              error={settingsErrors.currentPassword}
            />
            <TextInput
              label="New Password"
              placeholder="Leave blank to keep your current password"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setSettingsErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              secureTextEntry
              error={settingsErrors.newPassword}
            />
            <TextInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setSettingsErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              secureTextEntry
              error={settingsErrors.confirmPassword}
            />
            <Button
              title={isLoading ? 'Saving...' : 'Save Changes'}
              onPress={handleSaveSettings}
              variant="primary"
              disabled={isLoading}
              style={styles.settingsButton}
            />
          </Card>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} accessibilityRole="button">
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  formShell: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  section: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  settingsButton: {
    marginTop: Spacing.md,
  },
  logoutSection: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AdminSettingsScreen;
