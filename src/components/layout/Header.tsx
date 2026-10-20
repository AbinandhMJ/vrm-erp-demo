import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  RotateCcw,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  UserPlus,
  ExternalLink
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    role,
    logout,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isFullscreen,
    toggleFullscreen,
    openModal,
    notificationCount,
    visibleExamAlerts: examAlerts,
    visibleAnnouncements: announcements,
    resetToDefaultData,
    loadSampleData,
    hasActivityData,
    onlineClasses,
    classReminders,
    currentStudent,
    currentStaff,
    today,
    setActiveTab
  } = useApp();
  // Class links sent today for this student's batch (most recent first).
  const classLinks =
    role === 'student'
      ? classReminders
          .filter(r => r.date === today)
          .map(r => ({ r, c: onlineClasses.find(c => c.id === r.classId) }))
          .filter(x => x.c && (x.c.batchIds.length === 0 || x.c.batchIds.includes(currentStudent?.enrolledBatchId || '')))
          .filter((x, i, all) => all.findIndex(y => y.c!.id === x.c!.id) === i)
      : [];

  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const canManageData = role === 'management' || role === 'office_staff';
  const confirmLoadSample = () => {
    if (window.confirm('Replace all current data with the sample academy (about 200 students and 6 months of activity)?')) loadSampleData();
  };
  const confirmClear = () => {
    if (window.confirm('Delete all students, leads, fees, attendance and other records? Logins, staff, courses, batches and the timetable are kept.'))
      resetToDefaultData();
  };

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="app-header shrink-0 relative z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5">
        
        {/* Left Zone: Mobile Toggle + Sidebar Toggle + Academy Crest & Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Academy Crest and Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/vrm-logo.jpg"
              alt="VRM IAS Academy Crest"
              className="w-9 h-9 shrink-0 rounded-lg object-contain bg-white p-0.5 border border-amber-300 dark:border-amber-500/40 shadow-2xs"
            />
            <div className="leading-tight min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white block truncate">
                VRM IAS ACADEMY
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide block whitespace-nowrap">
                ERP Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Center Zone: Active Role Breadcrumb Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Access Mode:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{role.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Right Zone: Utility Controls (Theme, Fullscreen, Notifications, Enroll, User Profile) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Enroll Student CTA (Staff & Management only) */}
          {(role === 'management' || role === 'office_staff') && (
            <button
              onClick={() => openModal('admission')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Theme Light/Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Drawer Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notification Drawer Popover */}
            {isNotifOpen && (
              <div className="fixed sm:absolute left-3 right-3 top-14 sm:top-auto sm:left-auto sm:right-0 mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Alerts & Broadcasts ({notificationCount})
                  </h4>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Close
                  </button>
                </div>
                
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                  {classLinks.length > 0 && (
                    <div className="py-2">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">Today's online classes</span>
                      {classLinks.map(({ r, c }) => (
                        <div key={r.id} className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 mb-1.5 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{c!.title}</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {c!.startTime} · {c!.platform} · {c!.facultyName}
                          </div>
                          <div className="flex gap-3 mt-1">
                            <a href={c!.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline">
                              Join link <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => {
                                setIsNotifOpen(false);
                                setActiveTab('online_classes');
                              }}
                              className="text-[11px] text-slate-500 hover:underline"
                            >
                              All classes
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="py-2">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                      Govt Exam Alerts
                    </span>
                    {examAlerts.slice(0, 2).map(alert => (
                      <div key={alert.id} className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100/70 dark:border-amber-900/40 mb-1.5 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{alert.examName}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {alert.vacancies} · Prelims on {alert.examDate}
                        </div>
                        <a
                          href={alert.officialApplyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-400 hover:underline mt-1"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="py-2">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                      Academy Notices
                    </span>
                    {announcements.slice(0, 2).map(ann => (
                      <div key={ann.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-1 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{ann.title}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo data menu (admins only) */}
          {canManageData && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsDataMenuOpen(o => !o)}
                title="Demo data"
                className="inline-flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {isDataMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs">
                  <div className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Demo data (this browser only)</div>
                  <button
                    onClick={() => {
                      setIsDataMenuOpen(false);
                      confirmLoadSample();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <span className="font-semibold block">Load sample data</span>
                    <span className="text-slate-500">Fill the app with a sample academy</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDataMenuOpen(false);
                      confirmClear();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400"
                  >
                    <span className="font-semibold block">Clear all data</span>
                    <span className="text-slate-500">{hasActivityData ? 'Start again from empty' : 'Already empty'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Switch Role / Sign Out Button */}
          <button
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Sign out (pick another demo account on the login screen)"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          {/* User Profile & Logout Dropdown */}
          <div className="relative pl-1 sm:pl-2 sm:border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {(currentStudent?.photo || currentStaff?.photo) ? (
                <img src={currentStudent?.photo || currentStaff?.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-amber-500 text-amber-300 dark:text-slate-950 font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[120px]">
                  {currentUser.designation}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      Role: {role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  {canManageData && (
                    <>
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          confirmLoadSample();
                        }}
                        className="sm:hidden w-full px-4 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Load sample data</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          confirmClear();
                        }}
                        className="sm:hidden w-full px-4 py-2 text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear all data</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
