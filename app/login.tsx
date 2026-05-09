/**
 * Login Screen
 * Allows users to authenticate with email and password
 * Students can also register for a new account (requires admin approval)
 */

import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
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

interface LoginScreenProps {
  navigation?: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, registerStudent, isLoading } = useAuth();
  const { departments } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{email?: string; password?: string}>({});

  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regErrors, setRegErrors] = useState<{
    email?: string;
    name?: string;
    password?: string;
    confirmPassword?: string;
    department?: string;
  }>({});

  const activeDepartments = departments.filter((department) => department.status === 'active');

  const handleWebSubmitKey = (callback: () => void) => (event: any) => {
    if (event?.nativeEvent?.key === 'Enter' || event?.key === 'Enter') {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      callback();
    }
  };

  const showMessage = (title: string, message: string) => {
    setNotice({
      type: title.toLowerCase().includes('failed') || title.toLowerCase().includes('error') ? 'error' : 'success',
      title,
      message,
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return;
    }

    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    setNotice(null);
    const newErrors: {email?: string; password?: string} = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setLoginErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await login(email, password);
    } catch (error: any) {
      if (error?.message === 'Incorrect email or password.') {
        setLoginErrors({
          email: 'Incorrect email or password',
          password: 'Incorrect email or password',
        });
      }
      showMessage('Login Failed', error?.message || 'Invalid credentials');
    }
  };

  const handleRegister = async () => {
    setNotice(null);
    const newErrors: {
      email?: string;
      name?: string;
      password?: string;
      confirmPassword?: string;
      department?: string;
    } = {};

    if (!regEmail.trim()) newErrors.email = 'Email is required';
    else if (!regEmail.includes('@')) newErrors.email = 'Please enter a valid email';
    
    if (!regName.trim()) newErrors.name = 'Name is required';
    if (!regDepartment) newErrors.department = 'Department is required';
    
    if (!regPassword.trim()) newErrors.password = 'Password is required';
    else if (regPassword.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (regPassword !== regConfirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setRegErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await registerStudent(regEmail, regName, regPassword, regDepartment, regPhone || undefined);
      showMessage(
        'Registration Successful',
        'Your registration has been submitted. Please wait for admin approval before you can log in.'
      );
      // Clear form
      setRegEmail('');
      setRegName('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegPhone('');
      setRegDepartment('');
      setActiveTab('login');
    } catch (error: any) {
      if ((error?.message || '').toLowerCase().includes('email')) {
        setRegErrors((prev) => ({
          ...prev,
          email: error.message,
        }));
      }
      showMessage('Registration Failed', error?.message || 'Please try again');
    }
  };

  const handleForgotPassword = () => {
    navigation?.navigate('ForgotPassword', { email });
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
        <Text style={styles.title}>University Clearance System</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => setActiveTab('login')}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => setActiveTab('register')}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Register</Text>
        </TouchableOpacity>
      </View>

      {notice ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.noticeBox,
            notice.type === 'error' ? styles.noticeError : styles.noticeSuccess,
          ]}
        >
          <Text style={styles.noticeTitle}>{notice.title}</Text>
          <Text style={styles.noticeText}>{notice.message}</Text>
        </View>
      ) : null}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Welcome Back</Text>
            <Text style={styles.infoText}>
              Please log in with your credentials.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(val) => { setEmail(val); setLoginErrors(prev => ({ ...prev, email: undefined })); }}
              keyboardType="email-address"
              editable={!isLoading}
              error={loginErrors.email}
              onKeyPress={handleWebSubmitKey(handleLogin)}
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(val) => { setPassword(val); setLoginErrors(prev => ({ ...prev, password: undefined })); }}
              secureTextEntry
              editable={!isLoading}
              error={loginErrors.password}
              onSubmitEditing={handleLogin}
              onKeyPress={handleWebSubmitKey(handleLogin)}
            />

            <TouchableOpacity 
              onPress={handleForgotPassword} 
              style={styles.forgotPasswordContainer}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            />
          </View>
        </>
      )}

      {/* Register Tab */}
      {activeTab === 'register' && (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Student Registration</Text>
            <Text style={styles.infoText}>
              Create an account to apply for clearances. Your registration must be approved by an administrator.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={regName}
              onChangeText={(val) => { setRegName(val); setRegErrors(prev => ({ ...prev, name: undefined })); }}
              editable={!isLoading}
              error={regErrors.name}
            />

            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={regEmail}
              onChangeText={(val) => { setRegEmail(val); setRegErrors(prev => ({ ...prev, email: undefined })); }}
              keyboardType="email-address"
              editable={!isLoading}
              error={regErrors.email}
              onKeyPress={handleWebSubmitKey(handleRegister)}
            />

            <TextInput
              label="Phone Number (Optional)"
              placeholder="Enter your phone number"
              value={regPhone}
              onChangeText={setRegPhone}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            <Text style={styles.fieldLabel}>Department</Text>
            <View style={styles.selectionGrid}>
              {activeDepartments.length === 0 ? (
                <View style={styles.selectionEmptyState}>
                  <Text style={styles.selectionEmptyText}>No active departments available</Text>
                </View>
              ) : (
                activeDepartments.map((department) => (
                  <TouchableOpacity
                    key={department.id}
                    style={[
                      styles.selectionOption,
                      regDepartment === department.id && styles.selectionOptionSelected,
                    ]}
                    onPress={() => {
                      setRegDepartment(department.id);
                      setRegErrors((prev) => ({ ...prev, department: undefined }));
                    }}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.selectionOptionText,
                        regDepartment === department.id && styles.selectionOptionTextSelected,
                      ]}
                    >
                      {department.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            {regErrors.department ? <Text style={styles.fieldErrorText}>{regErrors.department}</Text> : null}

            <TextInput
              label="Password"
              placeholder="Create a password (min 6 characters)"
              value={regPassword}
              onChangeText={(val) => { setRegPassword(val); setRegErrors(prev => ({ ...prev, password: undefined })); }}
              secureTextEntry
              editable={!isLoading}
              error={regErrors.password}
            />

            <TextInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={regConfirmPassword}
              onChangeText={(val) => { setRegConfirmPassword(val); setRegErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
              secureTextEntry
              editable={!isLoading}
              error={regErrors.confirmPassword}
              onSubmitEditing={handleRegister}
              onKeyPress={handleWebSubmitKey(handleRegister)}
            />

            <Button
              title={isLoading ? 'Registering...' : 'Register'}
              onPress={handleRegister}
              disabled={isLoading}
              variant="primary"
              style={styles.registerButton}
            />

            <Text style={styles.disclaimerText}>
              By registering, you agree to our terms. Your account will be activated after admin review.
            </Text>
          </View>
        </>
      )}

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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.textInverse,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noticeBox: {
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
  },
  noticeError: {
    backgroundColor: Colors.rejected + '12',
    borderLeftColor: Colors.rejected,
  },
  noticeSuccess: {
    backgroundColor: Colors.approved + '12',
    borderLeftColor: Colors.approved,
  },
  noticeTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  noticeText: {
    ...Typography.body,
    color: Colors.text,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textLight,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  registerButton: {
    marginTop: Spacing.md,
  },
  fieldLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectionGrid: {
    marginBottom: Spacing.sm,
  },
  selectionOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectionOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectionOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  selectionOptionTextSelected: {
    color: Colors.textInverse,
  },
  selectionEmptyState: {
    paddingVertical: Spacing.md,
  },
  selectionEmptyText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  fieldErrorText: {
    ...Typography.caption,
    color: Colors.rejected,
    marginBottom: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default LoginScreen;
