/**
 * Admin Dashboard Screen
 * Mobile-first redesign: greeting, needs-attention card, quick stats,
 * progress section, quick actions, and navigation shortcuts.
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminDashboardScreenProps {
  navigation?: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single quick-stat mini card */
interface QuickStatProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: number;
  color?: string;
  onPress?: () => void;
}
const QuickStat: React.FC<QuickStatProps> = ({ icon, label, value, color = Colors.primary, onPress }) => (
  <TouchableOpacity style={qsStyles.card} onPress={onPress} activeOpacity={0.82}>
    <View style={[qsStyles.iconWrap, { backgroundColor: Colors.secondaryMuted }]}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.secondary} />
    </View>
    <Text style={[qsStyles.value, { color }]}>{value}</Text>
    <Text style={qsStyles.label}>{label}</Text>
  </TouchableOpacity>
);
const qsStyles = StyleSheet.create({
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
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: { width: 38, height: 38, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  value: { ...Typography.h3, color: Colors.primary },
  label: { ...Typography.caption, color: Colors.textLight, textAlign: 'center' },
});

/** Large touch-friendly quick-action button */
interface ActionBtnProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress?: () => void;
  highlight?: boolean;
}
const ActionBtn: React.FC<ActionBtnProps> = ({ icon, label, onPress, highlight = false }) => (
  <TouchableOpacity
    style={[abStyles.btn, highlight && abStyles.btnHighlight]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <View style={[abStyles.iconBox, highlight && abStyles.iconBoxHighlight]}>
      <MaterialCommunityIcons name={icon} size={24} color={highlight ? Colors.textInverse : Colors.primary} />
    </View>
    <Text style={[abStyles.label, highlight && abStyles.labelHighlight]}>{label}</Text>
  </TouchableOpacity>
);
const abStyles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 88,
  },
  btnHighlight: {
    backgroundColor: Colors.primary,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxHighlight: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  label: { ...Typography.captionBold, color: Colors.primary, textAlign: 'center' },
  labelHighlight: { color: Colors.textInverse },
});

/** Navigation shortcut list row */
interface ShortcutRowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  subtitle?: string;
  badge?: number;
  onPress?: () => void;
}
const ShortcutRow: React.FC<ShortcutRowProps> = ({ icon, label, subtitle, badge, onPress }) => (
  <TouchableOpacity style={srStyles.row} onPress={onPress} activeOpacity={0.75}>
    <View style={srStyles.iconBox}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.secondary} />
    </View>
    <View style={srStyles.text}>
      <Text style={srStyles.label}>{label}</Text>
      {subtitle ? <Text style={srStyles.sub}>{subtitle}</Text> : null}
    </View>
    <View style={srStyles.right}>
      {badge !== undefined && badge > 0 ? (
        <View style={srStyles.badge}>
          <Text style={srStyles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
    </View>
  </TouchableOpacity>
);
const srStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { ...Typography.bodyMedium, color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textLight, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.pending,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { ...Typography.captionBold, color: '#fff' },
});

// ── Progress bar (clearance completion) ───────────────────────────────────────
const MiniProgress: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={mpStyles.row}>
    <View style={mpStyles.header}>
      <Text style={mpStyles.label}>{label}</Text>
      <Text style={[mpStyles.pct, { color }]}>{value}%</Text>
    </View>
    <View style={mpStyles.track}>
      <View style={[mpStyles.fill, { width: `${value}%` as any, backgroundColor: color }]} />
    </View>
  </View>
);
const mpStyles = StyleSheet.create({
  row: { marginBottom: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { ...Typography.bodyMedium, color: Colors.text },
  pct: { ...Typography.captionBold },
  track: { height: 8, backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: BorderRadius.full },
});

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({ title, action, onAction }) => (
  <View style={shStyles.row}>
    <Text style={shStyles.title}>{title}</Text>
    {action ? (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={shStyles.action}>{action}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);
const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  title: { ...Typography.h4, color: Colors.text },
  action: { ...Typography.captionBold, color: Colors.secondary },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { staffRoles, clearances, departments, pendingStudents, users } = useApp();

  const activeDepartments = useMemo(() => departments.filter((d) => d.status === 'active'), [departments]);
  const activeStaffRoles = useMemo(
    () => staffRoles.filter((role) => (role.status || 'active') !== 'archived'),
    [staffRoles]
  );
  const activeClearances = useMemo(
    () => clearances.filter((clearance) => (clearance.status || 'active') !== 'archived'),
    [clearances]
  );
  const activeStudents = useMemo(
    () => users.filter((u) => u.role === 'student' && (u.status || 'active') !== 'archived'),
    [users]
  );
  const activeStaff = useMemo(
    () => users.filter((u) => u.role === 'staff' && (u.status || 'active') !== 'archived'),
    [users]
  );
  const pendingCount   = pendingStudents.filter((s) => s.status === 'pending').length;
  const staffCount     = activeStaff.length;
  const studentCount   = activeStudents.length;
  const firstName      = user?.name?.split(' ')[0] || 'Admin';

  // Clearance completion approximation across all student clearances
  const totalClearances    = activeClearances.length;
  const completionRate     = totalClearances === 0 ? 0 : Math.min(100, Math.round((activeDepartments.length / Math.max(1, departments.length)) * 100));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Welcome Section ── */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeLeft}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.adminName}>{firstName} 👋</Text>
          <Text style={styles.welcomeSub}>Here&apos;s what&apos;s happening today.</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{(user?.name?.[0] || 'A').toUpperCase()}</Text>
        </View>
      </View>

      {/* ── 2. Needs Attention Card ── */}
      {pendingCount > 0 && (
        <View style={styles.attentionWrap}>
          <View style={styles.attentionCard}>
            <View style={styles.attentionLeft}>
              <View style={styles.attentionIcon}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.attentionTitle}>Needs Attention</Text>
                <Text style={styles.attentionBody}>
                  {pendingCount} pending student registration{pendingCount > 1 ? 's' : ''} await your review.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.attentionBtn}
              onPress={() => navigation?.navigate('AdminPendingStudents')}
              activeOpacity={0.85}
            >
              <Text style={styles.attentionBtnText}>Review Now</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 3. Quick Stats ── */}
      <SectionHeader title="Quick Stats" />
      <View style={styles.statsRow}>
        <QuickStat icon="account-school-outline"   label="Students"    value={studentCount}          color={Colors.primary}   onPress={() => navigation?.navigate('AdminStudents')} />
        <QuickStat icon="office-building-outline"  label="Departments" value={activeDepartments.length} color={Colors.secondary} onPress={() => navigation?.navigate('AdminDepartments')} />
        <QuickStat icon="clipboard-check-outline"  label="Clearances"  value={activeClearances.length}     color={Colors.primary}   onPress={() => navigation?.navigate('AdminClearances')} />
        <QuickStat icon="clock-alert-outline"      label="Pending"     value={pendingCount}           color={pendingCount > 0 ? Colors.pending : Colors.primary} onPress={() => navigation?.navigate('AdminPendingStudents')} />
      </View>

      {/* ── 4. Progress Section ── */}
      <SectionHeader title="System Overview" />
      <Card style={styles.sectionCard}>
        <MiniProgress label="Active Departments" value={completionRate}                                           color={Colors.secondary} />
        <MiniProgress label="Staff Accounts"     value={staffCount > 0 ? Math.min(100, staffCount * 10) : 0}    color={Colors.text} />
        <MiniProgress label="Clearance Types"    value={totalClearances > 0 ? Math.min(100, totalClearances * 10) : 0} color={Colors.primary} />

        <View style={styles.overviewBadges}>
          <View style={[styles.overviewBadge, { backgroundColor: Colors.surfaceMuted }]}>
            <MaterialCommunityIcons name="account-tie-outline" size={14} color={Colors.text} />
            <Text style={[styles.overviewBadgeText, { color: Colors.text }]}>{staffCount} Staff</Text>
          </View>
          <View style={[styles.overviewBadge, { backgroundColor: Colors.secondaryMuted }]}>
            <MaterialCommunityIcons name="shield-account-outline" size={14} color={Colors.secondary} />
            <Text style={[styles.overviewBadgeText, { color: Colors.secondary }]}>{activeStaffRoles.length} Roles</Text>
          </View>
          <View style={[styles.overviewBadge, { backgroundColor: Colors.pendingBg }]}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.pendingText} />
            <Text style={[styles.overviewBadgeText, { color: Colors.pendingText }]}>{pendingCount} Pending</Text>
          </View>
        </View>
      </Card>

      {/* ── 5. Quick Actions ── */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionsRow}>
        <ActionBtn icon="account-plus-outline"     label="Add Student"    onPress={() => navigation?.navigate('AdminStudents')}    highlight />
        <ActionBtn icon="clipboard-plus-outline"   label="Create Clearance" onPress={() => navigation?.navigate('AdminClearances')} />
        <ActionBtn icon="office-building-plus-outline" label="Add Department" onPress={() => navigation?.navigate('AdminDepartments')} />
      </View>

      {/* ── 6. Navigation Shortcuts ── */}
      <SectionHeader title="Manage" action="See all" onAction={() => navigation?.navigate('AdminStudents')} />
      <Card style={styles.sectionCard}>
        <ShortcutRow
          icon="account-school-outline"
          label="Students"
          subtitle={`${studentCount} registered`}
          onPress={() => navigation?.navigate('AdminStudents')}
        />
        <ShortcutRow
          icon="office-building-outline"
          label="Departments"
          subtitle={`${activeDepartments.length} active`}
          onPress={() => navigation?.navigate('AdminDepartments')}
        />
        <ShortcutRow
          icon="clipboard-check-outline"
          label="Clearances"
          subtitle={`${activeClearances.length} types configured`}
          onPress={() => navigation?.navigate('AdminClearances')}
        />
        <ShortcutRow
          icon="shield-account-outline"
          label="Staff Roles"
          subtitle={`${activeStaffRoles.length} roles defined`}
          onPress={() => navigation?.navigate('AdminStaffRoles')}
        />
        <ShortcutRow
          icon="clock-alert-outline"
          label="Pending Registrations"
          subtitle="Students awaiting approval"
          badge={pendingCount}
          onPress={() => navigation?.navigate('AdminPendingStudents')}
        />
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },

  // Welcome
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  welcomeLeft: { flex: 1, gap: 2 },
  greeting: { ...Typography.caption, color: Colors.textLight },
  adminName: { ...Typography.h1, color: Colors.primary },
  welcomeSub: { ...Typography.body, color: Colors.textLight, marginTop: 2 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  avatarLetter: { ...Typography.h3, color: Colors.textInverse },

  // Needs Attention
  attentionWrap: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  attentionCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  attentionLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  attentionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionTitle: { ...Typography.h4, color: '#fff', marginBottom: 2 },
  attentionBody: { ...Typography.body, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  attentionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'stretch',
  },
  attentionBtnText: { ...Typography.bodyMedium, color: Colors.primary, fontWeight: '700' },

  // Quick Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },

  // Overview badges
  overviewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  overviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  overviewBadgeText: { ...Typography.captionBold },

  // Section card
  sectionCard: { marginHorizontal: Spacing.md },
});

export default AdminDashboardScreen;
