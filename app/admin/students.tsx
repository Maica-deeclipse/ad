/**
 * Admin Students Screen
 * View students, search and filter records, and manage archive lifecycle.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { Department, StudentClearance, User } from '@/types';
import React, { useCallback, useMemo, useState } from 'react';
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

interface AdminStudentsScreenProps {
  navigation?: any;
}

type StudentTab = 'active' | 'archived';
type StudentStatusFilter = 'all' | 'complete' | 'in-progress' | 'needs-attention' | 'no-clearances';

const AdminStudentsScreen: React.FC<AdminStudentsScreenProps> = () => {
  const {
    users,
    studentClearances,
    departments,
    updateStudentDepartment,
    archiveStudent,
    restoreStudent,
    deleteStudent,
  } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('all');

  const students = useMemo(() => users.filter((user) => user.role === 'student'), [users]);
  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === 'active'),
    [departments]
  );

  const activeStudents = useMemo(
    () => students.filter((student) => (student.status || 'active') !== 'archived'),
    [students]
  );
  const archivedStudents = useMemo(
    () => students.filter((student) => (student.status || 'active') === 'archived'),
    [students]
  );

  const getStudentClearances = useCallback(
    (studentId: string) => studentClearances.filter((clearance) => clearance.studentId === studentId),
    [studentClearances]
  );

  const getClearanceStatus = (items: StudentClearance[]) => {
    if (items.length === 0) return 'No clearances';
    if (items.every((clearance) => clearance.status === 'approved')) return 'Complete';
    if (items.some((clearance) => clearance.status === 'rejected')) return 'Needs Attention';
    return 'In Progress';
  };

  const getProgress = (items: StudentClearance[]) => {
    if (items.length === 0) return 0;
    const approved = items.filter((clearance) => clearance.status === 'approved').length;
    return Math.round((approved / items.length) * 100);
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Unassigned';
    return departments.find((department) => department.id === departmentId)?.name || 'Unknown Department';
  };

  const getMatchesStatusFilter = useCallback(
    (status: string) => {
      switch (statusFilter) {
        case 'complete':
          return status === 'Complete';
        case 'in-progress':
          return status === 'In Progress';
        case 'needs-attention':
          return status === 'Needs Attention';
        case 'no-clearances':
          return status === 'No clearances';
        default:
          return true;
      }
    },
    [statusFilter]
  );

  const displayedStudents = useMemo(() => {
    const source = activeTab === 'active' ? activeStudents : archivedStudents;
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return source.filter((student) => {
      const clearances = getStudentClearances(student.id);
      const status = getClearanceStatus(clearances);
      const departmentMatches =
        departmentFilter === 'all' || (student.department || '') === departmentFilter;
      const statusMatches = getMatchesStatusFilter(status);
      const searchMatches =
        normalizedSearch.length === 0 ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch);

      return departmentMatches && statusMatches && searchMatches;
    });
  }, [activeStudents, activeTab, archivedStudents, departmentFilter, getMatchesStatusFilter, getStudentClearances, searchQuery]);

  const openDepartmentModal = (student: User) => {
    setSelectedStudent(student);
    setSelectedDepartment(student.department || '');
    setShowDepartmentModal(true);
  };

  const openDetailsModal = (student: User) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleSaveDepartment = async () => {
    if (!selectedStudent?.id) {
      Alert.alert('Error', 'Student record not found');
      return;
    }

    if (!selectedDepartment) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    try {
      await updateStudentDepartment(selectedStudent.id, selectedDepartment);
      setShowDepartmentModal(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Student department updated successfully');
      } else {
        window.alert('Student department updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update department');
    }
  };

  const runStudentAction = async (
    action: () => Promise<void>,
    successMessage: string,
    closeAfter = false
  ) => {
    try {
      await action();
      if (closeAfter) {
        setShowDetailsModal(false);
      }
      if (Platform.OS !== 'web') {
        Alert.alert('Success', successMessage);
      } else {
        window.alert(successMessage);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        action();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => action() },
    ]);
  };

  const selectedStudentClearances = selectedStudent ? getStudentClearances(selectedStudent.id) : [];
  const selectedStudentStatus = getClearanceStatus(selectedStudentClearances);
  const selectedStudentProgress = getProgress(selectedStudentClearances);

  const renderDepartmentOption = (department: Department) => {
    const isSelected = selectedDepartment === department.id;

    return (
      <TouchableOpacity
        key={department.id}
        style={[styles.departmentOption, isSelected && styles.departmentOptionSelected]}
        onPress={() => setSelectedDepartment(department.id)}
      >
        <Text
          style={[styles.departmentOptionText, isSelected && styles.departmentOptionTextSelected]}
        >
          {department.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Students</Text>
        </View>
        <Text style={styles.subtitle}>
          {activeStudents.length} active student{activeStudents.length !== 1 ? 's' : ''}, {archivedStudents.length} archived
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({activeStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'archived' && styles.activeTab]}
          onPress={() => setActiveTab('archived')}
        >
          <Text style={[styles.tabText, activeTab === 'archived' && styles.activeTabText]}>
            Archived ({archivedStudents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersCard}>
        <TextInput
          label="Search Students"
          placeholder="Search by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <Text style={styles.filterLabel}>Department</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
          <TouchableOpacity
            style={[styles.filterChip, departmentFilter === 'all' && styles.filterChipSelected]}
            onPress={() => setDepartmentFilter('all')}
          >
            <Text style={[styles.filterChipText, departmentFilter === 'all' && styles.filterChipTextSelected]}>
              All
            </Text>
          </TouchableOpacity>
          {activeDepartments.map((department) => {
            const selected = departmentFilter === department.id;
            return (
              <TouchableOpacity
                key={department.id}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setDepartmentFilter(department.id)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                  {department.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.filterLabel}>Progress Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
          {[
            { key: 'all', label: 'All' },
            { key: 'complete', label: 'Complete' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'needs-attention', label: 'Needs Attention' },
            { key: 'no-clearances', label: 'No Clearances' },
          ].map((option) => {
            const selected = statusFilter === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setStatusFilter(option.key as StudentStatusFilter)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {displayedStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students match the current filters</Text>
          <Text style={styles.emptySubtext}>Try a different search, tab, department, or status filter.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const clearances = getStudentClearances(item.id);
            const status = getClearanceStatus(clearances);
            const progress = getProgress(clearances);

            return (
              <Card onPress={() => openDetailsModal(item)}>
                <View style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentDept}>{getDepartmentName(item.department)}</Text>
                    <Text style={styles.studentEmail}>{item.email}</Text>
                  </View>

                  <View style={styles.studentStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Clearances</Text>
                      <Text style={styles.statValue}>{clearances.length}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Progress</Text>
                      <Text style={styles.statValue}>{progress}%</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.studentFooter}>
                  <StatusBadge
                    status={status === 'Complete' ? 'approved' : status === 'Needs Attention' ? 'rejected' : 'pending'}
                    size="small"
                  />
                  <Text style={styles.viewDetailsText}>Tap to view details</Text>
                </View>
              </Card>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <Text style={styles.modalSubtitle}>
                {selectedStudent?.name} ({selectedStudent?.email})
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Department</Text>
                  <Text style={styles.summaryValue}>{getDepartmentName(selectedStudent?.department)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Progress</Text>
                  <Text style={styles.summaryValue}>{selectedStudentProgress}%</Text>
                </View>
              </View>

              <View style={styles.detailsStatusRow}>
                <StatusBadge
                  status={
                    selectedStudentStatus === 'Complete'
                      ? 'approved'
                      : selectedStudentStatus === 'Needs Attention'
                        ? 'rejected'
                        : 'pending'
                  }
                  size="small"
                />
                <Text style={styles.detailsStatusText}>{selectedStudentStatus}</Text>
              </View>

              <Button
                title="Change Department"
                onPress={() => {
                  setShowDetailsModal(false);
                  if (selectedStudent) {
                    openDepartmentModal(selectedStudent);
                  }
                }}
                variant="secondary"
                size="small"
                style={styles.inlineButton}
              />

              <Text style={styles.sectionTitle}>Assigned Clearances</Text>
              {selectedStudentClearances.length === 0 ? (
                <Text style={styles.emptySubtext}>This student does not have assigned clearances yet.</Text>
              ) : (
                selectedStudentClearances.map((clearance) => (
                  <View key={clearance.id} style={styles.clearanceItem}>
                    <View style={styles.clearanceTextWrap}>
                      <Text style={styles.clearanceName}>{clearance.clearance?.name || 'Unknown Clearance'}</Text>
                      <Text style={styles.clearanceMeta}>{clearance.remarks || 'No remarks yet'}</Text>
                    </View>
                    <StatusBadge status={clearance.status} size="small" />
                  </View>
                ))
              )}

              <Text style={styles.sectionTitle}>Account Actions</Text>
              {(selectedStudent?.status || 'active') !== 'archived' ? (
                <Button
                  title="Archive Student"
                  onPress={() =>
                    selectedStudent &&
                    confirmAction(
                      'Archive Student',
                      `Archive ${selectedStudent.name}?`,
                      () => runStudentAction(() => archiveStudent(selectedStudent.id), 'Student archived successfully', true)
                    )
                  }
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                />
              ) : (
                <>
                  <Button
                    title="Restore Student"
                    onPress={() =>
                      selectedStudent &&
                      runStudentAction(() => restoreStudent(selectedStudent.id), 'Student restored successfully', true)
                    }
                    variant="secondary"
                    size="small"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Delete Archived Student"
                    onPress={() =>
                      selectedStudent &&
                      confirmAction(
                        'Delete Student',
                        `Permanently delete ${selectedStudent.name}? This cannot be undone.`,
                        () => runStudentAction(() => deleteStudent(selectedStudent.id), 'Student deleted successfully', true)
                      )
                    }
                    variant="danger"
                    size="small"
                    style={styles.actionButton}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Close"
                onPress={() => setShowDetailsModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDepartmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Student Department</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStudent?.name} ({selectedStudent?.email})
            </Text>

            <View style={styles.departmentList}>
              {activeDepartments.map(renderDepartmentOption)}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowDepartmentModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSaveDepartment}
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
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
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
  filtersCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterScroller: {
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.text,
  },
  filterChipTextSelected: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.textLight,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingVertical: Spacing.md,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  studentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  studentName: {
    ...Typography.h3,
    color: Colors.text,
  },
  studentDept: {
    ...Typography.body,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  studentEmail: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  studentStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  viewDetailsText: {
    ...Typography.caption,
    color: Colors.textLight,
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
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  detailsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailsStatusText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  inlineButton: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  clearanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  clearanceTextWrap: {
    flex: 1,
  },
  clearanceName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  clearanceMeta: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
  departmentList: {
    marginBottom: Spacing.lg,
  },
  departmentOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  departmentOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  departmentOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  departmentOptionTextSelected: {
    color: Colors.textInverse,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdminStudentsScreen;
