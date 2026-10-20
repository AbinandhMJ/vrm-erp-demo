import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AcademyAnnouncement,
  AssessmentTest,
  AttendanceSession,
  Batch,
  ClassScheduleItem,
  Counselor,
  Course,
  ExamAlert,
  Invoice,
  Lead,
  LeadStatus,
  PaymentPlanType,
  PaymentReceipt,
  Question,
  SalaryPayout,
  ScholarshipType,
  StaffAttendanceEntry,
  StaffMember,
  Student,
  StudentTestAttempt,
  StudyMaterial,
  SupportTicket,
  UserAccount,
  UserProfile,
  UserRole,
  DailyQuizAttempt,
  AdmissionFormValues,
  OnlineApplication,
  LeaveRequest,
  Holiday,
  OnlineClass,
  ClassReminder,
  AcademySettings
} from '../types';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BATCHES,
  INITIAL_COURSES,
  INITIAL_EXAM_ALERTS,
  INITIAL_QUESTION_BANK,
  INITIAL_SCHEDULE,
  INITIAL_STUDY_MATERIALS,
  INITIAL_TICKETS
} from '../data/mockData';
import { buildBaseData, buildSeed, DEMO_PERSONA_ACCOUNT_IDS, SeedData, studentDefaultPassword } from '../data/seed';
import { pickDailyQuestions } from '../lib/dailyQuiz';
import { buildSampleExtras, YOUTUBE_CHANNEL } from '../data/sampleExtras';
import { DEFAULT_HOLIDAYS, workingDaysIn } from '../lib/leave';
import { classIsFor, occurrenceKey, occurrencesBetween } from '../lib/onlineClasses';
import { clearFiles, deleteFile } from '../lib/fileStore';
import { canAccess, HOME_TAB } from '../config/access';
import { nowDisplay, todayISO } from '../lib/dates';
import {
  allocatePayment,
  buildInstallmentSchedule,
  computeDiscount,
  effectiveInvoiceStatus,
  invoiceBalance,
  nextSequence
} from '../lib/fees';

type PaymentMethod = PaymentReceipt['paymentMethod'];

export interface AdmissionInput {
  leadId?: string;
  studentName: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  courseId: string;
  batchId: string;
  scholarship: ScholarshipType;
  customDiscountAmount?: number;
  paymentPlan: PaymentPlanType;
  paymentMethod: PaymentMethod;
  advancePaymentAmount: number;
  transactionRef?: string;
  /** Extra fields from the academy's admission form. */
  form?: Pick<
    Student,
    'qualification' | 'occupation' | 'dateOfBirth' | 'examsAttended' | 'specialCategory' | 'aim' | 'reference' | 'courseDetails' | 'photo' | 'declarationAcceptedAt'
  >;
}

export interface Credentials {
  username: string;
  password: string;
}

interface AppContextType {
  // Authentication & RBAC
  isAuthenticated: boolean;
  currentUser: UserProfile;
  currentAccount: UserAccount | null;
  role: UserRole;
  /** The Student record of the logged-in student (undefined for staff). */
  currentStudent: Student | undefined;
  /** The StaffMember record of the logged-in staff user (undefined for management/students). */
  currentStaff: StaffMember | undefined;
  accounts: UserAccount[];
  login: (username: string, pass: string) => boolean;
  quickLogin: (role: UserRole) => void;
  logout: () => void;

  // Layout & Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  /** Demo "today" (local date, YYYY-MM-DD). */
  today: string;

  // Data (derived values such as attendance %, balances and seat counts are always recomputed)
  courses: Course[];
  batches: Batch[];
  counselors: Counselor[];
  leads: Lead[];
  students: Student[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  schedule: ClassScheduleItem[];
  attendance: AttendanceSession[];
  materials: StudyMaterial[];
  assessmentTests: AssessmentTest[];
  questionBank: Question[];
  studentAttempts: StudentTestAttempt[];
  staffMembers: StaffMember[];
  staffAttendance: StaffAttendanceEntry[];
  salaryPayouts: SalaryPayout[];
  examAlerts: ExamAlert[];
  announcements: AcademyAnnouncement[];
  /** Alerts / notices filtered to what the current role is allowed to see. */
  visibleExamAlerts: ExamAlert[];
  visibleAnnouncements: AcademyAnnouncement[];
  tickets: SupportTicket[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  onlineClasses: OnlineClass[];
  classReminders: ClassReminder[];
  settings: AcademySettings;

  // Actions
  addLead: (lead: Partial<Lead>) => Lead;
  updateLeadStatus: (leadId: string, status: LeadStatus, notes?: string) => void;
  addFollowUp: (leadId: string, notes: string, nextDate?: string, statusUpdate?: LeadStatus) => void;
  convertLeadToAdmission: (data: AdmissionInput) => { student: Student; receipt: PaymentReceipt; credentials: Credentials };
  /** Public online admission form: creates (or updates) a CRM lead carrying the full application. */
  submitOnlineApplication: (values: AdmissionFormValues) => { lead: Lead; applicationNumber: string; updatedExisting: boolean };
  /** Edit an admitted student's admission-form details (name, contacts and form fields). */
  updateStudentForm: (studentId: string, values: AdmissionFormValues) => void;
  addCourse: (course: Omit<Course, 'id' | 'activeBatchesCount'>) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'enrolledCount'>) => void;
  recordBatchAttendance: (
    batchId: string,
    date: string,
    subject: string,
    records: { studentId: string; studentName: string; rollNumber: string; status: 'present' | 'absent' | 'late' }[]
  ) => void;
  /** Per-student status for a given batch/date, if attendance was already taken. */
  getSessionStatuses: (batchId: string, date: string) => Record<string, 'present' | 'absent' | 'late'> | null;
  addStudyMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => StudyMaterial;
  deleteStudyMaterial: (materialId: string) => void;
  /** Adds many reviewed questions at once (bulk import). */
  importQuestions: (questions: Omit<Question, 'id'>[]) => number;
  /** Student updates their own passport photo. */
  updateStudentPhoto: (studentId: string, photo: string | undefined) => void;
  updateStaffMember: (staffId: string, patch: Partial<Omit<StaffMember, 'id' | 'attendanceRate'>>) => void;

  // Leave
  applyLeave: (data: Pick<LeaveRequest, 'staffId' | 'type' | 'from' | 'to' | 'reason' | 'halfDay'>) => LeaveRequest | { error: string };
  decideLeave: (leaveId: string, status: 'approved' | 'rejected', note?: string) => void;
  cancelLeave: (leaveId: string) => void;
  addHoliday: (date: string, name: string) => void;
  removeHoliday: (holidayId: string) => void;

  // Online classes
  saveOnlineClass: (cls: Omit<OnlineClass, 'id' | 'createdAt' | 'createdBy' | 'cancelledDates' | 'recordings'> & { id?: string }) => OnlineClass;
  deleteOnlineClass: (classId: string) => void;
  setOccurrenceCancelled: (classId: string, date: string, cancelled: boolean) => void;
  setRecordingLink: (classId: string, date: string, link: string) => void;
  /** Sends (simulated SMS/WhatsApp + in-app) the class link to its students now. */
  sendClassReminder: (classId: string, date: string) => ClassReminder;
  /** Number of students a class is meant for. */
  classAudienceSize: (cls: OnlineClass) => number;
  updateSettings: (patch: Partial<AcademySettings>) => void;

  addQuestionToBank: (question: Omit<Question, 'id'>) => Question;
  updateQuestionInBank: (questionId: string, updated: Partial<Question>) => void;
  deleteQuestionFromBank: (questionId: string) => void;
  createTestFromQuestionBank: (data: {
    title: string;
    code: string;
    subject: string;
    category: AssessmentTest['category'];
    durationMinutes: number;
    batchIds: string[];
    questionIds: string[];
    negativeMarksPerWrong?: number;
  }) => AssessmentTest;
  submitTestAttempt: (attempt: Omit<StudentTestAttempt, 'id' | 'attemptedAt'>) => StudentTestAttempt;

  /** Collects a payment against an invoice; any amount beyond it flows to the next open installments. */
  recordFeePayment: (invoiceId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => PaymentReceipt;
  /** Collects a payment for a student; applied to the oldest open installments first. */
  recordDirectFeePayment: (data: {
    studentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    installmentDescription?: string;
    notes?: string;
    transactionReference?: string;
  }) => PaymentReceipt;
  studentOutstanding: (studentId: string) => number;

  addExamAlert: (alert: Omit<ExamAlert, 'id'>) => void;
  addAnnouncement: (ann: Omit<AcademyAnnouncement, 'id' | 'date'>) => void;
  createSupportTicket: (ticket: {
    studentOrStaffId: string;
    userName: string;
    userRole: UserRole;
    category: SupportTicket['category'];
    subject: string;
    description: string;
    priority: SupportTicket['priority'];
  }) => SupportTicket;
  replyToTicket: (ticketId: string, text: string, isStaff: boolean, senderName: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'attendanceRate'>) => { staff: StaffMember; credentials: Credentials };
  markStaffAttendance: (date: string, entries: { staffId: string; status: StaffAttendanceEntry['status'] }[]) => void;
  /** Clears everything back to the empty starting state (logins, staff, courses, batches, timetable, question bank). */
  resetToDefaultData: () => void;
  /** Replaces all data with the generated sample academy (~200 students, 6 months of activity). */
  loadSampleData: () => void;
  hasActivityData: boolean;

  // Daily quiz
  dailyQuizAttempts: DailyQuizAttempt[];
  todaysQuiz: Question[];
  submitDailyQuiz: (answers: Record<string, number>) => DailyQuizAttempt | null;

  // Modals & UI helpers
  activeModal: { type: string; data?: any } | null;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  selectedReceiptForView: PaymentReceipt | null;
  viewReceipt: (receipt: PaymentReceipt) => void;
  closeReceiptView: () => void;
  notificationCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Bumped (v3) so browsers still holding the old pre-filled sample data start empty.
const STORAGE_PREFIX = 'vrm_erp_v3_';

// First open starts from the base data (logins, staff, courses, batches, timetable, question bank).
let cachedBase: SeedData | null = null;
const getBase = (): SeedData => (cachedBase ??= buildBaseData());

function loadFromStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback();
  } catch {
    return fallback();
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed for', key, e);
  }
}

function clearOwnStorage() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

const defaultHolidays = (): Holiday[] => {
  const y = new Date().getFullYear();
  return [...DEFAULT_HOLIDAYS(y), ...DEFAULT_HOLIDAYS(y + 1)].map(h => ({ ...h, id: `hol-${h.date}` }));
};

/** useState that persists to localStorage under STORAGE_PREFIX + key. */
function usePersistentState<T>(key: string, fallback: () => T) {
  const [value, setValue] = useState<T>(() => loadFromStorage(key, fallback));
  useEffect(() => saveToStorage(key, value), [key, value]);
  return [value, setValue] as const;
}

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'management',
  designation: '',
  phone: ''
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = todayISO();

  // ---------- auth ----------
  const [accounts, setAccounts] = usePersistentState<UserAccount[]>('accounts', () => getBase().accounts);
  const [currentAccountId, setCurrentAccountId] = usePersistentState<string | null>('current_account', () => null);

  // ---------- UI ----------
  const [theme, setTheme] = usePersistentState<'light' | 'dark'>('theme', () => 'light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState<boolean>('sidebar_collapsed', () => false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTabRaw, setActiveTabRaw] = usePersistentState<string>('active_tab', () => 'crm');
  const [activeModal, setActiveModal] = useState<{ type: string; data?: any } | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<PaymentReceipt | null>(null);

  // ---------- data ----------
  const [coursesRaw, setCourses] = usePersistentState<Course[]>('courses', () => INITIAL_COURSES);
  const [batchesRaw, setBatches] = usePersistentState<Batch[]>('batches', () => INITIAL_BATCHES);
  const [counselorsRaw, setCounselors] = usePersistentState<Counselor[]>('counselors', () => getBase().counselors);
  const [leads, setLeads] = usePersistentState<Lead[]>('leads', () => getBase().leads);
  const [studentsRaw, setStudents] = usePersistentState<Student[]>('students', () => getBase().students);
  const [invoicesRaw, setInvoices] = usePersistentState<Invoice[]>('invoices', () => getBase().invoices);
  const [receipts, setReceipts] = usePersistentState<PaymentReceipt[]>('receipts', () => getBase().receipts);
  const [schedule, setSchedule] = usePersistentState<ClassScheduleItem[]>('schedule', () => INITIAL_SCHEDULE);
  const [attendance, setAttendance] = usePersistentState<AttendanceSession[]>('attendance', () => getBase().attendance);
  const [materials, setMaterials] = usePersistentState<StudyMaterial[]>('materials', () => []);
  const [assessmentTests, setAssessmentTests] = usePersistentState<AssessmentTest[]>('assessmentTests', () => getBase().assessmentTests);
  const [questionBank, setQuestionBank] = usePersistentState<Question[]>('questionBank', () => INITIAL_QUESTION_BANK);
  const [studentAttempts, setStudentAttempts] = usePersistentState<StudentTestAttempt[]>('studentAttempts', () => getBase().studentAttempts);
  const [staffRaw, setStaffMembers] = usePersistentState<StaffMember[]>('staffMembers', () => getBase().staffMembers);
  const [staffAttendance, setStaffAttendance] = usePersistentState<StaffAttendanceEntry[]>('staffAttendance', () => getBase().staffAttendance);
  const [salaryPayouts, setSalaryPayouts] = usePersistentState<SalaryPayout[]>('salaryPayouts', () => getBase().salaryPayouts);
  const [examAlerts, setExamAlerts] = usePersistentState<ExamAlert[]>('examAlerts', () => []);
  const [announcements, setAnnouncements] = usePersistentState<AcademyAnnouncement[]>('announcements', () => []);
  const [tickets, setTickets] = usePersistentState<SupportTicket[]>('tickets', () => []);
  const [dailyQuizAttempts, setDailyQuizAttempts] = usePersistentState<DailyQuizAttempt[]>('dailyQuizAttempts', () => []);
  const [leaveRequests, setLeaveRequests] = usePersistentState<LeaveRequest[]>('leaveRequests', () => []);
  const [holidays, setHolidays] = usePersistentState<Holiday[]>('holidays', () => defaultHolidays());
  const [onlineClasses, setOnlineClasses] = usePersistentState<OnlineClass[]>('onlineClasses', () => []);
  const [classReminders, setClassReminders] = usePersistentState<ClassReminder[]>('classReminders', () => []);
  const [settings, setSettings] = usePersistentState<AcademySettings>('settings', () => ({ youtubeChannelUrl: YOUTUBE_CHANNEL }));

  // ---------- identity ----------
  const currentAccount = useMemo(
    () => accounts.find(a => a.id === currentAccountId) || null,
    [accounts, currentAccountId]
  );
  const isAuthenticated = !!currentAccount;
  const role: UserRole = currentAccount?.role || 'management';
  const currentUser: UserProfile = currentAccount
    ? {
        id: currentAccount.linkedStudentId || currentAccount.linkedStaffId || currentAccount.id,
        name: currentAccount.name,
        email: currentAccount.email,
        role: currentAccount.role,
        designation: currentAccount.designation,
        phone: currentAccount.phone
      }
    : GUEST_PROFILE;

  // ---------- derived data ----------
  const invoices = useMemo(
    () => invoicesRaw.map(inv => ({ ...inv, paidAmount: inv.paidAmount || 0, status: effectiveInvoiceStatus(inv, today) })),
    [invoicesRaw, today]
  );

  const students = useMemo(() => {
    const paidByStudent = new Map<string, number>();
    for (const inv of invoicesRaw) paidByStudent.set(inv.studentId, (paidByStudent.get(inv.studentId) || 0) + (inv.paidAmount || 0));

    const attendanceStats = new Map<string, { attended: number; total: number }>();
    const byBatch = new Map<string, Student[]>();
    for (const s of studentsRaw) {
      const list = byBatch.get(s.enrolledBatchId) || [];
      list.push(s);
      byBatch.set(s.enrolledBatchId, list);
    }
    for (const session of attendance) {
      const absent = new Set(session.absentIds);
      for (const s of byBatch.get(session.batchId) || []) {
        if (s.admissionDate > session.date) continue;
        const st = attendanceStats.get(s.id) || { attended: 0, total: 0 };
        st.total++;
        if (!absent.has(s.id)) st.attended++;
        attendanceStats.set(s.id, st);
      }
    }

    const scoreStats = new Map<string, { sum: number; n: number }>();
    for (const a of studentAttempts) {
      if (!a.totalMarks) continue;
      const st = scoreStats.get(a.studentId) || { sum: 0, n: 0 };
      st.sum += Math.max(0, a.score) / a.totalMarks;
      st.n++;
      scoreStats.set(a.studentId, st);
    }

    return studentsRaw.map(s => {
      const paid = paidByStudent.get(s.id) || 0;
      const att = attendanceStats.get(s.id);
      const sc = scoreStats.get(s.id);
      return {
        ...s,
        paidFee: paid,
        balanceFee: Math.max(0, s.netFee - paid),
        attendancePercentage: att && att.total > 0 ? Math.round((att.attended / att.total) * 1000) / 10 : 100,
        // Average test performance as a percentage (0–100).
        averageTestScore: sc ? Math.round((sc.sum / sc.n) * 1000) / 10 : 0
      };
    });
  }, [studentsRaw, invoicesRaw, attendance, studentAttempts]);

  const batches = useMemo(
    () =>
      batchesRaw.map(b => ({
        ...b,
        enrolledCount: studentsRaw.filter(s => s.enrolledBatchId === b.id && s.status === 'active').length
      })),
    [batchesRaw, studentsRaw]
  );

  const courses = useMemo(
    () =>
      coursesRaw.map(c => ({
        ...c,
        activeBatchesCount: batchesRaw.filter(b => b.courseId === c.id && b.endDate >= today).length
      })),
    [coursesRaw, batchesRaw, today]
  );

  const counselors = useMemo(() => {
    const month = today.slice(0, 7);
    return counselorsRaw.map(c => {
      const mine = leads.filter(l => l.assignedCounselorId === c.id);
      const responseMins = mine
        .filter(l => l.followUps.length > 0)
        .map(l => (new Date(l.followUps[0].timestamp).getTime() - new Date(l.createdAt).getTime()) / 60000)
        .filter(m => m >= 0 && m < 60 * 24 * 3);
      return {
        ...c,
        activeLeadsCount: mine.filter(l => l.status !== 'converted' && l.status !== 'dropped').length,
        conversionsThisMonth: mine.filter(l => l.status === 'converted' && (l.convertedAt || '').slice(0, 7) === month).length,
        averageResponseMinutes: responseMins.length ? Math.round(responseMins.reduce((a, b) => a + b, 0) / responseMins.length) : 0
      };
    });
  }, [counselorsRaw, leads, today]);

  const staffMembers = useMemo(
    () =>
      staffRaw.map(s => {
        // Approved leave is not counted against attendance.
        const entries = staffAttendance.filter(a => a.staffId === s.id && a.status !== 'leave');
        const present = entries.filter(a => a.status === 'present').length;
        const onLeaveToday = leaveRequests.some(l => l.staffId === s.id && l.status === 'approved' && l.from <= today && l.to >= today);
        return {
          ...s,
          status: onLeaveToday ? ('on_leave' as const) : ('active' as const),
          attendanceRate: entries.length ? Math.round((present / entries.length) * 1000) / 10 : 100
        };
      }),
    [staffRaw, staffAttendance, leaveRequests, today]
  );

  const currentStudent = useMemo(
    () => (currentAccount?.linkedStudentId ? students.find(s => s.id === currentAccount.linkedStudentId) : undefined),
    [currentAccount, students]
  );
  const currentStaff = useMemo(
    () => (currentAccount?.linkedStaffId ? staffMembers.find(s => s.id === currentAccount.linkedStaffId) : undefined),
    [currentAccount, staffMembers]
  );

  const visibleExamAlerts = useMemo(() => {
    if (role === 'management' || role === 'office_staff') return examAlerts;
    const allowed = role === 'student' ? ['All', 'Students'] : ['All', 'Staff'];
    return examAlerts.filter(a => allowed.includes(a.targetAudience));
  }, [examAlerts, role]);

  const visibleAnnouncements = useMemo(() => {
    if (role === 'management' || role === 'office_staff') return announcements;
    const allowed = role === 'student' ? ['All', 'Students'] : ['All', 'Faculty'];
    return announcements.filter(a => allowed.includes(a.audience));
  }, [announcements, role]);

  // ---------- routing (with access guard) ----------
  const activeTab = isAuthenticated && canAccess(role, activeTabRaw) ? activeTabRaw : HOME_TAB[role];
  const setActiveTab = (tab: string) => {
    if (canAccess(role, tab)) setActiveTabRaw(tab);
    setMobileMenuOpen(false);
  };

  // ---------- effects ----------
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handle = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, []);

  // ---------- UI actions ----------
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !isFullscreen) {
      const req = document.documentElement.requestFullscreen?.();
      if (req) req.then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
      else setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      setIsFullscreen(false);
    }
  };
  const openModal = (type: string, data?: any) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal(null);
  const viewReceipt = (receipt: PaymentReceipt) => setSelectedReceiptForView(receipt);
  const closeReceiptView = () => setSelectedReceiptForView(null);

  // ---------- auth actions ----------
  const signIn = (account: UserAccount) => {
    setCurrentAccountId(account.id);
    setActiveTabRaw(HOME_TAB[account.role]);
  };

  const login = (username: string, pass: string): boolean => {
    const u = username.trim().toLowerCase();
    const account = accounts.find(
      a => (a.username.toLowerCase() === u || a.email.toLowerCase() === u) && a.password === pass
    );
    if (!account) return false;
    signIn(account);
    return true;
  };

  const quickLogin = (newRole: UserRole) => {
    const account = accounts.find(a => a.id === DEMO_PERSONA_ACCOUNT_IDS[newRole]);
    if (account) signIn(account);
  };

  const logout = () => {
    setCurrentAccountId(null);
    setActiveModal(null);
    setSelectedReceiptForView(null);
  };

  // ---------- CRM ----------
  const pickCounselor = (targetCourse: string): Counselor => {
    const category = coursesRaw.find(c => c.name === targetCourse || targetCourse.startsWith(c.name.split(' (')[0]))?.category;
    const eligible = counselors.filter(c => !category || c.specializations.includes(category));
    const pool = eligible.length ? eligible : counselors;
    // Least-loaded counselor among those who handle this course category.
    return [...pool].sort((a, b) => a.activeLeadsCount - b.activeLeadsCount)[0];
  };

  const addLead = (leadData: Partial<Lead>): Lead => {
    const targetCourse = leadData.targetCourse || coursesRaw[0]?.name || '';
    const counselor = pickCounselor(targetCourse);
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      studentName: leadData.studentName || 'New Aspirant',
      phone: leadData.phone || '',
      email: leadData.email || '',
      targetExamYear: leadData.targetExamYear || String(new Date().getFullYear() + 1),
      targetCourse,
      source: leadData.source || 'website',
      status: 'new',
      assignedCounselorId: counselor.id,
      assignedCounselorName: counselor.name,
      createdAt: new Date().toISOString(),
      location: leadData.location || '',
      notes: leadData.notes || '',
      fieldAgentName: leadData.fieldAgentName,
      followUps: []
    };
    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus, notes?: string) => {
    setLeads(prev =>
      prev.map(l => {
        if (l.id !== leadId) return l;
        const followUps = notes
          ? [...l.followUps, { id: `fu-${Date.now()}`, timestamp: new Date().toISOString(), counselorName: currentUser.name, notes, statusUpdate: status }]
          : l.followUps;
        return { ...l, status, followUps };
      })
    );
  };

  const addFollowUp = (leadId: string, notes: string, nextDate?: string, statusUpdate?: LeadStatus) => {
    setLeads(prev =>
      prev.map(l => {
        if (l.id !== leadId) return l;
        const newStatus = statusUpdate || l.status;
        return {
          ...l,
          status: newStatus,
          consultationDate: nextDate ? new Date(nextDate).toISOString() : l.consultationDate,
          followUps: [
            ...l.followUps,
            { id: `fu-${Date.now()}`, timestamp: new Date().toISOString(), counselorName: currentUser.name, notes, nextFollowUpDate: nextDate, statusUpdate: newStatus }
          ]
        };
      })
    );
  };

  // ---------- admissions ----------
  const convertLeadToAdmission = (data: AdmissionInput) => {
    const course = coursesRaw.find(c => c.id === data.courseId);
    const batch = batches.find(b => b.id === data.batchId);
    if (!course || !batch) throw new Error('Select a valid course and batch.');
    if (batch.enrolledCount >= batch.maxCapacity) throw new Error(`${batch.name} is full (${batch.maxCapacity} seats).`);

    const discountAmount = computeDiscount(course.totalFee, data.scholarship, data.customDiscountAmount);
    const netFee = course.totalFee - discountAmount;
    const advance = Math.round(Math.min(data.advancePaymentAmount, netFee));
    if (advance <= 0) throw new Error('An advance payment is required to confirm admission.');

    const rollNumber = nextSequence(studentsRaw.map(s => s.rollNumber), 'VRM-2026-', 3);
    const studentId = `stu-${Date.now()}`;
    const admissionDate = today;

    const newStudent: Student = {
      id: studentId,
      rollNumber,
      name: data.studentName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      gender: data.gender || 'Not specified',
      address: data.address,
      enrolledCourseId: course.id,
      enrolledCourseName: course.name,
      enrolledBatchId: batch.id,
      enrolledBatchName: batch.name,
      admissionDate,
      totalFee: course.totalFee,
      scholarshipApplied: data.scholarship,
      discountAmount,
      netFee,
      paidFee: 0,
      balanceFee: netFee,
      paymentPlan: data.paymentPlan,
      attendancePercentage: 100,
      averageTestScore: 0,
      portalUsername: rollNumber,
      status: 'active',
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone || data.phone,
      ...data.form
    };

    // Invoices for each installment, numbered sequentially across the academy.
    const existingInvoiceNumbers = invoicesRaw.map(i => i.invoiceNumber);
    const plan = buildInstallmentSchedule(netFee, data.paymentPlan, admissionDate);
    const newInvoices: Invoice[] = plan.map((inst, idx) => {
      const invoiceNumber = nextSequence(existingInvoiceNumbers, 'VRM/INV/2026/');
      existingInvoiceNumbers.push(invoiceNumber);
      return {
        id: `inv-${studentId}-${idx + 1}`,
        invoiceNumber,
        studentId,
        studentName: newStudent.name,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: idx + 1,
        totalInstallments: plan.length,
        amount: inst.amount,
        dueDate: inst.dueDate,
        status: 'pending',
        paidAmount: 0
      };
    });

    const receiptId = `rcpt-${Date.now()}`;
    const { updated, allocations } = allocatePayment(newInvoices, advance, admissionDate, receiptId);

    const receipt: PaymentReceipt = {
      id: receiptId,
      receiptNumber: nextSequence(receipts.map(r => r.receiptNumber), 'VRM/RCPT/2026/'),
      invoiceId: newInvoices[0].id,
      studentId,
      studentName: newStudent.name,
      studentRollNumber: rollNumber,
      courseName: course.name,
      batchName: batch.name,
      installmentDescription: 'Admission advance (Installment 1)',
      amountPaid: advance,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionRef || `TXN${Date.now().toString().slice(-9)}`,
      paidAt: nowDisplay(),
      paidOn: today,
      receivedBy: `${currentUser.name} (${currentUser.designation})`,
      notes: 'Admission confirmed. Student added to the class roster and portal login created.',
      status: 'verified',
      allocations
    };

    const credentials: Credentials = { username: rollNumber, password: studentDefaultPassword(newStudent.phone) };
    const account: UserAccount = {
      id: `acc-${studentId}`,
      username: credentials.username,
      password: credentials.password,
      role: 'student',
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      designation: `Enrolled Aspirant (Roll: ${rollNumber})`,
      linkedStudentId: studentId,
      createdAt: admissionDate
    };

    setStudents(prev => [newStudent, ...prev]);
    setInvoices(prev => [...updated, ...prev]);
    setReceipts(prev => [receipt, ...prev]);
    setAccounts(prev => [...prev, account]);

    if (data.leadId) {
      setLeads(prev =>
        prev.map(l =>
          l.id === data.leadId
            ? {
                ...l,
                status: 'converted',
                convertedStudentId: studentId,
                convertedAt: admissionDate,
                followUps: [
                  ...l.followUps,
                  {
                    id: `fu-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    counselorName: currentUser.name,
                    notes: `Converted: enrolled as ${newStudent.name} (${rollNumber}) in ${batch.name}. Advance ₹${advance.toLocaleString('en-IN')} collected.`,
                    statusUpdate: 'converted'
                  }
                ]
              }
            : l
        )
      );
    }

    return { student: { ...newStudent, paidFee: advance, balanceFee: netFee - advance }, receipt, credentials };
  };

  const submitOnlineApplication: AppContextType['submitOnlineApplication'] = values => {
    const course = coursesRaw.find(c => c.id === values.courseId);
    const applicationNumber = nextSequence(
      leads.filter(l => l.application).map(l => l.application!.applicationNumber),
      'APP-2026-',
      4
    );
    const now = new Date().toISOString();
    const application: OnlineApplication = {
      applicationNumber,
      submittedAt: now,
      courseId: values.courseId,
      preferredBatchId: values.batchId || undefined,
      courseDetails: values.courseDetails.trim(),
      qualification: values.qualification.trim(),
      guardianName: values.guardianName.trim(),
      occupation: values.occupation.trim(),
      dateOfBirth: values.dateOfBirth,
      guardianPhone: values.guardianPhone.trim(),
      specialCategory: values.specialCategory.trim() || 'None',
      examsAttended: values.examsAttended.trim(),
      address: values.address.trim(),
      aim: values.aim.trim(),
      reference: values.reference.trim(),
      photo: values.photo || undefined,
      declarationAcceptedAt: now
    };
    const digits = values.phone.replace(/\D/g, '').slice(-10);
    const existing = leads.find(l => l.phone.replace(/\D/g, '').slice(-10) === digits && l.status !== 'dropped' && l.status !== 'converted');
    const note = {
      id: `fu-${Date.now()}`,
      timestamp: now,
      counselorName: 'Online admission form',
      notes: `Submitted online admission form ${applicationNumber}.`,
      statusUpdate: (existing?.status || 'new') as LeadStatus
    };
    if (existing) {
      const updated: Lead = {
        ...existing,
        studentName: values.studentName.trim(),
        email: values.email.trim() || existing.email,
        targetCourse: course?.name || existing.targetCourse,
        location: values.address.trim() || existing.location,
        application,
        followUps: [...existing.followUps, note]
      };
      setLeads(prev => prev.map(l => (l.id === existing.id ? updated : l)));
      return { lead: updated, applicationNumber, updatedExisting: true };
    }
    const counselor = pickCounselor(course?.name || '');
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      studentName: values.studentName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      targetExamYear: String(new Date().getFullYear() + 1),
      targetCourse: course?.name || '',
      source: 'website',
      status: 'new',
      assignedCounselorId: counselor.id,
      assignedCounselorName: counselor.name,
      createdAt: now,
      location: values.address.trim(),
      notes: `Online admission form ${applicationNumber}. Aim: ${values.aim.trim() || 'not stated'}.`,
      application,
      followUps: [note]
    };
    setLeads(prev => [lead, ...prev]);
    return { lead, applicationNumber, updatedExisting: false };
  };

  const updateStudentForm: AppContextType['updateStudentForm'] = (studentId, v) => {
    setStudents(prev =>
      prev.map(s =>
        s.id !== studentId
          ? s
          : {
              ...s,
              name: v.studentName.trim(),
              phone: v.phone.trim(),
              email: v.email.trim(),
              address: v.address.trim(),
              guardianName: v.guardianName.trim(),
              guardianPhone: v.guardianPhone.trim() || v.phone.trim(),
              qualification: v.qualification.trim(),
              occupation: v.occupation.trim(),
              dateOfBirth: v.dateOfBirth,
              examsAttended: v.examsAttended.trim(),
              specialCategory: v.specialCategory.trim() || 'None',
              aim: v.aim.trim(),
              reference: v.reference.trim(),
              courseDetails: v.courseDetails.trim(),
              photo: v.photo || undefined
            }
      )
    );
    // Keep the login account's display details in step (username/password unchanged).
    setAccounts(prev =>
      prev.map(a => (a.linkedStudentId === studentId ? { ...a, name: v.studentName.trim(), phone: v.phone.trim(), email: v.email.trim() } : a))
    );
  };

  const addCourse = (courseData: Omit<Course, 'id' | 'activeBatchesCount'>) => {
    setCourses(prev => [...prev, { ...courseData, id: `crs-${Date.now()}`, activeBatchesCount: 0 }]);
  };

  const addBatch = (batchData: Omit<Batch, 'id' | 'enrolledCount'>) => {
    setBatches(prev => [...prev, { ...batchData, id: `batch-${Date.now()}`, enrolledCount: 0 }]);
  };

  // ---------- attendance ----------
  const recordBatchAttendance: AppContextType['recordBatchAttendance'] = (batchId, date, subject, records) => {
    const session: AttendanceSession = {
      id: `att-${batchId}-${date}`,
      date,
      batchId,
      subject,
      facultyName: currentUser.name,
      absentIds: records.filter(r => r.status === 'absent').map(r => r.studentId),
      lateIds: records.filter(r => r.status === 'late').map(r => r.studentId)
    };
    // One session per batch per day: re-submitting corrects the earlier entry.
    setAttendance(prev => [...prev.filter(s => s.id !== session.id), session]);
  };

  const getSessionStatuses = (batchId: string, date: string) => {
    const session = attendance.find(s => s.batchId === batchId && s.date === date);
    if (!session) return null;
    const result: Record<string, 'present' | 'absent' | 'late'> = {};
    for (const s of studentsRaw.filter(x => x.enrolledBatchId === batchId)) {
      result[s.id] = session.absentIds.includes(s.id) ? 'absent' : session.lateIds.includes(s.id) ? 'late' : 'present';
    }
    return result;
  };

  const addStudyMaterial = (matData: Omit<StudyMaterial, 'id' | 'uploadedAt'>): StudyMaterial => {
    const m: StudyMaterial = { ...matData, id: `mat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, uploadedAt: today };
    setMaterials(prev => [m, ...prev]);
    return m;
  };
  const deleteStudyMaterial = (materialId: string) => {
    const m = materials.find(x => x.id === materialId);
    if (m?.fileId) deleteFile(m.fileId).catch(() => undefined);
    setMaterials(prev => prev.filter(x => x.id !== materialId));
  };

  const updateStudentPhoto = (studentId: string, photo: string | undefined) =>
    setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, photo } : s)));

  // ---------- question bank & tests ----------
  const addQuestionToBank = (qData: Omit<Question, 'id'>): Question => {
    const q: Question = { ...qData, id: `qb-${Date.now()}`, createdAt: today };
    setQuestionBank(prev => [q, ...prev]);
    return q;
  };
  const updateQuestionInBank = (questionId: string, updated: Partial<Question>) =>
    setQuestionBank(prev => prev.map(q => (q.id === questionId ? { ...q, ...updated } : q)));
  const deleteQuestionFromBank = (questionId: string) => setQuestionBank(prev => prev.filter(q => q.id !== questionId));
  const importQuestions = (qs: Omit<Question, 'id'>[]): number => {
    const stamp = Date.now().toString(36);
    const added: Question[] = qs.map((q, i) => ({ ...q, id: `qb-${stamp}-${i}`, createdAt: q.createdAt || today }));
    setQuestionBank(prev => [...added, ...prev]);
    return added.length;
  };

  const createTestFromQuestionBank: AppContextType['createTestFromQuestionBank'] = data => {
    const selected = questionBank.filter(q => data.questionIds.includes(q.id));
    const test: AssessmentTest = {
      id: `test-${Date.now()}`,
      title: data.title,
      code: data.code,
      subject: data.subject,
      category: data.category,
      totalMarks: Math.round(selected.reduce((sum, q) => sum + (q.marks || 2), 0) * 100) / 100,
      durationMinutes: data.durationMinutes,
      questionsCount: selected.length,
      questions: selected,
      negativeMarksPerWrong: data.negativeMarksPerWrong ?? (data.subject.toLowerCase().includes('csat') ? 0.83 : 0.66),
      scheduledDate: today,
      batchIds: data.batchIds
    };
    setAssessmentTests(prev => [test, ...prev]);
    return test;
  };

  const submitTestAttempt = (attemptData: Omit<StudentTestAttempt, 'id' | 'attemptedAt'>): StudentTestAttempt => {
    const student = studentsRaw.find(s => s.id === attemptData.studentId);
    const peers = studentAttempts.filter(
      a => a.testId === attemptData.testId && studentsRaw.find(s => s.id === a.studentId)?.enrolledBatchId === student?.enrolledBatchId
    );
    const rankInBatch = peers.filter(a => a.score > attemptData.score).length + 1;
    const attempt: StudentTestAttempt = {
      ...attemptData,
      id: `att-${attemptData.testId}-${attemptData.studentId}-${Date.now()}`,
      attemptedAt: new Date().toISOString(),
      rankInBatch
    };
    setStudentAttempts(prev => [attempt, ...prev]);
    return attempt;
  };

  // ---------- fees ----------
  const studentOutstanding = (studentId: string) =>
    invoicesRaw.filter(i => i.studentId === studentId).reduce((sum, i) => sum + invoiceBalance(i), 0);

  const collectPayment = (
    studentId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    opts: { preferredInvoiceId?: string; description?: string; notes?: string; transactionReference?: string }
  ): PaymentReceipt => {
    const student = studentsRaw.find(s => s.id === studentId);
    const outstanding = studentOutstanding(studentId);
    const charge = Math.round(Math.min(amount, outstanding));
    if (!student || charge <= 0) throw new Error('Nothing is outstanding for this student.');

    const receiptId = `rcpt-${Date.now()}`;
    const studentInvoices = invoicesRaw.filter(i => i.studentId === studentId);
    const { updated, allocations } = allocatePayment(studentInvoices, charge, today, receiptId, opts.preferredInvoiceId);
    const updatedById = new Map(updated.map(i => [i.id, i]));

    const describe = () => {
      if (opts.description) return opts.description;
      return allocations
        .map(a => {
          const inv = studentInvoices.find(i => i.id === a.invoiceId)!;
          const full = a.amount >= invoiceBalance(inv);
          return `${full ? '' : 'Part payment of '}Installment ${inv.installmentIndex} of ${inv.totalInstallments}`;
        })
        .join(' + ');
    };

    const receipt: PaymentReceipt = {
      id: receiptId,
      receiptNumber: nextSequence(receipts.map(r => r.receiptNumber), 'VRM/RCPT/2026/'),
      invoiceId: allocations[0]?.invoiceId || studentInvoices[0]?.id || '',
      studentId,
      studentName: student.name,
      studentRollNumber: student.rollNumber,
      courseName: student.enrolledCourseName,
      batchName: student.enrolledBatchName,
      installmentDescription: describe(),
      amountPaid: charge,
      paymentMethod,
      transactionReference: opts.transactionReference || `TXN${Date.now().toString().slice(-9)}`,
      paidAt: nowDisplay(),
      paidOn: today,
      receivedBy:
        role === 'student' ? 'Online Payment Gateway (auto-verified)' : `${currentUser.name} (${currentUser.designation})`,
      notes: opts.notes || 'Payment received.',
      status: 'verified',
      allocations
    };

    setInvoices(prev => prev.map(i => updatedById.get(i.id) || i));
    setReceipts(prev => [receipt, ...prev]);
    return receipt;
  };

  const recordFeePayment: AppContextType['recordFeePayment'] = (invoiceId, amount, paymentMethod, notes) => {
    const inv = invoicesRaw.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found.');
    return collectPayment(inv.studentId, amount, paymentMethod, { preferredInvoiceId: invoiceId, notes });
  };

  const recordDirectFeePayment: AppContextType['recordDirectFeePayment'] = data =>
    collectPayment(data.studentId, data.amount, data.paymentMethod, {
      description: data.installmentDescription,
      notes: data.notes,
      transactionReference: data.transactionReference
    });

  // ---------- communication & support ----------
  const addExamAlert = (alertData: Omit<ExamAlert, 'id'>) => setExamAlerts(prev => [{ ...alertData, id: `alert-${Date.now()}` }, ...prev]);
  const addAnnouncement = (annData: Omit<AcademyAnnouncement, 'id' | 'date'>) =>
    setAnnouncements(prev => [{ ...annData, id: `ann-${Date.now()}`, date: today }, ...prev]);

  const createSupportTicket: AppContextType['createSupportTicket'] = ticketData => {
    const stamp = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const ticket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: nextSequence(tickets.map(t => t.ticketNumber), 'TKT-2026-', 4),
      ...ticketData,
      status: 'open',
      createdAt: stamp,
      lastUpdated: stamp,
      messages: [{ sender: ticketData.userName, isStaff: ticketData.userRole !== 'student', timestamp: stamp, text: ticketData.description }]
    };
    setTickets(prev => [ticket, ...prev]);
    return ticket;
  };

  const replyToTicket = (ticketId: string, text: string, isStaff: boolean, senderName: string) => {
    const stamp = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setTickets(prev =>
      prev.map(t =>
        t.id !== ticketId
          ? t
          : {
              ...t,
              status: isStaff && t.status === 'open' ? 'in_progress' : t.status,
              lastUpdated: stamp,
              messages: [...t.messages, { sender: senderName, isStaff, timestamp: stamp, text }]
            }
      )
    );
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) =>
    setTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, status, lastUpdated: new Date().toLocaleString('en-IN') } : t)));

  // ---------- staff ----------
  const addStaffMember = (staffData: Omit<StaffMember, 'id' | 'attendanceRate'>) => {
    const staff: StaffMember = { ...staffData, id: `stf-${Date.now()}`, attendanceRate: 100 };
    const credentials: Credentials = {
      username: staffData.email.trim().toLowerCase(),
      password: `Staff@${staffData.phone.replace(/\D/g, '').slice(-4) || '0000'}`
    };
    const accountRole: UserRole =
      staffData.department === 'Faculty' ? 'faculty' : staffData.department === 'Counseling' ? 'field_agent' : 'office_staff';
    const account: UserAccount = {
      id: `acc-${staff.id}`,
      username: credentials.username,
      password: credentials.password,
      role: accountRole,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      designation: staff.designation,
      linkedStaffId: staff.id,
      createdAt: today
    };
    setStaffMembers(prev => [...prev, staff]);
    setAccounts(prev => [...prev, account]);
    if (staffData.department === 'Counseling') {
      setCounselors(prev => [
        ...prev,
        {
          id: `csl-${slug(staff.name)}`,
          name: staff.name,
          phone: staff.phone,
          email: staff.email,
          activeLeadsCount: 0,
          conversionsThisMonth: 0,
          averageResponseMinutes: 0,
          specializations: ['GS Foundation', 'CSAT', 'Optional Subject', 'State PSC', 'Test Series']
        }
      ]);
    }
    return { staff, credentials };
  };

  const markStaffAttendance = (date: string, entries: { staffId: string; status: StaffAttendanceEntry['status'] }[]) => {
    setStaffAttendance(prev => {
      const ids = new Set(entries.map(e => `sa-${e.staffId}-${date}`));
      return [...prev.filter(a => !ids.has(a.id)), ...entries.map(e => ({ id: `sa-${e.staffId}-${date}`, staffId: e.staffId, date, status: e.status }))];
    });
  };

  const updateStaffMember: AppContextType['updateStaffMember'] = (staffId, patch) => {
    setStaffMembers(prev => prev.map(s => (s.id === staffId ? { ...s, ...patch } : s)));
    if (patch.name || patch.phone || patch.email || patch.designation)
      setAccounts(prev =>
        prev.map(a =>
          a.linkedStaffId === staffId
            ? { ...a, name: patch.name ?? a.name, phone: patch.phone ?? a.phone, email: patch.email ?? a.email, designation: patch.designation ?? a.designation }
            : a
        )
      );
  };

  // ---------- leave ----------
  const applyLeave: AppContextType['applyLeave'] = data => {
    const staff = staffRaw.find(s => s.id === data.staffId);
    if (!staff) return { error: 'Staff record not found.' };
    if (data.to < data.from) return { error: 'The end date is before the start date.' };
    const days = data.halfDay ? 0.5 : workingDaysIn(data.from, data.to, holidays).length;
    if (days === 0) return { error: 'Those dates are all Sundays or holidays: no leave needed.' };
    const clash = leaveRequests.find(
      l => l.staffId === data.staffId && (l.status === 'pending' || l.status === 'approved') && l.from <= data.to && l.to >= data.from
    );
    if (clash) return { error: `Overlaps an existing ${clash.status} leave (${clash.from} to ${clash.to}).` };
    const req: LeaveRequest = {
      ...data,
      to: data.halfDay ? data.from : data.to,
      id: `lv-${Date.now().toString(36)}`,
      staffName: staff.name,
      days,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };
    setLeaveRequests(prev => [req, ...prev]);
    return req;
  };
  const decideLeave: AppContextType['decideLeave'] = (leaveId, status, note) => {
    const req = leaveRequests.find(l => l.id === leaveId);
    if (!req) return;
    setLeaveRequests(prev =>
      prev.map(l => (l.id === leaveId ? { ...l, status, decidedBy: currentAccount?.name || 'Management', decidedAt: new Date().toISOString(), decisionNote: note } : l))
    );
    // Approved leave shows on the staff attendance register.
    if (status === 'approved') {
      const days = workingDaysIn(req.from, req.to, holidays);
      setStaffAttendance(prev => {
        const ids = new Set(days.map(d => `sa-${req.staffId}-${d}`));
        return [...prev.filter(a => !ids.has(a.id)), ...days.map(d => ({ id: `sa-${req.staffId}-${d}`, staffId: req.staffId, date: d, status: 'leave' as const }))];
      });
    }
  };
  const cancelLeave = (leaveId: string) => {
    const req = leaveRequests.find(l => l.id === leaveId);
    setLeaveRequests(prev => prev.map(l => (l.id === leaveId ? { ...l, status: 'cancelled' } : l)));
    if (req?.status === 'approved')
      setStaffAttendance(prev => prev.filter(a => !(a.staffId === req.staffId && a.status === 'leave' && a.date >= req.from && a.date <= req.to)));
  };
  const addHoliday = (date: string, name: string) =>
    setHolidays(prev => [...prev.filter(h => h.date !== date), { id: `hol-${date}`, date, name }].sort((a, b) => a.date.localeCompare(b.date)));
  const removeHoliday = (holidayId: string) => setHolidays(prev => prev.filter(h => h.id !== holidayId));

  // ---------- online classes ----------
  const classAudienceSize = (cls: OnlineClass) => studentsRaw.filter(s => s.status === 'active' && classIsFor(cls, s.enrolledBatchId)).length;
  const saveOnlineClass: AppContextType['saveOnlineClass'] = data => {
    const existing = data.id ? onlineClasses.find(c => c.id === data.id) : undefined;
    const cls: OnlineClass = existing
      ? { ...existing, ...data, id: existing.id }
      : {
          ...data,
          id: `ocl-${Date.now().toString(36)}`,
          cancelledDates: [],
          recordings: {},
          createdBy: currentAccount?.name || 'Staff',
          createdAt: new Date().toISOString()
        };
    setOnlineClasses(prev => (existing ? prev.map(c => (c.id === cls.id ? cls : c)) : [cls, ...prev]));
    return cls;
  };
  const deleteOnlineClass = (classId: string) => {
    setOnlineClasses(prev => prev.filter(c => c.id !== classId));
    setClassReminders(prev => prev.filter(r => r.classId !== classId));
  };
  const setOccurrenceCancelled = (classId: string, date: string, cancelled: boolean) =>
    setOnlineClasses(prev =>
      prev.map(c =>
        c.id === classId
          ? { ...c, cancelledDates: cancelled ? [...new Set([...c.cancelledDates, date])] : c.cancelledDates.filter(d => d !== date) }
          : c
      )
    );
  const setRecordingLink = (classId: string, date: string, link: string) =>
    setOnlineClasses(prev =>
      prev.map(c => {
        if (c.id !== classId) return c;
        const recordings = { ...c.recordings };
        if (link.trim()) recordings[date] = link.trim();
        else delete recordings[date];
        return { ...c, recordings };
      })
    );
  const makeReminder = (cls: OnlineClass, date: string, manual: boolean): ClassReminder => ({
    id: `rem-${cls.id}-${date}${manual ? `-${Date.now().toString(36)}` : ''}`,
    classId: cls.id,
    date,
    sentAt: new Date().toISOString(),
    recipients: classAudienceSize(cls),
    channels: 'App, SMS, WhatsApp',
    manual
  });
  const sendClassReminder = (classId: string, date: string): ClassReminder => {
    const cls = onlineClasses.find(c => c.id === classId)!;
    const r = makeReminder(cls, date, true);
    setClassReminders(prev => [r, ...prev]);
    return r;
  };
  const updateSettings = (patch: Partial<AcademySettings>) => setSettings(prev => ({ ...prev, ...patch }));

  // Automatic reminders: when a class is within its reminder window, its link goes out to its students once.
  // (In this demo the "sending" happens while the app is open; a real deployment would run this on a server.)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const due = occurrencesBetween(onlineClasses, today, today).filter(
        o => !o.cancelled && now.getTime() >= o.start.getTime() - o.cls.remindBeforeMinutes * 60_000 && now < o.end
      );
      if (due.length === 0) return;
      setClassReminders(prev => {
        const have = new Set(prev.filter(r => !r.manual).map(r => `${r.classId}|${r.date}`));
        const fresh = due.filter(o => !have.has(occurrenceKey(o))).map(o => makeReminder(o.cls, o.date, false));
        return fresh.length ? [...fresh, ...prev] : prev;
      });
    };
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineClasses, today]);

  // ---------- data reset / sample data ----------
  const applyData = (data: SeedData, withContent: boolean) => {
    clearOwnStorage();
    setAccounts(data.accounts);
    setCourses(INITIAL_COURSES);
    setBatches(INITIAL_BATCHES);
    setCounselors(data.counselors);
    setLeads(data.leads);
    setStudents(data.students);
    setInvoices(data.invoices);
    setReceipts(data.receipts);
    setSchedule(INITIAL_SCHEDULE);
    setAttendance(data.attendance);
    setMaterials(withContent ? INITIAL_STUDY_MATERIALS : []);
    setAssessmentTests(data.assessmentTests);
    setQuestionBank(INITIAL_QUESTION_BANK);
    setStudentAttempts(data.studentAttempts);
    setStaffMembers(data.staffMembers);
    setStaffAttendance(data.staffAttendance);
    setSalaryPayouts(data.salaryPayouts);
    setExamAlerts(withContent ? INITIAL_EXAM_ALERTS : []);
    setAnnouncements(withContent ? INITIAL_ANNOUNCEMENTS : []);
    setTickets(withContent ? INITIAL_TICKETS : []);
    setDailyQuizAttempts(data.dailyQuizAttempts);
    const extras = withContent ? buildSampleExtras(today, data.staffMembers) : { leaveRequests: [], onlineClasses: [], classReminders: [] };
    setLeaveRequests(extras.leaveRequests);
    setOnlineClasses(extras.onlineClasses);
    setClassReminders(extras.classReminders);
    setHolidays(defaultHolidays());
    setSettings({ youtubeChannelUrl: YOUTUBE_CHANNEL });
    if (withContent) {
      // Approved sample leave appears on the attendance register.
      setStaffAttendance(prev => {
        const marks = extras.leaveRequests
          .filter(l => l.status === 'approved')
          .flatMap(l => workingDaysIn(l.from, l.to, defaultHolidays()).map(d => ({ id: `sa-${l.staffId}-${d}`, staffId: l.staffId, date: d, status: 'leave' as const })));
        const ids = new Set(marks.map(m => m.id));
        return [...data.staffAttendance.filter(a => !ids.has(a.id)), ...marks];
      });
    }
    clearFiles();
    setTheme(theme);
    // Stay signed in as the same account if it still exists; otherwise fall back to management.
    if (currentAccountId) {
      const stillExists = data.accounts.find(a => a.id === currentAccountId);
      const account = stillExists || data.accounts.find(a => a.id === DEMO_PERSONA_ACCOUNT_IDS.management)!;
      setCurrentAccountId(account.id);
      setActiveTabRaw(HOME_TAB[account.role]);
    }
  };

  const resetToDefaultData = () => applyData(buildBaseData(), false);
  const loadSampleData = () => applyData(buildSeed(), true);
  const hasActivityData = studentsRaw.length > 0 || leads.length > 0;

  // ---------- daily quiz ----------
  const todaysQuiz = useMemo(() => pickDailyQuestions(questionBank, today), [questionBank, today]);
  const submitDailyQuiz = (answers: Record<string, number>): DailyQuizAttempt | null => {
    const studentId = currentAccount?.linkedStudentId;
    if (!studentId || todaysQuiz.length === 0) return null;
    const correct = todaysQuiz.filter(q => answers[q.id] === q.correctOptionIndex).length;
    const attempt: DailyQuizAttempt = {
      id: `dq-${studentId}-${today}`,
      studentId,
      date: today,
      questionIds: todaysQuiz.map(q => q.id),
      answers,
      correct,
      total: todaysQuiz.length
    };
    setDailyQuizAttempts(prev => [...prev.filter(a => a.id !== attempt.id), attempt]);
    return attempt;
  };

  const myClassLinksToday =
    role === 'student'
      ? classReminders.filter(r => r.date === today && onlineClasses.some(c => c.id === r.classId && classIsFor(c, currentStudent?.enrolledBatchId))).length
      : 0;
  const notificationCount = visibleExamAlerts.filter(a => a.status === 'active').length + visibleAnnouncements.length + myClassLinksToday;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        currentAccount,
        role,
        currentStudent,
        currentStaff,
        accounts,
        login,
        quickLogin,
        logout,
        theme,
        toggleTheme,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileMenuOpen,
        setMobileMenuOpen,
        isFullscreen,
        toggleFullscreen,
        activeTab,
        setActiveTab,
        today,
        courses,
        batches,
        counselors,
        leads,
        students,
        invoices,
        receipts,
        schedule,
        attendance,
        materials,
        assessmentTests,
        questionBank,
        studentAttempts,
        staffMembers,
        staffAttendance,
        salaryPayouts,
        examAlerts,
        announcements,
        visibleExamAlerts,
        visibleAnnouncements,
        tickets,
        leaveRequests,
        holidays,
        onlineClasses,
        classReminders,
        settings,
        deleteStudyMaterial,
        importQuestions,
        updateStudentPhoto,
        updateStaffMember,
        applyLeave,
        decideLeave,
        cancelLeave,
        addHoliday,
        removeHoliday,
        saveOnlineClass,
        deleteOnlineClass,
        setOccurrenceCancelled,
        setRecordingLink,
        sendClassReminder,
        classAudienceSize,
        updateSettings,
        addLead,
        updateLeadStatus,
        addFollowUp,
        convertLeadToAdmission,
        submitOnlineApplication,
        updateStudentForm,
        addCourse,
        addBatch,
        recordBatchAttendance,
        getSessionStatuses,
        addStudyMaterial,
        addQuestionToBank,
        updateQuestionInBank,
        deleteQuestionFromBank,
        createTestFromQuestionBank,
        submitTestAttempt,
        recordFeePayment,
        recordDirectFeePayment,
        studentOutstanding,
        addExamAlert,
        addAnnouncement,
        createSupportTicket,
        replyToTicket,
        updateTicketStatus,
        addStaffMember,
        markStaffAttendance,
        resetToDefaultData,
        loadSampleData,
        hasActivityData,
        dailyQuizAttempts,
        todaysQuiz,
        submitDailyQuiz,
        activeModal,
        openModal,
        closeModal,
        selectedReceiptForView,
        viewReceipt,
        closeReceiptView,
        notificationCount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
