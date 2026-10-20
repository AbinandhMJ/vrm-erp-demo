import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamAlert, AcademyAnnouncement } from '../../types';
import {
  BellRing,
  ExternalLink,
  Plus,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Share2,
  X
} from 'lucide-react';

export const CommunicationHub: React.FC = () => {
  const {
    visibleExamAlerts: examAlerts,
    addExamAlert,
    visibleAnnouncements: announcements,
    addAnnouncement,
    role
  } = useApp();

  const [activeTab, setActiveTab] = useState<'alerts' | 'notices' | 'sms'>('alerts');
  const [isPublishAlertOpen, setIsPublishAlertOpen] = useState(false);
  const [isPublishNoticeOpen, setIsPublishNoticeOpen] = useState(false);

  // New Exam Alert Form
  const [examName, setExamName] = useState('');
  const [organization, setOrganization] = useState('UPSC');
  const [postNames, setPostNames] = useState('');
  const [vacancies, setVacancies] = useState('1,000+ Posts');
  const [notificationDate, setNotificationDate] = useState('2026-11-01');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-11-25');
  const [examDate, setExamDate] = useState('2027-05-23');
  const [applyUrl, setApplyUrl] = useState('https://upsconline.nic.in');
  const [targetAudience, setTargetAudience] = useState<'All' | 'Students' | 'Staff' | 'Website'>('All');
  const [highlights, setHighlights] = useState('Preliminary Exam on May 23, OTR Registration mandatory');

  // New Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'high' | 'normal'>('normal');
  const [annAudience, setAnnAudience] = useState<'All' | 'Students' | 'Faculty'>('All');

  // SMS Simulator State
  const [smsRecipient, setSmsRecipient] = useState('All Enrolled Students');
  const [smsMessage, setSmsMessage] = useState(
    'VRM IAS ACADEMY: UPSC Prelims Mock Test 05 will be held this Sunday at 09:30 AM in Chanakya Hall. Please carry your student ID card.'
  );
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);

  const canPublish = role === 'management' || role === 'office_staff';

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !applyUrl) return;

    addExamAlert({
      examName,
      organization,
      postNames,
      vacancies,
      notificationDate,
      applicationDeadline,
      examDate,
      officialApplyUrl: applyUrl,
      targetAudience,
      keyHighlights: highlights.split(',').map(s => s.trim()).filter(Boolean),
      status: 'active'
    });

    setIsPublishAlertOpen(false);
    setExamName('');
    setPostNames('');
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    addAnnouncement({
      title: annTitle,
      content: annContent,
      author: 'Academic Administration',
      priority: annPriority,
      audience: annAudience
    });

    setIsPublishNoticeOpen(false);
    setAnnTitle('');
    setAnnContent('');
  };

  const handleDispatchSms = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsSentSuccess(true);
    setTimeout(() => {
      setSmsSentSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Government Exam Alerts & Communications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official UPSC / State PSC notifications · Multi-channel publishing · SMS / Push event reminders
          </p>
        </div>

        {canPublish && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPublishNoticeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Internal Notice</span>
            </button>
            <button
              onClick={() => setIsPublishAlertOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Exam Alert</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'alerts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Government Exam Alerts ({examAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'notices'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Internal Announcements ({announcements.length})
        </button>
        {canPublish && (
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'sms'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SMS / Push Dispatcher
          </button>
        )}
      </div>

      {/* Tab 1: Government Exam Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {examAlerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                      {alert.organization}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Audience: {alert.targetAudience}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {alert.examName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {alert.postNames}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                    {alert.vacancies}
                  </span>
                </div>
              </div>

              {/* Key Timeline Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Notification Released</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{alert.notificationDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Last Date to Apply</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{alert.applicationDeadline}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Preliminary Exam Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{alert.examDate}</span>
                </div>
              </div>

              {/* Highlights & Bullet Points */}
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Crucial Notification Directives
                </span>
                <ul className="space-y-1 list-disc list-inside">
                  {alert.keyHighlights.map((hl, idx) => (
                    <li key={idx}>{hl}</li>
                  ))}
                </ul>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Verified by VRM Civil Services Research Cell
                </span>
                <a
                  href={alert.officialApplyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-2xs"
                >
                  <span>Official Application Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Internal Announcements */}
      {activeTab === 'notices' && (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className={`p-5 bg-white dark:bg-slate-900 border rounded-xl shadow-2xs space-y-2 ${
                ann.priority === 'high'
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {ann.priority === 'high' && (
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 uppercase">
                      High Priority Notice
                    </span>
                  )}
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Audience: {ann.audience}</span>
                </div>
                <span className="font-mono text-slate-400 dark:text-slate-500">{ann.date}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ann.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ann.content}</p>

              <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500">
                Issued by: <span className="font-medium text-slate-700 dark:text-slate-300">{ann.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: SMS & Push Dispatcher Simulator */}
      {activeTab === 'sms' && canPublish && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Broadcast SMS & Push Notification Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send immediate exam alerts, schedule adjustments, or fee reminders directly to student and parent handsets.
            </p>
          </div>

          <form onSubmit={handleDispatchSms} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipient Group</label>
              <select
                value={smsRecipient}
                onChange={e => setSmsRecipient(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="All Enrolled Students">All Enrolled Students (Current Batches)</option>
                <option value="Morning Regular Batch (Alpha-26)">Morning Regular Batch (Alpha-26)</option>
                <option value="Evening Professionals Batch (Delta-26)">Evening Professionals Batch (Delta-26)</option>
                <option value="Weekend Super-30 Mentorship Batch">Weekend Super-30 Mentorship Batch</option>
                <option value="Parents of Defaulters (<80% Attendance)">Parents of Defaulters (&lt;80% Attendance)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Message Body (Max 160 Characters per SMS)
              </label>
              <textarea
                rows={3}
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>Sender ID: <b className="text-slate-700 dark:text-slate-300">VRMIAS</b></span>
                <span>{smsMessage.length} / 160 chars</span>
              </div>
            </div>

            {smsSentSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>SMS broadcast successfully queued and dispatched to {smsRecipient}!</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Broadcast Dispatch</span>
            </button>
          </form>
        </div>
      )}

      {/* Publish Exam Alert Modal */}
      {isPublishAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Publish Government Exam Alert</h3>
              <button onClick={() => setIsPublishAlertOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Name *</label>
                <input
                  type="text"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. UPSC CSE 2027 Notification"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Commission / Org</label>
                  <select
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="UPSC">UPSC</option>
                    <option value="TNPSC">TNPSC</option>
                    <option value="SSC">SSC</option>
                    <option value="State PSC">Other State PSC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Vacancies</label>
                  <input
                    type="text"
                    value={vacancies}
                    onChange={e => setVacancies(e.target.value)}
                    placeholder="1,056 Posts"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Publish Destination</label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="All">All (Students, Staff & Portal)</option>
                    <option value="Students">Enrolled Students Only</option>
                    <option value="Staff">Faculty & Staff</option>
                    <option value="Website">Public Website Noticeboard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={e => setApplicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Apply Link *</label>
                <input
                  type="url"
                  value={applyUrl}
                  onChange={e => setApplyUrl(e.target.value)}
                  placeholder="https://upsconline.nic.in"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Highlights (comma-separated)</label>
                <input
                  type="text"
                  value={highlights}
                  onChange={e => setHighlights(e.target.value)}
                  placeholder="Prelims on May 24, Age 21-32..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPublishAlertOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
                >
                  Publish Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Notice Modal */}
      {isPublishNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Publish Internal Announcement</h3>
              <button onClick={() => setIsPublishNoticeOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="e.g. Schedule Change: Optional Class on Sunday"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={annAudience}
                    onChange={e => setAnnAudience(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="All">All Academy</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={annPriority}
                    onChange={e => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Details *</label>
                <textarea
                  rows={3}
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="Full text of the announcement..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPublishNoticeOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
