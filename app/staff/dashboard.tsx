/**
 * Staff Dashboard Screen
 * Mobile-first redesign with tab layout, status badges, and FAB
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface StaffDashboardScreenProps {
  navigation?: any;
}

type Tab = 'overview' | 'queue';

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' }> = ({ status }) => {
  const map = {
    approved: { bg: Colors.approvedBg, text: Colors.approvedText, label: 'Approved', icon: 'check-circle-outline' as const },
    pending:  { bg: Colors.pendingBg,  text: Colors.pendingText,  label: 'Pending',  icon: 'clock-outline' as const },
    rejected: { bg: Colors.rejectedBg, text: Colors.rejectedText, label: 'Rejected', icon: 'close-circle-outline' as const },
  };
  const cfg = map[status];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.text} />
      <Text style={[badgeStyles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  text: {
    ...Typography.captionBold,
  },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: number | string;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color = Colors.primary }) => (
  <View style={statStyles.card}>
    <View style={[statStyles.iconWrap, { backgroundColor: Colors.secondaryMuted }]}>
      <MaterialCommunityIcons name={icon} size={22} color={Colors.secondary} />
    </View>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...Typography.h3,
    color: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

// ── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = ({ label, value, color, icon }) => (
  <View style={pbStyles.row}>
    <View style={pbStyles.header}>
      <View style={pbStyles.labelGroup}>
        <MaterialCommunityIcons name={icon} size={15} color={color} />
        <Text style={pbStyles.label}>{label}</Text>
      </View>
      <Text style={[pbStyles.pct, { color }]}>{value}%</Text>
    </View>
    <View style={pbStyles.track}>
      <View style={[pbStyles.fill, { width: `${value}%` as any, backgroundColor: color }]} />
    </View>
  </View>
);

const pbStyles = StyleSheet.create({
  row: { marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { ...Typography.bodyMedium, color: Colors.text },
  pct: { ...Typography.captionBold },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});

// ── Metric Row ────────────────────────────────────────────────────────────────
interface MetricRowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: number;
  status?: 'approved' | 'pending' | 'rejected';
}

const MetricRow: React.FC<MetricRowProps> = ({ icon, label, value, status }) => (
  <View style={mrStyles.row}>
    <View style={mrStyles.left}>
      <View style={mrStyles.iconBox}>
        <MaterialCommunityIcons name={icon} size={18} color={Colors.secondary} />
      </View>
      <Text style={mrStyles.label}>{label}</Text>
    </View>
    <View style={mrStyles.right}>
      {status ? <StatusBadge status={status} /> : null}
      <Text style={mrStyles.value}>{value}</Text>
    </View>
  </View>
);

const mrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...Typography.bodyMedium, color: Colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { ...Typography.h4, color: Colors.primary, minWidth: 28, textAlign: 'right' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { clearances, studentClearances, users } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const assignedClearances = useMemo(() => {
    if (!user?.staffRole) return [];
    return studentClearances.filter((sc) => {
      const student = users.find((u) => u.id === sc.studentId);
      const clearance = clearances.find((c) => c.id === sc.clearanceId) || sc.clearance;
      return (
        student?.role === 'student' &&
        clearance?.departmentsAllowed.includes(student?.department || '') &&
        clearance?.staffRole === user.staffRole
      );
    });
  }, [clearances, studentClearances, user?.staffRole, users]);

  const totals = useMemo(() => {
    const total    = assignedClearances.length;
    const pending  = assignedClearances.filter((c) => c.status === 'pending').length;
    const approved = assignedClearances.filter((c) => c.status === 'approved').length;
    const rejected = assignedClearances.filter((c) => c.status === 'rejected').length;
    const processed      = approved + rejected;
    const approvalRate   = total === 0 ? 0 : Math.round((approved / total) * 100);
    const processingRate = total === 0 ? 0 : Math.round((processed / total) * 100);
    const rejectedRate   = total === 0 ? 0 : Math.round((rejected / total) * 100);
    return { total, pending, approved, rejected, processed, approvalRate, processingRate, rejectedRate };
  }, [assignedClearances]);

  const firstName = user?.name?.split(' ')[0] || 'Staff';

  return (
    <View style={styles.root}>
      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{firstName} 👋</Text>
        </View>
        <View style={styles.rolePill}>
          <MaterialCommunityIcons name="shield-account-outline" size={14} color={Colors.secondary} />
          <Text style={styles.roleText}>{user?.staffRole || 'Staff'}</Text>
        </View>
      </View>

      {/* ── Quick Stats ── */}
      <View style={styles.statsRow}>
        <StatCard icon="clipboard-list-outline" value={totals.total}    label="Assigned"  color={Colors.primary} />
        <StatCard icon="clock-outline"           value={totals.pending}  label="Pending"   color={Colors.pending} />
        <StatCard icon="check-circle-outline"    value={totals.approved} label="Approved"  color={Colors.approved} />
        <StatCard icon="close-circle-outline"    value={totals.rejected} label="Rejected"  color={Colors.rejected} />
      </View>

      {/* ── Tab Switcher ── */}
      <View style={styles.tabBar}>
        {(['overview', 'queue'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialCommunityIcons
              name={tab === 'overview' ? 'chart-bar' : 'format-list-bulleted'}
              size={16}
              color={activeTab === tab ? Colors.primary : Colors.textLight}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Analytics' : 'Queue Status'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Rate Cards */}
            <View style={styles.rateRow}>
              <View style={[styles.rateCard, { borderColor: Colors.approved }]}>
                <MaterialCommunityIcons name="chart-arc" size={24} color={Colors.approved} />
                <Text style={[styles.rateValue, { color: Colors.approved }]}>{totals.approvalRate}%</Text>
                <Text style={styles.rateLabel}>Approval Rate</Text>
              </View>
              <View style={[styles.rateCard, { borderColor: Colors.secondary }]}>
                <MaterialCommunityIcons name="progress-check" size={24} color={Colors.secondary} />
                <Text style={[styles.rateValue, { color: Colors.secondary }]}>{totals.processingRate}%</Text>
                <Text style={styles.rateLabel}>Processing Rate</Text>
              </View>
            </View>

            {/* Status Breakdown */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Status Breakdown</Text>
            </View>
            <Card style={styles.sectionCard}>
              <ProgressBar label="Processed" value={totals.processingRate} color={Colors.secondary}  icon="progress-check" />
              <ProgressBar label="Approved"  value={totals.approvalRate}   color={Colors.approved}   icon="check-circle-outline" />
              <ProgressBar label="Rejected"  value={totals.rejectedRate}   color={Colors.rejected}   icon="close-circle-outline" />
            </Card>
          </>
        ) : (
          <>
            {/* Queue Details */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Queue Details</Text>
              <Text style={styles.sectionSub}>{totals.total} total assigned</Text>
            </View>
            <Card style={styles.sectionCard}>
              <MetricRow icon="clipboard-list-outline" label="Total Assigned" value={totals.total} />
              <MetricRow icon="clock-outline"          label="Pending"        value={totals.pending}  status="pending" />
              <MetricRow icon="check-circle-outline"   label="Approved"       value={totals.approved} status="approved" />
              <MetricRow icon="close-circle-outline"   label="Rejected"       value={totals.rejected} status="rejected" />
            </Card>
          </>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('StaffClearances')}
        activeOpacity={0.88}
      >
        <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#fff" />
        <Text style={styles.fabLabel}>Review Queue</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Page Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  name: {
    ...Typography.h2,
    color: Colors.primary,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.captionBold,
    color: Colors.secondary,
  },

  // Quick Stats Row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    justifyContent: 'space-between',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: '#F0EDE5',
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.xs,
  },
  tabActive: {
    backgroundColor: Colors.surfaceCard,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    ...Typography.captionBold,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  sectionSub: {
    ...Typography.caption,
    color: Colors.textLight,
  },

  // Rate Cards
  rateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rateCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  rateValue: {
    ...Typography.h2,
  },
  rateLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
  },

  // Section card (breakdown / queue)
  sectionCard: { marginHorizontal: Spacing.md },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  fabLabel: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
    fontWeight: '700',
  },
});

export default StaffDashboardScreen;
