/**
 * Type definitions for the University Clearance System
 */

export type UserRole = 'admin' | 'staff' | 'student';
export type ClearanceStatus = 'pending' | 'approved' | 'rejected';
export type DepartmentStatus = 'active' | 'archived';
export type EntityStatus = 'active' | 'archived';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: EntityStatus;
  department?: string; // For students
  staffRole?: string; // For staff (e.g., "IT Office", "Registrar")
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  status: DepartmentStatus; // active or archived
  createdAt: string;
  updatedAt: string;
}

export interface Clearance {
  id: string;
  name: string;
  description: string;
  status?: EntityStatus;
  staffRole: string; // The single staff role that approves this clearance
  departmentsAllowed: string[]; // IDs of departments that require this clearance
  createdAt: string;
  updatedAt: string;
}

export interface StudentClearance {
  id: string;
  studentId: string;
  clearanceId: string;
  clearance: Clearance;
  status: ClearanceStatus;
  remarks?: string;
  approvedBy?: string; // ID of staff member who approved/rejected
  approvedAt?: string; // ISO date string
  submittedAt: string;
  completedAt?: string;
}

export interface StaffRole {
  id: string;
  name: string;
  description: string;
  status?: EntityStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentRegistration {
  id: string;
  authUid: string;
  email: string;
  name: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  department?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  registerStudent: (email: string, name: string, password: string, department: string, phone?: string) => Promise<void>;
  updateAccountSettings: (data: {
    name: string;
    email: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
}

export interface AppContextType {
  users: User[];
  clearances: Clearance[];
  departments: Department[];
  staffRoles: StaffRole[];
  pendingStudents: StudentRegistration[];
  studentClearances: StudentClearance[];
  
  // Pending student management (Admin)
  approvePendingStudent: (registrationId: string) => Promise<void>;
  rejectPendingStudent: (registrationId: string, reason: string) => Promise<void>;
  updateStudentDepartment: (studentId: string, department: string) => Promise<void>;
  createStaffAccount: (data: {
    name: string;
    email: string;
    password: string;
    staffRole: string;
    phone?: string;
  }) => Promise<void>;
  
  // Department management (Admin)
  createDepartment: (name: string, description: string) => void;
  updateDepartment: (id: string, name: string, description: string) => void;
  archiveDepartment: (id: string) => void;
  restoreDepartment: (id: string) => void;
  deleteDepartment: (id: string) => void;
  
  // Staff role management (Admin)
  createStaffRole: (name: string, description: string) => void;
  updateStaffRole: (id: string, name: string, description: string) => void;
  archiveStaffRole: (id: string) => void;
  restoreStaffRole: (id: string) => void;
  deleteStaffRole: (id: string) => void;
  
  // Clearance management (Admin)
  createClearance: (name: string, description: string, staffRole: string, departmentsAllowed: string[]) => void;
  updateClearance: (id: string, name: string, description: string, staffRole: string, departmentsAllowed: string[]) => void;
  archiveClearance: (id: string) => void;
  restoreClearance: (id: string) => void;
  deleteClearance: (id: string) => void;

  // Student management (Admin)
  archiveStudent: (studentId: string) => Promise<void>;
  restoreStudent: (studentId: string) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  
  // Student clearance management
  submitStudentClearance: (studentId: string, clearanceId: string) => void;
  approveClearance: (studentClearanceId: string, staffId: string, remarks?: string) => void;
  rejectClearance: (studentClearanceId: string, staffId: string, remarks: string) => void;
}
