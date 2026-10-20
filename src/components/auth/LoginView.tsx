import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Eye, EyeOff, Moon, Sun, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS: { role: UserRole; label: string; who: string }[] = [
  { role: 'management', label: 'Management', who: 'Director' },
  { role: 'office_staff', label: 'Office & Fees', who: 'Registrar' },
  { role: 'faculty', label: 'Faculty', who: 'Polity lead' },
  { role: 'field_agent', label: 'Counselor', who: 'Admissions' },
  { role: 'student', label: 'Student', who: 'Aspirant' }
];

export const LoginView: React.FC = () => {
  const { login, quickLogin, accounts, theme, toggleTheme, todaysQuiz, loadSampleData, hasActivityData } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const question = todaysQuiz[0];
  const firstStudent = accounts.find(a => a.role === 'student');
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    // Brief delay so the button state is visible; everything is local.
    setTimeout(() => {
      const ok = login(username, password);
      setBusy(false);
      if (!ok) setError('Incorrect username or password.');
    }, 250);
  };

  const signInAsDemo = (role: UserRole) => {
    if (role === 'student') {
      // Use the sample student if present, otherwise the first enrolled student.
      if (accounts.some(a => a.id === 'acc-stu-01')) quickLogin('student');
      else if (firstStudent) login(firstStudent.username, firstStudent.password);
      return;
    }
    quickLogin(role);
  };

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] bg-[#f6f7f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Brand panel: today's question, set like an exam paper */}
      <section className="relative order-2 lg:order-1 bg-[#14213d] text-white px-6 py-10 sm:px-12 lg:px-16 lg:py-14 flex flex-col justify-between gap-10 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] h-[28rem] rounded-full border-[40px] border-[#e09f3e]/10"
        />
        <div className="hidden lg:flex items-center gap-4 relative">
          <img src="/vrm-logo.jpg" alt="" className="w-20 h-20 rounded-2xl object-contain bg-white p-1" />
          <div className="space-y-2">
            <img src="/vrm-wordmark.jpg" alt="VRM IAS Academy" className="h-9 w-auto rounded-sm" />
            <p className="text-sm text-slate-300">Perambalur · UPSC, TNPSC, Bank, SSC, Police, TRB and more</p>
          </div>
        </div>

        {question ? (
          <figure className="relative max-w-xl">
            <p className="text-sm text-[#e09f3e] font-semibold">Today's question, {todayLabel}</p>
            <blockquote className="mt-4 font-['Source_Serif_4',Georgia,serif] text-xl sm:text-2xl leading-[1.45] text-slate-50 whitespace-pre-line">
              {question.questionText}
            </blockquote>
            <figcaption className="mt-6 text-sm text-slate-300">
              {question.subject}
              {question.pyqYear ? `, ${question.pyqYear}` : ''}. Students can answer it after signing in.
            </figcaption>
          </figure>
        ) : (
          <p className="relative font-['Source_Serif_4',Georgia,serif] text-2xl leading-snug max-w-lg">
            Admissions, classes, tests and fees for VRM IAS Academy in one place.
          </p>
        )}

        <p className="relative text-xs text-slate-400">Demo build. Data is stored only in this browser.</p>
      </section>

      {/* Sign-in */}
      <section className="order-1 lg:order-2 flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:invisible">
            <img src="/vrm-logo.jpg" alt="VRM IAS Academy" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 ring-2 ring-[#e09f3e]/60" />
            <span className="font-bold tracking-tight">VRM IAS Academy</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Students use their roll number. Staff use their academy email.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="login-user" className="block text-sm font-semibold mb-1.5">
                Roll number or email
              </label>
              <input
                id="login-user"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="VRM-2026-001 or name@vrmiasacademy.com"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e09f3e] focus:border-[#e09f3e]"
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e09f3e] focus:border-[#e09f3e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-1.5 top-1.5 w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-lg bg-[#14213d] dark:bg-[#e09f3e] text-white dark:text-slate-950 text-sm font-bold hover:bg-[#1d2f55] dark:hover:bg-[#eab05a] disabled:opacity-70 inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#e09f3e]"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New students get their password at admission: <span className="font-mono">VRM@</span> followed by the last 4 digits of their
              phone number.
            </p>
          </form>

          <a
            href="#/apply"
            className="mt-6 block rounded-lg border border-[#e09f3e]/60 bg-[#e09f3e]/10 px-4 py-3 text-sm hover:bg-[#e09f3e]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e09f3e]"
          >
            <span className="font-semibold">New student? Apply for admission online</span>
            <span className="block text-xs text-slate-600 dark:text-slate-400">Fill the admission form; our team will call you back.</span>
          </a>

          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold">Try a demo account</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => {
                const disabled = acc.role === 'student' && !firstStudent;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={disabled}
                    onClick={() => signInAsDemo(acc.role)}
                    title={disabled ? 'No students yet. Enroll one or load sample data first.' : `Sign in as ${acc.label}`}
                    className="text-left px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#e09f3e] disabled:opacity-45 disabled:hover:border-slate-200 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e09f3e]"
                  >
                    <span className="block text-sm font-semibold">{acc.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{acc.who}</span>
                  </button>
                );
              })}
            </div>
            {!hasActivityData && (
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                The academy has no students yet.{' '}
                <button type="button" onClick={loadSampleData} className="font-semibold text-[#b67812] dark:text-[#e09f3e] underline underline-offset-2">
                  Load sample data
                </button>{' '}
                to explore with about 200 students, or sign in as Office and enroll your own.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
