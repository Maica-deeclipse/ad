/**
 * App Context
 * Manages all app data: clearances, staff roles, and student submissions
 */

import { apiService } from '@/services/api';
import { AppContextType, Clearance, Department, StaffRole, StudentClearance, StudentRegistration, User } from '@/types';
import { db, getNamedFirebaseApp } from '@/utils/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    setDoc,
    where,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, getAuth, signOut } from 'firebase/auth';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export const AppContext = createContext<AppContextType>({
  users: [],
  clearances: [],
  departments: [],
  staffRoles: [],
  pendingStudents: [],
  studentClearances: [],
  approvePendingStudent: async () => {},
  rejectPendingStudent: async () => {},
  updateStudentDepartment: async () => {},
  createStaffAccount: async () => {},
  createDepartment: () => {},
  updateDepartment: () => {},
  archiveDepartment: () => {},
  restoreDepartment: () => {},
  deleteDepartment: () => {},
  createStaffRole: () => {},
  updateStaffRole: () => {},
  archiveStaffRole: () => {},
  restoreStaffRole: () => {},
  deleteStaffRole: () => {},
  createClearance: () => {},
  updateClearance: () => {},
  archiveClearance: () => {},
  restoreClearance: () => {},
  deleteClearance: () => {},
  archiveStudent: async () => {},
  restoreStudent: async () => {},
  deleteStudent: async () => {},
  submitStudentClearance: () => {},
  approveClearance: () => {},
  rejectClearance: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [pendingStudents, setPendingStudents] = useState<StudentRegistration[]>([]);
  const [studentClearances, setStudentClearances] = useState<StudentClearance[]>([]);

  const createAssignedStudentClearances = useCallback(
    async (clearanceId: string, clearance: Clearance, targetStudentId?: string, targetStudent?: User) => {
      const candidateStudents = targetStudent ? [{ ...targetStudent, id: targetStudentId || targetStudent.id }] : users;
      const eligibleStudents = candidateStudents.filter((currentUser) => {
        if (currentUser.role !== 'student' || !currentUser.department) return false;
        if (targetStudentId && currentUser.id !== targetStudentId) return false;
        return clearance.departmentsAllowed.includes(currentUser.department);
      });

      if (eligibleStudents.length === 0) return;

      const existingSnapshot = await getDocs(
        query(collection(db, 'studentClearances'), where('clearanceId', '==', clearanceId))
      );
      const existingStudentIds = new Set(
        existingSnapshot.docs.map((studentClearanceDoc) => {
          const data = studentClearanceDoc.data() as StudentClearance;
          return data.studentId;
        })
      );
      const now = new Date().toISOString();

      await Promise.all(
        eligibleStudents
          .filter((student) => !existingStudentIds.has(student.id))
          .map((student) =>
            addDoc(collection(db, 'studentClearances'), {
              studentId: student.id,
              clearanceId,
              clearance,
              status: 'pending' as const,
              submittedAt: now,
            })
          )
      );
    },
    [users]
  );

  const syncAssignedStudentClearances = useCallback(
    async (clearanceId: string, clearance: Clearance) => {
      await createAssignedStudentClearances(clearanceId, clearance);

      const existingSnapshot = await getDocs(
        query(collection(db, 'studentClearances'), where('clearanceId', '==', clearanceId))
      );

      await Promise.all(
        existingSnapshot.docs.map((studentClearanceDoc) =>
          updateDoc(doc(db, 'studentClearances', studentClearanceDoc.id), {
            clearance,
          })
        )
      );
    },
    [createAssignedStudentClearances]
  );

  // Real-time listeners
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });

    const unsubClearances = onSnapshot(collection(db, 'clearances'), (snapshot) => {
      setClearances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clearance)));
    });

    const unsubDepartments = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });

    const unsubStaffRoles = onSnapshot(collection(db, 'staffRoles'), (snapshot) => {
      setStaffRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffRole)));
    });

    const unsubPendingStudents = onSnapshot(collection(db, 'pendingStudents'), (snapshot) => {
      setPendingStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentRegistration)));
    });

    const unsubStudentClearances = onSnapshot(collection(db, 'studentClearances'), (snapshot) => {
      setStudentClearances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentClearance)));
    });

    return () => {
      unsubUsers();
      unsubClearances();
      unsubDepartments();
      unsubStaffRoles();
      unsubPendingStudents();
      unsubStudentClearances();
    };
  }, []);

  // Department Management
  const createDepartment = useCallback(async (name: string, description: string) => {
    try {
      await addDoc(collection(db, 'departments'), {
        name,
        description,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  }, []);

  const updateDepartment = useCallback(async (id: string, name: string, description: string) => {
    try {
      await updateDoc(doc(db, 'departments', id), {
        name,
        description,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  }, []);

  const archiveDepartment = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'departments', id), {
        status: 'archived' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error archiving department:", error);
      throw error;
    }
  }, []);

  const restoreDepartment = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'departments', id), {
        status: 'active' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error restoring department:", error);
      throw error;
    }
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  }, []);

  // Staff Role Management
  const createStaffRole = useCallback(async (name: string, description: string) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'staffRoles'), {
        name,
        description,
        status: 'active' as const,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error creating staff role:", error);
      throw error;
    }
  }, []);

  const updateStaffRole = useCallback(async (id: string, name: string, description: string) => {
    try {
      await updateDoc(doc(db, 'staffRoles', id), {
        name,
        description,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating staff role:", error);
      throw error;
    }
  }, []);

  const archiveStaffRole = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'staffRoles', id), {
        status: 'archived' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error archiving staff role:", error);
      throw error;
    }
  }, []);

  const restoreStaffRole = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'staffRoles', id), {
        status: 'active' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error restoring staff role:", error);
      throw error;
    }
  }, []);

  const deleteStaffRole = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staffRoles', id));
    } catch (error) {
      console.error("Error deleting staff role:", error);
      throw error;
    }
  }, []);

  // Clearance Management
  const createClearance = useCallback(
    async (
      name: string,
      description: string,
      staffRole: string,
      departmentsAllowed: string[]
    ) => {
      try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'clearances'), {
          name,
          description,
          status: 'active' as const,
          staffRole,
          departmentsAllowed,
          createdAt: now,
          updatedAt: now,
        });
        await createAssignedStudentClearances(docRef.id, {
          id: docRef.id,
          name,
          description,
          status: 'active' as const,
          staffRole,
          departmentsAllowed,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        console.error("Error creating clearance:", error);
        throw error;
      }
    },
    [createAssignedStudentClearances]
  );

  const updateClearance = useCallback(
    async (id: string, name: string, description: string, staffRole: string, departmentsAllowed: string[]) => {
      try {
        const now = new Date().toISOString();
        const updatedClearance = {
          id,
          name,
          description,
          status: clearances.find((clearance) => clearance.id === id)?.status || 'active',
          staffRole,
          departmentsAllowed,
          createdAt: clearances.find((clearance) => clearance.id === id)?.createdAt || now,
          updatedAt: now,
        };

        await updateDoc(doc(db, 'clearances', id), {
          name,
          description,
          status: updatedClearance.status,
          staffRole,
          departmentsAllowed,
          updatedAt: now,
        });
        await syncAssignedStudentClearances(id, updatedClearance);
      } catch (error) {
        console.error("Error updating clearance:", error);
        throw error;
      }
    },
    [clearances, syncAssignedStudentClearances]
  );

  const deleteClearance = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clearances', id));
    } catch (error) {
      console.error("Error deleting clearance:", error);
      throw error;
    }
  }, []);

  const archiveClearance = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'clearances', id), {
        status: 'archived' as const,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error archiving clearance:", error);
      throw error;
    }
  }, []);

  const restoreClearance = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'clearances', id), {
        status: 'active' as const,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error restoring clearance:", error);
      throw error;
    }
  }, []);

  // Student Clearance Management
  const submitStudentClearance = useCallback(async (studentId: string, clearanceId: string) => {
    const clearance = clearances.find(c => c.id === clearanceId);
    if (!clearance) return;

    await addDoc(collection(db, 'studentClearances'), {
      studentId,
      clearanceId,
      clearance,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    });
  }, [clearances]);

  const approveClearance = useCallback(
    async (studentClearanceId: string, staffId: string, remarks?: string) => {
      const sc = studentClearances.find(s => s.id === studentClearanceId);
      if (!sc) return;

      const now = new Date().toISOString();

      await updateDoc(doc(db, 'studentClearances', studentClearanceId), {
        status: 'approved' as const,
        remarks: remarks || '',
        approvedBy: staffId,
        approvedAt: now,
        completedAt: now,
      });
    },
    [studentClearances]
  );

  const rejectClearance = useCallback(
    async (studentClearanceId: string, staffId: string, remarks: string) => {
      const sc = studentClearances.find(s => s.id === studentClearanceId);
      if (!sc) return;

      await updateDoc(doc(db, 'studentClearances', studentClearanceId), {
        status: 'rejected' as const,
        remarks,
        approvedBy: staffId,
        approvedAt: new Date().toISOString(),
      });
    },
    [studentClearances]
  );

  // Pending Student Management
  const approvePendingStudent = useCallback(async (registrationId: string) => {
    try {
      const registration = pendingStudents.find(p => p.id === registrationId);
      if (!registration) throw new Error('Registration not found');
      if (!registration.authUid) throw new Error('Registration is missing the student auth account reference');
      if (!registration.department) throw new Error('Registration is missing the selected department');

      const now = new Date().toISOString();

      const existingUserDocs = await getDocs(
        query(collection(db, 'users'), where('email', '==', registration.email))
      );
      const conflictingUser = existingUserDocs.docs.find((userDoc) => userDoc.id !== registration.authUid);
      if (conflictingUser) {
        throw new Error('A different user account already uses this email.');
      }

      const userData: Omit<User, 'id'> = {
        name: registration.name,
        email: registration.email,
        role: 'student' as const,
        status: 'active' as const,
        department: registration.department,
        phone: registration.phone || '',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', registration.authUid), userData, { merge: true });

      await Promise.all(
        clearances
          .filter((clearance) => clearance.departmentsAllowed.includes(registration.department || ''))
          .map((clearance) =>
            createAssignedStudentClearances(clearance.id, clearance, registration.authUid, {
              id: registration.authUid,
              ...userData,
            })
          )
      );

      await updateDoc(doc(db, 'pendingStudents', registrationId), {
        status: 'approved' as const,
        approvedAt: now,
        approvedBy: 'admin', // Could be improved to track which admin approved
        rejectionReason: '',
      });

      try {
        await apiService.sendStudentApprovalEmail({
          student_name: registration.name,
          student_email: registration.email,
          department: registration.department,
        });
      } catch (emailError) {
        console.error('Approval email failed:', emailError);
      }
    } catch (error) {
      console.error("Error approving pending student:", error);
      throw error;
    }
  }, [clearances, createAssignedStudentClearances, pendingStudents]);

  const rejectPendingStudent = useCallback(async (registrationId: string, reason: string) => {
    try {
      const registration = pendingStudents.find(p => p.id === registrationId);
      if (!registration) throw new Error('Registration not found');

      await updateDoc(doc(db, 'pendingStudents', registrationId), {
        status: 'rejected' as const,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });

      try {
        await apiService.sendStudentRejectionEmail({
          student_name: registration.name,
          student_email: registration.email,
          department: registration.department || 'Not specified',
          rejection_reason: reason,
        });
      } catch (emailError) {
        console.error('Rejection email failed:', emailError);
      }
    } catch (error) {
      console.error("Error rejecting pending student:", error);
      throw error;
    }
  }, [pendingStudents]);

  const updateStudentDepartment = useCallback(async (studentId: string, department: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        department,
        updatedAt: new Date().toISOString(),
      });

      await Promise.all(
        clearances
          .filter((clearance) => clearance.departmentsAllowed.includes(department))
          .map((clearance) =>
            createAssignedStudentClearances(clearance.id, clearance, studentId, {
              ...(users.find((currentUser) => currentUser.id === studentId) || {
                id: studentId,
                name: '',
                email: '',
                role: 'student' as const,
              }),
              department,
              role: 'student' as const,
            })
          )
      );
    } catch (error) {
      console.error("Error updating student department:", error);
      throw error;
    }
  }, [clearances, createAssignedStudentClearances, users]);

  const createStaffAccount = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
    staffRole: string;
    phone?: string;
  }) => {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    const staffRole = data.staffRole.trim();
    const phone = data.phone?.trim() || '';

    if (!name || !email || !password || !staffRole) {
      throw new Error('Name, email, password, and staff role are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const signInMethods = await fetchSignInMethodsForEmail(getAuth(), email);
    if (signInMethods.length > 0) {
      throw new Error('An account with this email already exists.');
    }

    const duplicateUsers = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    if (!duplicateUsers.empty) {
      throw new Error('A user record with this email already exists.');
    }

    const secondaryApp = getNamedFirebaseApp('staff-account-creator');
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const now = new Date().toISOString();

    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        name,
        email,
        role: 'staff' as const,
        status: 'active' as const,
        staffRole,
        phone,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error creating staff account document:", error);
      throw error;
    } finally {
      await signOut(secondaryAuth);
    }
  }, []);

  const archiveStudent = useCallback(async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        status: 'archived' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error archiving student:", error);
      throw error;
    }
  }, []);

  const restoreStudent = useCallback(async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        status: 'active' as const,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error restoring student:", error);
      throw error;
    }
  }, []);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      const studentClearanceSnapshot = await getDocs(
        query(collection(db, 'studentClearances'), where('studentId', '==', studentId))
      );

      await Promise.all(studentClearanceSnapshot.docs.map((studentClearanceDoc) => deleteDoc(studentClearanceDoc.ref)));
      await deleteDoc(doc(db, 'users', studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        users,
        clearances,
        departments,
        staffRoles,
        pendingStudents,
        studentClearances,
        approvePendingStudent,
        rejectPendingStudent,
        updateStudentDepartment,
        createStaffAccount,
        createDepartment,
        updateDepartment,
        archiveDepartment,
        restoreDepartment,
        deleteDepartment,
        createStaffRole,
        updateStaffRole,
        archiveStaffRole,
        restoreStaffRole,
        deleteStaffRole,
        createClearance,
        updateClearance,
        archiveClearance,
        restoreClearance,
        deleteClearance,
        archiveStudent,
        restoreStudent,
        deleteStudent,
        submitStudentClearance,
        approveClearance,
        rejectClearance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
