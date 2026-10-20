import { UserRole } from '../types';

/** Single source of truth for which role can open which module. Used by the sidebar AND the router. */
export const TAB_ACCESS: Record<string, UserRole[]> = {
  crm: ['management', 'office_staff', 'field_agent'],
  forms: ['management', 'office_staff'],
  students: ['management', 'office_staff', 'faculty'],
  academics: ['management', 'office_staff', 'faculty'],
  timetable: ['management', 'office_staff', 'faculty', 'student'],
  materials: ['management', 'office_staff', 'faculty', 'student'],
  tests: ['management', 'office_staff', 'faculty', 'student'],
  fees: ['management', 'office_staff'],
  reports: ['management', 'office_staff'],
  communication: ['management', 'office_staff', 'faculty', 'student', 'field_agent'],
  admin: ['management', 'office_staff'],
  analytics: ['management'],
  support: ['management', 'office_staff', 'faculty', 'student', 'field_agent'],
  student_portal: ['student', 'management', 'office_staff'],
  faculty_portal: ['faculty', 'management']
};

export const HOME_TAB: Record<UserRole, string> = {
  management: 'analytics',
  office_staff: 'crm',
  faculty: 'faculty_portal',
  student: 'student_portal',
  field_agent: 'crm'
};

export const canAccess = (role: UserRole, tab: string): boolean => (TAB_ACCESS[tab] || []).includes(role);

/** Roles that can publish alerts/notices, manage fees, courses and batches. */
export const isAdminRole = (role: UserRole) => role === 'management' || role === 'office_staff';
export const isStaffRole = (role: UserRole) => role !== 'student';
