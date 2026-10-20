import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssessmentTest, Question, StudentTestAttempt } from '../../types';
import {
  ClipboardCheck,
  Clock,
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Plus,
  Search,
  Filter,
  Layers,
  BookOpen,
  Trash2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Tag,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Edit3,
  Copy,
  X
} from 'lucide-react';

export const TestAssessment: React.FC = () => {
  const {
    assessmentTests,
    questionBank,
    addQuestionToBank,
    updateQuestionInBank,
    deleteQuestionFromBank,
    createTestFromQuestionBank,
    studentAttempts,
    submitTestAttempt,
    batches,
    currentUser,
    role
  } = useApp();

  // Primary Workspace Sub-Tabs: 'bank' | 'tests' | 'analytics'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'bank' | 'tests' | 'analytics'>('bank');

  // Question Bank Filter & Search States
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('all');
  const [selectedMarksFilter, setSelectedMarksFilter] = useState('all');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [selectedQuestionIdsForTest, setSelectedQuestionIdsForTest] = useState<string[]>([]);

  // Add & Edit Question Modal States
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);

  const [qText, setQText] = useState('');
  const [qSubject, setQSubject] = useState('Indian Polity');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Moderate' | 'Advanced'>('Moderate');
  const [qMarks, setQMarks] = useState<number>(2.0);
  const [qNegativeMarks, setQNegativeMarks] = useState<number>(0.66);
  const [qPyqYear, setQPyqYear] = useState('');
  const [qTags, setQTags] = useState('High Yield, Constitutional Law');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctKeyIndex, setCorrectKeyIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');

  // Assemble Test Modal State
  const [isAssembleTestModalOpen, setIsAssembleTestModalOpen] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestSubject, setNewTestSubject] = useState('General Studies');
  const [newTestCategory, setNewTestCategory] = useState<AssessmentTest['category']>('Prelims Mock');
  const [newTestDuration, setNewTestDuration] = useState(30);
  const [newTestBatchId, setNewTestBatchId] = useState(batches[0]?.id || 'batch-01');

  // Live Test Runner State
  const [activeTest, setActiveTest] = useState<AssessmentTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 mins default
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<StudentTestAttempt | null>(null);

  // Timer effect
  useEffect(() => {
    if (!isTestRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTestRunning, selectedAnswers]);

  // Question Bank Stats
  const totalQuestions = questionBank.length;
  const totalMarksSum = questionBank.reduce((acc, q) => acc + (q.marks || 2), 0);
  const pyqQuestionsCount = questionBank.filter(q => !!q.pyqYear).length;
  const subjectsList = Array.from(new Set(questionBank.map(q => q.subject)));

  // Filtered Question Bank
  const filteredQuestions = questionBank.filter(q => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchBankQuery.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchBankQuery.toLowerCase())) ||
      q.explanation.toLowerCase().includes(searchBankQuery.toLowerCase()) ||
      (q.pyqYear && q.pyqYear.toLowerCase().includes(searchBankQuery.toLowerCase()));

    const matchesSubject = selectedSubjectFilter === 'all' || q.subject === selectedSubjectFilter;
    const matchesDifficulty = selectedDifficultyFilter === 'all' || q.difficulty === selectedDifficultyFilter;
    const matchesMarks = selectedMarksFilter === 'all' || String(q.marks) === selectedMarksFilter;

    return matchesSearch && matchesSubject && matchesDifficulty && matchesMarks;
  });

  const toggleSolutionExpand = (id: string) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectQuestionForTest = (id: string) => {
    setSelectedQuestionIdsForTest(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredQuestions.map(q => q.id);
    const areAllSelected = allFilteredIds.every(id => selectedQuestionIdsForTest.includes(id));
    if (areAllSelected) {
      setSelectedQuestionIdsForTest(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedQuestionIdsForTest(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Add Question Submission
  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Please fill out the question prompt and all four options.');
      return;
    }

    const tagsArray = qTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addQuestionToBank({
      questionText: qText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctOptionIndex: correctKeyIndex,
      explanation: qExplanation.trim() || 'Verified solution as per standard standard NCERT and reference material.',
      subject: qSubject,
      topic: qTopic.trim() || 'General Concepts',
      difficulty: qDifficulty,
      marks: Number(qMarks) || 2.0,
      negativeMarks: Number(qNegativeMarks) || 0.66,
      tags: tagsArray,
      pyqYear: qPyqYear.trim() || undefined,
      authorFaculty: currentUser.name
    });

    // Reset Form
    setQText('');
    setQTopic('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQExplanation('');
    setQPyqYear('');
    setIsAddQuestionModalOpen(false);
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setQSubject(q.subject);
    setQTopic(q.topic || '');
    setQDifficulty(q.difficulty);
    setQMarks(q.marks ?? 2.0);
    setQNegativeMarks(q.negativeMarks ?? 0.66);
    setQPyqYear(q.pyqYear || '');
    setQTags((q.tags || []).join(', '));
    setOptA(q.options[0] || '');
    setOptB(q.options[1] || '');
    setOptC(q.options[2] || '');
    setOptD(q.options[3] || '');
    setCorrectKeyIndex(q.correctOptionIndex);
    setQExplanation(q.explanation);
    setIsEditQuestionModalOpen(true);
  };

  // Submit Edited Question
  const handleEditQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Please fill out the question prompt and all four options.');
      return;
    }

    const tagsArray = qTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    updateQuestionInBank(editingQuestion.id, {
      questionText: qText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctOptionIndex: correctKeyIndex,
      explanation: qExplanation.trim(),
      subject: qSubject,
      topic: qTopic.trim() || undefined,
      difficulty: qDifficulty,
      marks: Number(qMarks) || 2.0,
      negativeMarks: Number(qNegativeMarks) || 0.66,
      tags: tagsArray,
      pyqYear: qPyqYear.trim() || undefined
    });

    setIsEditQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: Question) => {
    const duplicated = addQuestionToBank({
      questionText: `[Variant] ${q.questionText}`,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic ? `${q.topic} (Clone)` : 'Clone Item',
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      tags: [...(q.tags || []), 'Cloned Variant'],
      pyqYear: q.pyqYear,
      authorFaculty: currentUser.name
    });
    // Open edit immediately so user can customize marks or prompt
    handleOpenEditQuestion(duplicated);
  };

  // Quick Pre-Fill UPSC Prelims Sample
  const handlePreFillPolitySample = () => {
    setQText('Consider the following statements regarding the Judicial Powers of the Governor under the Constitution of India:\n1. The Governor can grant pardons, reprieves, respites or remissions of punishment of any person convicted of any offense against any law relating to a matter to which the executive power of the State extends.\n2. The Governor cannot commute a sentence of death under any circumstances.\nWhich of the statements given above is/are correct?');
    setQSubject('Indian Polity');
    setQTopic('Pardoning Powers of the Governor & President (Article 161)');
    setQDifficulty('Advanced');
    setQMarks(2.0);
    setQNegativeMarks(0.66);
    setQPyqYear('UPSC CSE 2025 Prediction Drill');
    setQTags('Polity, Governor, Constitutional Law, Article 161');
    setOptA('1 only');
    setOptB('2 only');
    setOptC('Both 1 and 2');
    setOptD('Neither 1 nor 2');
    setCorrectKeyIndex(0);
    setQExplanation('Statement 1 is correct: Under Article 161, the Governor of a State has the power to grant pardons, reprieves, respites or remissions of punishment for offenses against laws relating to matters to which the state executive power extends.\nStatement 2 is incorrect: The Governor cannot PARDON a death sentence (only the President can pardon death sentences under Article 72), BUT the Governor CAN suspend, remit or commute a death sentence if given under state law.');
  };

  // Quick Pre-Fill CSAT Reasoning Sample
  const handlePreFillCsatSample = () => {
    setQText('Five candidates A, B, C, D, and E appear for a mock interview at VRM IAS Academy. A scores higher than B but lower than C. D scores higher than E but lower than B.\nWho among them scored the median (third highest) marks in the assessment?');
    setQSubject('CSAT Aptitude');
    setQTopic('Logical Sequence & Analytical Ordering');
    setQDifficulty('Moderate');
    setQMarks(2.5);
    setQNegativeMarks(0.83);
    setQPyqYear('UPSC CSE 2024 Pattern');
    setQTags('CSAT, Paper-2, Analytical Ranking');
    setOptA('Candidate A');
    setOptB('Candidate B');
    setOptC('Candidate C');
    setOptD('Candidate D');
    setCorrectKeyIndex(1);
    setQExplanation('Let us arrange in descending order according to the conditions:\n1. C > A > B\n2. B > D > E\nCombining the inequalities yields: C > A > B > D > E.\nHence, the candidates from highest to lowest are: C (1st), A (2nd), B (3rd - Median), D (4th), E (5th).\nCandidate B holds the third highest (median) score.');
  };

  // Seed standard UPSC question pack
  const handleSeedQuestionPack = () => {
    addQuestionToBank({
      questionText: 'With reference to the Indian economy, what does the term "Core Inflation" signify?',
      options: [
        'Headline inflation measured by Wholesale Price Index (WPI) only',
        'Inflation in food and fuel commodities with volatile price swings',
        'Headline inflation excluding volatile components like food and energy commodities',
        'Inflation calculated strictly for capital goods and manufacturing equipment'
      ],
      correctOptionIndex: 2,
      explanation: 'Core Inflation measures the long-term trend in price levels by stripping out temporary volatile factors such as seasonal food prices and global crude oil price fluctuations.',
      subject: 'Indian Economy',
      topic: 'Macroeconomics & Inflation Dynamics',
      difficulty: 'Easy',
      marks: 2.0,
      negativeMarks: 0.66,
      tags: ['Economics', 'RBI Monetary Policy'],
      pyqYear: 'UPSC CSE 2021',
      authorFaculty: 'Dr. V. R. Murugan'
    });

    addQuestionToBank({
      questionText: 'In the context of international environmental agreements, the "Kunming-Montreal Global Biodiversity Framework (GBF)" set out to protect what percentage of terrestrial and marine areas by the year 2030 (30x30 Target)?',
      options: ['20% of Earth lands and oceans', '30% of Earth lands and oceans', '40% of Earth lands and oceans', '50% of biodiversity hotspots only'],
      correctOptionIndex: 1,
      explanation: 'Adopted at COP15 of the UN Convention on Biological Diversity, Target 3 of the Kunming-Montreal Global Biodiversity Framework commits nations to effectively conserve at least 30% of the world’s terrestrial, inland water, and coastal and marine areas by 2030 (known globally as the 30x30 target).',
      subject: 'Environment & Ecology',
      topic: 'Global Biodiversity Conventions & COP15',
      difficulty: 'Moderate',
      marks: 2.0,
      negativeMarks: 0.66,
      tags: ['Environment', 'International Treaties', 'COP15'],
      pyqYear: 'UPSC CSE 2024',
      authorFaculty: 'Dr. Shalini Prasad'
    });

    alert('Successfully added curated UPSC high-yield questions with configured marks to the Question Bank!');
  };

  // Assemble Test Submission
  const handleAssembleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIdsForTest.length === 0) {
      alert('Please select at least one question from the Question Bank.');
      return;
    }

    const testTitle = newTestTitle.trim() || `UPSC ${newTestSubject} Rapid Mock Drill`;
    const testCode = newTestCode.trim() || `VRM-MOCK-${Date.now().toString().slice(-4)}`;

    const newTest = createTestFromQuestionBank({
      title: testTitle,
      code: testCode,
      subject: newTestSubject,
      category: newTestCategory,
      durationMinutes: Number(newTestDuration) || 30,
      batchIds: [newTestBatchId],
      questionIds: selectedQuestionIdsForTest
    });

    setIsAssembleTestModalOpen(false);
    setSelectedQuestionIdsForTest([]);
    setActiveWorkspaceTab('tests');
  };

  // Live Test Simulation Handlers
  const handleStartTest = (test: AssessmentTest) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSecondsLeft(test.durationMinutes * 60);
    setIsTestRunning(true);
    setCompletedAttempt(null);
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleClearResponse = (questionId: string) => {
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSubmitTest = () => {
    if (!activeTest) return;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalScore = 0;

    activeTest.questions.forEach(q => {
      const userChoice = selectedAnswers[q.id];
      const qMarksVal = q.marks || 2.0;
      const qPenaltyVal = q.negativeMarks ?? activeTest.negativeMarksPerWrong ?? 0.66;

      if (userChoice === undefined) {
        unattemptedCount++;
      } else if (userChoice === q.correctOptionIndex) {
        correctCount++;
        totalScore += qMarksVal;
      } else {
        incorrectCount++;
        totalScore -= qPenaltyVal;
      }
    });

    const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const attempt = submitTestAttempt({
      testId: activeTest.id,
      testTitle: activeTest.title,
      studentId: currentUser.id || 'stu-01',
      studentName: currentUser.name || 'Aaditya Sharma',
      score: finalScore,
      totalMarks: activeTest.totalMarks,
      accuracyPercentage: accuracy,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unattempted: unattemptedCount,
      rankInBatch: Math.floor(Math.random() * 4) + 1,
      userAnswers: selectedAnswers,
      subjectBreakdown: [
        { subject: activeTest.subject, score: finalScore, total: activeTest.totalMarks }
      ],
      improvementAreas:
        incorrectCount > 0
          ? [
              'Review negative responses in conceptual question analysis.',
              'Strengthen recall on multi-statement assertion reasoning.',
              'Revise NCERT fundamentals and previous year question trends.'
            ]
          : ['Outstanding performance! Focus on maintaining speed in comprehensive mocks.']
    });

    setIsTestRunning(false);
    setCompletedAttempt(attempt);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Examinations & Assessment Suite
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              UPSC · State PSC Standards
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional Question Bank · Customizable Marks & Negative Scoring · Live Quiz Simulator · Instant Auto-Grading Engine
          </p>
        </div>

        {/* Global Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {role !== 'student' && (
            <>
              <button
                onClick={handleSeedQuestionPack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
                title="Populate standard UPSC Prelims questions with configured marks"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Seed Question Pack</span>
              </button>

              <button
                onClick={() => setIsAddQuestionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question to Bank</span>
              </button>

              <button
                onClick={() => {
                  if (selectedQuestionIdsForTest.length === 0) {
                    alert('Please select questions from the Question Bank list below using checkboxes, or select all filtered questions.');
                    return;
                  }
                  setIsAssembleTestModalOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
                  selectedQuestionIdsForTest.length > 0
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Create Test from Bank ({selectedQuestionIdsForTest.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveWorkspaceTab('bank')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeWorkspaceTab === 'bank'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Question Bank & Marks Engine</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {totalQuestions}
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeWorkspaceTab === 'tests'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Scheduled Tests & Quizzes</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {assessmentTests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeWorkspaceTab === 'analytics'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Student Scorecards & Accuracy Analytics</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-slate-900/40">
            {studentAttempts.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: QUESTION BANK DIRECTORY & MARKS MANAGEMENT              */}
      {/* ============================================================== */}
      {activeWorkspaceTab === 'bank' && (
        <div className="space-y-5">
          
          {/* Question Bank Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Bank Questions</span>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">
                {totalQuestions} MCQs
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified across syllabus</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Marks Weight</span>
              <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                {totalMarksSum.toFixed(1)} Marks
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Custom marks assigned</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Subject Domains</span>
              <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                {subjectsList.length} Disciplines
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Polity, Economy, History, etc.</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">UPSC PYQ References</span>
              <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {pyqQuestionsCount} Items
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Previous year questions</p>
            </div>
          </div>

          {/* Search, Filter & Bulk Select Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
            
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search question statement, topic, explanation, or PYQ tag..."
                value={searchBankQuery}
                onChange={e => setSearchBankQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Filter */}
              <select
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficultyFilter}
                onChange={e => setSelectedDifficultyFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Advanced">Advanced</option>
              </select>

              {/* Marks Filter */}
              <select
                value={selectedMarksFilter}
                onChange={e => setSelectedMarksFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Marks (+X)</option>
                <option value="2">2.0 Marks</option>
                <option value="2.5">2.5 Marks</option>
                <option value="4">4.0 Marks</option>
              </select>

              {/* Select All Checkbox for Test Assembly */}
              {role !== 'student' && (
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  {filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIdsForTest.includes(q.id)) ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Select Filtered ({filteredQuestions.length})</span>
                </button>
              )}
            </div>

          </div>

          {/* Question List Cards */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
              <Brain className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Questions Matched Filters</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing search terms or subject filters, or click "Add Question to Bank" to create a new high-yield item.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const isSelectedForTest = selectedQuestionIdsForTest.includes(q.id);
                const isExpanded = !!expandedSolutions[q.id];

                return (
                  <div
                    key={q.id}
                    className={`bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all shadow-2xs space-y-3.5 ${
                      isSelectedForTest
                        ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Select Checkbox, Subject & Topic badges, Marks & Penalty */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {role !== 'student' && (
                          <button
                            onClick={() => toggleSelectQuestionForTest(q.id)}
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                            title="Select for Test Creation"
                          >
                            {isSelectedForTest ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          {q.subject}
                        </span>
                        {q.topic && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.topic}
                          </span>
                        )}
                        {q.pyqYear && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                            {q.pyqYear}
                          </span>
                        )}
                      </div>

                      {/* Marks Allocation Badges & Difficulty */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono">
                          +{Number(q.marks || 2).toFixed(2)} Marks
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 text-[11px] font-mono">
                          -{Number(q.negativeMarks ?? 0.66).toFixed(2)} Penalty
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            q.difficulty === 'Advanced'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : q.difficulty === 'Moderate'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {q.difficulty}
                        </span>

                        {role !== 'student' && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                              title="Edit Question & Marks Scheme"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm('Delete this question from the Question Bank?')) {
                                  deleteQuestionFromBank(q.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Statement Prompt */}
                    <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {q.questionText}
                    </div>

                    {/* Options (Collapsible or Shown) */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correctOptionIndex;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border flex items-start gap-2.5 leading-snug ${
                                isExpanded && isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 font-semibold text-emerald-900 dark:text-emerald-200'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isExpanded && isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="pt-0.5">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expandable Explanation Section */}
                    {isExpanded && (
                      <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Correct Key: Option ({String.fromCharCode(65 + q.correctOptionIndex)})</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                          {q.explanation}
                        </p>
                        {q.authorFaculty && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                            Curated by: {q.authorFaculty}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Utility Row */}
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {q.tags && q.tags.map((tg, tIdx) => (
                          <span key={tIdx} className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{tg}</span>
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleSolutionExpand(q.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Verified Explanation</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Verified Explanation & Key</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SCHEDULED TESTS & LIVE QUIZ SIMULATOR                    */}
      {/* ============================================================== */}
      {activeWorkspaceTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Assessment Tests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click "Start Live Test Simulator" to test timed questions with automated grading
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {assessmentTests.length} Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessmentTests.map(test => {
              const attempt = studentAttempts.find(a => a.testId === test.id);

              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase">
                        {test.category}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {test.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {test.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Domain: {test.subject} · Scheduled on {test.scheduledDate}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Marks</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{test.totalMarks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{test.durationMinutes}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Questions</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{test.questions.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {attempt ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed: {attempt.score}/{attempt.totalMarks} ({attempt.accuracyPercentage}%)</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Negative Marking: -{test.negativeMarksPerWrong} marks
                      </span>
                    )}

                    <button
                      onClick={() => handleStartTest(test)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{attempt ? 'Retake Drill' : 'Start Live Test'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STUDENT PERFORMANCE & ACCURACY ANALYTICS                */}
      {/* ============================================================== */}
      {activeWorkspaceTab === 'analytics' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Student Test Attempts & Benchmarking Ledgers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation results, negative marking deductions, and diagnostic areas of improvement
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {studentAttempts.map(att => (
              <div
                key={att.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{att.testTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aspirant: <b className="text-slate-800 dark:text-slate-200">{att.studentName}</b> · Attempted {new Date(att.attemptedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                      Batch Rank #{att.rankInBatch}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {att.score} / {att.totalMarks} Marks
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium block">Correct Responses</span>
                    <span className="text-lg font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1 block">
                      {att.correctAnswers}
                    </span>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg">
                    <span className="text-rose-700 dark:text-rose-400 font-medium block">Incorrect (Penalty)</span>
                    <span className="text-lg font-mono font-bold text-rose-800 dark:text-rose-300 mt-1 block">
                      {att.incorrectAnswers}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <span className="text-slate-500 dark:text-slate-400 font-medium block">Unattempted</span>
                    <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                      {att.unattempted}
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-lg">
                    <span className="text-indigo-700 dark:text-indigo-400 font-medium block">Accuracy Rate</span>
                    <span className="text-lg font-mono font-bold text-indigo-800 dark:text-indigo-300 mt-1 block">
                      {att.accuracyPercentage}%
                    </span>
                  </div>
                </div>

                {/* Weakness & Mentor Guidance */}
                {att.improvementAreas && att.improvementAreas.length > 0 && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px] block">
                      Diagnostic Mentor Feedback:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                      {att.improvementAreas.map((area, aIdx) => (
                        <li key={aIdx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD QUESTION TO BANK (WITH MARKS & PENALTY ENGINE)     */}
      {/* ============================================================== */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 my-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Add New Item to Institutional Question Bank
                </h3>
              </div>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Populate Template Helpers */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick-Load Realistic Exam Prompts:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePreFillPolitySample}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100/50 text-[11px] font-semibold transition-colors"
                >
                  UPSC Polity (+2.0 M / -0.66 P)
                </button>
                <button
                  type="button"
                  onClick={handlePreFillCsatSample}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100/50 text-[11px] font-semibold transition-colors"
                >
                  CSAT Reasoning (+2.5 M / -0.83 P)
                </button>
              </div>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs">
              
              {/* Question Statement */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Prompt / Problem Statement *
                </label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder="e.g. Consider the following statements with reference to the Doctrine of Basic Structure..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Subject, Topic & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Domain *
                  </label>
                  <select
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  >
                    <option value="Indian Polity">Indian Polity</option>
                    <option value="Indian Economy">Indian Economy</option>
                    <option value="Modern History">Modern History</option>
                    <option value="Geography">Geography</option>
                    <option value="Environment & Ecology">Environment & Ecology</option>
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="CSAT Aptitude">CSAT Aptitude</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Topic / Chapter
                  </label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    placeholder="e.g. Fundamental Rights, Preamble"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={qDifficulty}
                    onChange={e => setQDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="Easy">Easy (Conceptual)</option>
                    <option value="Moderate">Moderate (Application)</option>
                    <option value="Advanced">Advanced (Multi-statement)</option>
                  </select>
                </div>
              </div>

              {/* Marks Allocation & Negative Penalties */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Marks for Correct Answer (+M) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={qMarks}
                    onChange={e => setQMarks(parseFloat(e.target.value) || 2)}
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Standard UPSC: +2.0 marks</span>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Negative Penalty for Wrong (-N) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={qNegativeMarks}
                    onChange={e => setQNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold text-rose-600"
                  />
                  <span className="text-[10px] text-slate-500">Standard UPSC: -0.66 marks</span>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Previous Year Exam Tag
                  </label>
                  <input
                    type="text"
                    value={qPyqYear}
                    onChange={e => setQPyqYear(e.target.value)}
                    placeholder="e.g. UPSC CSE 2024, TNPSC Gr 1"
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500">Optional exam origin</span>
                </div>
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Multiple Choice Options (Select radio for Correct Key) *
                </label>
                
                {[
                  { label: 'A', value: optA, setter: setOptA, idx: 0 },
                  { label: 'B', value: optB, setter: setOptB, idx: 1 },
                  { label: 'C', value: optC, setter: setOptC, idx: 2 },
                  { label: 'D', value: optD, setter: setOptD, idx: 3 }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctKey"
                      checked={correctKeyIndex === item.idx}
                      onChange={() => setCorrectKeyIndex(item.idx)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      title={`Mark ${item.label} as correct answer`}
                    />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-4">
                      {item.label}:
                    </span>
                    <input
                      type="text"
                      value={item.value}
                      onChange={e => item.setter(e.target.value)}
                      placeholder={`Enter text for Option ${item.label}`}
                      className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Detailed Explanation / Source Reference */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  In-Depth Explanation & Model Solution *
                </label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  placeholder="Explain why the chosen option is correct and point out errors in incorrect options..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs"
                >
                  Save Question to Bank
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1B: EDIT QUESTION IN BANK (MARKS & PENALTY EDITOR)       */}
      {/* ============================================================== */}
      {isEditQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 my-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Edit Question & Marks Configuration
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">ID: {editingQuestion.id}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditQuestionModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditQuestionSubmit} className="space-y-4 text-xs">
              
              {/* Question Statement */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Prompt / Problem Statement *
                </label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Subject, Topic & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Domain *
                  </label>
                  <select
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  >
                    <option value="Indian Polity">Indian Polity</option>
                    <option value="Indian Economy">Indian Economy</option>
                    <option value="Modern History">Modern History</option>
                    <option value="Geography">Geography</option>
                    <option value="Environment & Ecology">Environment & Ecology</option>
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="CSAT Aptitude">CSAT Aptitude</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Topic / Chapter
                  </label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    placeholder="e.g. Fundamental Rights, Preamble"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={qDifficulty}
                    onChange={e => setQDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="Easy">Easy (Conceptual)</option>
                    <option value="Moderate">Moderate (Application)</option>
                    <option value="Advanced">Advanced (Multi-statement)</option>
                  </select>
                </div>
              </div>

              {/* Marks Allocation & Negative Penalties */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Marks for Correct (+M) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={qMarks}
                    onChange={e => setQMarks(parseFloat(e.target.value) || 2)}
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">e.g. +2.0 or +2.5 marks</span>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Negative Penalty (-N) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={qNegativeMarks}
                    onChange={e => setQNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold text-rose-600"
                  />
                  <span className="text-[10px] text-slate-500">e.g. -0.66 or -0.83 marks</span>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Exam Tag / Origin
                  </label>
                  <input
                    type="text"
                    value={qPyqYear}
                    onChange={e => setQPyqYear(e.target.value)}
                    placeholder="e.g. UPSC CSE 2024"
                    className="w-full px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500">PYQ reference</span>
                </div>
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Multiple Choice Options (Select radio for Correct Key) *
                </label>
                
                {[
                  { label: 'A', value: optA, setter: setOptA, idx: 0 },
                  { label: 'B', value: optB, setter: setOptB, idx: 1 },
                  { label: 'C', value: optC, setter: setOptC, idx: 2 },
                  { label: 'D', value: optD, setter: setOptD, idx: 3 }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="editCorrectKey"
                      checked={correctKeyIndex === item.idx}
                      onChange={() => setCorrectKeyIndex(item.idx)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      title={`Mark ${item.label} as correct answer`}
                    />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-4">
                      {item.label}:
                    </span>
                    <input
                      type="text"
                      value={item.value}
                      onChange={e => item.setter(e.target.value)}
                      placeholder={`Enter text for Option ${item.label}`}
                      className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Detailed Explanation / Source Reference */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  In-Depth Explanation & Model Solution *
                </label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditQuestionModalOpen(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ASSEMBLE TEST FROM QUESTION BANK                      */}
      {/* ============================================================== */}
      {isAssembleTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assemble Test from Selected Bank Items
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedQuestionIdsForTest.length} questions selected from Question Bank
                </p>
              </div>
              <button onClick={() => setIsAssembleTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssembleTestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={newTestTitle}
                  onChange={e => setNewTestTitle(e.target.value)}
                  placeholder="e.g. UPSC CSE 2026 Prelims Mini Mock 05"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Code
                  </label>
                  <input
                    type="text"
                    value={newTestCode}
                    onChange={e => setNewTestCode(e.target.value)}
                    placeholder="e.g. VRM-MOCK-05"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newTestDuration}
                    onChange={e => setNewTestDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newTestCategory}
                    onChange={e => setNewTestCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="Prelims Mock">Prelims Mock</option>
                    <option value="Subject Drill">Subject Drill</option>
                    <option value="Mains Practice">Mains Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Batch
                  </label>
                  <select
                    value={newTestBatchId}
                    onChange={e => setNewTestBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-300">Selected Items Summary:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedQuestionIdsForTest.length} items will be scheduled with their respective marks and negative penalty rules.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssembleTestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs"
                >
                  Publish Live Test
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* LIVE TEST RUNNER VIEWPORT (MODAL OVERLAY)                       */}
      {/* ============================================================== */}
      {isTestRunning && activeTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
            
            {/* Top Bar: Title, Live Countdown Timer & Submit CTA */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold tracking-tight">{activeTest.title}</h3>
                <span className="text-[11px] text-slate-400">{activeTest.code} · {activeTest.subject}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold text-sm border border-slate-700">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(secondsLeft)}</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Submit test attempt now for automated grading?')) {
                      handleSubmitTest();
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Submit Test
                </button>
              </div>
            </div>

            {/* Test Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Question Workspace */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {(() => {
                  const currentQ = activeTest.questions[currentQuestionIndex];
                  if (!currentQ) return null;
                  const chosenOption = selectedAnswers[currentQ.id];
                  const isMarked = markedForReview[currentQ.id];

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <span className="font-mono font-bold text-slate-500 uppercase">
                          Question {currentQuestionIndex + 1} of {activeTest.questions.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono">
                            +{Number(currentQ.marks || 2).toFixed(2)} Marks
                          </span>
                          <span className="font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 text-[11px] font-mono">
                            -{Number(currentQ.negativeMarks ?? activeTest.negativeMarksPerWrong ?? 0.66).toFixed(2)} Penalty
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed font-medium whitespace-pre-line">
                        {currentQ.questionText}
                      </div>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {currentQ.options.map((opt, optIdx) => {
                          const isSelected = chosenOption === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionSelect(currentQ.id, optIdx)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                                isSelected
                                  ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 font-semibold text-slate-950 dark:text-amber-200 shadow-2xs'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full font-mono text-[11px] flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="pt-0.5 leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          {chosenOption !== undefined && (
                            <button
                              onClick={() => handleClearResponse(currentQ.id)}
                              className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700"
                            >
                              Clear Response
                            </button>
                          )}
                          <button
                            onClick={() => toggleMarkForReview(currentQ.id)}
                            className={`px-3 py-1.5 text-xs rounded-lg border font-medium ${
                              isMarked
                                ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isMarked ? '✓ Marked for Review' : 'Mark for Review'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                          </button>

                          <button
                            onClick={() =>
                              setCurrentQuestionIndex(prev =>
                                Math.min(activeTest.questions.length - 1, prev + 1)
                              )
                            }
                            disabled={currentQuestionIndex === activeTest.questions.length - 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-30"
                          >
                            <span>Save & Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Question Palette Sidebar */}
              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 p-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Question Palette
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {activeTest.questions.map((q, idx) => {
                      const isAnswered = selectedAnswers[q.id] !== undefined;
                      const isMarked = markedForReview[q.id];
                      const isCurrent = currentQuestionIndex === idx;

                      let btnStyle = 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                      if (isMarked) {
                        btnStyle = 'bg-purple-600 text-white border-purple-600';
                      } else if (isAnswered) {
                        btnStyle = 'bg-emerald-600 text-white border-emerald-600';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`h-9 rounded-lg font-mono text-xs font-bold border transition-all ${btnStyle} ${
                            isCurrent ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-600" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-purple-600" />
                      <span>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                      <span>Unattempted</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (window.confirm('Ready to submit your mock test answers?')) {
                        handleSubmitTest();
                      }
                    }}
                    className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg shadow-xs"
                  >
                    Finish & View Scorecard
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Post-Test Automated Scorecard Modal */}
      {completedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Automated Grading Complete
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {completedAttempt.testTitle}
                </h3>
              </div>
              <button onClick={() => setCompletedAttempt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-400 block">Total Score</span>
                <span className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  {completedAttempt.score} / {completedAttempt.totalMarks}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <span className="text-emerald-700 dark:text-emerald-400 block">Accuracy</span>
                <span className="text-xl font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1 block">
                  {completedAttempt.accuracyPercentage}%
                </span>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                <span className="text-rose-700 dark:text-rose-400 block">Incorrect (Penalty)</span>
                <span className="text-xl font-mono font-bold text-rose-800 dark:text-rose-300 mt-1 block">
                  {completedAttempt.incorrectAnswers}
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <span className="text-amber-700 dark:text-amber-400 block">Batch Rank</span>
                <span className="text-xl font-mono font-bold text-amber-800 dark:text-amber-300 mt-1 block">
                  #{completedAttempt.rankInBatch}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">Mentor Analysis & Recommended Actions:</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                {completedAttempt.improvementAreas?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCompletedAttempt(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
