/**
 * Admin Clearances Screen
 * Manage clearances with active and archived states.
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminClearancesScreenProps {
  navigation?: any;
}

const AdminClearancesScreen: React.FC<AdminClearancesScreenProps> = () => {
  const {
    clearances,
    staffRoles,
    departments,
    createClearance,
    updateClearance,
    archiveClearance,
    restoreClearance,
    deleteClearance,
  } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editClearanceId, setEditClearanceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [departmentsAllowed, setDepartmentsAllowed] = useState<string[]>([]);
  const [errors, setErrors] = useState<{name?: string; description?: string; staffRole?: string; departments?: string}>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeClearances = useMemo(
    () => clearances.filter((clearance) => (clearance.status || 'active') !== 'archived'),
    [clearances]
  );
  const archivedClearances = useMemo(
    () => clearances.filter((clearance) => (clearance.status || 'active') === 'archived'),
    [clearances]
  );
  const displayedClearances = showArchived ? archivedClearances : activeClearances;
  const activeRoles = useMemo(
    () => staffRoles.filter((role) => (role.status || 'active') !== 'archived'),
    [staffRoles]
  );

  const handleSave = async () => {
    const safeName = name || '';
    const safeDescription = description || '';

    const newErrors: {name?: string; description?: string; staffRole?: string; departments?: string} = {};
    if (!safeName.trim()) newErrors.name = 'Clearance name is required';
    if (!safeDescription.trim()) newErrors.description = 'Description is required';
    if (!staffRole) newErrors.staffRole = 'Please select an assigned staff role';
    if (departmentsAllowed.length === 0) newErrors.departments = 'Please select at least one department';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      if (editClearanceId) {
        await updateClearance(editClearanceId, name, description, staffRole, departmentsAllowed);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Clearance updated successfully');
        } else {
          window.alert('Clearance updated successfully');
        }
      } else {
        await createClearance(name, description, staffRole, departmentsAllowed);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Clearance created successfully');
        } else {
          window.alert('Clearance created successfully');
        }
      }

      setName('');
      setDescription('');
      setStaffRole('');
      setDepartmentsAllowed([]);
      setErrors({});
      setEditClearanceId(null);
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditClearanceId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setStaffRole(item.staffRole || '');
    setDepartmentsAllowed(item.departmentsAllowed || []);
    setShowModal(true);
  };

  const confirmAction = (title: string, message: string, action: () => Promise<void>) => {
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
          <Text style={styles.title}>Clearances</Text>
        </View>
        <Button
          title="+ Add Clearance"
          onPress={() => {
            setEditClearanceId(null);
            setName('');
            setDescription('');
            setStaffRole('');
            setDepartmentsAllowed([]);
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
            Active ({activeClearances.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showArchived && styles.activeTab]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.tabText, showArchived && styles.activeTabText]}>
            Archived ({archivedClearances.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedClearances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{showArchived ? 'No archived clearances' : 'No clearances yet'}</Text>
          <Text style={styles.emptySubtext}>
            {showArchived ? 'Archived clearances will appear here.' : 'Tap Add Clearance to create your first clearance.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedClearances}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              onLongPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              delayLongPress={200}
            >
              <Card>
                <View style={styles.clearanceCard}>
                  <View style={styles.clearanceInfo}>
                    <View style={styles.clearanceHeader}>
                      <Text style={styles.clearanceName}>{item.name}</Text>
                      <View style={[styles.statusBadge, showArchived && styles.archivedBadge]}>
                        <Text style={styles.statusText}>{showArchived ? 'Archived' : 'Active'}</Text>
                      </View>
                    </View>
                    <Text style={styles.clearanceDescription}>{item.description}</Text>
                    <View style={styles.partsList}>
                      <Text style={styles.partItem}>
                        Assigned to: {staffRoles.find(r => r.id === item.staffRole)?.name || item.staffRole}
                      </Text>
                    </View>
                    <View style={styles.departmentsList}>
                      <Text style={styles.clearanceMeta}>
                        {item.departmentsAllowed.length} department{item.departmentsAllowed.length !== 1 ? 's' : ''}
                      </Text>
                      {item.departmentsAllowed.length > 0 ? (
                        <Text style={styles.partItem}>
                          {item.departmentsAllowed
                            .map(deptId => departments.find(d => d.id === deptId)?.name || deptId)
                            .join(', ')}
                        </Text>
                      ) : null}
                    </View>
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
                            confirmAction('Archive Clearance', 'Archive this clearance?', async () => {
                              await archiveClearance(item.id);
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
                            confirmAction('Restore Clearance', 'Restore this clearance?', async () => {
                              await restoreClearance(item.id);
                            })
                          }
                          style={styles.textActionButton}
                        >
                          <Text style={styles.textAction}>Restore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            confirmAction('Delete Clearance', 'Permanently delete this archived clearance?', async () => {
                              await deleteClearance(item.id);
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editClearanceId ? 'Edit Clearance' : 'Create New Clearance'}
              </Text>

              <TextInput
                label="Clearance Name"
                placeholder="e.g., IT Clearance"
                value={name}
                onChangeText={(val) => { setName(val); setErrors(prev => ({ ...prev, name: undefined })); }}
                error={errors.name}
              />

              <TextInput
                label="Description"
                placeholder="What is this clearance for?"
                value={description}
                onChangeText={(val) => { setDescription(val); setErrors(prev => ({ ...prev, description: undefined })); }}
                multiline
                numberOfLines={2}
                error={errors.description}
              />

              <View style={styles.partContainer}>
                <Text style={styles.label}>Assigned Staff Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelector}>
                  {activeRoles.map(role => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleOption,
                        staffRole === role.id && styles.roleOptionSelected,
                        !!errors.staffRole && styles.roleOptionError,
                      ]}
                      onPress={() => {
                        setStaffRole(role.id);
                        setErrors(prev => ({ ...prev, staffRole: undefined }));
                      }}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          staffRole === role.id && styles.roleOptionTextSelected,
                        ]}
                      >
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {errors.staffRole ? <Text style={styles.fieldErrorText}>{errors.staffRole}</Text> : null}
              </View>

              <View style={styles.partContainer}>
                <Text style={styles.label}>Assign to Departments</Text>
                <Text style={styles.helperText}>Select which departments require this clearance</Text>
                <View style={styles.departmentsGrid}>
                  {departments.filter(d => d.status === 'active').map(dept => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.departmentOption,
                        departmentsAllowed.includes(dept.id) && styles.departmentOptionSelected,
                      ]}
                      onPress={() => {
                        setDepartmentsAllowed(prev =>
                          prev.includes(dept.id)
                            ? prev.filter(id => id !== dept.id)
                            : [...prev, dept.id]
                        );
                        setErrors(prev => ({ ...prev, departments: undefined }));
                      }}
                    >
                      <Text
                        style={[
                          styles.departmentOptionText,
                          departmentsAllowed.includes(dept.id) && styles.departmentOptionTextSelected,
                        ]}
                      >
                        {departmentsAllowed.includes(dept.id) ? '✓ ' : ''}{dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.departments ? <Text style={styles.fieldErrorText}>{errors.departments}</Text> : null}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowModal(false);
                  setEditClearanceId(null);
                  setName('');
                  setDescription('');
                  setStaffRole('');
                  setDepartmentsAllowed([]);
                  setErrors({});
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title={editClearanceId ? "Save Changes" : "Create"}
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
  clearanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearanceInfo: {
    flex: 1,
  },
  clearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  clearanceName: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  clearanceDescription: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  clearanceMeta: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  partsList: {
    marginTop: Spacing.sm,
  },
  departmentsList: {
    marginTop: Spacing.sm,
  },
  partItem: {
    ...Typography.caption,
    color: Colors.textLight,
    marginVertical: Spacing.xs,
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
    maxHeight: '85%',
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  partContainer: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  roleSelector: {
    marginVertical: Spacing.sm,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleOptionText: {
    ...Typography.caption,
    color: Colors.text,
  },
  roleOptionTextSelected: {
    color: Colors.textInverse,
  },
  roleOptionError: {
    borderColor: Colors.rejected,
  },
  fieldErrorText: {
    ...Typography.caption,
    color: Colors.rejected,
    marginTop: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  departmentOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  departmentOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  departmentOptionText: {
    ...Typography.caption,
    color: Colors.text,
  },
  departmentOptionTextSelected: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
});

export default AdminClearancesScreen;
