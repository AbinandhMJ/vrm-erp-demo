import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  Course,
  Batch,
  Counselor,
  Lead,
  LeadStatus,
  Student,
  Invoice,
  PaymentReceipt,
  ClassScheduleItem,
  StudyMaterial,
  AssessmentTest,
  StudentTestAttempt,
  StaffMember,
  SalaryPayout,
  ExamAlert,
  AcademyAnnouncement,
  SupportTicket,
  ScholarshipType,
  PaymentPlanType,
  Question
} from '../types';
import {
  INITIAL_USER_PROFILES,
  INITIAL_COURSES,
  INITIAL_BATCHES,
  INITIAL_COUNSELORS,
  INITIAL_LEADS,
  INITIAL_STUDENTS,
  INITIAL_INVOICES,
  INITIAL_RECEIPTS,
  INITIAL_SCHEDULE,
  INITIAL_STUDY_MATERIALS,
  INITIAL_ASSESSMENT_TESTS,
  INITIAL_QUESTION_BANK,
  INITIAL_STUDENT_ATTEMPTS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_SALARY_PAYOUTS,
  INITIAL_EXAM_ALERTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TICKETS
} from '../data/mockData';

interface AppContextType {
  // Authentication & RBAC
  isAuthenticated: boolean;
  currentUser: UserProfile;
  role: UserRole;
  login: (emailOrUser: string, pass: string) => boolean;
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
  courses: Course[];
  batches: Batch[];
  counselors: Counselor[];
  leads: Lead[];
  students: Student[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  schedule: ClassScheduleItem[];
  materials: StudyMaterial[];
  assessmentTests: AssessmentTest[];
  questionBank: Question[];
  studentAttempts: StudentTestAttempt[];
  staffMembers: StaffMember[];
  salaryPayouts: SalaryPayout[];
  examAlerts: ExamAlert[];
  announcements: AcademyAnnouncement[];
  tickets: SupportTicket[];
  
  // Actions
  addLead: (lead: Partial<Lead>) => Lead;
  updateLeadStatus: (leadId: string, status: LeadStatus, notes?: string) => void;
  addFollowUp: (leadId: string, notes: string, nextDate?: string, statusUpdate?: LeadStatus) => void;
  convertLeadToAdmission: (data: {
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
    paymentMethod: 'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash';
    advancePaymentAmount: number;
    transactionRef?: string;
  }) => { student: Student; receipt: PaymentReceipt };
  addCourse: (course: Omit<Course, 'id' | 'activeBatchesCount'>) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'enrolledCount'>) => void;
  recordBatchAttendance: (
    batchId: string,
    date: string,
    subject: string,
    records: { studentId: string; studentName: string; rollNumber: string; status: 'present' | 'absent' | 'late' }[]
  ) => void;
  addStudyMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => void;
  
  // Question Bank & Assessments
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
  
  // Fee Management & Payment History
  recordFeePayment: (
    invoiceId: string,
    amount: number,
    paymentMethod: 'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash',
    notes?: string
  ) => PaymentReceipt;
  recordDirectFeePayment: (data: {
    studentId: string;
    amount: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    installmentDescription?: string;
    notes?: string;
    transactionReference?: string;
  }) => PaymentReceipt;
  
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
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'attendanceRate'>) => void;
  resetToDefaultData: () => void;
  
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

const STORAGE_PREFIX = 'vrm_ias_erp_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error('Failed to parse localStorage for', key, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage for', key, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state - defaults to false so user is presented with the RBAC mock login screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadFromStorage<boolean>('is_authenticated', false));
  const [role, setRoleState] = useState<UserRole>(() => loadFromStorage<UserRole>('role', 'management'));
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedRole = loadFromStorage<UserRole>('role', 'management');
    return INITIAL_USER_PROFILES[savedRole] || INITIAL_USER_PROFILES.management;
  });

  // UI state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadFromStorage<'light' | 'dark'>('theme', 'light'));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => loadFromStorage<boolean>('sidebar_collapsed', false));
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // App active tab
  const [activeTab, setActiveTabState] = useState<string>(() => loadFromStorage<string>('active_tab', 'crm'));

  // Core Data
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage('courses', INITIAL_COURSES));
  const [batches, setBatches] = useState<Batch[]>(() => loadFromStorage('batches', INITIAL_BATCHES));
  const [counselors, setCounselors] = useState<Counselor[]>(() => loadFromStorage('counselors', INITIAL_COUNSELORS));
  const [leads, setLeads] = useState<Lead[]>(() => loadFromStorage('leads', INITIAL_LEADS));
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('students', INITIAL_STUDENTS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('invoices', INITIAL_INVOICES));
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => loadFromStorage('receipts', INITIAL_RECEIPTS));
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(() => loadFromStorage('schedule', INITIAL_SCHEDULE));
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => loadFromStorage('materials', INITIAL_STUDY_MATERIALS));
  const [assessmentTests, setAssessmentTests] = useState<AssessmentTest[]>(() => loadFromStorage('assessmentTests', INITIAL_ASSESSMENT_TESTS));
  const [questionBank, setQuestionBank] = useState<Question[]>(() => loadFromStorage('questionBank', INITIAL_QUESTION_BANK));
  const [studentAttempts, setStudentAttempts] = useState<StudentTestAttempt[]>(() => loadFromStorage('studentAttempts', INITIAL_STUDENT_ATTEMPTS));
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => loadFromStorage('staffMembers', INITIAL_STAFF_MEMBERS));
  const [salaryPayouts, setSalaryPayouts] = useState<SalaryPayout[]>(() => loadFromStorage('salaryPayouts', INITIAL_SALARY_PAYOUTS));
  const [examAlerts, setExamAlerts] = useState<ExamAlert[]>(() => loadFromStorage('examAlerts', INITIAL_EXAM_ALERTS));
  const [announcements, setAnnouncements] = useState<AcademyAnnouncement[]>(() => loadFromStorage('announcements', INITIAL_ANNOUNCEMENTS));
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadFromStorage('tickets', INITIAL_TICKETS));

  const [activeModal, setActiveModal] = useState<{ type: string; data?: any } | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<PaymentReceipt | null>(null);

  // Sync state to localStorage
  useEffect(() => { saveToStorage('is_authenticated', isAuthenticated); }, [isAuthenticated]);
  useEffect(() => { saveToStorage('role', role); }, [role]);
  useEffect(() => { saveToStorage('theme', theme); }, [theme]);
  useEffect(() => { saveToStorage('sidebar_collapsed', isSidebarCollapsed); }, [isSidebarCollapsed]);
  useEffect(() => { saveToStorage('active_tab', activeTab); }, [activeTab]);
  useEffect(() => { saveToStorage('courses', courses); }, [courses]);
  useEffect(() => { saveToStorage('batches', batches); }, [batches]);
  useEffect(() => { saveToStorage('counselors', counselors); }, [counselors]);
  useEffect(() => { saveToStorage('leads', leads); }, [leads]);
  useEffect(() => { saveToStorage('students', students); }, [students]);
  useEffect(() => { saveToStorage('invoices', invoices); }, [invoices]);
  useEffect(() => { saveToStorage('receipts', receipts); }, [receipts]);
  useEffect(() => { saveToStorage('schedule', schedule); }, [schedule]);
  useEffect(() => { saveToStorage('materials', materials); }, [materials]);
  useEffect(() => { saveToStorage('assessmentTests', assessmentTests); }, [assessmentTests]);
  useEffect(() => { saveToStorage('questionBank', questionBank); }, [questionBank]);
  useEffect(() => { saveToStorage('studentAttempts', studentAttempts); }, [studentAttempts]);
  useEffect(() => { saveToStorage('staffMembers', staffMembers); }, [staffMembers]);
  useEffect(() => { saveToStorage('salaryPayouts', salaryPayouts); }, [salaryPayouts]);
  useEffect(() => { saveToStorage('examAlerts', examAlerts); }, [examAlerts]);
  useEffect(() => { saveToStorage('announcements', announcements); }, [announcements]);
  useEffect(() => { saveToStorage('tickets', tickets); }, [tickets]);

  // Handle dark mode class on HTML document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch(err => {
            console.warn('Native fullscreen not allowed in iframe, enabling app viewport fullscreen:', err);
            setIsFullscreen(true);
          });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
      setIsFullscreen(false);
    }
  };

  // Auth Functions
  const login = (emailOrUser: string, _pass: string): boolean => {
    const clean = emailOrUser.toLowerCase().trim();
    let detectedRole: UserRole = 'management';

    if (clean.includes('director') || clean.includes('admin') || clean.includes('murugan')) {
      detectedRole = 'management';
    } else if (clean.includes('registrar') || clean.includes('sangeetha') || clean.includes('office') || clean.includes('finance')) {
      detectedRole = 'office_staff';
    } else if (clean.includes('ramanathan') || clean.includes('faculty') || clean.includes('polity') || clean.includes('mentor')) {
      detectedRole = 'faculty';
    } else if (clean.includes('vrm-2026') || clean.includes('student') || clean.includes('aaditya') || clean.includes('sharma')) {
      detectedRole = 'student';
    } else if (clean.includes('deepa') || clean.includes('agent') || clean.includes('counselor') || clean.includes('outreach')) {
      detectedRole = 'field_agent';
    } else {
      detectedRole = 'management';
    }

    quickLogin(detectedRole);
    return true;
  };

  const quickLogin = (newRole: UserRole) => {
    setRoleState(newRole);
    const profile = INITIAL_USER_PROFILES[newRole] || INITIAL_USER_PROFILES.management;
    setCurrentUser(profile);
    setIsAuthenticated(true);

    // Navigate to role-appropriate home tab
    if (newRole === 'student') {
      setActiveTabState('student_portal');
    } else if (newRole === 'faculty') {
      setActiveTabState('faculty_portal');
    } else if (newRole === 'field_agent') {
      setActiveTabState('crm');
    } else {
      setActiveTabState('crm');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setMobileMenuOpen(false); // Close mobile drawer upon navigation
  };

  const openModal = (type: string, data?: any) => {
    setActiveModal({ type, data });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const viewReceipt = (receipt: PaymentReceipt) => {
    setSelectedReceiptForView(receipt);
  };

  const closeReceiptView = () => {
    setSelectedReceiptForView(null);
  };

  // Actions
  const addLead = (leadData: Partial<Lead>): Lead => {
    const counselor = counselors[leads.length % counselors.length] || counselors[0];
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      studentName: leadData.studentName || 'New Aspirant',
      phone: leadData.phone || '+91 98000 00000',
      email: leadData.email || 'enquiry@example.com',
      targetExamYear: leadData.targetExamYear || '2026',
      targetCourse: leadData.targetCourse || courses[0]?.name || 'UPSC CSE 2026 Foundation',
      source: leadData.source || 'website',
      status: 'new',
      assignedCounselorId: counselor.id,
      assignedCounselorName: counselor.name,
      createdAt: new Date().toISOString(),
      location: leadData.location || 'Chennai',
      notes: leadData.notes || '',
      fieldAgentName: leadData.fieldAgentName,
      followUps: []
    };

    setLeads(prev => [newLead, ...prev]);

    setCounselors(prev =>
      prev.map(c => (c.id === counselor.id ? { ...c, activeLeadsCount: c.activeLeadsCount + 1 } : c))
    );

    return newLead;
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus, notes?: string) => {
    setLeads(prev =>
      prev.map(l => {
        if (l.id !== leadId) return l;
        const updatedFollowUps = [...l.followUps];
        if (notes) {
          updatedFollowUps.push({
            id: `fu-${Date.now()}`,
            timestamp: new Date().toISOString(),
            counselorName: currentUser.name,
            notes,
            statusUpdate: status
          });
        }
        return {
          ...l,
          status,
          followUps: updatedFollowUps
        };
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
            {
              id: `fu-${Date.now()}`,
              timestamp: new Date().toISOString(),
              counselorName: currentUser.name,
              notes,
              nextFollowUpDate: nextDate,
              statusUpdate: newStatus
            }
          ]
        };
      })
    );
  };

  const convertLeadToAdmission = (data: {
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
    paymentMethod: 'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash';
    advancePaymentAmount: number;
    transactionRef?: string;
  }) => {
    const course = courses.find(c => c.id === data.courseId) || courses[0];
    const batch = batches.find(b => b.id === data.batchId) || batches[0];
    
    const baseFee = course.totalFee;
    let discountAmount = 0;
    if (data.scholarship === 'merit_25') {
      discountAmount = Math.round(baseFee * 0.25);
    } else if (data.scholarship === 'ews_rural_40') {
      discountAmount = Math.round(baseFee * 0.40);
    } else if (data.scholarship === 'full_lump_sum_10') {
      discountAmount = Math.round(baseFee * 0.10);
    } else if (data.scholarship === 'custom' && data.customDiscountAmount) {
      discountAmount = data.customDiscountAmount;
    }

    const netFee = baseFee - discountAmount;
    const advancePaid = Math.min(data.advancePaymentAmount, netFee);
    const balanceFee = netFee - advancePaid;

    const rollSuffix = Math.floor(100 + Math.random() * 900);
    const rollNumber = `VRM-2026-${rollSuffix}`;
    const studentId = `stu-${Date.now()}`;

    const newStudent: Student = {
      id: studentId,
      rollNumber,
      name: data.studentName,
      email: data.email,
      phone: data.phone,
      gender: data.gender || 'Not Specified',
      address: data.address || 'Chennai',
      enrolledCourseId: course.id,
      enrolledCourseName: course.name,
      enrolledBatchId: batch.id,
      enrolledBatchName: batch.name,
      admissionDate: new Date().toISOString().split('T')[0],
      totalFee: baseFee,
      scholarshipApplied: data.scholarship,
      discountAmount,
      netFee,
      paidFee: advancePaid,
      balanceFee,
      paymentPlan: data.paymentPlan,
      attendancePercentage: 100.0,
      averageTestScore: 0,
      portalUsername: rollNumber,
      status: 'active',
      guardianName: data.guardianName || 'Guardian',
      guardianPhone: data.guardianPhone || data.phone
    };

    const invoiceList: Invoice[] = [];
    const invoice1Id = `inv-${Date.now()}-1`;
    const receiptId = `rcpt-${Date.now()}`;

    if (data.paymentPlan === 'one_time') {
      invoiceList.push({
        id: invoice1Id,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-1`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 1,
        totalInstallments: 1,
        amount: netFee,
        dueDate: new Date().toISOString().split('T')[0],
        status: advancePaid >= netFee ? 'paid' : 'pending',
        paidDate: advancePaid >= netFee ? new Date().toISOString().split('T')[0] : undefined,
        receiptId: advancePaid > 0 ? receiptId : undefined
      });
    } else if (data.paymentPlan === 'two_installments') {
      const half = Math.round(netFee / 2);
      invoiceList.push({
        id: invoice1Id,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-1`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 1,
        totalInstallments: 2,
        amount: half,
        dueDate: new Date().toISOString().split('T')[0],
        status: advancePaid >= half ? 'paid' : 'pending',
        paidDate: advancePaid >= half ? new Date().toISOString().split('T')[0] : undefined,
        receiptId: advancePaid > 0 ? receiptId : undefined
      });
      invoiceList.push({
        id: `inv-${Date.now()}-2`,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-2`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 2,
        totalInstallments: 2,
        amount: netFee - half,
        dueDate: '2026-12-15',
        status: 'pending'
      });
    } else {
      const third = Math.round(netFee / 3);
      invoiceList.push({
        id: invoice1Id,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-1`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 1,
        totalInstallments: 3,
        amount: third,
        dueDate: new Date().toISOString().split('T')[0],
        status: advancePaid >= third ? 'paid' : 'pending',
        paidDate: advancePaid >= third ? new Date().toISOString().split('T')[0] : undefined,
        receiptId: advancePaid > 0 ? receiptId : undefined
      });
      invoiceList.push({
        id: `inv-${Date.now()}-2`,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-2`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 2,
        totalInstallments: 3,
        amount: third,
        dueDate: '2026-11-20',
        status: 'pending'
      });
      invoiceList.push({
        id: `inv-${Date.now()}-3`,
        invoiceNumber: `VRM-INV-2026-${rollSuffix}-3`,
        studentId,
        studentName: data.studentName,
        studentRollNumber: rollNumber,
        courseName: course.name,
        installmentIndex: 3,
        totalInstallments: 3,
        amount: netFee - (third * 2),
        dueDate: '2027-01-20',
        status: 'pending'
      });
    }

    const newReceipt: PaymentReceipt = {
      id: receiptId,
      receiptNumber: `VRM-RCPT-2026-${rollSuffix}`,
      invoiceId: invoice1Id,
      studentId,
      studentName: data.studentName,
      studentRollNumber: rollNumber,
      courseName: course.name,
      batchName: batch.name,
      amountPaid: advancePaid,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionRef || `TXN-VRM-${Date.now().toString().slice(-8)}`,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      receivedBy: 'P. Sangeetha (Finance Controller)',
      notes: 'Admission enrollment confirmed. Digital classroom ID and LMS credentials activated.'
    };

    setStudents(prev => [newStudent, ...prev]);
    setInvoices(prev => [...invoiceList, ...prev]);
    if (advancePaid > 0) {
      setReceipts(prev => [newReceipt, ...prev]);
    }

    setBatches(prev =>
      prev.map(b => (b.id === batch.id ? { ...b, enrolledCount: b.enrolledCount + 1 } : b))
    );

    if (data.leadId) {
      setLeads(prev =>
        prev.map(l =>
          l.id === data.leadId
            ? {
                ...l,
                status: 'converted',
                convertedStudentId: studentId,
                followUps: [
                  ...l.followUps,
                  {
                    id: `fu-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    counselorName: currentUser.name,
                    notes: `Lead successfully converted! Enrolled as ${newStudent.name} (${rollNumber}) in ${batch.name}. Advance fee ₹${advancePaid.toLocaleString('en-IN')} collected.`,
                    statusUpdate: 'converted'
                  }
                ]
              }
            : l
        )
      );
      setCounselors(prev =>
        prev.map(c =>
          c.name === currentUser.name || c.id === 'csl-01'
            ? { ...c, conversionsThisMonth: c.conversionsThisMonth + 1 }
            : c
        )
      );
    }

    return { student: newStudent, receipt: newReceipt };
  };

  const addCourse = (courseData: Omit<Course, 'id' | 'activeBatchesCount'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `crs-${Date.now()}`,
      activeBatchesCount: 0
    };
    setCourses(prev => [...prev, newCourse]);
  };

  const addBatch = (batchData: Omit<Batch, 'id' | 'enrolledCount'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      enrolledCount: 0
    };
    setBatches(prev => [...prev, newBatch]);
    setCourses(prev =>
      prev.map(c => (c.id === batchData.courseId ? { ...c, activeBatchesCount: c.activeBatchesCount + 1 } : c))
    );
  };

  const recordBatchAttendance = (
    batchId: string,
    _date: string,
    _subject: string,
    records: { studentId: string; studentName: string; rollNumber: string; status: 'present' | 'absent' | 'late' }[]
  ) => {
    setStudents(prev =>
      prev.map(s => {
        const rec = records.find(r => r.studentId === s.id);
        if (!rec) return s;
        let delta = 0;
        if (rec.status === 'present') delta = 0.5;
        else if (rec.status === 'absent') delta = -1.2;
        const newPct = Math.min(100, Math.max(50, Math.round((s.attendancePercentage + delta) * 10) / 10));
        return {
          ...s,
          attendancePercentage: newPct
        };
      })
    );
  };

  const addStudyMaterial = (matData: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
    const newMat: StudyMaterial = {
      ...matData,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setMaterials(prev => [newMat, ...prev]);
  };

  const submitTestAttempt = (attemptData: Omit<StudentTestAttempt, 'id' | 'attemptedAt'>): StudentTestAttempt => {
    const newAttempt: StudentTestAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      attemptedAt: new Date().toISOString()
    };
    setStudentAttempts(prev => [newAttempt, ...prev]);

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== attemptData.studentId) return s;
        const currentAvg = s.averageTestScore || 0;
        const newAvg = currentAvg > 0 ? Math.round(((currentAvg + attemptData.score) / 2) * 10) / 10 : attemptData.score;
        return {
          ...s,
          averageTestScore: newAvg
        };
      })
    );

    return newAttempt;
  };

  const recordFeePayment = (
    invoiceId: string,
    amount: number,
    paymentMethod: 'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash',
    notes?: string
  ): PaymentReceipt => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    const student = students.find(s => s.id === invoice?.studentId);
    const receiptId = `rcpt-${Date.now()}`;
    const rollSuffix = student?.rollNumber.split('-')[2] || '089';

    const newReceipt: PaymentReceipt = {
      id: receiptId,
      receiptNumber: `VRM-RCPT-2026-${rollSuffix}-${Date.now().toString().slice(-4)}`,
      invoiceId,
      studentId: invoice?.studentId || 'stu-01',
      studentName: invoice?.studentName || 'Student',
      studentRollNumber: invoice?.studentRollNumber || 'VRM-2026-089',
      courseName: invoice?.courseName || 'UPSC Foundation',
      batchName: student?.enrolledBatchName || 'Morning Regular Batch',
      amountPaid: amount,
      paymentMethod,
      transactionReference: `TXN-VRM-${Date.now().toString().slice(-8)}`,
      paidAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      receivedBy: `${currentUser.name} (${currentUser.designation})`,
      notes: notes || 'Installment fee cleared successfully.'
    };

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid',
              paidDate: new Date().toISOString().split('T')[0],
              receiptId
            }
          : inv
      )
    );

    if (student) {
      setStudents(prev =>
        prev.map(s =>
          s.id === student.id
            ? {
                ...s,
                paidFee: s.paidFee + amount,
                balanceFee: Math.max(0, s.balanceFee - amount)
              }
            : s
        )
      );
    }

    setReceipts(prev => [newReceipt, ...prev]);
    return newReceipt;
  };

  // Direct Fee Payment Logger (for Student portal or Admin/Management desk)
  const recordDirectFeePayment = (data: {
    studentId: string;
    amount: number;
    paymentMethod: PaymentReceipt['paymentMethod'];
    installmentDescription?: string;
    notes?: string;
    transactionReference?: string;
  }): PaymentReceipt => {
    const student = students.find(s => s.id === data.studentId);
    const rollSuffix = student?.rollNumber.split('-')[2] || '089';
    const receiptNum = `VRM-RCPT-2026-${rollSuffix}-${Date.now().toString().slice(-4)}`;
    
    const newReceipt: PaymentReceipt = {
      id: `rcpt-${Date.now()}`,
      receiptNumber: receiptNum,
      invoiceId: `inv-direct-${Date.now()}`,
      studentId: data.studentId,
      studentName: student?.name || 'Enrolled Student',
      studentRollNumber: student?.rollNumber || 'VRM-2026-089',
      courseName: student?.enrolledCourseName || 'UPSC CSE GS Foundation',
      batchName: student?.enrolledBatchName || 'Morning Regular Batch',
      installmentDescription: data.installmentDescription || 'Tuition Fee Remittance',
      amountPaid: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference || `TXN-VRM-${Date.now().toString().slice(-8)}`,
      paidAt: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      receivedBy: `${currentUser.name} (${currentUser.designation})`,
      notes: data.notes || 'Payment recorded and officially verified.',
      status: 'verified'
    };

    setReceipts(prev => [newReceipt, ...prev]);

    if (student) {
      setStudents(prev =>
        prev.map(s => {
          if (s.id === data.studentId) {
            const newPaid = s.paidFee + data.amount;
            const newBalance = Math.max(0, s.netFee - newPaid);
            return {
              ...s,
              paidFee: newPaid,
              balanceFee: newBalance
            };
          }
          return s;
        })
      );
    }

    return newReceipt;
  };

  // Question Bank Operations
  const addQuestionToBank = (qData: Omit<Question, 'id'>): Question => {
    const newQuestion: Question = {
      ...qData,
      id: `qb-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setQuestionBank(prev => [newQuestion, ...prev]);
    return newQuestion;
  };

  const updateQuestionInBank = (questionId: string, updated: Partial<Question>) => {
    setQuestionBank(prev => prev.map(q => (q.id === questionId ? { ...q, ...updated } : q)));
  };

  const deleteQuestionFromBank = (questionId: string) => {
    setQuestionBank(prev => prev.filter(q => q.id !== questionId));
  };

  const createTestFromQuestionBank = (data: {
    title: string;
    code: string;
    subject: string;
    category: AssessmentTest['category'];
    durationMinutes: number;
    batchIds: string[];
    questionIds: string[];
    negativeMarksPerWrong?: number;
  }): AssessmentTest => {
    const selectedQuestions = questionBank.filter(q => data.questionIds.includes(q.id));
    const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 2), 0);
    const newTest: AssessmentTest = {
      id: `test-${Date.now()}`,
      title: data.title,
      code: data.code,
      subject: data.subject,
      category: data.category,
      totalMarks,
      durationMinutes: data.durationMinutes,
      questionsCount: selectedQuestions.length,
      questions: selectedQuestions,
      negativeMarksPerWrong: data.negativeMarksPerWrong ?? (data.subject.toLowerCase().includes('csat') ? 0.83 : 0.66),
      scheduledDate: new Date().toISOString().split('T')[0],
      batchIds: data.batchIds
    };

    setAssessmentTests(prev => [newTest, ...prev]);
    return newTest;
  };

  const addExamAlert = (alertData: Omit<ExamAlert, 'id'>) => {
    const newAlert: ExamAlert = {
      ...alertData,
      id: `alert-${Date.now()}`
    };
    setExamAlerts(prev => [newAlert, ...prev]);
  };

  const addAnnouncement = (annData: Omit<AcademyAnnouncement, 'id' | 'date'>) => {
    const newAnn: AcademyAnnouncement = {
      ...annData,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const createSupportTicket = (ticketData: {
    studentOrStaffId: string;
    userName: string;
    userRole: UserRole;
    category: SupportTicket['category'];
    subject: string;
    description: string;
    priority: SupportTicket['priority'];
  }): SupportTicket => {
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      ...ticketData,
      status: 'open',
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      lastUpdated: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      messages: [
        {
          sender: ticketData.userName,
          isStaff: ticketData.userRole !== 'student',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
          text: ticketData.description
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const replyToTicket = (ticketId: string, text: string, isStaff: boolean, senderName: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: isStaff && t.status === 'open' ? 'in_progress' : t.status,
          lastUpdated: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
          messages: [
            ...t.messages,
            {
              sender: senderName,
              isStaff,
              timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
              text
            }
          ]
        };
      })
    );
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status, lastUpdated: new Date().toLocaleString('en-IN') } : t))
    );
  };

  const addStaffMember = (staffData: Omit<StaffMember, 'id' | 'attendanceRate'>) => {
    const newStaff: StaffMember = {
      ...staffData,
      id: `staff-${Date.now()}`,
      attendanceRate: 98.0
    };
    setStaffMembers(prev => [...prev, newStaff]);
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setCourses(INITIAL_COURSES);
    setBatches(INITIAL_BATCHES);
    setCounselors(INITIAL_COUNSELORS);
    setLeads(INITIAL_LEADS);
    setStudents(INITIAL_STUDENTS);
    setInvoices(INITIAL_INVOICES);
    setReceipts(INITIAL_RECEIPTS);
    setSchedule(INITIAL_SCHEDULE);
    setMaterials(INITIAL_STUDY_MATERIALS);
    setAssessmentTests(INITIAL_ASSESSMENT_TESTS);
    setQuestionBank(INITIAL_QUESTION_BANK);
    setStudentAttempts(INITIAL_STUDENT_ATTEMPTS);
    setStaffMembers(INITIAL_STAFF_MEMBERS);
    setSalaryPayouts(INITIAL_SALARY_PAYOUTS);
    setExamAlerts(INITIAL_EXAM_ALERTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setTickets(INITIAL_TICKETS);
    setRoleState('management');
    setCurrentUser(INITIAL_USER_PROFILES.management);
    setActiveTabState('crm');
    setIsAuthenticated(true);
    setTheme('light');
  };

  const notificationCount = examAlerts.filter(a => a.status === 'active').length + announcements.length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        role,
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
        courses,
        batches,
        counselors,
        leads,
        students,
        invoices,
        receipts,
        schedule,
        materials,
        assessmentTests,
        questionBank,
        studentAttempts,
        staffMembers,
        salaryPayouts,
        examAlerts,
        announcements,
        tickets,
        addLead,
        updateLeadStatus,
        addFollowUp,
        convertLeadToAdmission,
        addCourse,
        addBatch,
        recordBatchAttendance,
        addStudyMaterial,
        addQuestionToBank,
        updateQuestionInBank,
        deleteQuestionFromBank,
        createTestFromQuestionBank,
        submitTestAttempt,
        recordFeePayment,
        recordDirectFeePayment,
        addExamAlert,
        addAnnouncement,
        createSupportTicket,
        replyToTicket,
        updateTicketStatus,
        addStaffMember,
        resetToDefaultData,
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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
