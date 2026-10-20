export type UserRole = 'management' | 'office_staff' | 'faculty' | 'student' | 'field_agent';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  avatar?: string;
  phone: string;
}

export type LeadStatus = 'new' | 'contacted' | 'consultation_scheduled' | 'demo_attended' | 'ready_to_join' | 'converted' | 'dropped';
export type LeadSource = 'website' | 'walk_in' | 'field_agent' | 'referral' | 'seminar';

export interface FollowUpLog {
  id: string;
  timestamp: string;
  counselorName: string;
  notes: string;
  nextFollowUpDate?: string;
  statusUpdate: LeadStatus;
}

export interface Lead {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  targetExamYear: string;
  targetCourse: string;
  source: LeadSource;
  status: LeadStatus;
  assignedCounselorId: string;
  assignedCounselorName: string;
  createdAt: string;
  consultationDate?: string;
  notes?: string;
  followUps: FollowUpLog[];
  convertedStudentId?: string;
  fieldAgentName?: string;
  location?: string;
}

export interface Counselor {
  id: string;
  name: string;
  phone: string;
  email: string;
  activeLeadsCount: number;
  conversionsThisMonth: number;
  averageResponseMinutes: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  category: 'GS Foundation' | 'Optional Subject' | 'CSAT' | 'Test Series' | 'State PSC';
  durationMonths: number;
  totalFee: number;
  description: string;
  syllabusHighlights: string[];
  activeBatchesCount: number;
}

export interface Batch {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  code: string;
  timing: string;
  days: string;
  room: string;
  maxCapacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  leadFacultyId: string;
  leadFacultyName: string;
}

export type ScholarshipType = 'none' | 'merit_25' | 'ews_rural_40' | 'full_lump_sum_10' | 'custom';
export type PaymentPlanType = 'one_time' | 'two_installments' | 'three_installments';

export interface Student {
  id: string;
  rollNumber: string; // e.g. VRM-2026-089
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  enrolledCourseId: string;
  enrolledCourseName: string;
  enrolledBatchId: string;
  enrolledBatchName: string;
  admissionDate: string;
  totalFee: number;
  scholarshipApplied: ScholarshipType;
  discountAmount: number;
  netFee: number;
  paidFee: number;
  balanceFee: number;
  paymentPlan: PaymentPlanType;
  attendancePercentage: number;
  averageTestScore: number;
  portalUsername: string;
  status: 'active' | 'graduated' | 'suspended';
  guardianName: string;
  guardianPhone: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  courseName: string;
  installmentIndex: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  receiptId?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  courseName: string;
  batchName: string;
  installmentDescription?: string;
  amountPaid: number;
  paymentMethod: 'UPI' | 'Credit/Debit Card' | 'NetBanking' | 'Demand Draft' | 'Cash';
  transactionReference: string;
  paidAt: string;
  receivedBy: string;
  notes?: string;
  status?: 'verified' | 'reconciled';
}

export interface ClassScheduleItem {
  id: string;
  batchId: string;
  batchName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  subject: string;
  topic: string;
  facultyName: string;
  room: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  batchId: string;
  batchName: string;
  subject: string;
  facultyId: string;
  records: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: 'present' | 'absent' | 'late';
  }[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'PDF Notes' | 'Handwritten Digest' | 'Mindmap' | 'Question Compendium' | 'Current Affairs';
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  targetScope: 'all' | 'batch' | 'individual';
  targetBatchId?: string;
  targetBatchName?: string;
  targetStudentId?: string;
  downloadUrl?: string;
  pageCount: number;
  summary: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject: string;
  topic?: string;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  marks: number; // e.g. 2, 2.5, 4
  negativeMarks: number; // e.g. 0.66, 1
  tags?: string[];
  pyqYear?: string;
  createdAt?: string;
  authorFaculty?: string;
}

export interface AssessmentTest {
  id: string;
  title: string;
  code: string;
  subject: string;
  category: 'Prelims Mock' | 'Mains Practice' | 'Subject Drill';
  totalMarks: number;
  durationMinutes: number;
  questionsCount: number;
  questions: Question[];
  negativeMarksPerWrong: number; // e.g. 0.66
  scheduledDate: string;
  batchIds: string[];
}

export interface StudentTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  attemptedAt: string;
  score: number;
  totalMarks: number;
  accuracyPercentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  rankInBatch: number;
  userAnswers: Record<string, number>; // questionId -> chosenIndex
  subjectBreakdown: {
    subject: string;
    score: number;
    total: number;
  }[];
  improvementAreas: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: 'Faculty' | 'Administration' | 'Counseling' | 'Finance';
  subjectsHandling?: string[];
  assignedBatches?: string[];
  phone: string;
  email: string;
  monthlySalary: number;
  joiningDate: string;
  status: 'active' | 'on_leave';
  attendanceRate: number;
}

export interface SalaryPayout {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  baseSalary: number;
  incentives: number;
  deductions: number;
  netPayout: number;
  paymentDate: string;
  status: 'paid' | 'processing';
  transactionRef: string;
}

export interface ExamAlert {
  id: string;
  examName: string;
  organization: string; // e.g. UPSC, TNPSC, SSC
  postNames: string;
  vacancies: string;
  notificationDate: string;
  applicationDeadline: string;
  examDate: string;
  officialApplyUrl: string;
  targetAudience: 'All' | 'Students' | 'Staff' | 'Website';
  keyHighlights: string[];
  status: 'active' | 'upcoming' | 'expired';
}

export interface AcademyAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'high' | 'normal';
  audience: 'All' | 'Students' | 'Faculty';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  studentOrStaffId: string;
  userName: string;
  userRole: UserRole;
  category: 'Fee & Invoicing' | 'Portal Login' | 'Test Evaluation' | 'Classroom & Batch' | 'Material Access' | 'Other';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  lastUpdated: string;
  assignedTo?: string;
  messages: {
    sender: string;
    isStaff: boolean;
    timestamp: string;
    text: string;
  }[];
}
