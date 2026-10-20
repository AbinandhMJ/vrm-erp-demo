import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Lead, LeadStatus, LeadSource } from '../../types';
import {
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Smartphone,
  ChevronRight,
  X
} from 'lucide-react';
import { AdmissionModal } from '../admissions/AdmissionModal';
import { AdmissionFormPrint, printableFromApplication } from '../admissions/AdmissionFormPrint';
import { BarsChart, ChartCard } from '../charts/Charts';
import { addDays, parseISODate } from '../../lib/dates';

export const CrmDashboard: React.FC = () => {
  const {
    leads,
    counselors,
    addLead,
    updateLeadStatus,
    addFollowUp,
    courses,
    batches,
    role,
    currentAccount,
    today
  } = useApp();

  // Field agents / counselors work their own queue; office and management see every lead.
  const myCounselorId = role === 'field_agent' ? currentAccount?.linkedCounselorId : undefined;
  const scopedLeads = myCounselorId ? leads.filter(l => l.assignedCounselorId === myCounselorId) : leads;
  const canAdmit = role === 'management' || role === 'office_staff';
  const [visibleCount, setVisibleCount] = useState(40);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  // Modals & States
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [selectedLeadForAdmission, setSelectedLeadForAdmission] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isMobileFieldMode, setIsMobileFieldMode] = useState(false);
  const [viewForm, setViewForm] = useState<Lead | null>(null);

  // Form states for New Lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadTargetYear, setNewLeadTargetYear] = useState(String(new Date().getFullYear() + 1));
  const [newLeadCourse, setNewLeadCourse] = useState(courses[0]?.name || 'UPSC CSE 2026 GS Foundation');
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('website');
  const [newLeadLocation, setNewLeadLocation] = useState('');
  const [leadError, setLeadError] = useState('');
  const [lastAssigned, setLastAssigned] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Form states for Follow-up Logger
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<LeadStatus>('consultation_scheduled');

  const latestNextDate = (l: Lead) => [...l.followUps].reverse().find(f => f.nextFollowUpDate)?.nextFollowUpDate;
  const isOpen = (l: Lead) => l.status !== 'converted' && l.status !== 'dropped';
  const isFollowUpDue = (l: Lead) => {
    if (!isOpen(l)) return false;
    if (l.status === 'new') return true; // not yet contacted
    const next = latestNextDate(l);
    return !!next && next <= today;
  };

  const filteredLeads = scopedLeads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.studentName.toLowerCase().includes(q) ||
      lead.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      lead.targetCourse.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' ? isOpen(lead) : statusFilter === 'due' ? isFollowUpDue(lead) : lead.status === statusFilter);
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // KPIs, all computed from the lead records.
  const thisMonth = today.slice(0, 7);
  const lastMonthDate = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const leadsThisMonth = scopedLeads.filter(l => l.createdAt.slice(0, 7) === thisMonth).length;
  const leadsLastMonth = scopedLeads.filter(l => l.createdAt.slice(0, 7) === lastMonth).length;
  const dayOfMonth = Number(today.slice(8, 10));
  const daysInLastMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 0).getDate();
  // Compare like-for-like: this month so far vs. last month's pace for the same number of days.
  const paceChange = leadsLastMonth > 0 ? Math.round(((leadsThisMonth / dayOfMonth) / (leadsLastMonth / daysInLastMonth) - 1) * 100) : 0;

  const responseTimes = scopedLeads
    .filter(l => l.followUps.length > 0)
    .map(l => (new Date(l.followUps[0].timestamp).getTime() - new Date(l.createdAt).getTime()) / 60000)
    .filter(m => m >= 0 && m < 60 * 24 * 3);
  const avgResponseMinutes = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  const avgResponseTime = `${avgResponseMinutes} min`;

  const closedLeads = scopedLeads.filter(l => l.status === 'converted' || l.status === 'dropped');
  const convertedLeads = scopedLeads.filter(l => l.status === 'converted').length;
  const conversionRate = closedLeads.length > 0 ? Math.round((convertedLeads / closedLeads.length) * 100) : 0;
  const readyToJoinCount = scopedLeads.filter(l => l.status === 'ready_to_join').length;
  const followUpsDue = scopedLeads.filter(isFollowUpDue).length;
  const openLeads = scopedLeads.filter(isOpen).length;

  const pipelineRows = (
    [
      ['new', 'New'],
      ['contacted', 'Contacted'],
      ['consultation_scheduled', 'Consultation'],
      ['demo_attended', 'Attended demo'],
      ['ready_to_join', 'Ready to join']
    ] as [LeadStatus, string][]
  ).map(([status, stage]) => ({ stage, leads: scopedLeads.filter(l => l.status === status).length }));

  const weekStart = addDays(today, -((parseISODate(today).getDay() + 6) % 7));
  const weeklyRows = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(weekStart, -7 * (7 - i));
    const end = addDays(start, 6);
    const inWeek = scopedLeads.filter(l => l.createdAt.slice(0, 10) >= start && l.createdAt.slice(0, 10) <= end);
    return {
      week: parseISODate(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      enquiries: inWeek.length,
      joined: scopedLeads.filter(l => (l.convertedAt || '') >= start && (l.convertedAt || '') <= end).length
    };
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      setLeadError('Please enter the name and phone number.');
      return;
    }
    const digits = newLeadPhone.replace(/\D/g, '').slice(-10);
    const duplicate = leads.find(l => l.phone.replace(/\D/g, '').slice(-10) === digits && l.status !== 'dropped');
    if (duplicate) {
      setLeadError(`This number already belongs to ${duplicate.studentName} (assigned to ${duplicate.assignedCounselorName}).`);
      return;
    }
    setLeadError('');

    const created = addLead({
      studentName: newLeadName.trim(),
      phone: newLeadPhone.trim(),
      email: newLeadEmail.trim(),
      targetExamYear: newLeadTargetYear,
      targetCourse: newLeadCourse,
      source: newLeadSource,
      location: newLeadLocation,
      notes: newLeadNotes,
      fieldAgentName: role === 'field_agent' ? currentAccount?.name : undefined
    });
    setLastAssigned(`${created.studentName} → assigned to ${created.assignedCounselorName}`);
    setTimeout(() => setLastAssigned(''), 5000);

    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadEmail('');
    setNewLeadNotes('');
    setIsNewLeadModalOpen(false);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForFollowUp || !followUpNotes) return;

    addFollowUp(selectedLeadForFollowUp.id, followUpNotes, followUpDate, followUpStatus);
    setFollowUpNotes('');
    setFollowUpDate('');
    setSelectedLeadForFollowUp(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admissions & Student CRM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic lead assignment · Follow-up consultation scheduling · Instant admission conversion
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileFieldMode(!isMobileFieldMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors border ${
              isMobileFieldMode
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMobileFieldMode ? 'Standard Desktop CRM' : 'Field Agent Quick Mode'}</span>
          </button>

          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Capture New Lead</span>
          </button>
        </div>
      </div>

      {/* Counselor Performance & Efficiency KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Enquiries This Month</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{leadsThisMonth}</span>
            {leadsLastMonth > 0 && (
              <span className={`text-[11px] font-medium ${paceChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {paceChange >= 0 ? '+' : ''}
                {paceChange}% vs last month's pace
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{openLeads} open leads in the pipeline</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Avg First Response</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{avgResponseTime}</span>
            <span className={`text-[11px] font-medium ${avgResponseMinutes <= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>Target &lt; 20 min</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Enquiry to first counselor call</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Follow-ups Due</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">{followUpsDue}</span>
            <button onClick={() => setStatusFilter('due')} className="text-[11px] text-amber-800 dark:text-amber-300 font-medium hover:underline">
              View →
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{readyToJoinCount} ready to join · new or due today</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Conversion Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{conversionRate}%</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">{convertedLeads} admissions</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Of closed leads (joined vs dropped)</p>
        </div>
      </div>

      {/* Pipeline and weekly intake */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Lead pipeline" note="Open leads by stage" empty={openLeads === 0} emptyText="No open leads. Capture an enquiry to start the pipeline.">
          <BarsChart
            horizontal
            height={220}
            data={pipelineRows}
            xKey="stage"
            series={[{ key: 'leads', label: 'Leads' }]}
          />
        </ChartCard>
        <ChartCard title="New enquiries" note="Per week, last 8 weeks" empty={scopedLeads.length === 0} emptyText="No enquiries yet.">
          <BarsChart
            height={220}
            data={weeklyRows}
            xKey="week"
            series={[
              { key: 'enquiries', label: 'Enquiries' },
              { key: 'joined', label: 'Joined' }
            ]}
          />
        </ChartCard>
      </div>

      {/* Counselor Team Distribution Cards */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Active Counselor Assignment & Response Queues
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">New leads go to the least-busy counselor for that course</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {counselors.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  {c.conversionsThisMonth} joined this month
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Active Leads: <b className="text-slate-800 dark:text-slate-200 font-mono">{c.activeLeadsCount}</b></span>
                <span>Avg Response: <b className="text-slate-800 dark:text-slate-200 font-mono">{c.averageResponseMinutes}m</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Field Agent Quick Capture View */}
      {isMobileFieldMode && (
        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Field Agent Rapid Lead Logger (Mobile Seminar & College Visits)
            </h3>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-slate-400 mb-4">
            Designed for high-speed offline / mobile data collection during campus awareness programs.
          </p>

          {(leadError || lastAssigned) && (
            <div className={`mb-3 p-2 rounded-lg text-xs border ${leadError ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'}`}>
              {leadError || `Lead saved: ${lastAssigned}`}
            </div>
          )}
          <form onSubmit={handleCreateLead} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Candidate Name"
              value={newLeadName}
              onChange={e => setNewLeadName(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="tel"
              placeholder="Mobile Phone"
              value={newLeadPhone}
              onChange={e => setNewLeadPhone(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <select
              value={newLeadCourse}
              onChange={e => setNewLeadCourse(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              + Quick Save Lead
            </button>
          </form>
        </div>
      )}

      {!isMobileFieldMode && lastAssigned && (
        <div className="p-2.5 rounded-lg text-xs border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
          Lead saved: {lastAssigned}
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, course..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'due', label: `Due (${followUpsDue})` },
            { id: 'new', label: 'New' },
            { id: 'consultation_scheduled', label: 'Consultation' },
            { id: 'ready_to_join', label: 'Ready to Join' },
            { id: 'converted', label: 'Joined' },
            { id: 'dropped', label: 'Dropped' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
        >
          <option value="all">All Sources</option>
          <option value="website">Website Inquiries</option>
          <option value="field_agent">Field Agent / Seminars</option>
          <option value="walk_in">Walk-in Center</option>
          <option value="referral">Student Referrals</option>
          <option value="seminar">Seminars</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Aspirant Name & Target</th>
                <th className="px-4 py-3">Contact & Location</th>
                <th className="px-4 py-3">Inbound Source</th>
                <th className="px-4 py-3">Assigned Counselor</th>
                <th className="px-4 py-3">Lead Pipeline Status</th>
                <th className="px-4 py-3 text-right">CRM Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No leads found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.slice(0, visibleCount).map(lead => {
                  const isConverted = lead.status === 'converted';
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm flex flex-wrap items-center gap-1.5">
                          {lead.studentName}
                          {lead.application && (
                            <button
                              onClick={() => setViewForm(lead)}
                              title="Submitted the online admission form"
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 hover:underline"
                            >
                              Online form {lead.application.applicationNumber}
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Target Year: <span className="font-mono text-slate-700 dark:text-slate-300">{lead.targetExamYear}</span> · {lead.targetCourse}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {lead.source.replace('_', ' ')}
                        </span>
                        {lead.location && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{lead.location}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-white">{lead.assignedCounselorName}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          Logged: {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Enrolled in Batch</span>
                          </span>
                        ) : lead.status === 'ready_to_join' ? (
                          <span className="text-amber-800 dark:text-amber-300 font-bold text-xs bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            Ready to Join
                          </span>
                        ) : lead.status === 'consultation_scheduled' ? (
                          <span className="text-blue-700 dark:text-blue-400 font-medium text-xs">
                            Consultation Set
                          </span>
                        ) : lead.status === 'contacted' ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                            Contacted
                          </span>
                        ) : lead.status === 'demo_attended' ? (
                          <span className="text-indigo-700 dark:text-indigo-400 font-medium text-xs">Attended Demo</span>
                        ) : lead.status === 'dropped' ? (
                          <span className="text-slate-400 font-medium text-xs line-through">Dropped</span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold text-xs">
                            New Inbound
                          </span>
                        )}
                        {isFollowUpDue(lead) && lead.status !== 'new' && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Follow-up due</div>
                        )}
                        {lead.consultationDate && isOpen(lead) && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Meeting: {new Date(lead.consultationDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {isOpen(lead) ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLeadForFollowUp(lead);
                                setFollowUpStatus(lead.status);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                              title="Schedule follow-up consultation"
                            >
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Follow-up</span>
                            </button>

                            {canAdmit && (
                              <button
                                onClick={() => setSelectedLeadForAdmission(lead)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors shadow-2xs"
                                title="Convert to Admission & Generate Receipt"
                              >
                                <span>Admit</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                            {isConverted ? 'Student Active' : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredLeads.length > visibleCount && (
          <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setVisibleCount(v => v + 40)} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
              Show more ({filteredLeads.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Follow-up Consultation Logger Modal */}
      {selectedLeadForFollowUp && (
        <Modal title={<>Log Consultation & Follow-up: {selectedLeadForFollowUp.studentName}</>} onClose={() => setSelectedLeadForFollowUp(null)} size="md" bodyClassName="px-5 py-4 space-y-4">

        <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Update Lead Pipeline Status
            </label>
            <select
              value={followUpStatus}
              onChange={e => setFollowUpStatus(e.target.value as LeadStatus)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="contacted">Contacted · Shared Syllabus Guide</option>
              <option value="consultation_scheduled">Consultation Scheduled with Mentor</option>
              <option value="demo_attended">Attended Demo Lecture</option>
              <option value="ready_to_join">Ready to Join · Preparing Admission</option>
              <option value="dropped">Not Interested / Postponed to 2027</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Next Follow-up or In-Person Consultation Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Counseling Notes & Student Aspirations *
            </label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={e => setFollowUpNotes(e.target.value)}
              placeholder="e.g. Student visited center, interested in Morning batch. Discussed Optional subject guidance with Dr. Ramanathan..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {selectedLeadForFollowUp.followUps.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Previous Consultation History
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedLeadForFollowUp.followUps.map(fu => (
                  <div key={fu.id} className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded border border-slate-100 dark:border-slate-700 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>{fu.counselorName}</span>
                      <span>{new Date(fu.timestamp).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{fu.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedLeadForFollowUp(null)}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
            >
              Save Log
            </button>
          </div>
        </form>
        </Modal>
      )}

      {/* New Inbound Lead Modal */}
      {isNewLeadModalOpen && (
        <Modal title="Capture New Inbound Lead" onClose={() => setIsNewLeadModalOpen(false)} size="md" bodyClassName="px-5 py-4 space-y-4">

        <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
          {leadError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">{leadError}</div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Candidate Full Name *</label>
            <input
              type="text"
              value={newLeadName}
              onChange={e => setNewLeadName(e.target.value)}
              placeholder="e.g. Meenakshi Sundaram"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                value={newLeadPhone}
                onChange={e => setNewLeadPhone(e.target.value)}
                placeholder="+91 98401 XXXXX"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={newLeadEmail}
                onChange={e => setNewLeadEmail(e.target.value)}
                placeholder="aspirant@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Exam Year</label>
              <select
                value={newLeadTargetYear}
                onChange={e => setNewLeadTargetYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              >
                <option value="2026">UPSC 2026</option>
                <option value="2027">UPSC 2027</option>
                <option value="2028">UPSC 2028 Foundation</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Inbound Channel</label>
              <select
                value={newLeadSource}
                onChange={e => setNewLeadSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              >
                <option value="website">Website Portal Form</option>
                <option value="field_agent">Field Agent / College Seminar</option>
                <option value="walk_in">Academy Walk-in</option>
                <option value="referral">Alumni Referral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Interested Program</label>
            <select
              value={newLeadCourse}
              onChange={e => setNewLeadCourse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            >
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Enquiry Notes</label>
            <textarea
              rows={2}
              value={newLeadNotes}
              onChange={e => setNewLeadNotes(e.target.value)}
              placeholder="e.g. Final year engineering student, needs weekend batch..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(false)}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
            >
              Auto-Assign Counselor & Save
            </button>
          </div>
        </form>
        </Modal>
      )}

      {/* Admission Modal when converting lead */}
      {selectedLeadForAdmission && (
        <AdmissionModal
          initialLead={selectedLeadForAdmission}
          onClose={() => setSelectedLeadForAdmission(null)}
        />
      )}

      {viewForm && printableFromApplication(viewForm, courses, batches) && (
        <AdmissionFormPrint form={printableFromApplication(viewForm, courses, batches)!} onClose={() => setViewForm(null)} />
      )}
    </div>
  );
};
