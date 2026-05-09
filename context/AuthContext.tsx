/**
 * Authentication Context
 * Manages user login/logout and authentication state
 */

import { AuthContextType, User } from '@/types';
import { auth, db } from '@/utils/firebase';
import {
    confirmPasswordReset,
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    fetchSignInMethodsForEmail,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateEmail,
    updatePassword
} from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import React, { createContext, useCallback, useEffect, useState } from 'react';

const getAuthErrorMessage = (error: any, fallbackMessage: string) => {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    default:
      return error?.message || fallbackMessage;
  }
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isInitializing: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  registerStudent: async () => {},
  updateAccountSettings: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              id: firebaseUser.uid,
              ...userDoc.data() as Omit<User, 'id'>
            });
          } else {
            console.warn('User document not found in Firestore');
            
            // AUTO-FIX for user: If this is admin@admin.com, create the document
            if (firebaseUser.email === 'admin@admin.com') {
              console.log('Auto-creating admin document...');
              const adminData = {
                name: 'Admin User',
                email: 'admin@admin.com',
                role: 'admin' as const,
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), adminData);
              setUser({
                id: firebaseUser.uid,
                ...adminData
              });
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

      if (!userDoc.exists()) {
        const pendingQuery = query(
          collection(db, 'pendingStudents'),
          where('authUid', '==', credential.user.uid)
        );
        const pendingSnapshot = await getDocs(pendingQuery);

        if (!pendingSnapshot.empty) {
          const registration = pendingSnapshot.docs[0].data();
          await signOut(auth);

          if (registration.status === 'pending') {
            throw new Error('Your student registration is still pending admin approval.');
          }

          if (registration.status === 'rejected') {
            const reason = registration.rejectionReason
              ? ` Reason: ${registration.rejectionReason}`
              : '';
            throw new Error(`Your student registration was rejected.${reason}`);
          }
        }

        await signOut(auth);
        throw new Error('Your account is not active yet. Please contact an administrator.');
      }

      const currentUserData = userDoc.data() as User;
      if ((currentUserData.status || 'active') === 'archived') {
        await signOut(auth);
        throw new Error('This account has been archived. Please contact an administrator.');
      }
    } catch (error: any) {
      const message = getAuthErrorMessage(error, 'Unable to sign in right now.');
      console.error('Login error:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error('Email address is required.');
      }

      await sendPasswordResetEmail(auth, normalizedEmail);
    } catch (error: any) {
      console.error('Forgot password error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, token.trim(), newPassword);
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  const registerStudent = useCallback(async (email: string, name: string, password: string, department: string, phone?: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();
      const normalizedPhone = phone?.trim() || '';
      const normalizedDepartment = department.trim();

      if (!normalizedDepartment) {
        throw new Error('Please select a department.');
      }

      const existingMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (existingMethods.length > 0) {
        throw new Error('An account with this email already exists.');
      }

      const duplicatePendingQuery = query(
        collection(db, 'pendingStudents'),
        where('email', '==', normalizedEmail)
      );
      const duplicatePendingSnapshot = await getDocs(duplicatePendingQuery);
      const duplicatePending = duplicatePendingSnapshot.docs.find(
        (pendingDoc) => pendingDoc.data().status !== 'rejected'
      );

      if (duplicatePending) {
        const status = duplicatePending.data().status;
        if (status === 'pending') {
          throw new Error('A registration with this email is already waiting for approval.');
        }

        throw new Error('This student account has already been approved.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      await addDoc(collection(db, 'pendingStudents'), {
        authUid: userCredential.user.uid,
        email: normalizedEmail,
        name: normalizedName,
        phone: normalizedPhone,
        department: normalizedDepartment,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      });

      await signOut(auth);
    } catch (error: any) {
      const message = getAuthErrorMessage(error, 'Unable to submit registration right now.');
      console.error('Registration error:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAccountSettings = useCallback(async (data: {
    name: string;
    email: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    if (!auth.currentUser || !user) {
      throw new Error('You must be logged in to update your account.');
    }

    setIsLoading(true);
    try {
      const nextName = data.name.trim();
      const nextEmail = data.email.trim().toLowerCase();
      const nextPhone = data.phone?.trim() || '';
      const nextPassword = data.newPassword?.trim() || '';
      const currentPassword = data.currentPassword?.trim() || '';
      const emailChanged = nextEmail !== user.email;
      const passwordChanged = nextPassword.length > 0;

      if (!nextName) {
        throw new Error('Name is required.');
      }

      if (!nextEmail.includes('@')) {
        throw new Error('Please enter a valid email.');
      }

      if (passwordChanged && nextPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }

      if ((emailChanged || passwordChanged) && !currentPassword) {
        throw new Error('Current password is required to change your email or password.');
      }

      if (emailChanged || passwordChanged) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email || user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      if (emailChanged) {
        const methods = await fetchSignInMethodsForEmail(auth, nextEmail);
        const emailInUseByAnotherAccount =
          methods.length > 0 && nextEmail !== (auth.currentUser.email || '').toLowerCase();
        if (emailInUseByAnotherAccount) {
          throw new Error('Another account already uses that email.');
        }
        await updateEmail(auth.currentUser, nextEmail);
      }

      if (passwordChanged) {
        await updatePassword(auth.currentUser, nextPassword);
      }

      const updatedUser: User = {
        ...user,
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'users', user.id), {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        updatedAt: updatedUser.updatedAt,
      });

      setUser(updatedUser);
    } catch (error: any) {
      console.error('Update account settings error:', error.message);
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Current password is incorrect.');
      }
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Please log out and log back in, then try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        login,
        logout,
        setUser: updateUser,
        forgotPassword,
        resetPassword,
        registerStudent,
        updateAccountSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
