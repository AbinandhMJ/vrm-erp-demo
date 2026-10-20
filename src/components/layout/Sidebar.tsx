import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  BellRing,
  Building2,
  BarChart3,
  LifeBuoy,
  UserCheck,
  Layers,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    role,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    leads,
    invoices,
    tickets,
    examAlerts
  } = useApp();

  const newLeadsCount = leads.filter(l => l.status === 'new' || l.status === 'ready_to_join').length;
  const pendingInvoicesCount = invoices.filter(i => i.status === 'pending').length;
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const activeAlertsCount = examAlerts.filter(a => a.status === 'active').length;

  const mainNavItems = [
    {
      id: 'crm',
      label: 'Admissions & CRM',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
      roles: ['management', 'office_staff', 'field_agent']
    },
    {
      id: 'students',
      label: 'Student Directory',
      icon: <GraduationCap className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff', 'faculty']
    },
    {
      id: 'academics',
      label: 'Courses & Batches',
      icon: <Layers className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff', 'faculty']
    },
    {
      id: 'timetable',
      label: 'Class Schedules',
      icon: <Calendar className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff', 'faculty', 'student']
    },
    {
      id: 'materials',
      label: 'Learning Materials',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff', 'faculty', 'student']
    },
    {
      id: 'tests',
      label: 'Tests & Assessments',
      icon: <ClipboardCheck className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff', 'faculty', 'student']
    },
    {
      id: 'fees',
      label: 'Fee Management',
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
      roles: ['management', 'office_staff']
    },
    {
      id: 'reports',
      label: 'Progress Reports',
      icon: <FileText className="w-4 h-4 shrink-0" />,
      roles: ['management', 'office_staff']
    },
    {
      id: 'communication',
      label: 'Govt Exam Alerts',
      icon: <BellRing className="w-4 h-4 shrink-0" />,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      roles: ['management', 'office_staff', 'faculty', 'student', 'field_agent']
    },
    {
      id: 'admin',
      label: 'Staff Administration',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      roles: ['management']
    },
    {
      id: 'analytics',
      label: 'Executive Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      roles: ['management']
    },
    {
      id: 'support',
      label: 'Help Desk & Tickets',
      icon: <LifeBuoy className="w-4 h-4 shrink-0" />,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      roles: ['management', 'office_staff', 'faculty', 'student', 'field_agent']
    }
  ];

  const portalItems = [
    {
      id: 'student_portal',
      label: 'My Student Portal',
      icon: <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />,
      roles: ['student', 'management']
    },
    {
      id: 'faculty_portal',
      label: 'Faculty Attendance & Batches',
      icon: <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />,
      roles: ['faculty', 'management']
    }
  ];

  const visibleNavItems = mainNavItems.filter(item => item.roles.includes(role));
  const visiblePortalItems = portalItems.filter(item => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-4 overflow-y-auto">
      <div className="space-y-6">
        
        {/* Dedicated Persona Portals */}
        {visiblePortalItems.length > 0 && (
          <div className="px-3">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Personalized Portal
              </div>
            )}
            <div className="space-y-1">
              {visiblePortalItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 text-left ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modules Navigation */}
        <div className="px-3">
          {!isSidebarCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Academy Modules
            </div>
          )}
          <nav className="space-y-1">
            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 text-left ${
                    isActive
                      ? 'bg-slate-900 dark:bg-amber-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-slate-700 dark:bg-amber-700 text-white'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Minimize / Maximize Sidebar Control & Footer Branding */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-3 space-y-2">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group`}
          title={isSidebarCollapsed ? 'Maximize Sidebar (Expand to Full Width)' : 'Minimize Sidebar (Collapse to Compact)'}
        >
          <div className="flex items-center gap-2.5">
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Minimize Sidebar</span>
              </>
            )}
          </div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] text-slate-400 font-mono">
              Collapse
            </span>
          )}
        </button>

        {!isSidebarCollapsed && (
          <div className="px-3 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <p className="font-semibold text-slate-600 dark:text-slate-300">VRM IAS Academy</p>
            <p className="text-[10px]">ERP Enterprise · RBAC Active</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/src/assets/images/vrm_academy_emblem_1792414585733.jpg"
                  alt="VRM IAS Academy Crest"
                  className="w-8 h-8 rounded-full object-cover border border-amber-300 dark:border-amber-500/40"
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  VRM IAS ERP
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
