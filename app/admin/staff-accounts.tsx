/**
 * Admin Staff Accounts Screen
 * Create staff accounts with email/password and assign a staff role
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminStaffAccountsScreenProps {
  navigation?: any;
}

const AdminStaffAccountsScreen: React.FC<AdminStaffAccountsScreenProps> = ({ navigation }) => {
  const { users, staffRoles, createStaffAccount } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    staffRole?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeStaffRoles = useMemo(
    () => staffRoles.filter((role) => (role.status || 'active') !== 'archived'),
    [staffRoles]
  );
  const staffUsers = useMemo(
    () => users.filter((user) => user.role === 'staff' && (user.status || 'active') !== 'archived'),
    [users]
  );

  const handleCreate = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!email.includes('@')) nextErrors.email = 'Please enter a valid email';
    if (!password.trim()) nextErrors.password = 'Password is required';
    else if (password.trim().length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (!selectedRole) nextErrors.staffRole = 'Staff role is required';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await createStaffAccount({
        name,
        email,
        password,
        phone,
        staffRole: selectedRole,
      });

      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSelectedRole('');
      setErrors({});

      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Staff account created successfully');
      } else {
        window.alert('Staff account created successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create staff account');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (roleId?: string) => {
    return staffRoles.find((role) => role.id === roleId)?.name || 'Unassigned';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Staff Accounts</Text>
        </View>
      </View>

      <FlatList
        data={staffUsers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create Staff Account</Text>
            <TextInput
              label="Full Name"
              placeholder="Enter staff name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />
            <TextInput
              label="Email"
              placeholder="Enter staff email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              error={errors.email}
            />
            <TextInput
              label="Password"
              placeholder="Enter temporary password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry
              error={errors.password}
            />
            <TextInput
              label="Phone Number (Optional)"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Staff Role</Text>
            <View style={styles.roleList}>
              {activeStaffRoles.length === 0 ? (
                <Text style={styles.helperText}>Create staff roles first before adding staff accounts.</Text>
              ) : (
                activeStaffRoles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                      onPress={() => {
                        setSelectedRole(role.id);
                        setErrors((prev) => ({ ...prev, staffRole: undefined }));
                      }}
                    >
                      <Text style={[styles.roleOptionText, isSelected && styles.roleOptionTextSelected]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
            {errors.staffRole ? <Text style={styles.fieldErrorText}>{errors.staffRole}</Text> : null}

            <Button
              title={isSaving ? 'Creating...' : 'Create Staff Account'}
              onPress={handleCreate}
              variant="primary"
              disabled={isSaving || activeStaffRoles.length === 0}
              style={styles.createButton}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.staffName}>{item.name}</Text>
            <Text style={styles.staffMeta}>{item.email}</Text>
            <Text style={styles.staffRole}>{getRoleName(item.staffRole)}</Text>
            {item.phone ? <Text style={styles.staffMeta}>Phone: {item.phone}</Text> : null}
          </Card>
        )}
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyText}>No staff accounts created yet</Text>
          </Card>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.surface,
    fontWeight: '600',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
    textAlign: 'left',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  roleList: {
    marginBottom: Spacing.sm,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: Colors.textInverse,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  fieldErrorText: {
    ...Typography.caption,
    color: Colors.rejected,
  },
  createButton: {
    marginTop: Spacing.md,
  },
  staffName: {
    ...Typography.h3,
    color: Colors.text,
  },
  staffRole: {
    ...Typography.body,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  staffMeta: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'left',
    paddingVertical: Spacing.md,
  },
});

export default AdminStaffAccountsScreen;
