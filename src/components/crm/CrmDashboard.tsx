import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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

export const CrmDashboard: React.FC = () => {
  const {
    leads,
    counselors,
    addLead,
    updateLeadStatus,
    addFollowUp,
    courses,
    role
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  // Modals & States
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<Lead | null>(null);
  const [selectedLeadForAdmission, setSelectedLeadForAdmission] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isMobileFieldMode, setIsMobileFieldMode] = useState(false);

  // Form states for New Lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadTargetYear, setNewLeadTargetYear] = useState('2026');
  const [newLeadCourse, setNewLeadCourse] = useState(courses[0]?.name || 'UPSC CSE 2026 GS Foundation');
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('website');
  const [newLeadLocation, setNewLeadLocation] = useState('Chennai');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Form states for Follow-up Logger
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<LeadStatus>('consultation_scheduled');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.targetCourse.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const avgResponseTime = '14.2 min';
  const readyToJoinCount = leads.filter(l => l.status === 'ready_to_join').length;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) {
      alert('Please fill out Name and Phone');
      return;
    }

    addLead({
      studentName: newLeadName,
      phone: newLeadPhone,
      email: newLeadEmail || `${newLeadName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      targetExamYear: newLeadTargetYear,
      targetCourse: newLeadCourse,
      source: newLeadSource,
      location: newLeadLocation,
      notes: newLeadNotes,
      fieldAgentName: newLeadSource === 'field_agent' ? 'Deepa Nathan' : undefined
    });

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
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Inquiries Logged</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{totalLeads}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+18% this month</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Synced across Web, Field & Walk-in</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Avg Response Latency</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{avgResponseTime}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Target &lt; 20 min</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Auto-assigned to available counselor</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Ready to Enroll</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">{readyToJoinCount}</span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">High Intent</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Attended demo / awaiting payment</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Counselor Conversion Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{conversionRate}%</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">{convertedLeads} admissions</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Lead to classroom onboarding</p>
        </div>
      </div>

      {/* Counselor Team Distribution Cards */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Active Counselor Assignment & Response Queues
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Auto Round-Robin Allocation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {counselors.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  {c.conversionsThisMonth} converted
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Active Leads: <b className="text-slate-800 dark:text-slate-200 font-mono">{c.activeLeadsCount}</b></span>
                <span>Avg Call: <b className="text-slate-800 dark:text-slate-200 font-mono">{c.averageResponseMinutes}m</b></span>
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
            { id: 'all', label: 'All Leads' },
            { id: 'new', label: 'New' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'consultation_scheduled', label: 'Consultation Set' },
            { id: 'ready_to_join', label: 'Ready to Join' },
            { id: 'converted', label: 'Converted' }
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
                filteredLeads.map(lead => {
                  const isConverted = lead.status === 'converted';
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{lead.studentName}</div>
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
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold text-xs">
                            New Inbound
                          </span>
                        )}
                        {lead.consultationDate && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Meeting: {new Date(lead.consultationDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {!isConverted ? (
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

                            <button
                              onClick={() => setSelectedLeadForAdmission(lead)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors shadow-2xs"
                              title="Convert to Admission & Generate Receipt"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                            Student Active
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
      </div>

      {/* Follow-up Consultation Logger Modal */}
      {selectedLeadForFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log Consultation & Follow-up: {selectedLeadForFollowUp.studentName}
              </h3>
              <button
                onClick={() => setSelectedLeadForFollowUp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

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
          </div>
        </div>
      )}

      {/* New Inbound Lead Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Capture New Inbound Lead</h3>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
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
          </div>
        </div>
      )}

      {/* Admission Modal when converting lead */}
      {selectedLeadForAdmission && (
        <AdmissionModal
          initialLead={selectedLeadForAdmission}
          onClose={() => setSelectedLeadForAdmission(null)}
        />
      )}

    </div>
  );
};
