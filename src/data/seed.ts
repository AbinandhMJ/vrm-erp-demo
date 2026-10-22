/**
 * Deterministic demo-data generator.
 *
 * Builds ~200 students with fee plans, invoices, receipts, class attendance, test attempts,
 * leads (with conversions linked to students), login accounts, staff attendance and payroll —
 * all internally consistent and dated relative to "today", so the demo always looks live.
 * The same seed produces the same data on every reset.
 */
import {
  AssessmentTest,
  AttendanceSession,
  Counselor,
  Invoice,
  Lead,
  LeadSource,
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
  UserAccount,
  DailyQuizAttempt
} from '../types';
import {
  INITIAL_ASSESSMENT_TESTS,
  INITIAL_BATCHES,
  INITIAL_COUNSELORS,
  INITIAL_COURSES,
  INITIAL_LEADS,
  INITIAL_QUESTION_BANK,
  INITIAL_SCHEDULE,
  INITIAL_STAFF_MEMBERS,
  INITIAL_STUDENTS
} from './mockData';
import { addDays, parseISODate, todayISO, toISODate, weekdayOf } from '../lib/dates';
import { allocatePayment, buildInstallmentSchedule, buildMonthlySchedule, computeDiscount } from '../lib/fees';
import { pickDailyQuestions } from '../lib/dailyQuiz';

// ---------- deterministic randomness ----------
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let rand = mulberry32(2026);
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const weighted = <T,>(pairs: [T, number][]): T => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
};

// ---------- name pools ----------
const MALE = ['Arun', 'Bharath', 'Dinesh', 'Gokul', 'Hari', 'Karthikeyan', 'Manoj', 'Naveen', 'Pradeep', 'Rahul', 'Sanjay', 'Senthil', 'Surya', 'Vignesh', 'Ajith', 'Balaji', 'Ganesh', 'Kishore', 'Mukesh', 'Prakash', 'Ramesh', 'Sathish', 'Siva', 'Vasanth', 'Yogesh', 'Ashwin', 'Deepak', 'Jeevan', 'Lokesh', 'Nithin', 'Rohit', 'Tharun', 'Vikram', 'Abishek', 'Jerin', 'Ebin', 'Shibu', 'Anto', 'Joel', 'Ragul'];
const FEMALE = ['Aishwarya', 'Bhavya', 'Divya', 'Gayathri', 'Harini', 'Janani', 'Kavya', 'Lakshmi', 'Monisha', 'Nandhini', 'Pavithra', 'Ramya', 'Sandhya', 'Sowmya', 'Swetha', 'Abinaya', 'Deepika', 'Keerthana', 'Madhumitha', 'Nivetha', 'Preethi', 'Revathi', 'Shalini', 'Sneha', 'Varsha', 'Anitha', 'Dharshini', 'Jenifer', 'Mahalakshmi', 'Priyanka', 'Sangeetha', 'Subha', 'Vaishnavi', 'Ancy', 'Merlin', 'Sherin', 'Jasmine', 'Ashly'];
const SURNAMES = ['Murugan', 'Subramanian', 'Krishnan', 'Rajendran', 'Selvam', 'Pandian', 'Natarajan', 'Kumar', 'Raj', 'Sundaram', 'Ramasamy', 'Velu', 'Pillai', 'Nadar', 'Joseph', 'Thomas', 'Devadas', 'Shanmugam', 'Ganesan', 'Arumugam', 'Chandran', 'Mohan', 'Balasubramanian', 'Iyer', 'Venkatesh'];
const PLACES = ['Perambalur', 'Perambalur', 'Ariyalur', 'Thuraiyur', 'Kunnam', 'Veppanthattai', 'Jayankondam', 'Tiruchirappalli', 'Lalgudi', 'Attur', 'Namakkal', 'Kallakurichi', 'Salem', 'Udayarpalayam', 'Chinnasalem'];
const STREETS = ['Main Road', 'Church Street', 'Temple Street', 'Gandhi Nagar', 'Nehru Street', 'Anna Nagar', 'Bazaar Road', 'Lake View Road', 'College Road', 'Station Road'];
const EMAIL_DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.co.in', 'outlook.com'];

const phone = () => `+91 ${pick(['94', '95', '97', '98', '99', '63', '70', '80'])}${int(100, 999)} ${int(10000, 99999)}`;

// ---------- reference data ----------
const TODAY = todayISO();
const courseById = new Map(INITIAL_COURSES.map(c => [c.id, c]));
const batchName = (id: string) => (INITIAL_BATCHES.find(b => b.id === id)?.timing || 'regular batch');

/** How many students to put in each batch (featured students included). */
const BATCH_TARGETS: Record<string, number> = {
  'batch-01': 46,
  'batch-02': 34,
  'batch-03': 28,
  'batch-04': 22,
  'batch-05': 26,
  'batch-06': 38,
  'batch-07': 14
};

const PAYMENT_METHODS: [PaymentReceipt['paymentMethod'], number][] = [
  ['UPI', 45],
  ['Cash', 20],
  ['Credit/Debit Card', 15],
  ['NetBanking', 15],
  ['Demand Draft', 5]
];

const RECEIVERS = ['P. Sangeetha (Head Registrar & Finance Controller)', 'J. Sathish Kumar (Front Office & Accounts Executive)'];

// Per-student behaviour profiles used by the generators below.
interface Profile {
  attendanceP: number;
  ability: number;
  paysOnTime: boolean;
}

// ---------- main builder ----------
export interface SeedData {
  students: Student[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  attendance: AttendanceSession[];
  assessmentTests: AssessmentTest[];
  studentAttempts: StudentTestAttempt[];
  leads: Lead[];
  counselors: Counselor[];
  accounts: UserAccount[];
  staffMembers: StaffMember[];
  staffAttendance: StaffAttendanceEntry[];
  salaryPayouts: SalaryPayout[];
  dailyQuizAttempts: DailyQuizAttempt[];
}

export const buildSeed = (): SeedData => {
  rand = mulberry32(2026); // reset so every call yields identical data

  const students: Student[] = [];
  const profiles = new Map<string, Profile>();
  const usedRolls = new Set(INITIAL_STUDENTS.map(s => s.rollNumber));
  let rollCursor = 1;
  const nextRoll = () => {
    while (usedRolls.has(`VRM-2026-${String(rollCursor).padStart(3, '0')}`)) rollCursor++;
    const r = `VRM-2026-${String(rollCursor).padStart(3, '0')}`;
    usedRolls.add(r);
    return r;
  };

  // 1. Featured (hand-written) students keep their identity; financials are recomputed below.
  const featuredProfiles: Record<string, Profile> = {
    'stu-01': { attendanceP: 0.92, ability: 0.8, paysOnTime: true },
    'stu-02': { attendanceP: 0.96, ability: 0.88, paysOnTime: true },
    'stu-03': { attendanceP: 0.88, ability: 0.7, paysOnTime: true },
    'stu-04': { attendanceP: 0.84, ability: 0.66, paysOnTime: false },
    'stu-05': { attendanceP: 0.94, ability: 0.82, paysOnTime: true }
  };
  for (const f of INITIAL_STUDENTS) {
    const course = courseById.get(f.enrolledCourseId)!;
    students.push({
      ...f,
      enrolledCourseName: course.name,
      totalFee: course.totalFee,
      discountAmount: computeDiscount(course.totalFee, f.scholarshipApplied),
      netFee: course.totalFee - computeDiscount(course.totalFee, f.scholarshipApplied)
    });
    profiles.set(f.id, featuredProfiles[f.id]);
  }

  // 2. Generated students per batch.
  let stuCounter = 6;
  for (const batch of INITIAL_BATCHES) {
    const course = courseById.get(batch.courseId)!;
    const already = students.filter(s => s.enrolledBatchId === batch.id).length;
    const target = BATCH_TARGETS[batch.id] ?? 10;
    for (let i = already; i < target; i++) {
      const female = chance(0.48);
      const first = female ? pick(FEMALE) : pick(MALE);
      const last = pick(SURNAMES);
      const name = `${first} ${last}`;
      // Admissions spread from 3 weeks before batch start up to ~6 weeks after it (never in the future).
      // ~18% are late joiners admitted in the last ~7 weeks, so recent months stay active.
      const admissionDate = (() => {
        if (chance(0.18) && batch.startDate < addDays(TODAY, -20)) return addDays(TODAY, -int(1, 48));
        const d = addDays(batch.startDate, int(-21, 42));
        return d > TODAY ? addDays(TODAY, -int(1, 10)) : d;
      })();
      const scholarship: ScholarshipType = weighted([
        ['none', 55],
        ['merit_25', 15],
        ['ews_rural_40', 12],
        ['full_lump_sum_10', 10],
        ['custom', 8]
      ]);
      const plan: PaymentPlanType =
        scholarship === 'full_lump_sum_10'
          ? 'one_time'
          : weighted([
              ['one_time', 25],
              ['two_installments', 40],
              ['three_installments', 25],
              ['monthly', 12]
            ]);
      const custom = scholarship === 'custom' ? pick([5000, 7500, 10000, 15000]) : 0;
      const discount = computeDiscount(course.totalFee, scholarship, custom);
      const ph = phone();
      const roll = nextRoll();
      const id = `stu-${String(stuCounter++).padStart(3, '0')}`;
      students.push({
        id,
        rollNumber: roll,
        name,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${int(1, 99)}@${pick(EMAIL_DOMAINS)}`,
        phone: ph,
        gender: female ? 'Female' : 'Male',
        address: `${int(1, 220)}, ${pick(STREETS)}, ${pick(PLACES)}`,
        enrolledCourseId: course.id,
        enrolledCourseName: course.name,
        enrolledBatchId: batch.id,
        enrolledBatchName: batch.name,
        admissionDate,
        totalFee: course.totalFee,
        scholarshipApplied: scholarship,
        discountAmount: discount,
        netFee: course.totalFee - discount,
        paidFee: 0,
        balanceFee: 0,
        paymentPlan: plan,
        attendancePercentage: 0,
        averageTestScore: 0,
        portalUsername: roll,
        status: 'active',
        guardianName: `${pick(['S.', 'K.', 'R.', 'M.', 'P.', 'T.'])} ${last}`,
        guardianPhone: phone()
      });
      profiles.set(id, {
        attendanceP: 0.76 + rand() * 0.23,
        ability: 0.4 + rand() * 0.5,
        paysOnTime: chance(0.8)
      });
    }
  }

  // 2b. Admission-form details for every student (matches VRM's printed form).
  const QUALS = ['B.Sc Mathematics', 'B.E. Civil', 'B.A. History', 'B.Com', 'B.Sc Agriculture', 'B.E. ECE', 'M.A. Tamil', 'B.Sc Physics', 'M.Sc Chemistry', 'B.A. English', 'B.Tech IT'];
  const OCCUPATIONS = ['Farmer', 'Teacher', 'Business', 'Govt. employee', 'Driver', 'Shop owner', 'Retired', 'Daily wage worker', 'Nurse'];
  const AIMS: Record<string, string[]> = {
    'GS Foundation': ['IAS', 'IPS', 'IFS', 'IRS'],
    CSAT: ['Clear UPSC Prelims', 'IAS'],
    'Optional Subject': ['IAS', 'Score 300+ in optional'],
    'State PSC': ['Deputy Collector (Group 1)', 'DSP (Group 1)', 'Assistant Commissioner'],
    'Test Series': ['IAS']
  };
  const REFERENCES = ['Friend studying here', 'Alumni recommendation', 'Website', 'Newspaper advertisement', 'Instagram', 'College seminar', 'Relative', 'Walk-in'];
  const EXAMS = ['None (first attempt)', 'TNPSC Group 4 (2024)', 'TNPSC Group 2 Prelims (2024)', 'UPSC CSE Prelims (2025)', 'SSC CGL Tier 1 (2025)', 'IBPS PO Prelims (2024)', 'TNUSRB SI (2025)'];
  for (const s of students) {
    const course = courseById.get(s.enrolledCourseId)!;
    s.qualification ||= pick(QUALS);
    s.occupation ||= pick(OCCUPATIONS);
    s.dateOfBirth ||= addDays(TODAY, -int(21 * 365, 30 * 365));
    s.examsAttended ||= pick(EXAMS);
    s.specialCategory ||= chance(0.9) ? 'None' : pick(['Person with disability', 'First graduate', 'Ex-serviceman']);
    s.aim ||= pick(AIMS[course.category] || ['IAS']);
    s.reference ||= pick(REFERENCES);
    s.courseDetails ||= `Classroom, ${batchName(s.enrolledBatchId)}`;
    s.declarationAcceptedAt ||= `${s.admissionDate}T10:00:00.000Z`;
  }

  // 3. Invoices + receipts (sequential numbering in date order).
  const invoices: Invoice[] = [];
  const receipts: PaymentReceipt[] = [];
  type PendingPayment = { student: Student; date: string; amount: number; description: string };
  const payments: PendingPayment[] = [];
  let invSeq = 1;

  for (const s of [...students].sort((a, b) => a.admissionDate.localeCompare(b.admissionDate))) {
    const schedule: { amount: number; dueDate: string; label?: string }[] =
      s.paymentPlan === 'monthly'
        ? buildMonthlySchedule(s.netFee, 10, s.admissionDate, { firstPayment: Math.round((s.netFee * 0.2) / 500) * 500 })
        : buildInstallmentSchedule(s.netFee, s.paymentPlan, s.admissionDate);
    schedule.forEach((inst, idx) => {
      invoices.push({
        id: `inv-${s.id}-${idx + 1}`,
        invoiceNumber: `VRM/INV/2026/${String(invSeq++).padStart(5, '0')}`,
        studentId: s.id,
        studentName: s.name,
        studentRollNumber: s.rollNumber,
        courseName: s.enrolledCourseName,
        installmentIndex: idx + 1,
        totalInstallments: schedule.length,
        amount: inst.amount,
        dueDate: inst.dueDate,
        label: inst.label,
        status: 'pending',
        paidAmount: 0
      });
    });
    const p = profiles.get(s.id)!;
    // Advance at admission: usually the full first installment, sometimes a part of it.
    const first = schedule[0].amount;
    const advance = chance(0.82) ? first : Math.round((first * pick([0.4, 0.5, 0.6])) / 500) * 500;
    payments.push({ student: s, date: s.admissionDate, amount: advance, description: 'Admission advance (Installment 1)' });
    if (advance < first && (p.paysOnTime || chance(0.5))) {
      const d = addDays(s.admissionDate, int(10, 35));
      if (d < TODAY) payments.push({ student: s, date: d, amount: first - advance, description: 'Balance of Installment 1' });
    }
    schedule.slice(1).forEach((inst, idx) => {
      if (inst.dueDate >= TODAY) return; // not yet due
      if (!p.paysOnTime && chance(0.7)) return; // defaulter
      const d = addDays(inst.dueDate, -int(0, 10));
      if (d < TODAY) payments.push({ student: s, date: d, amount: inst.amount, description: `Installment ${idx + 2} of ${schedule.length}` });
    });
  }

  payments.sort((a, b) => a.date.localeCompare(b.date));
  let rcptSeq = 1;
  const invoiceIndex = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const list = invoiceIndex.get(inv.studentId) || [];
    list.push(inv);
    invoiceIndex.set(inv.studentId, list);
  }
  for (const pay of payments) {
    const rid = `rcpt-${String(rcptSeq).padStart(5, '0')}`;
    const studentInvoices = invoiceIndex.get(pay.student.id)!;
    const { updated, allocations } = allocatePayment(studentInvoices, pay.amount, pay.date, rid);
    invoiceIndex.set(pay.student.id, updated);
    const method = weighted(PAYMENT_METHODS);
    const hh = int(9, 18);
    const mm = int(0, 59);
    receipts.push({
      id: rid,
      receiptNumber: `VRM/RCPT/2026/${String(rcptSeq).padStart(5, '0')}`,
      invoiceId: allocations[0]?.invoiceId || studentInvoices[0].id,
      studentId: pay.student.id,
      studentName: pay.student.name,
      studentRollNumber: pay.student.rollNumber,
      courseName: pay.student.enrolledCourseName,
      batchName: pay.student.enrolledBatchName,
      installmentDescription: pay.description,
      amountPaid: pay.amount,
      paymentMethod: method,
      transactionReference:
        method === 'Cash'
          ? `CASH-${pay.date.replace(/-/g, '')}-${int(100, 999)}`
          : method === 'Demand Draft'
            ? `DD-${int(100000, 999999)}`
            : `${method === 'UPI' ? 'UPI' : 'TXN'}${int(100000000, 999999999)}`,
      paidAt: `${parseISODate(pay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${String(hh % 12 || 12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'pm' : 'am'}`,
      paidOn: pay.date,
      receivedBy: method === 'Cash' || method === 'Demand Draft' ? pick(RECEIVERS) : 'Online Payment Gateway (auto-verified)',
      notes: pay.description,
      status: 'verified',
      allocations
    });
    rcptSeq++;
  }
  const finalInvoices = [...invoiceIndex.values()].flat();

  // 4. Attendance sessions from each batch's weekly timetable, batch start → yesterday.
  const attendance: AttendanceSession[] = [];
  const rosterByBatch = new Map<string, Student[]>();
  for (const s of students) {
    const list = rosterByBatch.get(s.enrolledBatchId) || [];
    list.push(s);
    rosterByBatch.set(s.enrolledBatchId, list);
  }
  for (const batch of INITIAL_BATCHES) {
    const slots = INITIAL_SCHEDULE.filter(x => x.batchId === batch.id);
    if (slots.length === 0) continue;
    const roster = rosterByBatch.get(batch.id) || [];
    for (let d = batch.startDate; d < TODAY && d <= batch.endDate; d = addDays(d, 1)) {
      const slot = slots.find(x => x.day === weekdayOf(d));
      if (!slot) continue;
      if (chance(0.03)) continue; // holiday / cancelled class
      const absentIds: string[] = [];
      const lateIds: string[] = [];
      for (const s of roster) {
        if (s.admissionDate > d) continue;
        const p = profiles.get(s.id)!;
        const r = rand();
        if (r > p.attendanceP) absentIds.push(s.id);
        else if (r > p.attendanceP - 0.04) lateIds.push(s.id);
      }
      attendance.push({
        id: `att-${batch.id}-${d}`,
        date: d,
        batchId: batch.id,
        subject: slot.subject,
        facultyName: slot.facultyName,
        absentIds,
        lateIds
      });
    }
  }

  // 5. Tests: the hand-written ones plus three past mocks assembled from the question bank.
  const qb = new Map(INITIAL_QUESTION_BANK.map(q => [q.id, q]));
  const fromBank = (ids: string[]): Question[] => ids.map(id => qb.get(id)).filter(Boolean) as Question[];
  const normalise = (t: AssessmentTest): AssessmentTest => ({
    ...t,
    status: 'published',
    mode: 'online',
    resultRelease: 'immediate',
    // test-01 stays open from yesterday to tomorrow so the demo always has a live exam; test-02 is upcoming.
    startAt: t.id === 'test-01' ? `${addDays(TODAY, -1)}T06:00` : t.id === 'test-02' ? `${t.scheduledDate}T10:00` : `${t.scheduledDate}T09:00`,
    endAt: t.id === 'test-01' ? `${addDays(TODAY, 1)}T22:00` : t.id === 'test-02' ? `${t.scheduledDate}T13:00` : `${t.scheduledDate}T21:00`,
    instructions: 'Each question has one correct answer. Wrong answers carry negative marks. Do not refresh the page during the exam.',
    createdBy: 'Dr. K. Ramanathan',
    questionsCount: t.questions.length,
    totalMarks: Math.round(t.questions.reduce((sum, q) => sum + (q.marks || 2), 0) * 100) / 100
  });
  const gsBatches = ['batch-01', 'batch-02', 'batch-03'];
  const pastTests = ([
    {
      id: 'test-p01',
      title: 'UPSC Prelims Mock 01: Polity Foundations',
      code: 'VRM-PRE-MOCK-01',
      subject: 'Indian Polity',
      category: 'Prelims Mock',
      totalMarks: 0,
      durationMinutes: 15,
      questionsCount: 0,
      questions: fromBank(['qb-101', 'qb-102', 'qb-103', 'qb-104', 'qb-105', 'qb-106']),
      negativeMarksPerWrong: 0.66,
      scheduledDate: addDays(TODAY, -84),
      batchIds: gsBatches
    },
    {
      id: 'test-p02',
      title: 'UPSC Prelims Mock 02: Economy, History & Geography',
      code: 'VRM-PRE-MOCK-02',
      subject: 'Mixed GS',
      category: 'Prelims Mock',
      totalMarks: 0,
      durationMinutes: 15,
      questionsCount: 0,
      questions: fromBank(['qb-201', 'qb-202', 'qb-301', 'qb-302', 'qb-401']),
      negativeMarksPerWrong: 0.66,
      scheduledDate: addDays(TODAY, -56),
      batchIds: gsBatches
    },
    {
      id: 'test-p03',
      title: 'GS Subject Drill 03: Science, Tech & CSAT Warm-up',
      code: 'VRM-DRILL-03',
      subject: 'Science & Technology',
      category: 'Subject Drill',
      totalMarks: 0,
      durationMinutes: 10,
      questionsCount: 0,
      questions: fromBank(['qb-501', 'qb-601', 'qb-201', 'qb-104']),
      negativeMarksPerWrong: 0.66,
      scheduledDate: addDays(TODAY, -28),
      batchIds: [...gsBatches, 'batch-05']
    }
  ] as AssessmentTest[]).filter(t => t.questions.length > 0);

  const handWritten = INITIAL_ASSESSMENT_TESTS.map(t => ({
    ...t,
    // Keep the "live" mock current: one test today-ish, the next one upcoming.
    scheduledDate: t.id === 'test-01' ? addDays(TODAY, -1) : t.id === 'test-02' ? addDays(TODAY, 2) : t.scheduledDate
  }));
  const assessmentTests = [...handWritten, ...pastTests].map(normalise);

  const studentAttempts: StudentTestAttempt[] = [];
  for (const test of assessmentTests) {
    if (test.scheduledDate >= TODAY) continue;
    const takers = students.filter(
      s => test.batchIds.includes(s.enrolledBatchId) && s.admissionDate <= test.scheduledDate
    );
    const scored: StudentTestAttempt[] = [];
    for (const s of takers) {
      if (s.id === 'stu-01' && test.id === 'test-01') continue; // left for the live demo
      if (!chance(0.88)) continue; // missed the test
      const p = profiles.get(s.id)!;
      const userAnswers: Record<string, number> = {};
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let score = 0;
      const byTopic = new Map<string, { score: number; total: number }>();
      const weak: string[] = [];
      for (const q of test.questions) {
        const topic = q.topic || q.subject;
        const bucket = byTopic.get(topic) || { score: 0, total: 0 };
        bucket.total += q.marks;
        const r = rand();
        const difficultyPenalty = q.difficulty === 'Advanced' ? 0.15 : q.difficulty === 'Moderate' ? 0.05 : 0;
        if (r < 0.08) {
          skipped++;
        } else if (r < 0.08 + (p.ability - difficultyPenalty)) {
          correct++;
          userAnswers[q.id] = q.correctOptionIndex;
          score += q.marks;
          bucket.score += q.marks;
        } else {
          wrong++;
          const wrongOpts = q.options.map((_, i) => i).filter(i => i !== q.correctOptionIndex);
          userAnswers[q.id] = pick(wrongOpts);
          score -= q.negativeMarks ?? test.negativeMarksPerWrong;
          bucket.score -= q.negativeMarks ?? test.negativeMarksPerWrong;
          if (!weak.includes(topic)) weak.push(topic);
        }
        byTopic.set(topic, bucket);
      }
      score = Math.round(score * 100) / 100;
      scored.push({
        id: `att-${test.id}-${s.id}`,
        testId: test.id,
        testTitle: test.title,
        studentId: s.id,
        studentName: s.name,
        attemptedAt: `${test.scheduledDate}T${String(int(9, 18)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00`,
        score,
        totalMarks: test.totalMarks,
        accuracyPercentage: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 1000) / 10 : 0,
        correctAnswers: correct,
        incorrectAnswers: wrong,
        unattempted: skipped,
        rankInBatch: 0,
        userAnswers,
        subjectBreakdown: [...byTopic.entries()].map(([subject, v]) => ({
          subject,
          score: Math.round(v.score * 100) / 100,
          total: v.total
        })),
        improvementAreas: weak.slice(0, 3).map(t => `Revise ${t}: review the explanation for each incorrect answer.`)
      });
    }
    // Rank within each batch by score.
    for (const batchId of test.batchIds) {
      const inBatch = scored
        .filter(a => students.find(s => s.id === a.studentId)?.enrolledBatchId === batchId)
        .sort((a, b) => b.score - a.score);
      inBatch.forEach((a, i) => (a.rankInBatch = i + 1));
    }
    studentAttempts.push(...scored);
  }

  // 6. Leads: one converted lead per ~70% of students, plus open and dropped enquiries.
  const counselors = INITIAL_COUNSELORS.map(c => ({ ...c }));
  const counselorFor = (category: string) => {
    const eligible = counselors.filter(c => c.specializations.includes(category as never));
    return pick(eligible.length ? eligible : counselors);
  };
  const leadSources: [LeadSource, number][] = [
    ['website', 38],
    ['walk_in', 24],
    ['referral', 16],
    ['field_agent', 14],
    ['seminar', 8]
  ];
  const leads: Lead[] = [...INITIAL_LEADS];
  let leadSeq = 1000;
  let fuSeq = 1;
  const stamp = (date: string, minutes: number) => {
    const d = parseISODate(date);
    d.setHours(9 + int(0, 8), int(0, 59) + minutes);
    return d.toISOString();
  };
  /** `date` is either a YYYY-MM-DD day (random office-hours time) or a full ISO timestamp to offset from. */
  const mkFollowUp = (date: string, minutesAfter: number, counselorName: string, notes: string, statusUpdate: LeadStatus, nextFollowUpDate?: string) => ({
    id: `fu-g${fuSeq++}`,
    timestamp: date.length > 10 ? new Date(new Date(date).getTime() + minutesAfter * 60000).toISOString() : stamp(date, minutesAfter),
    counselorName,
    notes,
    statusUpdate,
    nextFollowUpDate
  });

  for (const s of students) {
    if (s.id === 'stu-01' || !chance(0.7)) continue;
    const course = courseById.get(s.enrolledCourseId)!;
    const c = counselorFor(course.category);
    const created = addDays(s.admissionDate, -int(2, 18));
    const createdAt = stamp(created, 0);
    leads.push({
      id: `lead-${leadSeq++}`,
      studentName: s.name,
      phone: s.phone,
      email: s.email,
      targetExamYear: pick(['2026', '2027']),
      targetCourse: course.name,
      source: weighted(leadSources),
      status: 'converted',
      assignedCounselorId: c.id,
      assignedCounselorName: c.name,
      createdAt,
      consultationDate: stamp(addDays(created, 1), 0),
      notes: 'Enquired about batch timings and fee instalment options.',
      location: s.address.split(', ').pop(),
      convertedStudentId: s.id,
      convertedAt: s.admissionDate,
      followUps: [
        mkFollowUp(createdAt, int(3, 22), c.name, 'Called back, shared course brochure and fee structure on WhatsApp.', 'contacted'),
        mkFollowUp(addDays(created, 1), 0, c.name, 'Counselling session done at the academy with parent.', 'consultation_scheduled'),
        mkFollowUp(s.admissionDate, 0, c.name, `Joined ${s.enrolledBatchName} (${s.rollNumber}).`, 'converted')
      ]
    });
  }

  const OPEN_STATUSES: [LeadStatus, number][] = [
    ['new', 18],
    ['contacted', 30],
    ['consultation_scheduled', 22],
    ['demo_attended', 15],
    ['ready_to_join', 10]
  ];
  const DROP_REASONS = ['Joined another academy in Trichy.', 'Fee too high; wants online-only course.', 'Postponed preparation to next year.', 'Not reachable after 3 attempts.', 'Preparing for bank exams instead.'];
  const openLeadCount = 64;
  const droppedLeadCount = 46;
  for (let i = 0; i < openLeadCount + droppedLeadCount; i++) {
    const dropped = i >= openLeadCount;
    const female = chance(0.5);
    const first = female ? pick(FEMALE) : pick(MALE);
    const last = pick(SURNAMES);
    const course = pick(INITIAL_COURSES);
    const c = counselorFor(course.category);
    const created = addDays(TODAY, dropped ? -int(15, 170) : -int(0, 40));
    const createdAt = stamp(created, 0);
    const status: LeadStatus = dropped ? 'dropped' : weighted(OPEN_STATUSES);
    const followUps = [] as Lead['followUps'];
    if (status !== 'new') {
      followUps.push(mkFollowUp(createdAt, int(3, 26), c.name, 'First call done. Interested; asked for fee details and batch timings.', 'contacted', addDays(created, int(1, 4))));
    }
    if (['consultation_scheduled', 'demo_attended', 'ready_to_join'].includes(status)) {
      followUps.push(mkFollowUp(addDays(created, 1), 0, c.name, 'Consultation booked at the academy.', 'consultation_scheduled', addDays(created, 3)));
    }
    if (['demo_attended', 'ready_to_join'].includes(status)) {
      followUps.push(mkFollowUp(addDays(created, 3), 0, c.name, 'Attended a demo class. Positive feedback.', 'demo_attended'));
    }
    if (status === 'ready_to_join') {
      followUps.push(mkFollowUp(addDays(created, 4), 0, c.name, 'Confirmed joining; will bring documents and advance fee.', 'ready_to_join', addDays(TODAY, int(0, 3))));
    }
    if (dropped) {
      followUps.push(mkFollowUp(addDays(created, int(3, 10)), 0, c.name, pick(DROP_REASONS), 'dropped'));
    }
    const lastNext = [...followUps].reverse().find(f => f.nextFollowUpDate)?.nextFollowUpDate;
    leads.push({
      id: `lead-${leadSeq++}`,
      studentName: `${first} ${last}`,
      phone: phone(),
      email: `${first.toLowerCase()}${int(10, 99)}@${pick(EMAIL_DOMAINS)}`,
      targetExamYear: pick(['2026', '2027']),
      targetCourse: course.name,
      source: weighted(leadSources),
      status,
      assignedCounselorId: c.id,
      assignedCounselorName: c.name,
      createdAt,
      consultationDate: status === 'consultation_scheduled' && lastNext ? stamp(lastNext, 0) : undefined,
      notes: '',
      location: pick(PLACES),
      followUps
    });
  }
  // Some website enquiries came in through the online admission form (full application attached).
  const appCandidates = leads
    .filter(l => l.source === 'website' && l.status !== 'converted' && l.status !== 'dropped' && !l.application && l.id.startsWith('lead-1'))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let appSeq = 1;
  for (const l of appCandidates) {
    if (!chance(0.6)) continue;
    const course = INITIAL_COURSES.find(c => c.name === l.targetCourse) || INITIAL_COURSES[0];
    const preferred = INITIAL_BATCHES.filter(b => b.courseId === course.id);
    l.application = {
      applicationNumber: `APP-2026-${String(appSeq++).padStart(4, '0')}`,
      submittedAt: l.createdAt,
      courseId: course.id,
      preferredBatchId: preferred.length && chance(0.6) ? pick(preferred).id : undefined,
      courseDetails: pick(['Classroom', 'Classroom, weekend preferred', 'Morning batch preferred', '']),
      qualification: pick(QUALS),
      guardianName: `${pick(['S.', 'K.', 'R.', 'M.', 'P.'])} ${l.studentName.split(' ').pop()}`,
      occupation: pick(OCCUPATIONS),
      dateOfBirth: addDays(TODAY, -int(20 * 365, 29 * 365)),
      guardianPhone: phone(),
      specialCategory: 'None',
      examsAttended: pick(EXAMS),
      address: `${int(1, 200)}, ${pick(STREETS)}, ${l.location || pick(PLACES)}`,
      aim: pick(AIMS[course.category] || ['IAS']),
      reference: pick(REFERENCES),
      declarationAcceptedAt: l.createdAt
    };
  }
  leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // 7. Staff: attendance for the last ~4 months (Mon–Sat) and monthly payroll for 6 months.
  const staffMembers = INITIAL_STAFF_MEMBERS.map(s => ({ ...s }));
  const staffAttendance: StaffAttendanceEntry[] = [];
  for (const st of staffMembers) {
    for (let d = addDays(TODAY, -120); d < TODAY; d = addDays(d, 1)) {
      if (weekdayOf(d) === 'Sunday' || d < st.joiningDate) continue;
      const r = rand();
      staffAttendance.push({
        id: `sa-${st.id}-${d}`,
        staffId: st.id,
        date: d,
        status: r < 0.025 ? 'absent' : r < 0.06 ? 'leave' : 'present'
      });
    }
  }
  const salaryPayouts: SalaryPayout[] = [];
  const now = parseISODate(TODAY);
  for (let m = 6; m >= 1; m--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
    const label = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    for (const st of staffMembers) {
      if (toISODate(monthEnd) < st.joiningDate) continue;
      const absentDays = staffAttendance.filter(
        a => a.staffId === st.id && a.status === 'absent' && a.date >= toISODate(monthStart) && a.date <= toISODate(monthEnd)
      ).length;
      const incentives = st.department === 'Counseling' ? int(2, 8) * 1000 : st.department === 'Faculty' ? pick([0, 0, 5000, 10000]) : 0;
      const deductions = Math.round(st.monthlySalary * 0.05) + Math.round((st.monthlySalary / 26) * absentDays);
      salaryPayouts.push({
        id: `sal-${st.id}-${toISODate(monthStart).slice(0, 7)}`,
        staffId: st.id,
        staffName: st.name,
        month: label,
        baseSalary: st.monthlySalary,
        incentives,
        deductions,
        netPayout: st.monthlySalary + incentives - deductions,
        paymentDate: toISODate(monthEnd),
        status: 'paid',
        transactionRef: `NEFT-SAL-${toISODate(monthStart).slice(0, 7).replace('-', '')}-${int(10000, 99999)}`
      });
    }
  }

  // 8. Daily quiz answers for the last two weeks (today left open for the live demo).
  const dailyQuizAttempts: DailyQuizAttempt[] = [];
  for (let back = 14; back >= 1; back--) {
    const date = addDays(TODAY, -back);
    const qs = pickDailyQuestions(INITIAL_QUESTION_BANK, date);
    for (const s of students) {
      if (s.admissionDate > date) continue;
      const p = profiles.get(s.id)!;
      if (!chance(0.35 + p.ability * 0.4)) continue; // engaged students answer more often
      const answers: Record<string, number> = {};
      let correct = 0;
      for (const q of qs) {
        if (chance(p.ability)) {
          answers[q.id] = q.correctOptionIndex;
          correct++;
        } else answers[q.id] = pick(q.options.map((_, i) => i).filter(i => i !== q.correctOptionIndex));
      }
      dailyQuizAttempts.push({ id: `dq-${s.id}-${date}`, studentId: s.id, date, questionIds: qs.map(q => q.id), answers, correct, total: qs.length });
    }
  }

  // 9. Login accounts: demo personas + every student and staff member.
  const accounts = buildAccounts(staffMembers, students);

  return {
    students,
    invoices: finalInvoices,
    receipts: receipts.reverse(), // newest first
    attendance,
    assessmentTests,
    studentAttempts,
    leads,
    counselors,
    accounts,
    staffMembers,
    staffAttendance,
    salaryPayouts: salaryPayouts.reverse(),
    dailyQuizAttempts
  };
};

const MANAGEMENT_ACCOUNT: UserAccount = {
  id: 'usr-mgmt-01',
  username: 'director@vrmiasacademy.com',
  password: 'admin123',
  role: 'management',
  name: 'Dr. V. R. Murugan, Ex-IRS',
  email: 'director@vrmiasacademy.com',
  phone: '+91 98401 23456',
  designation: 'Founder & Director General',
  createdAt: '2020-01-01'
};

/** Logins for management, every staff member and every student. */
export const buildAccounts = (staffMembers: StaffMember[], students: Student[]): UserAccount[] => {
  const staffRole = (st: StaffMember): UserAccount['role'] =>
    st.department === 'Faculty' ? 'faculty' : st.department === 'Counseling' ? 'field_agent' : 'office_staff';
  const staffPassword: Record<string, string> = { 'usr-staff-02': 'office123', 'usr-fac-03': 'faculty123', 'usr-agent-05': 'agent123' };
  const counselorByEmail = new Map(INITIAL_COUNSELORS.map(c => [c.email, c.id]));
  return [
    MANAGEMENT_ACCOUNT,
    ...staffMembers.map(st => ({
      id: `acc-${st.id}`,
      username: st.email,
      password: staffPassword[st.id] || 'staff123',
      role: staffRole(st),
      name: st.name,
      email: st.email,
      phone: st.phone,
      designation: st.designation,
      linkedStaffId: st.id,
      linkedCounselorId: counselorByEmail.get(st.email),
      createdAt: st.joiningDate
    })),
    ...students.map(s => ({
      id: `acc-${s.id}`,
      username: s.rollNumber,
      password: s.id === 'stu-01' ? 'student123' : studentDefaultPassword(s.phone),
      role: 'student' as const,
      name: s.name,
      email: s.email,
      phone: s.phone,
      designation: `Enrolled Aspirant (Roll: ${s.rollNumber})`,
      linkedStudentId: s.id,
      createdAt: s.admissionDate
    }))
  ];
};

/**
 * What the app contains on first open (and after "Clear all data"): logins, staff, courses,
 * batches, timetable and the question bank. No students, leads, fees or activity.
 */
export const buildBaseData = (): SeedData => {
  const staffMembers = INITIAL_STAFF_MEMBERS.map(s => ({ ...s }));
  return {
    students: [],
    invoices: [],
    receipts: [],
    attendance: [],
    assessmentTests: [],
    studentAttempts: [],
    leads: [],
    counselors: INITIAL_COUNSELORS.map(c => ({ ...c })),
    accounts: buildAccounts(staffMembers, []),
    staffMembers,
    staffAttendance: [],
    salaryPayouts: [],
    dailyQuizAttempts: []
  };
};

/** Default student password: "VRM@" + last 4 digits of the phone number. */
export const studentDefaultPassword = (phoneNumber: string): string =>
  `VRM@${phoneNumber.replace(/\D/g, '').slice(-4) || '0000'}`;

export const DEMO_PERSONA_ACCOUNT_IDS: Record<UserAccount['role'], string> = {
  management: 'usr-mgmt-01',
  office_staff: 'acc-usr-staff-02',
  faculty: 'acc-usr-fac-03',
  student: 'acc-stu-01',
  field_agent: 'acc-usr-agent-05'
};

