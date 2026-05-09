/**
 * Admin Departments Screen
 * Manage departments - create, edit, archive, restore, delete
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import React, { useState } from 'react';
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

interface AdminDepartmentsScreenProps {
  navigation?: any;
}

const AdminDepartmentsScreen: React.FC<AdminDepartmentsScreenProps> = ({ navigation }) => {
  const { departments, createDepartment, updateDepartment, archiveDepartment, restoreDepartment, deleteDepartment } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{name?: string, description?: string}>({});
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const activeDepartments = departments.filter(d => d.status === 'active');
  const archivedDepartments = departments.filter(d => d.status === 'archived');
  const displayedDepartments = showArchived ? archivedDepartments : activeDepartments;

  const handleSave = async () => {
    const safeName = name || '';
    const safeDescription = description || '';

    const newErrors: {name?: string, description?: string} = {};
    if (!safeName.trim()) newErrors.name = 'Department name is required';
    if (!safeDescription.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editDepartmentId) {
        await updateDepartment(editDepartmentId, name, description);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Department updated successfully');
        } else {
          window.alert('Department updated successfully');
        }
      } else {
        await createDepartment(name, description);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Department created successfully');
        } else {
          window.alert('Department created successfully');
        }
      }

      setName('');
      setDescription('');
      setErrors({});
      setEditDepartmentId(null);
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditDepartmentId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setShowModal(true);
  };

  const handleArchiveConfirm = async (id: string) => {
    try {
      await archiveDepartment(id);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Department archived successfully');
      } else {
        window.alert('Department archived successfully');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to archive');
      } else {
        window.alert('Error: ' + (error.message || 'Failed to archive'));
      }
    }
  };

  const handleArchive = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to archive this department?')) {
        handleArchiveConfirm(id);
      }
    } else {
      Alert.alert(
        'Confirm Archive',
        'Are you sure you want to archive this department?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: () => handleArchiveConfirm(id),
          },
        ]
      );
    }
  };

  const handleRestoreConfirm = async (id: string) => {
    try {
      await restoreDepartment(id);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Department restored successfully');
      } else {
        window.alert('Department restored successfully');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to restore');
      } else {
        window.alert('Error: ' + (error.message || 'Failed to restore'));
      }
    }
  };

  const handleRestore = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to restore this department?')) {
        handleRestoreConfirm(id);
      }
    } else {
      Alert.alert(
        'Confirm Restore',
        'Are you sure you want to restore this department?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'default',
            onPress: () => handleRestoreConfirm(id),
          },
        ]
      );
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteDepartment(id);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Department deleted successfully');
      } else {
        window.alert('Department deleted successfully');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to delete');
      } else {
        window.alert('Error: ' + (error.message || 'Failed to delete'));
      }
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to permanently delete this department? This cannot be undone.')) {
        handleDeleteConfirm(id);
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to permanently delete this department? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteConfirm(id),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Departments</Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            title="+ Add Department"
            onPress={() => {
              setEditDepartmentId(null);
              setName('');
              setDescription('');
              setErrors({});
              setShowModal(true);
            }}
            variant="primary"
            size="small"
          />
        </View>
      </View>

      {/* Tabs to show active/archived */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, !showArchived && styles.activeTab]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.tabText, !showArchived && styles.activeTabText]}>
            Active ({activeDepartments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showArchived && styles.activeTab]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.tabText, showArchived && styles.activeTabText]}>
            Archived ({archivedDepartments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedDepartments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {showArchived ? 'No archived departments' : 'No departments yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {showArchived ? 'Archived departments will appear here' : 'Tap "Add Department" to create your first department'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedDepartments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              onLongPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
              delayLongPress={200}
            >
              <Card>
                <View style={styles.departmentCard}>
                  <View style={styles.departmentInfo}>
                    <View style={styles.departmentHeader}>
                      <Text style={styles.departmentName}>{item.name}</Text>
                      <View style={[styles.statusBadge, item.status === 'archived' && styles.archivedBadge]}>
                        <Text style={styles.statusText}>
                          {item.status === 'archived' ? 'Archived' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.departmentDescription}>{item.description}</Text>
                    <Text style={styles.cardHintText}>
                      {selectedCardId === item.id ? 'Tap card to hide actions' : 'Tap card to manage'}
                    </Text>
                  </View>
                </View>
                {selectedCardId === item.id && (
                  <View style={styles.textActionsRow}>
                    {item.status === 'active' && (
                      <>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.textActionButton}>
                          <Text style={styles.textAction}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleArchive(item.id)} style={styles.textActionButton}>
                          <Text style={styles.textAction}>Archive</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {item.status === 'archived' && (
                      <>
                        <TouchableOpacity onPress={() => handleRestore(item.id)} style={styles.textActionButton}>
                          <Text style={styles.textAction}>Restore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.textActionButton}>
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

      {/* Modal for creating/editing department */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editDepartmentId ? 'Edit Department' : 'Create New Department'}
            </Text>

            <TextInput
              label="Department Name"
              placeholder="e.g., Computer Science"
              value={name}
              onChangeText={(val) => { setName(val); setErrors(prev => ({ ...prev, name: undefined })); }}
              error={errors.name}
            />

            <TextInput
              label="Description"
              placeholder="What does this department do?"
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
                  setEditDepartmentId(null);
                  setName('');
                  setDescription('');
                  setErrors({});
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title={editDepartmentId ? "Save Changes" : "Create"}
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
  headerActions: {
    marginTop: Spacing.md,
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
  departmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  departmentInfo: {
    flex: 1,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  departmentName: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
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
  departmentDescription: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  cardHintText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.sm,
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

export default AdminDepartmentsScreen;
