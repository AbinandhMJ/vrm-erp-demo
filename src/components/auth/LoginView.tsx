import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  User,
  GraduationCap,
  Briefcase,
  UserCheck,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  KeyRound,
  CheckCircle2,
  XCircle,
  Table,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, quickLogin, theme, toggleTheme } = useApp();
  const [username, setUsername] = useState('director@vrmiasacademy.in');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRbacMatrix, setShowRbacMatrix] = useState(false);

  const personas: {
    role: UserRole;
    name: string;
    designation: string;
    email: string;
    pass: string;
    icon: React.ReactNode;
    accessSummary: string;
    accentColor: string;
    bgAccent: string;
    badgeColor: string;
  }[] = [
    {
      role: 'management',
      name: 'Dr. V. R. Murugan, Ex-IRS',
      designation: 'Founder & Director General',
      email: 'director@vrmiasacademy.in',
      pass: 'admin123',
      icon: <GraduationCap className="w-5 h-5 text-amber-500" />,
      accessSummary: 'Full Academy Governance: Financial ledgers, staff compensation & payouts, course creation, exam alert publishing & executive KPIs.',
      accentColor: 'hover:border-amber-500',
      bgAccent: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
    },
    {
      role: 'office_staff',
      name: 'P. Sangeetha',
      designation: 'Head Registrar & Finance Controller',
      email: 'registrar@vrmiasacademy.in',
      pass: 'office123',
      icon: <Briefcase className="w-5 h-5 text-blue-500" />,
      accessSummary: 'Registrar & Billing: Student admissions, fee collections, invoice generation, attendance compliance & document records.',
      accentColor: 'hover:border-blue-500',
      bgAccent: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300'
    },
    {
      role: 'faculty',
      name: 'Dr. K. Ramanathan',
      designation: 'Senior Faculty - Polity & Governance',
      email: 'ramanathan.polity@vrmiasacademy.in',
      pass: 'faculty123',
      icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
      accessSummary: 'Faculty Console: Live batch attendance marking, syllabus topic logging, study material distribution & student test review.',
      accentColor: 'hover:border-emerald-500',
      bgAccent: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300'
    },
    {
      role: 'student',
      name: 'Aaditya Sharma',
      designation: 'Enrolled Aspirant (VRM-2026-089)',
      email: 'VRM-2026-089',
      pass: 'student123',
      icon: <User className="w-5 h-5 text-indigo-500" />,
      accessSummary: 'Student Portal: Course progress, personalized timetable, mock test quizzes with auto-grading, digital receipts & notes dossier.',
      accentColor: 'hover:border-indigo-500',
      bgAccent: 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/20',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300'
    },
    {
      role: 'field_agent',
      name: 'Deepa Nathan',
      designation: 'Senior Counselor & Field Outreach Lead',
      email: 'deepa.outreach@vrmiasacademy.in',
      pass: 'agent123',
      icon: <Sparkles className="w-5 h-5 text-rose-500" />,
      accessSummary: 'Field Outreach: Inbound CRM, college seminar rapid lead logger, counselor conversion SLAs & consultation scheduler.',
      accentColor: 'hover:border-rose-500',
      bgAccent: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20',
      badgeColor: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300'
    }
  ];

  const rbacMatrix = [
    { module: 'CRM & Lead Assignment', mgmt: true, office: true, faculty: false, student: false, agent: true },
    { module: 'Walk-in Admission & Fee Plan Gateway', mgmt: true, office: true, faculty: false, student: false, agent: false },
    { module: 'Student Directory & 360 Profile', mgmt: true, office: true, faculty: true, student: false, agent: false },
    { module: 'Course & Batch Setup (faculty: view only)', mgmt: true, office: true, faculty: true, student: false, agent: false },
    { module: 'Class Schedules & Timetable', mgmt: true, office: true, faculty: true, student: true, agent: false },
    { module: 'Learning Material Distribution', mgmt: true, office: true, faculty: true, student: true, agent: false },
    { module: 'Online Quizzes & Auto-Grading Engine', mgmt: true, office: true, faculty: true, student: true, agent: false },
    { module: 'Automated Invoicing & Fee Receipts', mgmt: true, office: true, faculty: false, student: false, agent: false },
    { module: 'Comprehensive Stakeholder Reports', mgmt: true, office: true, faculty: false, student: false, agent: false },
    { module: 'Government Exam Alerts Publishing', mgmt: true, office: true, faculty: false, student: false, agent: false },
    { module: 'Staff Records, Attendance & Payroll', mgmt: true, office: true, faculty: false, student: false, agent: false },
    { module: 'Real-Time Analytics & Executive KPIs', mgmt: true, office: false, faculty: false, student: false, agent: false },
    { module: 'Troubleshooting & Support Tickets', mgmt: true, office: true, faculty: true, student: true, agent: true }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter email or Roll Number');
      return;
    }
    const success = login(username, password);
    if (!success) {
      setErrorMessage('Incorrect username or password.');
    } else {
      setErrorMessage('');
    }
  };

  const handleSelectPersona = (p: typeof personas[0]) => {
    quickLogin(p.role);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      
      {/* Top Institutional Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/vrm-emblem.jpg"
            alt="VRM IAS Academy Emblem"
            className="w-10 h-10 rounded-full object-cover border border-amber-300 dark:border-amber-500/40 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                VRM IAS ACADEMY
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                ERP Portal
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Premier Civil Services Training Institute · Chennai, Tamil Nadu
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Sign-In Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col justify-center">
        
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC) Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In with Your Academy Role
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Click on any authorized role below for instant authenticated access to its tailored ERP workspace, or enter your credentials manually.
          </p>
        </div>

        {/* 1-Click Persona RBAC Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {personas.map(p => (
            <div
              key={p.role}
              onClick={() => handleSelectPersona(p)}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group ${p.accentColor} ${p.bgAccent}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {p.icon}
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${p.badgeColor}`}>
                    {p.role.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {p.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {p.designation}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.accessSummary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                  {p.email}
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-amber-300 text-[11px] group-hover:translate-x-1 transition-transform">
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}

          {/* Form Card for Manual Credentials */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Manual Sign-In Credentials
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs mt-3">
                {errorMessage && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded text-rose-700 dark:text-rose-300 text-[11px]">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Username / Email / Student Roll ID
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. director@vrmiasacademy.in or VRM-2026-089"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
                >
                  Authenticate & Launch Session
                </button>
              </form>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500">
              Demo passwords: <code className="font-mono text-slate-700 dark:text-slate-300">admin123</code>, <code className="font-mono text-slate-700 dark:text-slate-300">office123</code>, <code className="font-mono text-slate-700 dark:text-slate-300">faculty123</code>, <code className="font-mono text-slate-700 dark:text-slate-300">agent123</code>, <code className="font-mono text-slate-700 dark:text-slate-300">student123</code>.
              Newly admitted students sign in with their roll number and <code className="font-mono text-slate-700 dark:text-slate-300">VRM@</code> + last 4 digits of their phone.
            </div>
          </div>
        </div>

        {/* Toggleable RBAC Permissions Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowRbacMatrix(!showRbacMatrix)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-500" />
              <span>Compare Academy RBAC Permissions Matrix</span>
              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 hidden sm:inline">
                (View module access rules across all 5 roles)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-medium">{showRbacMatrix ? 'Hide Details' : 'Expand Matrix'}</span>
              {showRbacMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showRbacMatrix && (
            <div className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">ERP System Capability</th>
                    <th className="py-2.5 px-2 font-semibold text-center text-amber-700 dark:text-amber-400">Management</th>
                    <th className="py-2.5 px-2 font-semibold text-center text-blue-700 dark:text-blue-400">Office / Registrar</th>
                    <th className="py-2.5 px-2 font-semibold text-center text-emerald-700 dark:text-emerald-400">Faculty</th>
                    <th className="py-2.5 px-2 font-semibold text-center text-indigo-700 dark:text-indigo-400">Student Aspirant</th>
                    <th className="py-2.5 px-2 font-semibold text-center text-rose-700 dark:text-rose-400">Field Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rbacMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{row.module}</td>
                      <td className="py-2 px-2 text-center">
                        {row.mgmt ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.office ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.faculty ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.student ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.agent ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
        VRM IAS Academy Enterprise Portal · Protected by Role-Based Access Control · Chennai, Tamil Nadu
      </footer>

    </div>
  );
};
