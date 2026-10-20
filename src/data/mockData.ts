import {
  Course,
  Batch,
  Counselor,
  Lead,
  Student,
  ClassScheduleItem,
  StudyMaterial,
  AssessmentTest,
  StaffMember,
  ExamAlert,
  AcademyAnnouncement,
  SupportTicket,
  Question
} from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-01',
    code: 'UPSC-GS-FND',
    name: 'UPSC CSE 2026 Comprehensive GS Foundation (Prelims + Mains + Interview)',
    category: 'GS Foundation',
    durationMonths: 12,
    totalFee: 135000,
    description: 'Flagship 1-year classroom mentorship covering complete GS Papers 1-4, Essay, Current Affairs Dossiers, and Interview Guidance.',
    syllabusHighlights: ['Indian Polity & Constitution', 'Modern History & Art Culture', 'Geography & Environment', 'Economy & Budget', 'Ethics & Case Studies', 'Weekly Answer Evaluation'],
    activeBatchesCount: 3
  },
  {
    id: 'crs-02',
    code: 'UPSC-CSAT-INT',
    name: 'UPSC CSAT Intensive Masterclass 2026',
    category: 'CSAT',
    durationMonths: 4,
    totalFee: 24000,
    description: 'High-yield analytical reasoning, reading comprehension, and quantitative aptitude tailored for CSAT Paper-II qualification.',
    syllabusHighlights: ['Reading Comprehension Matrix', 'Logical & Analytical Deductions', 'Number Systems & Permutations', 'Data Interpretation Mastery'],
    activeBatchesCount: 2
  },
  {
    id: 'crs-03',
    code: 'OPT-PUB-ADM',
    name: 'Public Administration Optional Foundation & Answer Writing',
    category: 'Optional Subject',
    durationMonths: 6,
    totalFee: 45000,
    description: 'In-depth Paper 1 & 2 conceptual clarity with administrative theorists, Indian administration linkages, and 200+ model answers.',
    syllabusHighlights: ['Administrative Thought & Thinkers', 'Personnel & Financial Administration', 'Indian Administration Evolution', 'Disaster & Urban Governance'],
    activeBatchesCount: 2
  },
  {
    id: 'crs-04',
    code: 'OPT-SOC-ADV',
    name: 'Sociology Optional Mentorship & Thinker Series',
    category: 'Optional Subject',
    durationMonths: 6,
    totalFee: 42000,
    description: 'Comprehensive coverage of sociological theories, Indian social structure, social movements, and weekly test series.',
    syllabusHighlights: ['Classical Thinkers (Marx, Weber, Durkheim)', 'Caste, Kinship & Class in India', 'Social Transformations', 'Applied Sociology Answer Frameworks'],
    activeBatchesCount: 1
  },
  {
    id: 'crs-05',
    code: 'TNPSC-GRP1-INT',
    name: 'TNPSC Combined Civil Services (Group 1) Integrated Batch',
    category: 'State PSC',
    durationMonths: 8,
    totalFee: 65000,
    description: 'Complete coverage of TNPSC Group 1 syllabus with focus on Tamil Nadu History, Culture, Socio-Political Movements, and Aptitude.',
    syllabusHighlights: ['Tamil Society & Archeological Discoveries', 'Thirukkural Analytical Perspectives', 'TN Socio-Economic Policies & Welfare Schemes', 'Mental Ability & Quantitative Skills'],
    activeBatchesCount: 2
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-01',
    courseId: 'crs-01',
    courseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    name: 'Morning Regular Batch (Alpha-26)',
    code: 'B-GS-MORN-A',
    timing: '07:30 AM – 10:30 AM',
    days: 'Monday to Friday',
    room: 'Hall 101 (Chanakya Block)',
    maxCapacity: 60,
    enrolledCount: 48,
    startDate: '2026-06-15',
    endDate: '2027-05-30',
    leadFacultyId: 'usr-fac-03',
    leadFacultyName: 'Dr. K. Ramanathan'
  },
  {
    id: 'batch-02',
    courseId: 'crs-01',
    courseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    name: 'Evening Professionals Batch (Delta-26)',
    code: 'B-GS-EVE-D',
    timing: '06:30 PM – 09:30 PM',
    days: 'Monday to Friday',
    room: 'Hall 202 (Kautilya Block)',
    maxCapacity: 50,
    enrolledCount: 39,
    startDate: '2026-07-01',
    endDate: '2027-06-15',
    leadFacultyId: 'fac-02',
    leadFacultyName: 'S. Meenakshi Sundaram'
  },
  {
    id: 'batch-03',
    courseId: 'crs-01',
    courseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    name: 'Weekend Super-30 Mentorship Batch',
    code: 'B-GS-WKND-S30',
    timing: '09:00 AM – 05:00 PM',
    days: 'Saturday & Sunday',
    room: 'Seminar Auditorium 1',
    maxCapacity: 40,
    enrolledCount: 32,
    startDate: '2026-06-20',
    endDate: '2027-05-15',
    leadFacultyId: 'usr-fac-03',
    leadFacultyName: 'Dr. K. Ramanathan'
  },
  {
    id: 'batch-04',
    courseId: 'crs-03',
    courseName: 'Public Administration Optional Foundation',
    name: 'PubAd Weekend Specialized Batch',
    code: 'B-PUBAD-01',
    timing: '02:00 PM – 06:00 PM',
    days: 'Saturday & Sunday',
    room: 'Discussion Room B',
    maxCapacity: 35,
    enrolledCount: 26,
    startDate: '2026-07-10',
    endDate: '2027-01-20',
    leadFacultyId: 'fac-03',
    leadFacultyName: 'Col. Arvind Menon (Retd.)'
  },
  {
    id: 'batch-05',
    courseId: 'crs-02',
    courseName: 'UPSC CSAT Intensive Masterclass 2026',
    name: 'CSAT Evening Booster (Gamma-26)',
    code: 'B-CSAT-EVE-G',
    timing: '05:00 PM – 07:00 PM',
    days: 'Monday, Wednesday & Friday',
    room: 'Hall 103 (Chanakya Block)',
    maxCapacity: 40,
    enrolledCount: 0,
    startDate: '2026-08-03',
    endDate: '2026-12-18',
    leadFacultyId: 'fac-07',
    leadFacultyName: 'A. Prakash'
  },
  {
    id: 'batch-06',
    courseId: 'crs-05',
    courseName: 'TNPSC Combined Civil Services (Group 1) Integrated Batch',
    name: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    code: 'B-TNPSC-G1-01',
    timing: '10:30 AM – 01:30 PM',
    days: 'Monday to Saturday',
    room: 'Hall 201 (Kautilya Block)',
    maxCapacity: 50,
    enrolledCount: 0,
    startDate: '2026-07-06',
    endDate: '2027-02-27',
    leadFacultyId: 'fac-05',
    leadFacultyName: 'R. Thangaraj'
  },
  {
    id: 'batch-07',
    courseId: 'crs-04',
    courseName: 'Sociology Optional Mentorship & Thinker Series',
    name: 'Sociology Weekend Thinkers Batch',
    code: 'B-SOC-WKND-01',
    timing: '02:00 PM – 05:00 PM',
    days: 'Saturday & Sunday',
    room: 'Discussion Room A',
    maxCapacity: 30,
    enrolledCount: 0,
    startDate: '2026-07-18',
    endDate: '2027-01-17',
    leadFacultyId: 'fac-06',
    leadFacultyName: 'Dr. Nirmala Joseph'
  }
];

export const INITIAL_COUNSELORS: Counselor[] = [
  {
    id: 'csl-01',
    name: 'Deepa Nathan',
    phone: '+91 98401 56789',
    email: 'deepa.outreach@vrmiasacademy.com',
    activeLeadsCount: 14,
    conversionsThisMonth: 8,
    averageResponseMinutes: 11,
    specializations: ['GS Foundation', 'CSAT']
  },
  {
    id: 'csl-02',
    name: 'Vigneshwaran K.',
    phone: '+91 98401 67890',
    email: 'vignesh.counsel@vrmiasacademy.com',
    activeLeadsCount: 18,
    conversionsThisMonth: 6,
    averageResponseMinutes: 18,
    specializations: ['Optional Subject', 'CSAT', 'Test Series']
  },
  {
    id: 'csl-03',
    name: 'Ananya Sen',
    phone: '+91 98401 78901',
    email: 'ananya.advisory@vrmiasacademy.com',
    activeLeadsCount: 12,
    conversionsThisMonth: 7,
    averageResponseMinutes: 14,
    specializations: ['State PSC', 'GS Foundation']
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-101',
    studentName: 'Siddharth V. Menon',
    phone: '+91 94441 22891',
    email: 'siddharth.menon@outlook.com',
    targetExamYear: '2026',
    targetCourse: 'UPSC CSE 2026 Comprehensive GS Foundation',
    source: 'website',
    status: 'consultation_scheduled',
    assignedCounselorId: 'csl-01',
    assignedCounselorName: 'Deepa Nathan',
    createdAt: '2026-10-18T09:30:00Z',
    consultationDate: '2026-10-20T11:00:00Z',
    notes: 'Mechanical Engineer from Anna University. First attempt. Wants morning batch and syllabus guide.',
    location: 'Perambalur',
    followUps: [
      {
        id: 'fu-01',
        timestamp: '2026-10-18T10:15:00Z',
        counselorName: 'Deepa Nathan',
        notes: 'Called within 12 mins. Explained Prelims + Mains structure. Scheduled in-person counseling for Oct 20.',
        statusUpdate: 'consultation_scheduled',
        nextFollowUpDate: '2026-10-20'
      }
    ]
  },
  {
    id: 'lead-102',
    studentName: 'Nandhini Soundararajan',
    phone: '+91 98840 55123',
    email: 'nandhini.s@gmail.com',
    targetExamYear: '2026',
    targetCourse: 'UPSC CSE 2026 Comprehensive GS Foundation',
    source: 'field_agent',
    status: 'ready_to_join',
    assignedCounselorId: 'csl-01',
    assignedCounselorName: 'Deepa Nathan',
    createdAt: '2026-10-17T14:20:00Z',
    consultationDate: '2026-10-18T15:00:00Z',
    notes: 'Met at Loyola College Civil Services awareness seminar. Attended Polity demo class by Dr. Ramanathan. Ready to enroll under Merit Scholarship.',
    fieldAgentName: 'Deepa Nathan',
    location: 'Nungambakkam',
    followUps: [
      {
        id: 'fu-02',
        timestamp: '2026-10-18T16:00:00Z',
        counselorName: 'Deepa Nathan',
        notes: 'Demo class attended. Student requested 2-installment plan with 25% Merit scholarship.',
        statusUpdate: 'ready_to_join',
        nextFollowUpDate: '2026-10-20'
      }
    ]
  },
  {
    id: 'lead-103',
    studentName: 'Karthik Subramanian',
    phone: '+91 97909 33412',
    email: 'karthik.sub@yahoo.co.in',
    targetExamYear: '2026',
    targetCourse: 'Public Administration Optional Foundation',
    source: 'walk_in',
    status: 'new',
    assignedCounselorId: 'csl-02',
    assignedCounselorName: 'Vigneshwaran K.',
    createdAt: '2026-10-19T08:15:00Z',
    notes: 'Walk-in enquiry at reception. Working in TCS Siruseri. Inquiring about weekend optional batch.',
    location: 'Ariyalur',
    followUps: []
  },
  {
    id: 'lead-104',
    studentName: 'Bhavani Ranganathan',
    phone: '+91 94450 77890',
    email: 'bhavani.r@gmail.com',
    targetExamYear: '2027',
    targetCourse: 'TNPSC Combined Civil Services (Group 1) Integrated Batch',
    source: 'website',
    status: 'contacted',
    assignedCounselorId: 'csl-03',
    assignedCounselorName: 'Ananya Sen',
    createdAt: '2026-10-18T11:45:00Z',
    notes: 'Inquired for TNPSC Deputy Collector syllabus. Requested Tamil study materials brochure.',
    location: 'Madurai',
    followUps: [
      {
        id: 'fu-03',
        timestamp: '2026-10-18T12:30:00Z',
        counselorName: 'Ananya Sen',
        notes: 'Shared syllabus PDF via WhatsApp. Follow up set for weekend.',
        statusUpdate: 'contacted',
        nextFollowUpDate: '2026-10-21'
      }
    ]
  },
  {
    id: 'lead-105',
    studentName: 'Tarun Jayaram',
    phone: '+91 98412 99014',
    email: 'tarun.jay@outlook.com',
    targetExamYear: '2026',
    targetCourse: 'UPSC CSAT Intensive Masterclass 2026',
    source: 'referral',
    status: 'demo_attended',
    assignedCounselorId: 'csl-02',
    assignedCounselorName: 'Vigneshwaran K.',
    createdAt: '2026-10-16T16:10:00Z',
    notes: 'Referred by alumni Rahul (AIR 142). Wants quick CSAT booster.',
    location: 'Coimbatore',
    followUps: [
      {
        id: 'fu-04',
        timestamp: '2026-10-17T11:00:00Z',
        counselorName: 'Vigneshwaran K.',
        notes: 'Attended sample CSAT class on Permutations & Deductions. Highly impressed.',
        statusUpdate: 'demo_attended',
        nextFollowUpDate: '2026-10-20'
      }
    ]
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-01',
    rollNumber: 'VRM-2026-089',
    name: 'Aaditya Sharma',
    email: 'aaditya.sharma@gmail.com',
    phone: '+91 97910 88234',
    gender: 'Male',
    address: '12, Gandhi Nagar, Perambalur',
    enrolledCourseId: 'crs-01',
    enrolledCourseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    enrolledBatchId: 'batch-01',
    enrolledBatchName: 'Morning Regular Batch (Alpha-26)',
    admissionDate: '2026-06-10',
    totalFee: 135000,
    scholarshipApplied: 'merit_25',
    discountAmount: 33750,
    netFee: 101250,
    paidFee: 67500,
    balanceFee: 33750,
    paymentPlan: 'two_installments',
    attendancePercentage: 91.5,
    averageTestScore: 124.5,
    portalUsername: 'VRM-2026-089',
    status: 'active',
    guardianName: 'V. K. Sharma',
    guardianPhone: '+91 98400 11223'
  },
  {
    id: 'stu-02',
    rollNumber: 'VRM-2026-042',
    name: 'Priya Sridhar',
    email: 'priya.sridhar@gmail.com',
    phone: '+91 98411 77654',
    gender: 'Female',
    address: '4, Mettu Street, Thuraiyur, Tiruchirappalli',
    enrolledCourseId: 'crs-01',
    enrolledCourseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    enrolledBatchId: 'batch-01',
    enrolledBatchName: 'Morning Regular Batch (Alpha-26)',
    admissionDate: '2026-06-08',
    totalFee: 135000,
    scholarshipApplied: 'full_lump_sum_10',
    discountAmount: 13500,
    netFee: 121500,
    paidFee: 121500,
    balanceFee: 0,
    paymentPlan: 'one_time',
    attendancePercentage: 96.0,
    averageTestScore: 138.0,
    portalUsername: 'VRM-2026-042',
    status: 'active',
    guardianName: 'Dr. M. Sridhar',
    guardianPhone: '+91 98411 99887'
  },
  {
    id: 'stu-03',
    rollNumber: 'VRM-2026-056',
    name: 'Karthik Rajan',
    email: 'karthik.rajan99@outlook.com',
    phone: '+91 94443 66521',
    gender: 'Male',
    address: '22/3, Temple Street, Ariyalur',
    enrolledCourseId: 'crs-03',
    enrolledCourseName: 'Public Administration Optional Foundation',
    enrolledBatchId: 'batch-04',
    enrolledBatchName: 'PubAd Weekend Specialized Batch',
    admissionDate: '2026-07-02',
    totalFee: 45000,
    scholarshipApplied: 'none',
    discountAmount: 0,
    netFee: 45000,
    paidFee: 45000,
    balanceFee: 0,
    paymentPlan: 'one_time',
    attendancePercentage: 88.0,
    averageTestScore: 118.0,
    portalUsername: 'VRM-2026-056',
    status: 'active',
    guardianName: 'Rajan Natarajan',
    guardianPhone: '+91 94440 22331'
  },
  {
    id: 'stu-04',
    rollNumber: 'VRM-2026-071',
    name: 'Meera Nambiar',
    email: 'meera.nambiar@gmail.com',
    phone: '+91 98845 33219',
    gender: 'Female',
    address: '8A, Lake View Road, Kunnam, Perambalur',
    enrolledCourseId: 'crs-01',
    enrolledCourseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    enrolledBatchId: 'batch-02',
    enrolledBatchName: 'Evening Professionals Batch (Delta-26)',
    admissionDate: '2026-06-25',
    totalFee: 135000,
    scholarshipApplied: 'none',
    discountAmount: 0,
    netFee: 135000,
    paidFee: 90000,
    balanceFee: 45000,
    paymentPlan: 'three_installments',
    attendancePercentage: 84.5,
    averageTestScore: 112.5,
    portalUsername: 'VRM-2026-071',
    status: 'active',
    guardianName: 'Suresh Nambiar',
    guardianPhone: '+91 98840 44556'
  },
  {
    id: 'stu-05',
    rollNumber: 'VRM-2026-094',
    name: 'Rohan Verma',
    email: 'rohan.verma@gmail.com',
    phone: '+91 97112 44332',
    gender: 'Male',
    address: '102, Main Road, Jayankondam, Ariyalur',
    enrolledCourseId: 'crs-01',
    enrolledCourseName: 'UPSC CSE 2026 Comprehensive GS Foundation',
    enrolledBatchId: 'batch-03',
    enrolledBatchName: 'Weekend Super-30 Mentorship Batch',
    admissionDate: '2026-06-18',
    totalFee: 135000,
    scholarshipApplied: 'ews_rural_40',
    discountAmount: 54000,
    netFee: 81000,
    paidFee: 40500,
    balanceFee: 40500,
    paymentPlan: 'two_installments',
    attendancePercentage: 94.0,
    averageTestScore: 132.0,
    portalUsername: 'VRM-2026-094',
    status: 'active',
    guardianName: 'Dinesh Verma',
    guardianPhone: '+91 97110 55667'
  }
];

export const INITIAL_SCHEDULE: ClassScheduleItem[] = [
  {
    id: 'sch-01',
    batchId: 'batch-01',
    batchName: 'Morning Regular Batch (Alpha-26)',
    day: 'Monday',
    time: '07:30 AM – 10:30 AM',
    subject: 'Indian Polity & Governance',
    topic: 'Preamble, Fundamental Rights (Articles 14–19) & Judicial Review',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Hall 101 (Chanakya Block)'
  },
  {
    id: 'sch-02',
    batchId: 'batch-01',
    batchName: 'Morning Regular Batch (Alpha-26)',
    day: 'Tuesday',
    time: '07:30 AM – 10:30 AM',
    subject: 'Indian Economy & Macro Trends',
    topic: 'Fiscal Policy, RBI Monetary Stance & Inflation Dynamics',
    facultyName: 'S. Meenakshi Sundaram',
    room: 'Hall 101 (Chanakya Block)'
  },
  {
    id: 'sch-03',
    batchId: 'batch-01',
    batchName: 'Morning Regular Batch (Alpha-26)',
    day: 'Wednesday',
    time: '07:30 AM – 10:30 AM',
    subject: 'Modern Indian History',
    topic: 'Freedom Struggle: Non-Cooperation to Civil Disobedience',
    facultyName: 'Dr. Shalini Prasad',
    room: 'Hall 101 (Chanakya Block)'
  },
  {
    id: 'sch-04',
    batchId: 'batch-01',
    batchName: 'Morning Regular Batch (Alpha-26)',
    day: 'Thursday',
    time: '07:30 AM – 10:30 AM',
    subject: 'Ethics, Integrity & Case Studies (GS-4)',
    topic: 'Ethical Dilemmas in Civil Servants: Discretion vs Statutory Rule',
    facultyName: 'Col. Arvind Menon (Retd.)',
    room: 'Hall 101 (Chanakya Block)'
  },
  {
    id: 'sch-05',
    batchId: 'batch-01',
    batchName: 'Morning Regular Batch (Alpha-26)',
    day: 'Friday',
    time: '07:30 AM – 10:30 AM',
    subject: 'Weekly Current Affairs & Mains Answer Writing',
    topic: 'India-Middle East-Europe Corridor & G20 Outcomes',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Hall 101 (Chanakya Block)'
  },
  {
    id: 'sch-06',
    batchId: 'batch-02',
    batchName: 'Evening Professionals Batch (Delta-26)',
    day: 'Monday',
    time: '06:30 PM – 09:30 PM',
    subject: 'Indian Economy & Macro Trends',
    topic: 'Banking Sector Reforms, NPAs & Insolvency Code',
    facultyName: 'S. Meenakshi Sundaram',
    room: 'Hall 202 (Kautilya Block)'
  },
  {
    id: 'sch-07',
    batchId: 'batch-02',
    batchName: 'Evening Professionals Batch (Delta-26)',
    day: 'Tuesday',
    time: '06:30 PM – 09:30 PM',
    subject: 'Indian Polity & Governance',
    topic: 'Parliament, Legislative Procedure & Committees',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Hall 202 (Kautilya Block)'
  },
  {
    id: 'sch-08',
    batchId: 'batch-02',
    batchName: 'Evening Professionals Batch (Delta-26)',
    day: 'Wednesday',
    time: '06:30 PM – 09:30 PM',
    subject: 'Modern Indian History',
    topic: 'Revolt of 1857 & Early Nationalism',
    facultyName: 'Dr. Shalini Prasad',
    room: 'Hall 202 (Kautilya Block)'
  },
  {
    id: 'sch-09',
    batchId: 'batch-02',
    batchName: 'Evening Professionals Batch (Delta-26)',
    day: 'Thursday',
    time: '06:30 PM – 09:30 PM',
    subject: 'Geography & Environment',
    topic: 'Monsoon Mechanism & Climate Change Frameworks',
    facultyName: 'Dr. Shalini Prasad',
    room: 'Hall 202 (Kautilya Block)'
  },
  {
    id: 'sch-10',
    batchId: 'batch-02',
    batchName: 'Evening Professionals Batch (Delta-26)',
    day: 'Friday',
    time: '06:30 PM – 09:30 PM',
    subject: 'Ethics, Integrity & Case Studies (GS-4)',
    topic: 'Emotional Intelligence in Administration',
    facultyName: 'Col. Arvind Menon (Retd.)',
    room: 'Hall 202 (Kautilya Block)'
  },
  {
    id: 'sch-11',
    batchId: 'batch-03',
    batchName: 'Weekend Super-30 Mentorship Batch',
    day: 'Saturday',
    time: '09:00 AM – 05:00 PM',
    subject: 'Indian Polity & Governance',
    topic: 'Centre-State Relations & Cooperative Federalism',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Seminar Auditorium 1'
  },
  {
    id: 'sch-12',
    batchId: 'batch-03',
    batchName: 'Weekend Super-30 Mentorship Batch',
    day: 'Sunday',
    time: '09:00 AM – 05:00 PM',
    subject: 'Weekly Current Affairs & Mains Answer Writing',
    topic: 'Full-Length Mains Answer Writing & Peer Review',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Seminar Auditorium 1'
  },
  {
    id: 'sch-13',
    batchId: 'batch-04',
    batchName: 'PubAd Weekend Specialized Batch',
    day: 'Saturday',
    time: '02:00 PM – 06:00 PM',
    subject: 'Public Administration Paper I',
    topic: 'Administrative Thinkers: Weber, Taylor & Simon',
    facultyName: 'Col. Arvind Menon (Retd.)',
    room: 'Discussion Room B'
  },
  {
    id: 'sch-14',
    batchId: 'batch-04',
    batchName: 'PubAd Weekend Specialized Batch',
    day: 'Sunday',
    time: '02:00 PM – 06:00 PM',
    subject: 'Public Administration Paper II',
    topic: 'Union & State Secretariat, PMO & Cabinet Secretariat',
    facultyName: 'Col. Arvind Menon (Retd.)',
    room: 'Discussion Room B'
  },
  {
    id: 'sch-15',
    batchId: 'batch-05',
    batchName: 'CSAT Evening Booster (Gamma-26)',
    day: 'Monday',
    time: '05:00 PM – 07:00 PM',
    subject: 'CSAT Quantitative Aptitude',
    topic: 'Number Systems, Percentages & Ratios',
    facultyName: 'A. Prakash',
    room: 'Hall 103 (Chanakya Block)'
  },
  {
    id: 'sch-16',
    batchId: 'batch-05',
    batchName: 'CSAT Evening Booster (Gamma-26)',
    day: 'Wednesday',
    time: '05:00 PM – 07:00 PM',
    subject: 'CSAT Logical Reasoning',
    topic: 'Syllogisms, Seating Arrangement & Blood Relations',
    facultyName: 'A. Prakash',
    room: 'Hall 103 (Chanakya Block)'
  },
  {
    id: 'sch-17',
    batchId: 'batch-05',
    batchName: 'CSAT Evening Booster (Gamma-26)',
    day: 'Friday',
    time: '05:00 PM – 07:00 PM',
    subject: 'CSAT Reading Comprehension',
    topic: 'Inference-Based RC & Passage Mapping',
    facultyName: 'A. Prakash',
    room: 'Hall 103 (Chanakya Block)'
  },
  {
    id: 'sch-18',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Monday',
    time: '10:30 AM – 01:30 PM',
    subject: 'History & Culture of Tamil Nadu',
    topic: 'Sangam Age Polity & Literature',
    facultyName: 'R. Thangaraj',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-19',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Tuesday',
    time: '10:30 AM – 01:30 PM',
    subject: 'Thirukkural Studies',
    topic: 'Thirukkural in Governance & Administration',
    facultyName: 'R. Thangaraj',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-20',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Wednesday',
    time: '10:30 AM – 01:30 PM',
    subject: 'Indian Polity & Governance',
    topic: 'Panchayati Raj & Local Bodies in Tamil Nadu',
    facultyName: 'Dr. K. Ramanathan',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-21',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Thursday',
    time: '10:30 AM – 01:30 PM',
    subject: 'TN Development Administration',
    topic: 'Social Welfare Schemes of Tamil Nadu',
    facultyName: 'R. Thangaraj',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-22',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Friday',
    time: '10:30 AM – 01:30 PM',
    subject: 'Indian Economy & Macro Trends',
    topic: 'Tamil Nadu Economy & Industrial Policy',
    facultyName: 'S. Meenakshi Sundaram',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-23',
    batchId: 'batch-06',
    batchName: 'TNPSC Group 1 Integrated Batch (Tamil & English)',
    day: 'Saturday',
    time: '10:30 AM – 01:30 PM',
    subject: 'Aptitude & Mental Ability',
    topic: 'Simplification, Ratio & Data Interpretation',
    facultyName: 'A. Prakash',
    room: 'Hall 201 (Kautilya Block)'
  },
  {
    id: 'sch-24',
    batchId: 'batch-07',
    batchName: 'Sociology Weekend Thinkers Batch',
    day: 'Saturday',
    time: '02:00 PM – 05:00 PM',
    subject: 'Sociology Paper I',
    topic: 'Classical Thinkers: Durkheim, Weber & Marx',
    facultyName: 'Dr. Nirmala Joseph',
    room: 'Discussion Room A'
  },
  {
    id: 'sch-25',
    batchId: 'batch-07',
    batchName: 'Sociology Weekend Thinkers Batch',
    day: 'Sunday',
    time: '02:00 PM – 05:00 PM',
    subject: 'Sociology Paper II',
    topic: 'Caste System, Kinship & Agrarian Structure in India',
    facultyName: 'Dr. Nirmala Joseph',
    room: 'Discussion Room A'
  }
];

export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-01',
    title: 'VRM Constitutional Law Digest: Articles 1 to 51A & Landmark Judgments',
    subject: 'Indian Polity (GS-2)',
    type: 'PDF Notes',
    fileSize: '4.8 MB',
    uploadedAt: '2026-10-15',
    uploadedBy: 'Dr. K. Ramanathan',
    targetScope: 'all',
    pageCount: 68,
    summary: 'Comprehensive analytical notes on Fundamental Rights, DPSP harmonious construction, Kesavananda Bharati doctrine, and recent Supreme Court constitutional bench verdicts.'
  },
  {
    id: 'mat-02',
    title: 'Union Budget & Economic Survey 2026: Prelims & Mains High-Yield Summary',
    subject: 'Indian Economy (GS-3)',
    type: 'Handwritten Digest',
    fileSize: '6.2 MB',
    uploadedAt: '2026-10-12',
    uploadedBy: 'S. Meenakshi Sundaram',
    targetScope: 'batch',
    targetBatchId: 'batch-01',
    targetBatchName: 'Morning Regular Batch (Alpha-26)',
    pageCount: 52,
    summary: 'Sector-wise capital expenditure allocation, fiscal deficit targets, PLI schemes performance, and green hydrogen mission updates.'
  },
  {
    id: 'mat-03',
    title: 'Ramsar Wetlands, Biosphere Reserves & National Parks of India (2026 Atlas)',
    subject: 'Environment & Ecology (GS-3)',
    type: 'Mindmap',
    fileSize: '3.1 MB',
    uploadedAt: '2026-10-10',
    uploadedBy: 'Dr. Shalini Prasad',
    targetScope: 'all',
    pageCount: 34,
    summary: 'Visual GIS maps highlighting all 85 Ramsar sites with ecological significance, endemic species, and conservation threats for Prelims mapping questions.'
  },
  {
    id: 'mat-04',
    title: 'GS-4 Ethics Case Studies: 50 Real Administrative Dilemmas & Frameworks',
    subject: 'Ethics & Integrity (GS-4)',
    type: 'Question Compendium',
    fileSize: '5.5 MB',
    uploadedAt: '2026-10-05',
    uploadedBy: 'Col. Arvind Menon (Retd.)',
    targetScope: 'all',
    pageCount: 76,
    summary: 'Structured model answers with stakeholder analysis, value matrix (justice, empathy, transparency), and administrative conflict resolution.'
  },
  {
    id: 'mat-05',
    title: 'Monthly Current Affairs Compendium: September 2026',
    subject: 'Current Affairs',
    type: 'Current Affairs',
    fileSize: '8.4 MB',
    uploadedAt: '2026-10-01',
    uploadedBy: 'Dr. K. Ramanathan',
    targetScope: 'all',
    pageCount: 110,
    summary: 'Curated PIB, The Hindu, Indian Express, and Rajya Sabha TV synthesis for Prelims and Mains with practice MCQs.'
  }
];

export const INITIAL_ASSESSMENT_TESTS: AssessmentTest[] = [
  {
    id: 'test-01',
    title: 'UPSC Prelims Mock 04: Indian Constitution & Parliamentary Procedures',
    code: 'VRM-PRE-MOCK-04',
    subject: 'Indian Polity',
    category: 'Prelims Mock',
    totalMarks: 20,
    durationMinutes: 15,
    questionsCount: 6,
    negativeMarksPerWrong: 0.66,
    scheduledDate: '2026-10-19',
    batchIds: ['batch-01', 'batch-02', 'batch-03'],
    questions: [
      {
        id: 'q-101',
        questionText: 'With reference to the Parliament of India, consider the following statements regarding the Speaker of Lok Sabha:\n1. The Speaker ceases to hold office if they resign from their political party.\n2. The Speaker casts their vote only in the case of equality of votes.\n3. The Speaker’s decision on whether a bill is a Money Bill is final and beyond judicial review under all circumstances.',
        options: [
          '1 and 2 only',
          '2 only',
          '2 and 3 only',
          '1, 2 and 3'
        ],
        correctOptionIndex: 1,
        explanation: 'Statement 1 is incorrect: Under the Tenth Schedule (Anti-Defection Law), if a person resigns from their party upon election as Speaker/Deputy Speaker, they are exempted from disqualification. Statement 2 is correct: The Speaker does not vote in the first instance, but exercises a casting vote in case of a tie (Article 100(1)). Statement 3 is incorrect: The Supreme Court in Kihoto Hollohan and subsequent rulings held that the Speaker’s decision is subject to limited judicial review on grounds of procedural illegality or mala fides.',
        subject: 'Indian Polity',
        topic: 'Parliament & Presiding Officers',
        difficulty: 'Advanced',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['UPSC Core', 'Constitutional Law'],
        pyqYear: 'UPSC CSE 2023',
        authorFaculty: 'Dr. K. Ramanathan'
      },
      {
        id: 'q-102',
        questionText: 'Under Article 21 of the Constitution of India, which of the following rights have been declared as Fundamental Rights by the Supreme Court?\n1. Right to clean drinking water\n2. Right to speedy trial\n3. Right to free legal aid\n4. Right to livelihood',
        options: [
          '1 and 4 only',
          '2 and 3 only',
          '1, 2, 3 and 4',
          '1, 3 and 4 only'
        ],
        correctOptionIndex: 2,
        explanation: 'All four rights have been held as integral to the Right to Life and Personal Liberty under Article 21 through expansive landmark verdicts (Maneka Gandhi, Olga Tellis, Hussainara Khatoon, and Subhash Kumar cases).',
        subject: 'Indian Polity',
        topic: 'Fundamental Rights (Article 21)',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['High Yield', 'Landmark Judgments'],
        pyqYear: 'UPSC CSE 2021',
        authorFaculty: 'Dr. K. Ramanathan'
      },
      {
        id: 'q-103',
        questionText: 'Which of the following bodies is/are NOT established under a specific provision of the Constitution of India?\n1. National Development Council (NDC)\n2. Finance Commission\n3. NITI Aayog\n4. Inter-State Council',
        options: [
          '1 and 3 only',
          '2 and 4 only',
          '1, 3 and 4 only',
          '3 only'
        ],
        correctOptionIndex: 0,
        explanation: 'The Finance Commission is established under Article 280; the Inter-State Council under Article 263. Both the National Development Council and NITI Aayog were established via executive resolutions of the Union Cabinet and are non-constitutional, extra-statutory bodies.',
        subject: 'Indian Polity',
        topic: 'Constitutional vs Non-Constitutional Bodies',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['Institutions'],
        authorFaculty: 'Dr. K. Ramanathan'
      },
      {
        id: 'q-104',
        questionText: 'Consider the following statements regarding the Writ of Quo-Warranto:\n1. It can be sought only by an aggrieved person whose legal right has been directly violated.\n2. It is issued to prevent illegal usurpation of a public office created by statute or Constitution.\nWhich of the statements given above is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctOptionIndex: 1,
        explanation: 'Statement 1 is incorrect: Unlike other writs, the writ of Quo-Warranto can be moved by any member of the public, even if they are not personally aggrieved (locus standi is relaxed). Statement 2 is correct: It inquires into the legality of the claim which a party asserts to a public office.',
        subject: 'Indian Polity',
        topic: 'Writs & Judicial Review',
        difficulty: 'Advanced',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['High Yield', 'Judiciary'],
        authorFaculty: 'Dr. K. Ramanathan'
      },
      {
        id: 'q-105',
        questionText: 'Which one of the following schedules of the Constitution of India contains provisions regarding the disqualification of Members of Parliament and State Legislatures on the ground of defection?',
        options: [
          'Seventh Schedule',
          'Eighth Schedule',
          'Ninth Schedule',
          'Tenth Schedule'
        ],
        correctOptionIndex: 3,
        explanation: 'The Tenth Schedule was added by the 52nd Constitutional Amendment Act, 1985, and specifies grounds for disqualification on defection.',
        subject: 'Indian Polity',
        topic: 'Constitutional Schedules & Defection',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['PYQ', 'Schedules'],
        pyqYear: 'UPSC CSE 2014',
        authorFaculty: 'Dr. K. Ramanathan'
      },
      {
        id: 'q-106',
        questionText: 'In India, the power to increase the number of judges in the Supreme Court is vested in which of the following authorities?',
        options: [
          'The President of India',
          'The Parliament of India',
          'The Chief Justice of India',
          'The Law Commission'
        ],
        correctOptionIndex: 1,
        explanation: 'Under Article 124(1) of the Indian Constitution, the Parliament is empowered to prescribe the number of judges of the Supreme Court of India by law (Supreme Court (Number of Judges) Amendment Act).',
        subject: 'Indian Polity',
        topic: 'Supreme Court & Judicial Structure',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['Judiciary'],
        pyqYear: 'UPSC CSE 2019',
        authorFaculty: 'Dr. K. Ramanathan'
      }
    ]
  },
  {
    id: 'test-02',
    title: 'GS-3 Indian Economy: Fiscal Policy, Banking & External Trade Drill',
    code: 'VRM-ECO-DRILL-01',
    subject: 'Indian Economy',
    category: 'Subject Drill',
    totalMarks: 20,
    durationMinutes: 15,
    questionsCount: 2,
    negativeMarksPerWrong: 0.66,
    scheduledDate: '2026-10-22',
    batchIds: ['batch-01', 'batch-02'],
    questions: [
      {
        id: 'q-201',
        questionText: 'Which of the following is considered the most liquid measure of Money Supply in the Indian economy?',
        options: ['M1', 'M2', 'M3', 'M4'],
        correctOptionIndex: 0,
        explanation: 'M1 is known as narrow money and is the most liquid: Currency with the public + Demand deposits with banking system + Other deposits with RBI.',
        subject: 'Indian Economy',
        topic: 'Money Supply & Monetary Aggregates',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['Banking', 'Macroeconomics'],
        authorFaculty: 'S. Meenakshi Sundaram'
      },
      {
        id: 'q-202',
        questionText: 'When the Reserve Bank of India decreases the Cash Reserve Ratio (CRR), what is the direct impact on the economy?',
        options: [
          'Commercial banks lend less money',
          'Credit creation capability of commercial banks increases',
          'Bond yields spike immediately',
          'Government tax revenue drops'
        ],
        correctOptionIndex: 1,
        explanation: 'A reduction in CRR frees up reserves that banks must keep with the RBI, thereby boosting the liquidity available for commercial lending.',
        subject: 'Indian Economy',
        topic: 'RBI Monetary Policy Tools',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.66,
        tags: ['Monetary Policy'],
        pyqYear: 'UPSC CSE 2018',
        authorFaculty: 'S. Meenakshi Sundaram'
      }
    ]
  }
];

export const INITIAL_QUESTION_BANK: Question[] = [
  {
    id: 'qb-101',
    questionText: 'With reference to the Parliament of India, consider the following statements regarding the Speaker of Lok Sabha:\n1. The Speaker ceases to hold office if they resign from their political party.\n2. The Speaker casts their vote only in the case of equality of votes.\n3. The Speaker’s decision on whether a bill is a Money Bill is final and beyond judicial review under all circumstances.',
    options: [
      '1 and 2 only',
      '2 only',
      '2 and 3 only',
      '1, 2 and 3'
    ],
    correctOptionIndex: 1,
    explanation: 'Statement 1 is incorrect: Under the Tenth Schedule (Anti-Defection Law), if a person resigns from their party upon election as Speaker/Deputy Speaker, they are exempted from disqualification. Statement 2 is correct: The Speaker does not vote in the first instance, but exercises a casting vote in case of a tie (Article 100(1)). Statement 3 is incorrect: The Supreme Court in Kihoto Hollohan and subsequent rulings held that the Speaker’s decision is subject to limited judicial review on grounds of procedural illegality or mala fides.',
    subject: 'Indian Polity',
    topic: 'Parliament & Presiding Officers',
    difficulty: 'Advanced',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['UPSC Core', 'Constitutional Law'],
    pyqYear: 'UPSC CSE 2023',
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-15'
  },
  {
    id: 'qb-102',
    questionText: 'Under Article 21 of the Constitution of India, which of the following rights have been declared as Fundamental Rights by the Supreme Court?\n1. Right to clean drinking water\n2. Right to speedy trial\n3. Right to free legal aid\n4. Right to livelihood',
    options: [
      '1 and 4 only',
      '2 and 3 only',
      '1, 2, 3 and 4',
      '1, 3 and 4 only'
    ],
    correctOptionIndex: 2,
    explanation: 'All four rights have been held as integral to the Right to Life and Personal Liberty under Article 21 through expansive landmark verdicts (Maneka Gandhi, Olga Tellis, Hussainara Khatoon, and Subhash Kumar cases).',
    subject: 'Indian Polity',
    topic: 'Fundamental Rights (Article 21)',
    difficulty: 'Moderate',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['High Yield', 'Landmark Judgments'],
    pyqYear: 'UPSC CSE 2021',
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-14'
  },
  {
    id: 'qb-103',
    questionText: 'Which of the following bodies is/are NOT established under a specific provision of the Constitution of India?\n1. National Development Council (NDC)\n2. Finance Commission\n3. NITI Aayog\n4. Inter-State Council',
    options: [
      '1 and 3 only',
      '2 and 4 only',
      '1, 3 and 4 only',
      '3 only'
    ],
    correctOptionIndex: 0,
    explanation: 'The Finance Commission is established under Article 280; the Inter-State Council under Article 263. Both the National Development Council and NITI Aayog were established via executive resolutions of the Union Cabinet and are non-constitutional, extra-statutory bodies.',
    subject: 'Indian Polity',
    topic: 'Constitutional vs Non-Constitutional Bodies',
    difficulty: 'Moderate',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Institutions'],
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-12'
  },
  {
    id: 'qb-104',
    questionText: 'Consider the following statements regarding the Writ of Quo-Warranto:\n1. It can be sought only by an aggrieved person whose legal right has been directly violated.\n2. It is issued to prevent illegal usurpation of a public office created by statute or Constitution.\nWhich of the statements given above is/are correct?',
    options: [
      '1 only',
      '2 only',
      'Both 1 and 2',
      'Neither 1 nor 2'
    ],
    correctOptionIndex: 1,
    explanation: 'Statement 1 is incorrect: Unlike other writs, the writ of Quo-Warranto can be moved by any member of the public, even if they are not personally aggrieved (locus standi is relaxed). Statement 2 is correct: It inquires into the legality of the claim which a party asserts to a public office.',
    subject: 'Indian Polity',
    topic: 'Writs & Judicial Review',
    difficulty: 'Advanced',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['High Yield', 'Judiciary'],
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-10'
  },
  {
    id: 'qb-105',
    questionText: 'Which one of the following schedules of the Constitution of India contains provisions regarding the disqualification of Members of Parliament and State Legislatures on the ground of defection?',
    options: [
      'Seventh Schedule',
      'Eighth Schedule',
      'Ninth Schedule',
      'Tenth Schedule'
    ],
    correctOptionIndex: 3,
    explanation: 'The Tenth Schedule was added by the 52nd Constitutional Amendment Act, 1985, and specifies grounds for disqualification on defection.',
    subject: 'Indian Polity',
    topic: 'Constitutional Schedules & Defection',
    difficulty: 'Easy',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['PYQ', 'Schedules'],
    pyqYear: 'UPSC CSE 2014',
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-08'
  },
  {
    id: 'qb-106',
    questionText: 'In India, the power to increase the number of judges in the Supreme Court is vested in which of the following authorities?',
    options: [
      'The President of India',
      'The Parliament of India',
      'The Chief Justice of India',
      'The Law Commission'
    ],
    correctOptionIndex: 1,
    explanation: 'Under Article 124(1) of the Indian Constitution, the Parliament is empowered to prescribe the number of judges of the Supreme Court of India by law (Supreme Court (Number of Judges) Amendment Act).',
    subject: 'Indian Polity',
    topic: 'Supreme Court & Judicial Structure',
    difficulty: 'Moderate',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Judiciary'],
    pyqYear: 'UPSC CSE 2019',
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-10-06'
  },
  {
    id: 'qb-201',
    questionText: 'Which of the following is considered the most liquid measure of Money Supply in the Indian economy?',
    options: ['M1', 'M2', 'M3', 'M4'],
    correctOptionIndex: 0,
    explanation: 'M1 is known as narrow money and is the most liquid: Currency with the public + Demand deposits with banking system + Other deposits with RBI.',
    subject: 'Indian Economy',
    topic: 'Money Supply & Monetary Aggregates',
    difficulty: 'Easy',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Banking', 'Macroeconomics'],
    authorFaculty: 'S. Meenakshi Sundaram',
    createdAt: '2026-10-05'
  },
  {
    id: 'qb-202',
    questionText: 'When the Reserve Bank of India decreases the Cash Reserve Ratio (CRR), what is the direct impact on the economy?',
    options: [
      'Commercial banks lend less money',
      'Credit creation capability of commercial banks increases',
      'Bond yields spike immediately',
      'Government tax revenue drops'
    ],
    correctOptionIndex: 1,
    explanation: 'A reduction in CRR frees up reserves that banks must keep with the RBI, thereby boosting the liquidity available for commercial lending.',
    subject: 'Indian Economy',
    topic: 'RBI Monetary Policy Tools',
    difficulty: 'Easy',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Monetary Policy'],
    pyqYear: 'UPSC CSE 2018',
    authorFaculty: 'S. Meenakshi Sundaram',
    createdAt: '2026-10-04'
  },
  {
    id: 'qb-301',
    questionText: 'Which of the following was the primary reason for Mahatma Gandhi launching the Champaran Satyagraha in 1917?',
    options: [
      'Protest against the Rowlatt Act and arbitrary detention',
      'Oppose the Tinkathia system imposed by European indigo planters',
      'Support textile mill workers demanding plague bonus in Ahmedabad',
      'Resist revenue collection during the drought in Kheda'
    ],
    correctOptionIndex: 1,
    explanation: 'The Champaran Satyagraha of 1917 was Mahatma Gandhi’s first civil disobedience movement in India, initiated upon Rajkumar Shukla’s appeal against the oppressive Tinkathia system (compulsory cultivation of indigo on 3/20th of farmland).',
    subject: 'Modern History',
    topic: 'Gandhian Era & Early Satyagrahas',
    difficulty: 'Easy',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Freedom Struggle', 'PYQ'],
    pyqYear: 'UPSC CSE 2020',
    authorFaculty: 'Dr. Shalini Prasad',
    createdAt: '2026-10-03'
  },
  {
    id: 'qb-302',
    questionText: 'Consider the following pairs of revolutionary organizations and their founders:\n1. Abhinav Bharat Society — V. D. Savarkar\n2. Ghadar Party — Lala Har Dayal\n3. Anushilan Samiti — Pramathanath Mitra & Barindra Kumar Ghosh\nHow many of the pairs given above are correctly matched?',
    options: [
      'Only one pair',
      'Only two pairs',
      'All three pairs',
      'None of the pairs'
    ],
    correctOptionIndex: 2,
    explanation: 'All three pairs are historically accurate: V.D. Savarkar founded Abhinav Bharat in 1904 (Nasik); Lala Har Dayal and Sohan Singh Bhakna founded the Ghadar Party in 1913 in San Francisco; Anushilan Samiti was established in Bengal in 1902 by P. Mitra, B.K. Ghosh, and Bhupendranath Datta.',
    subject: 'Modern History',
    topic: 'Revolutionary Nationalism',
    difficulty: 'Moderate',
    marks: 2.5,
    negativeMarks: 0.83,
    tags: ['National Movement'],
    authorFaculty: 'Dr. Shalini Prasad',
    createdAt: '2026-10-02'
  },
  {
    id: 'qb-401',
    questionText: 'With reference to the Western Ghats and Eastern Ghats of India, consider the following statements:\n1. The Western Ghats are comparatively continuous and higher in average altitude than the Eastern Ghats.\n2. The Nilgiri Hills serve as the geographical junction where the Western Ghats and Eastern Ghats meet.\n3. The Eastern Ghats are dissected by perennial rivers like Godavari, Krishna, and Mahanadi draining into the Arabian Sea.',
    options: [
      '1 and 2 only',
      '2 and 3 only',
      '1 and 3 only',
      '1, 2 and 3'
    ],
    correctOptionIndex: 0,
    explanation: 'Statements 1 and 2 are correct. Statement 3 is incorrect because the rivers Godavari, Krishna, and Mahanadi flow eastward and drain into the Bay of Bengal, not the Arabian Sea.',
    subject: 'Geography',
    topic: 'Physiography of Peninsular India',
    difficulty: 'Moderate',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Peninsular India', 'Mapping'],
    pyqYear: 'UPSC CSE 2022',
    authorFaculty: 'Dr. Shalini Prasad',
    createdAt: '2026-10-01'
  },
  {
    id: 'qb-501',
    questionText: 'Which of the following statements best describes the mechanism of CRISPR-Cas9 technology?',
    options: [
      'A method for measuring atmospheric carbon sequestration rates',
      'A molecular tool that allows researchers to precisely cut and edit DNA sequences in living organisms',
      'An algorithm for high-frequency algorithmic trade execution',
      'A cryogenic fuel formulation for satellite launch vehicles'
    ],
    correctOptionIndex: 1,
    explanation: 'CRISPR-Cas9 is a targeted genome-editing technology adapted from a naturally occurring bacterial defense mechanism. It uses a guide RNA to direct the Cas9 enzyme to a specific genomic location to perform double-stranded breaks and facilitate sequence editing.',
    subject: 'Science & Technology',
    topic: 'Biotechnology & Genetic Engineering',
    difficulty: 'Easy',
    marks: 2.0,
    negativeMarks: 0.66,
    tags: ['Biotech', 'Frontier Tech'],
    pyqYear: 'UPSC CSE 2019',
    authorFaculty: 'Dr. K. Ramanathan',
    createdAt: '2026-09-28'
  },
  {
    id: 'qb-601',
    questionText: 'In a class of civil services aspirants, 60% opted for Indian Polity, 45% opted for Public Administration, and 25% opted for both. What percentage of aspirants did NOT opt for either of these two subjects?',
    options: [
      '15%',
      '20%',
      '25%',
      '30%'
    ],
    correctOptionIndex: 1,
    explanation: 'Using set union: n(Polity ∪ PubAd) = n(Polity) + n(PubAd) - n(Polity ∩ PubAd) = 60% + 45% - 25% = 80%. Aspirants who did not opt for either = 100% - 80% = 20%.',
    subject: 'CSAT Aptitude',
    topic: 'Set Theory & Venn Diagrams',
    difficulty: 'Moderate',
    marks: 2.5,
    negativeMarks: 0.83,
    tags: ['CSAT Paper-II', 'Quantitative Aptitude'],
    authorFaculty: 'Ananya Sen',
    createdAt: '2026-09-25'
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'usr-fac-03',
    name: 'Dr. K. Ramanathan',
    designation: 'Senior Faculty & Lead - Polity & Governance',
    department: 'Faculty',
    subjectsHandling: ['Indian Polity & Constitution', 'Governance & Social Justice', 'Public Administration'],
    assignedBatches: ['Morning Regular Batch (Alpha-26)', 'Evening Professionals Batch (Delta-26)', 'Weekend Super-30 Mentorship Batch', 'TNPSC Group 1 Integrated Batch (Tamil & English)'],
    phone: '+91 98401 45678',
    email: 'ramanathan.polity@vrmiasacademy.com',
    monthlySalary: 145000,
    joiningDate: '2022-04-15',
    status: 'active',
    attendanceRate: 98.2
  },
  {
    id: 'fac-02',
    name: 'S. Meenakshi Sundaram',
    designation: 'Faculty - Indian Economy & Budgetary Analysis',
    department: 'Faculty',
    subjectsHandling: ['Indian Economy (GS-3)', 'Monetary Policy & Infrastructure'],
    assignedBatches: ['Morning Regular Batch (Alpha-26)', 'Evening Professionals Batch (Delta-26)'],
    phone: '+91 98401 88990',
    email: 'meenakshi.eco@vrmiasacademy.com',
    monthlySalary: 130000,
    joiningDate: '2023-01-10',
    status: 'active',
    attendanceRate: 96.5
  },
  {
    id: 'fac-03',
    name: 'Col. Arvind Menon (Retd.)',
    designation: 'Senior Faculty - Ethics, Integrity & Aptitude (GS-4)',
    department: 'Faculty',
    subjectsHandling: ['Ethics & Case Studies (GS-4)', 'Internal Security & Defense', 'Interview Board Chair'],
    assignedBatches: ['Morning Regular Batch (Alpha-26)', 'PubAd Weekend Specialized Batch'],
    phone: '+91 98401 77665',
    email: 'arvind.menon@vrmiasacademy.com',
    monthlySalary: 140000,
    joiningDate: '2021-08-01',
    status: 'active',
    attendanceRate: 99.0
  },
  {
    id: 'fac-04',
    name: 'Dr. Shalini Prasad',
    designation: 'Faculty - Modern Indian History & IR',
    department: 'Faculty',
    subjectsHandling: ['Modern History & Freedom Struggle', 'International Relations & Bilateral Summits'],
    assignedBatches: ['Morning Regular Batch (Alpha-26)'],
    phone: '+91 98401 66554',
    email: 'shalini.history@vrmiasacademy.com',
    monthlySalary: 115000,
    joiningDate: '2023-06-15',
    status: 'active',
    attendanceRate: 95.0
  },
  {
    id: 'usr-staff-02',
    name: 'P. Sangeetha',
    designation: 'Head Registrar & Finance Controller',
    department: 'Finance',
    phone: '+91 98401 34567',
    email: 'registrar@vrmiasacademy.com',
    monthlySalary: 85000,
    joiningDate: '2020-03-01',
    status: 'active',
    attendanceRate: 99.5
  },
  {
    id: 'usr-agent-05',
    name: 'Deepa Nathan',
    designation: 'Senior Academic Counselor & Field Lead',
    department: 'Counseling',
    phone: '+91 98401 56789',
    email: 'deepa.outreach@vrmiasacademy.com',
    monthlySalary: 65000,
    joiningDate: '2023-09-01',
    status: 'active',
    attendanceRate: 97.0
  },
  {
    id: 'fac-05',
    name: 'R. Thangaraj',
    designation: 'Faculty - Tamil Nadu History, Culture & Thirukkural',
    department: 'Faculty',
    subjectsHandling: ['History & Culture of Tamil Nadu', 'Thirukkural Studies', 'TN Development Administration'],
    assignedBatches: ['TNPSC Group 1 Integrated Batch (Tamil & English)'],
    phone: '+91 98401 22145',
    email: 'thangaraj.tnpsc@vrmiasacademy.com',
    monthlySalary: 95000,
    joiningDate: '2022-11-01',
    status: 'active',
    attendanceRate: 0
  },
  {
    id: 'fac-06',
    name: 'Dr. Nirmala Joseph',
    designation: 'Faculty - Sociology Optional',
    department: 'Faculty',
    subjectsHandling: ['Sociology Paper I', 'Sociology Paper II'],
    assignedBatches: ['Sociology Weekend Thinkers Batch'],
    phone: '+91 98401 33256',
    email: 'nirmala.socio@vrmiasacademy.com',
    monthlySalary: 90000,
    joiningDate: '2024-02-12',
    status: 'active',
    attendanceRate: 0
  },
  {
    id: 'fac-07',
    name: 'A. Prakash',
    designation: 'Faculty - CSAT Aptitude & Reasoning',
    department: 'Faculty',
    subjectsHandling: ['CSAT Quantitative Aptitude', 'CSAT Logical Reasoning', 'CSAT Reading Comprehension', 'Aptitude & Mental Ability'],
    assignedBatches: ['CSAT Evening Booster (Gamma-26)', 'TNPSC Group 1 Integrated Batch (Tamil & English)'],
    phone: '+91 98401 44367',
    email: 'prakash.csat@vrmiasacademy.com',
    monthlySalary: 80000,
    joiningDate: '2023-07-03',
    status: 'active',
    attendanceRate: 0
  },
  {
    id: 'stf-06',
    name: 'J. Sathish Kumar',
    designation: 'Front Office & Accounts Executive',
    department: 'Administration',
    phone: '+91 98401 55478',
    email: 'frontoffice@vrmiasacademy.com',
    monthlySalary: 38000,
    joiningDate: '2024-06-01',
    status: 'active',
    attendanceRate: 0
  },
  {
    id: 'stf-07',
    name: 'Vigneshwaran K.',
    designation: 'Academic Counselor',
    department: 'Counseling',
    phone: '+91 98401 67890',
    email: 'vignesh.counsel@vrmiasacademy.com',
    monthlySalary: 48000,
    joiningDate: '2024-01-08',
    status: 'active',
    attendanceRate: 0
  },
  {
    id: 'stf-08',
    name: 'Ananya Sen',
    designation: 'Academic Counselor (State PSC)',
    department: 'Counseling',
    phone: '+91 98401 78901',
    email: 'ananya.advisory@vrmiasacademy.com',
    monthlySalary: 46000,
    joiningDate: '2024-04-15',
    status: 'active',
    attendanceRate: 0
  }
];

export const INITIAL_EXAM_ALERTS: ExamAlert[] = [
  {
    id: 'alert-01',
    examName: 'UPSC Civil Services Examination (CSE) 2027 / Prelims 2026',
    organization: 'Union Public Service Commission (UPSC)',
    postNames: 'IAS, IPS, IFS, IRS, IAAS & Allied Central Services Group A & B',
    vacancies: '1,056 Expected Posts',
    notificationDate: '2026-02-14',
    applicationDeadline: '2026-03-05',
    examDate: '2026-05-24',
    officialApplyUrl: 'https://upsconline.nic.in',
    targetAudience: 'All',
    keyHighlights: [
      'Preliminary Examination date confirmed for 24th May 2026.',
      'OTR (One Time Registration) mandatory before submitting the application.',
      'Age limit: 21 to 32 years as on 1st August 2026 (relaxations as per reservation norms).'
    ],
    status: 'active'
  },
  {
    id: 'alert-02',
    examName: 'TNPSC Combined Civil Services Examination - I (Group 1)',
    organization: 'Tamil Nadu Public Service Commission (TNPSC)',
    postNames: 'Deputy Collector, DSP, Assistant Commissioner (Commercial Taxes), District Registrar',
    vacancies: '90 Vacancies',
    notificationDate: '2026-04-10',
    applicationDeadline: '2026-05-02',
    examDate: '2026-07-12',
    officialApplyUrl: 'https://tnpsc.gov.in',
    targetAudience: 'Students',
    keyHighlights: [
      'Prelims consists of General Studies (175 Questions) + Aptitude (25 Questions).',
      'Tamil Eligibility Test qualifying paper included in Mains.',
      'Online application via One-Time Registration portal.'
    ],
    status: 'active'
  },
  {
    id: 'alert-03',
    examName: 'UPSC Central Armed Police Forces (CAPF AC) 2026',
    organization: 'Union Public Service Commission (UPSC)',
    postNames: 'Assistant Commandant (BSF, CRPF, CISF, ITBP, SSB)',
    vacancies: '506 Posts',
    notificationDate: '2026-04-22',
    applicationDeadline: '2026-05-14',
    examDate: '2026-08-02',
    officialApplyUrl: 'https://upsconline.nic.in',
    targetAudience: 'All',
    keyHighlights: [
      'Paper I: General Ability & Intelligence (250 Marks).',
      'Paper II: General Studies, Essay and Comprehension (200 Marks).'
    ],
    status: 'upcoming'
  }
];

export const INITIAL_ANNOUNCEMENTS: AcademyAnnouncement[] = [
  {
    id: 'ann-01',
    title: 'Special Guest Lecture: Administrative Ethics by Former Chief Secretary',
    content: 'We are honored to host Thiru. K. Shanmugam, IAS (Retd.), former Chief Secretary of Tamil Nadu, on Saturday, 24th October at 10:30 AM in Chanakya Auditorium. All GS Foundation aspirants must attend.',
    author: 'Directorate Office',
    date: '2026-10-18',
    priority: 'high',
    audience: 'All'
  },
  {
    id: 'ann-02',
    title: 'All-India Open Prelims Mock Test 05 Scheduled for This Sunday',
    content: 'Mock Test 05 covering Full Indian Polity and Modern History will be conducted in real UPSC exam timing (09:30 AM – 11:30 AM). Offline classroom seating strictly allocated as per roll number.',
    author: 'Academic Dean',
    date: '2026-10-17',
    priority: 'normal',
    audience: 'Students'
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-01',
    ticketNumber: 'TKT-2026-0042',
    studentOrStaffId: 'stu-01',
    userName: 'Aaditya Sharma',
    userRole: 'student',
    category: 'Test Evaluation',
    subject: 'Request for re-evaluation feedback on Ethics Case Study Test 03',
    description: 'Submitted my GS-4 Ethics answer sheet last week. Evaluator commented "needs more administrative grounding in question 4" — would appreciate 10 mins mentor slot with Col. Arvind Menon sir.',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '2026-10-17 14:10',
    lastUpdated: '2026-10-18 10:30',
    assignedTo: 'Col. Arvind Menon (Retd.)',
    messages: [
      {
        sender: 'Aaditya Sharma',
        isStaff: false,
        timestamp: '2026-10-17 14:10',
        text: 'Submitted my GS-4 Ethics answer sheet last week. Evaluator commented "needs more administrative grounding in question 4" — would appreciate 10 mins mentor slot with Col. Arvind Menon sir.'
      },
      {
        sender: 'Academic Desk (P. Sangeetha)',
        isStaff: true,
        timestamp: '2026-10-18 10:30',
        text: 'Hello Aaditya, your request has been forwarded to Col. Arvind Menon sir. He has allotted you a 1-on-1 slot this Wednesday at 11:00 AM in Discussion Room B.'
      }
    ]
  },
  {
    id: 'tkt-02',
    ticketNumber: 'TKT-2026-0038',
    studentOrStaffId: 'stu-04',
    userName: 'Meera Nambiar',
    userRole: 'student',
    category: 'Fee & Invoicing',
    subject: 'Request for 2nd installment digital receipt copy',
    description: 'Payment was debited via NetBanking on 26th September. Needed the stamped receipt copy for company education sponsorship claim.',
    priority: 'low',
    status: 'resolved',
    createdAt: '2026-09-28 09:20',
    lastUpdated: '2026-09-28 11:45',
    assignedTo: 'P. Sangeetha',
    messages: [
      {
        sender: 'Meera Nambiar',
        isStaff: false,
        timestamp: '2026-09-28 09:20',
        text: 'Needed the stamped receipt copy for company education sponsorship claim.'
      },
      {
        sender: 'P. Sangeetha (Finance)',
        isStaff: true,
        timestamp: '2026-09-28 11:45',
        text: 'Receipt VRM-RCPT-2026-0171 generated and linked to your portal under Invoices. You can download the stamped PDF anytime.'
      }
    ]
  }
];
