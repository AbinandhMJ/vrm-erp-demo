import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { StudentManagement } from './components/students/StudentManagement';
import { CoursesAndBatches } from './components/academics/CoursesAndBatches';
import { Timetable } from './components/academics/Timetable';
import { LearningMaterials } from './components/academics/LearningMaterials';
import { ExamsModule } from './components/exams/ExamsModule';
import { FeeManagement } from './components/fees/FeeManagement';
import { ReportingView } from './components/reports/ReportingView';
import { CommunicationHub } from './components/communication/CommunicationHub';
import { StaffManagement } from './components/admin/StaffManagement';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SupportTickets } from './components/support/SupportTickets';
import { StudentPortal } from './components/portals/StudentPortal';
import { FacultyPortal } from './components/portals/FacultyPortal';
import { AdmissionModal } from './components/admissions/AdmissionModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { ApplyPage } from './components/apply/ApplyPage';
import { AdmissionForms } from './components/admissions/AdmissionForms';
import { OnlineClasses } from './components/academics/OnlineClasses';
import { LeaveManagement } from './components/admin/LeaveManagement';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    activeModal,
    closeModal,
    selectedReceiptForView,
    closeReceiptView,
    isFullscreen,
    role,
    hasActivityData,
    loadSampleData,
    openModal
  } = useApp();
  const isAdmin = role === 'management' || role === 'office_staff';

  // Content scrolls inside <main>, so reset it to the top when switching modules.
  useEffect(() => {
    document.getElementById('app-main')?.scrollTo({ top: 0 });
  }, [activeTab]);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'crm':
        return <CrmDashboard />;
      case 'forms':
        return <AdmissionForms />;
      case 'students':
        return <StudentManagement />;
      case 'academics':
        return <CoursesAndBatches />;
      case 'timetable':
        return <Timetable />;
      case 'materials':
        return <LearningMaterials />;
      case 'tests':
        return <ExamsModule />;
      case 'online_classes':
        return <OnlineClasses />;
      case 'leave':
        return <LeaveManagement />;
      case 'fees':
        return <FeeManagement />;
      case 'reports':
        return <ReportingView />;
      case 'communication':
        return <CommunicationHub />;
      case 'admin':
        return <StaffManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'support':
        return <SupportTickets />;
      case 'student_portal':
        return <StudentPortal />;
      case 'faculty_portal':
        return <FacultyPortal />;
      default:
        return <CrmDashboard />;
    }
  };

  return (
    // App shell is exactly one viewport tall: header and sidebar stay put, only <main> scrolls.
    <div className={`app-shell h-[100dvh] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors ${
      isFullscreen ? 'fixed inset-0 z-50 w-screen' : ''
    }`}>
      {/* Top Header */}
      <Header />

      {/* Main Viewport Body */}
      <div className="app-body flex-1 min-h-0 flex overflow-hidden">
        {/* Collapsible / Mobile Responsive Sidebar */}
        <Sidebar />

        {/* Content Viewport */}
        <main id="app-main" className="app-main flex-1 min-w-0 overflow-y-auto overscroll-contain">
          <div className="p-3 sm:p-5 lg:p-7 max-w-[1440px] mx-auto w-full">
            {isAdmin && !hasActivityData && (
              <div className="mb-5 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-amber-950 dark:text-amber-200">
                  <p className="font-bold text-sm">No students or enquiries yet</p>
                  <p className="mt-0.5 text-amber-900/80 dark:text-amber-200/80">
                    Everything you add is saved in this browser. Start by enrolling a student or capturing a lead, or load a sample academy to explore.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openModal('admission')}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-800"
                  >
                    Enroll first student
                  </button>
                  <button
                    onClick={loadSampleData}
                    className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 dark:bg-amber-600 text-white hover:bg-slate-800 dark:hover:bg-amber-500"
                  >
                    Load sample data
                  </button>
                </div>
              </div>
            )}
            {renderActiveTabContent()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {activeModal?.type === 'admission' && (
        <AdmissionModal
          initialLead={activeModal.data?.lead}
          onClose={closeModal}
        />
      )}

      {selectedReceiptForView && (
        <ReceiptModal
          receipt={selectedReceiptForView}
          onClose={closeReceiptView}
        />
      )}
    </div>
  );
};

/** Tiny hash router: /#/apply is the public online admission form; everything else is the app. */
const useHashRoute = () => {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
};

const RootApp: React.FC = () => {
  const { isAuthenticated } = useApp();
  const hash = useHashRoute();

  if (hash.startsWith('#/apply')) {
    return <ApplyPage />;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <RootApp />
    </AppProvider>
  );
}
