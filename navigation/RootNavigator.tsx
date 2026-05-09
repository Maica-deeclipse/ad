/**
 * Root Navigation Setup
 * Routes users to appropriate screen based on auth status and role
 * Uses custom mobile drawer for navigation on small screens
 */

import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, BackHandler, SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';


// Import screens
import AdminClearancesScreen from '@/app/admin/clearances';
import AdminDashboardScreen from '@/app/admin/dashboard';
import AdminDepartmentsScreen from '@/app/admin/departments';
import AdminPendingStudentsScreen from '@/app/admin/pending-students';
import AdminSettingsScreen from '@/app/admin/settings';
import AdminStaffAccountsScreen from '@/app/admin/staff-accounts';
import AdminStaffRolesScreen from '@/app/admin/staff-roles';
import AdminStudentsScreen from '@/app/admin/students';
import ForgotPasswordScreen from '@/app/forgot-password';
import LoginScreen from '@/app/login';
import ResetPasswordScreen from '@/app/reset-password';
import StaffApproveScreen from '@/app/staff/approve';
import StaffClearancesScreen from '@/app/staff/clearances';
import StaffDashboardScreen from '@/app/staff/dashboard';
import StaffRejectScreen from '@/app/staff/reject';
import StaffSettingsScreen from '@/app/staff/settings';
import ClearanceDetailScreen from '@/app/student/clearance-detail';
import StudentClearancesScreen from '@/app/student/clearances';
import StudentDashboardScreen from '@/app/student/dashboard';
import StudentSettingsScreen from '@/app/student/settings';

/**
 * Root Navigator Component
 * Conditionally renders screens based on authentication state and user role
 */
export const RootNavigator: React.FC = () => {
  const { user, isInitializing } = useAuth();
  const [loggedOutScreen, setLoggedOutScreen] = React.useState<'login' | 'forgot-password' | 'reset-password'>('login');
  const [params, setParams] = React.useState<any>(null);

  const navigation = {
    navigate: (name: string, p?: any) => {
      if (name === 'ForgotPassword') {
        setLoggedOutScreen('forgot-password');
      } else if (name === 'ResetPassword') {
        setLoggedOutScreen('reset-password');
      } else if (name === 'Login') {
        setLoggedOutScreen('login');
      }
      setParams(p);
    },
    goBack: () => setLoggedOutScreen('login'),
  };

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not logged in - show login or auth flow screens
  if (!user) {
    switch (loggedOutScreen) {
      case 'forgot-password':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'reset-password':
        return <ResetPasswordScreen route={{ params }} navigation={navigation} />;
      case 'login':
      default:
        return <LoginScreen navigation={navigation} />;
    }
  }

  // Admin screens
  if (user.role === 'admin') {
    return <AdminNavigator />;
  }

  // Staff screens
  if (user.role === 'staff') {
    return <StaffNavigator />;
  }

  // Student screens
  if (user.role === 'student') {
    return <StudentNavigator />;
  }

  return <LoginScreen navigation={navigation} />;
};

/**
 * Drawer Navigation Setup
 * Custom drawer for mobile-optimized navigation
 */
interface SidebarItem {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  badge?: number;
}

/**
 * Bottom Tab Bar for mobile navigation
 */
interface BottomTabBarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemPress: (key: string) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ items, activeItem, onItemPress }) => (
  <View style={styles.bottomTabBar}>
    {items.map((item) => {
      const isActive = activeItem === item.key;
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.bottomTabItem}
          onPress={() => onItemPress(item.key)}
          accessibilityRole="button"
        >
          <View style={[styles.bottomTabIconWrap, isActive && styles.bottomTabIconWrapActive]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={isActive ? '#ffffff' : '#94a3b8'}
            />
            {typeof item.badge === 'number' && item.badge > 0 ? (
              <View style={styles.bottomTabBadge}>
                <Text style={styles.bottomTabBadgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

interface AdminHeaderProps {
  adminName: string;
  isCompact: boolean;
  onBack: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminName, isCompact, onBack }) => (
  <View style={styles.adminHeader}>
    <View style={styles.adminBrandBlock}>
      <TouchableOpacity style={styles.adminBrandMark} onPress={onBack} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.adminBrandText}>ClearanceHub</Text>
    </View>

    <View style={styles.adminHeaderRight}>
      {!isCompact ? <Text style={styles.adminWelcome}>Welcome, {adminName}</Text> : null}
      <View style={styles.adminRoleBadge}>
        <Text style={styles.adminRoleBadgeText}>Administrator</Text>
      </View>
    </View>
  </View>
);

/**
 * Admin Navigator
 */
const AdminNavigator: React.FC = () => {
  const { user, logout } = useAuth();
  const { pendingStudents } = useApp();
  const [history, setHistory] = React.useState<string[]>(['dashboard']);
  const [params, setParams] = React.useState<any>(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isMobileDrawer = width < 760;

  const screen = history[history.length - 1];

  const navigation = {
    navigate: (name: string, p?: any) => {
      setHistory((prev) => [...prev, name]);
      setParams(p);
    },
    goBack: () =>
      setHistory((prev) => {
        if (prev.length > 1) return prev.slice(0, -1);
        if (prev[0] !== 'dashboard') return ['dashboard'];
        return prev;
      }),
  };

  // Android hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
        return true; // handled — do NOT exit
      }
      if (history[0] !== 'dashboard') {
        setHistory(['dashboard']);
        return true; // go to dashboard instead of exiting
      }
      return false; // at root — let OS handle (exits app)
    });
    return () => handler.remove();
  }, [history]);

  const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Home', icon: 'view-dashboard-outline' as const },
    { key: 'AdminStaffRoles', label: 'Roles', icon: 'shield-account-outline' as const },
    { key: 'AdminStudents', label: 'Students', icon: 'account-school-outline' as const },
    { key: 'AdminSettings', label: 'Settings', icon: 'cog-outline' as const },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <AdminDashboardScreen navigation={navigation} />;
      case 'AdminDepartments':
        return <AdminDepartmentsScreen navigation={navigation} />;
      case 'AdminStaffRoles':
        return <AdminStaffRolesScreen navigation={navigation} />;
      case 'AdminStaffAccounts':
        return <AdminStaffAccountsScreen navigation={navigation} />;
      case 'AdminClearances':
        return <AdminClearancesScreen navigation={navigation} />;
      case 'AdminPendingStudents':
        return <AdminPendingStudentsScreen navigation={navigation} />;
      case 'AdminStudents':
        return <AdminStudentsScreen navigation={navigation} />;
      case 'AdminSettings':
        return <AdminSettingsScreen navigation={navigation} />;
      default:
        return <AdminDashboardScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.adminShell}>
      <AdminHeader
        adminName={user?.name || 'Admin User'}
        isCompact={isCompact}
        onBack={navigation.goBack}
      />
      <View style={styles.adminBody}>
        {!isMobileDrawer && (
          <View style={[styles.adminSidebar, isCompact && styles.adminSidebarCompact]}>
            <View style={styles.adminNavGroup}>
              {sidebarItems.map((item) => (
                <AdminNavItem
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  isActive={screen === item.key}
                  isCompact={isCompact}
                  onPress={() => setHistory([item.key])}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.adminContent}>{renderScreen()}</View>
      </View>

      {isMobileDrawer && (
        <BottomTabBar
          items={sidebarItems}
          activeItem={screen}
          onItemPress={(key) => setHistory([key])}
        />
      )}
    </SafeAreaView>
  );
};

interface AdminNavItemProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  badge?: number;
  isActive: boolean;
  isCompact: boolean;
  onPress: () => void;
}

const AdminNavItem: React.FC<AdminNavItemProps> = ({ label, icon, badge, isActive, isCompact, onPress }) => (
  <TouchableOpacity
    style={[styles.adminNavItem, isActive && styles.adminNavItemActive, isCompact && styles.adminNavItemCompact]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <MaterialCommunityIcons name={icon} size={20} color={isActive ? '#ffffff' : '#cbd5e1'} />
    {!isCompact ? (
      <Text style={[styles.adminNavText, isActive && styles.adminNavTextActive]}>{label}</Text>
    ) : null}
    {typeof badge === 'number' ? (
      <View style={[styles.adminNavBadge, badge > 0 && styles.adminNavBadgeAlert]}>
        <Text style={[styles.adminNavBadgeText, badge > 0 && styles.adminNavBadgeAlertText]}>{badge}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

/**
 * Staff Navigator
 */
const StaffNavigator: React.FC = () => {
  const { user, logout } = useAuth();
  const [history, setHistory] = React.useState<string[]>(['dashboard']);
  const [params, setParams] = React.useState<any>(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isMobileDrawer = width < 600;

  const screen = history[history.length - 1];

  const navigation = {
    navigate: (name: string, p?: any) => {
      setHistory((prev) => [...prev, name]);
      setParams(p);
    },
    goBack: () =>
      setHistory((prev) => {
        if (prev.length > 1) return prev.slice(0, -1);
        if (prev[0] !== 'dashboard') return ['dashboard'];
        return prev;
      }),
  };

  // Android hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
        return true;
      }
      if (history[0] !== 'dashboard') {
        setHistory(['dashboard']);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [history]);

  const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Home', icon: 'view-dashboard-outline' as const },
    { key: 'StaffClearances', label: 'Student Clearances', icon: 'clipboard-check-outline' as const },
    { key: 'StaffSettings', label: 'Settings', icon: 'cog-outline' as const },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <StaffDashboardScreen navigation={navigation} />;
      case 'StaffClearances':
        return <StaffClearancesScreen navigation={navigation} />;
      case 'StaffSettings':
        return <StaffSettingsScreen navigation={navigation} />;
      case 'StaffApprove':
        return <StaffApproveScreen route={{ params }} navigation={navigation} />;
      case 'StaffReject':
        return <StaffRejectScreen route={{ params }} navigation={navigation} />;
      default:
        return <StaffDashboardScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.adminShell}>
      <StaffHeader
        staffName={user?.name || 'Staff Member'}
        isCompact={isCompact}
        onBack={navigation.goBack}
      />
      <View style={styles.adminBody}>
        {!isMobileDrawer && (
          <View style={[styles.adminSidebar, isCompact && styles.adminSidebarCompact]}>
            <View style={styles.adminNavGroup}>
              {sidebarItems.map((item) => (
                <AdminNavItem
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  isActive={screen === item.key}
                  isCompact={isCompact}
                  onPress={() => setHistory([item.key])}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.adminContent}>{renderScreen()}</View>
      </View>

      {isMobileDrawer && (
        <BottomTabBar
          items={sidebarItems}
          activeItem={screen}
          onItemPress={(key) => setHistory([key])}
        />
      )}
    </SafeAreaView>
  );
};

interface StaffHeaderProps {
  staffName: string;
  isCompact: boolean;
  onBack: () => void;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({ staffName, isCompact, onBack }) => (
  <View style={styles.adminHeader}>
    <View style={styles.adminBrandBlock}>
      <TouchableOpacity style={styles.adminBrandMark} onPress={onBack} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.adminBrandText}>ClearanceHub</Text>
    </View>

    <View style={styles.adminHeaderRight}>
      {!isCompact ? <Text style={styles.adminWelcome}>Welcome, {staffName}</Text> : null}
      <View style={styles.adminRoleBadge}>
        <Text style={styles.adminRoleBadgeText}>Staff</Text>
      </View>
    </View>
  </View>
);

/**
 * Student Navigator
 */
const StudentNavigator: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = React.useState<string[]>(['dashboard']);
  const [params, setParams] = React.useState<any>(null);
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isMobileDrawer = width < 760;

  const screen = history[history.length - 1];

  const navigation = {
    navigate: (name: string, p?: any) => {
      setHistory((prev) => [...prev, name]);
      setParams(p);
    },
    goBack: () =>
      setHistory((prev) => {
        if (prev.length > 1) return prev.slice(0, -1);
        if (prev[0] !== 'dashboard') return ['dashboard'];
        return prev;
      }),
  };

  // Android hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
        return true;
      }
      if (history[0] !== 'dashboard') {
        setHistory(['dashboard']);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [history]);

  const sidebarItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Home', icon: 'view-dashboard-outline' as const },
    { key: 'StudentClearances', label: 'My Clearances', icon: 'clipboard-check-outline' as const },
    { key: 'StudentSettings', label: 'Settings', icon: 'cog-outline' as const },
  ];

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <StudentDashboardScreen navigation={navigation} />;
      case 'StudentClearances':
        return <StudentClearancesScreen navigation={navigation} />;
      case 'StudentSettings':
        return <StudentSettingsScreen navigation={navigation} />;
      case 'StudentClearanceDetail':
        return <ClearanceDetailScreen route={{ params }} navigation={navigation} />;
      default:
        return <StudentDashboardScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.adminShell}>
      <StudentHeader
        studentName={user?.name || 'Student'}
        isCompact={isCompact}
        onBack={navigation.goBack}
      />
      <View style={styles.adminBody}>
        {!isMobileDrawer && (
          <View style={[styles.adminSidebar, isCompact && styles.adminSidebarCompact]}>
            <View style={styles.adminNavGroup}>
              {sidebarItems.map((item) => (
                <AdminNavItem
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  isActive={screen === item.key}
                  isCompact={isCompact}
                  onPress={() => setHistory([item.key])}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.adminContent}>{renderScreen()}</View>
      </View>

      {isMobileDrawer && (
        <BottomTabBar
          items={sidebarItems}
          activeItem={screen}
          onItemPress={(key) => setHistory([key])}
        />
      )}
    </SafeAreaView>
  );
};

interface StudentHeaderProps {
  studentName: string;
  isCompact: boolean;
  onBack: () => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentName, isCompact, onBack }) => (
  <View style={styles.adminHeader}>
    <View style={styles.adminBrandBlock}>
      <TouchableOpacity style={styles.adminBrandMark} onPress={onBack} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.adminBrandText}>ClearanceHub</Text>
    </View>

    <View style={styles.adminHeaderRight}>
      {!isCompact ? <Text style={styles.adminWelcome}>Welcome, {studentName}</Text> : null}
      <View style={styles.adminRoleBadge}>
        <Text style={styles.adminRoleBadgeText}>Student</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  adminShell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  adminHeader: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingBottom: 26,
    paddingTop: 48,
    backgroundColor: '#082052',
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  adminBrandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  adminBrandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBrandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  adminHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flex: 1,
  },
  adminWelcome: {
    fontSize: 13,
    color: '#D0E4EF',
    fontWeight: '600',
  },
  adminRoleBadge: {
    backgroundColor: '#3E6985',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminRoleBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  adminLogoutButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminLogoutText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  adminBody: {
    flex: 1,
    flexDirection: 'row',
  },
  adminSidebar: {
    width: 248,
    backgroundColor: '#082052',
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  adminSidebarCompact: {
    width: 76,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2D9C9',
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#082052',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  bottomTabIconWrap: {
    width: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bottomTabIconWrapActive: {
    backgroundColor: '#082052',
    borderRadius: 12,
  },
  bottomTabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bottomTabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5C6B7A',
  },
  bottomTabLabelActive: {
    color: '#082052',
    fontWeight: '800',
  },
  adminContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  adminNavGroup: {
    marginBottom: 22,
    width: '100%',
  },
  adminNavGroupTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  adminNavItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  adminNavItemActive: {
    backgroundColor: '#3E6985',
  },
  adminNavItemCompact: {
    width: 48,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  adminNavText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  adminNavTextActive: {
    color: '#ffffff',
  },
  adminNavBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 6,
  },
  adminNavBadgeAlert: {
    backgroundColor: '#f97316',
  },
  adminNavBadgeText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  adminNavBadgeAlertText: {
    color: '#ffffff',
  },
});
