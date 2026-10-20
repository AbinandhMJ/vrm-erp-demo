import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { StudentManagement } from './components/students/StudentManagement';
import { CoursesAndBatches } from './components/academics/CoursesAndBatches';
import { Timetable } from './components/academics/Timetable';
import { LearningMaterials } from './components/academics/LearningMaterials';
import { TestAssessment } from './components/academics/TestAssessment';
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

const MainLayout: React.FC = () => {
  const {
    activeTab,
    activeModal,
    closeModal,
    selectedReceiptForView,
    closeReceiptView,
    isFullscreen
  } = useApp();

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'crm':
        return <CrmDashboard />;
      case 'students':
        return <StudentManagement />;
      case 'academics':
        return <CoursesAndBatches />;
      case 'timetable':
        return <Timetable />;
      case 'materials':
        return <LearningMaterials />;
      case 'tests':
        return <TestAssessment />;
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
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors ${
      isFullscreen ? 'fixed inset-0 z-50 overflow-hidden w-screen h-screen' : ''
    }`}>
      {/* Top Header */}
      <Header />

      {/* Main Viewport Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible / Mobile Responsive Sidebar */}
        <Sidebar />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 max-w-[1440px] mx-auto w-full">
          {renderActiveTabContent()}
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

const RootApp: React.FC = () => {
  const { isAuthenticated } = useApp();

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
