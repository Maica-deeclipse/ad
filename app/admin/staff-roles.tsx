/**
 * Admin Staff Roles Screen
 * Manage staff roles with active and archived states.
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
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface AdminStaffRolesScreenProps {
  navigation?: any;
}

const AdminStaffRolesScreen: React.FC<AdminStaffRolesScreenProps> = () => {
  const {
    staffRoles,
    createStaffRole,
    updateStaffRole,
    archiveStaffRole,
    restoreStaffRole,
    deleteStaffRole,
  } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{name?: string, description?: string}>({});
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const activeRoles = useMemo(
    () => staffRoles.filter((role) => (role.status || 'active') !== 'archived'),
    [staffRoles]
  );
  const archivedRoles = useMemo(
    () => staffRoles.filter((role) => (role.status || 'active') === 'archived'),
    [staffRoles]
  );
  const displayedRoles = showArchived ? archivedRoles : activeRoles;

  const handleSave = async () => {
    const safeName = name || '';
    const safeDescription = description || '';

    const newErrors: {name?: string, description?: string} = {};
    if (!safeName.trim()) newErrors.name = 'Role name is required';
    if (!safeDescription.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editRoleId) {
        await updateStaffRole(editRoleId, name, description);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Staff role updated successfully');
        } else {
          window.alert('Staff role updated successfully');
        }
      } else {
        await createStaffRole(name, description);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Staff role created successfully');
        } else {
          window.alert('Staff role created successfully');
        }
      }

      setName('');
      setDescription('');
      setErrors({});
      setEditRoleId(null);
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditRoleId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setShowModal(true);
  };

  const confirmWebOrNative = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    const run = async () => {
      try {
        await action();
      } catch (error: any) {
        if (Platform.OS !== 'web') {
          Alert.alert('Error', error.message || 'Operation failed');
        } else {
          window.alert(`Error: ${error.message || 'Operation failed'}`);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        run();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => run() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Staff Roles</Text>
        </View>
        <Button
          title="+ Add Role"
          onPress={() => {
            setEditRoleId(null);
            setName('');
            setDescription('');
            setErrors({});
            setShowModal(true);
          }}
          variant="primary"
          size="small"
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, !showArchived && styles.activeTab]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.tabText, !showArchived && styles.activeTabText]}>
            Active ({activeRoles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showArchived && styles.activeTab]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.tabText, showArchived && styles.activeTabText]}>
            Archived ({archivedRoles.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedRoles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{showArchived ? 'No archived staff roles' : 'No staff roles yet'}</Text>
          <Text style={styles.emptySubtext}>
            {showArchived ? 'Archived staff roles will appear here.' : 'Tap Add Role to create your first staff role.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedRoles}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              onLongPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              delayLongPress={200}
            >
              <Card>
                <View style={styles.roleCard}>
                  <View style={styles.roleInfo}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleName}>{item.name}</Text>
                      <View style={[styles.statusBadge, showArchived && styles.archivedBadge]}>
                        <Text style={styles.statusText}>{showArchived ? 'Archived' : 'Active'}</Text>
                      </View>
                    </View>
                    <Text style={styles.roleDescription}>{item.description}</Text>
                    <Text style={styles.cardHintText}>
                      {selectedCardId === item.id ? 'Tap card to hide actions' : 'Tap card to manage'}
                    </Text>
                  </View>
                </View>
                {selectedCardId === item.id && (
                  <View style={styles.textActionsRow}>
                    {!showArchived ? (
                      <>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.textActionButton}>
                          <Text style={styles.textAction}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            confirmWebOrNative('Archive Role', 'Archive this staff role?', async () => {
                              await archiveStaffRole(item.id);
                            })
                          }
                          style={styles.textActionButton}
                        >
                          <Text style={styles.textAction}>Archive</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            confirmWebOrNative('Restore Role', 'Restore this staff role?', async () => {
                              await restoreStaffRole(item.id);
                            })
                          }
                          style={styles.textActionButton}
                        >
                          <Text style={styles.textAction}>Restore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            confirmWebOrNative('Delete Role', 'Permanently delete this archived staff role?', async () => {
                              await deleteStaffRole(item.id);
                            })
                          }
                          style={styles.textActionButton}
                        >
                          <Text style={[styles.textAction, styles.textActionDelete]}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editRoleId ? 'Edit Staff Role' : 'Create New Staff Role'}
            </Text>

            <TextInput
              label="Role Name"
              placeholder="e.g., IT Office"
              value={name}
              onChangeText={(val) => { setName(val); setErrors(prev => ({ ...prev, name: undefined })); }}
              error={errors.name}
            />

            <TextInput
              label="Description"
              placeholder="What does this role manage?"
              value={description}
              onChangeText={(val) => { setDescription(val); setErrors(prev => ({ ...prev, description: undefined })); }}
              multiline
              numberOfLines={3}
              error={errors.description}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowModal(false);
                  setEditRoleId(null);
                  setName('');
                  setDescription('');
                  setErrors({});
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title={editRoleId ? "Save Changes" : "Create"}
                onPress={handleSave}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
    textAlign: 'left',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textLight,
  },
  listContent: {
    paddingVertical: Spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  roleName: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  roleDescription: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  cardHintText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
  },
  archivedBadge: {
    backgroundColor: Colors.textLight,
  },
  statusText: {
    ...Typography.body,
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  textActionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  textActionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  textAction: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  textActionDelete: {
    color: Colors.rejected,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdminStaffRolesScreen;
