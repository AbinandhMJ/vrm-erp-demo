import React, { useEffect, useMemo, useState } from 'react';
import { daysBetween, formatDate } from '../../lib/dates';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Avatar, PhotoPicker } from '../common/PhotoPicker';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { StaffMember } from '../../types';
import { LEAVE_LABEL, LEAVE_QUOTA, leaveUsed } from '../../lib/leave';
import { CheckCircle2, Phone, Mail, Plus, Pencil, Eye, CalendarDays, CalendarCheck, BookOpen, Users } from 'lucide-react';

type StaffDraft = {
  name: string;
  designation: string;
  department: StaffMember['department'];
  subjects: string;
  phone: string;
  email: string;
  monthlySalary: string;
  joiningDate: string;
  qualification: string;
  address: string;
  photo?: string;
  batchNames: string[];
};

const draftFrom = (s: StaffMember | null, today: string): StaffDraft => ({
  name: s?.name || '',
  designation: s?.designation || '',
  department: s?.department || 'Faculty',
  subjects: (s?.subjectsHandling || []).join(', '),
  phone: s?.phone || '',
  email: s?.email || '',
  monthlySalary: s ? String(s.monthlySalary) : '60000',
  joiningDate: s?.joiningDate || today,
  qualification: s?.qualification || '',
  address: s?.address || '',
  photo: s?.photo,
  batchNames: s?.assignedBatches || []
});

export const tenureLabel = (joiningDate: string, today: string) => {
  const days = daysBetween(joiningDate, today);
  if (days < 0) return 'Joins on ' + formatDate(joiningDate);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years === 0 && months === 0) return 'Joined this month';
  return [years ? `${years} yr` : '', months ? `${months} mo` : ''].filter(Boolean).join(' ') + ' with VRM';
};

const StaffFormModal: React.FC<{ staff: StaffMember | null; onClose: () => void; onSaved: (msg: { name: string; username?: string; password?: string }) => void }> = ({
  staff,
  onClose,
  onSaved
}) => {
  const { addStaffMember, updateStaffMember, batches, today, staffMembers } = useApp();
  const [f, setF] = useState<StaffDraft>(() => draftFrom(staff, today));
  const [error, setError] = useState('');
  const set = (patch: Partial<StaffDraft>) => setF(prev => ({ ...prev, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = [
      !f.name.trim() && 'full name',
      !f.phone.trim() && 'mobile number',
      !f.email.trim() && 'email',
      !f.joiningDate && 'joining date',
      !(Number(f.monthlySalary) > 0) && 'monthly salary'
    ].filter(Boolean);
    if (missing.length) return setError(`Please fill in: ${missing.join(', ')}.`);
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError('Enter a valid email address.');
    const dupe = staffMembers.find(s => s.id !== staff?.id && s.email.toLowerCase() === f.email.trim().toLowerCase());
    if (dupe) return setError(`${dupe.name} already uses this email.`);
    const data = {
      name: f.name.trim(),
      designation: f.designation.trim() || (f.department === 'Faculty' ? 'Faculty' : f.department),
      department: f.department,
      subjectsHandling: f.subjects.split(',').map(s => s.trim()).filter(Boolean),
      assignedBatches: f.batchNames,
      phone: f.phone.trim(),
      email: f.email.trim(),
      monthlySalary: Number(f.monthlySalary),
      joiningDate: f.joiningDate,
      qualification: f.qualification.trim() || undefined,
      address: f.address.trim() || undefined,
      photo: f.photo
    };
    if (staff) {
      updateStaffMember(staff.id, data);
      onSaved({ name: data.name });
    } else {
      const { credentials } = addStaffMember({ ...data, status: 'active' });
      onSaved({ name: data.name, ...credentials });
    }
  };

  return (
    <Modal
      title={staff ? `Edit ${staff.name}` : 'Onboard New Faculty / Staff Member'}
      subtitle={staff ? 'Changes show on the staff profile immediately.' : 'A login is created and the password is shown after saving.'}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button type="submit" form="staff-form" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            {staff ? 'Save changes' : 'Complete Onboarding'}
          </button>
        </div>
      }
    >
      <form id="staff-form" onSubmit={submit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <label className={LBL}>Full legal name *</label>
              <input className={FIELD} value={f.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Dr. Raghavan Swaminathan" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LBL}>Department</label>
                <select className={FIELD} value={f.department} onChange={e => set({ department: e.target.value as StaffMember['department'] })} disabled={!!staff}>
                  <option value="Faculty">Academic Faculty</option>
                  <option value="Administration">Administration & Front Desk</option>
                  <option value="Counseling">Counseling & Outreach</option>
                  <option value="Finance">Finance & Fee Accounts</option>
                </select>
              </div>
              <div>
                <label className={LBL}>Designation</label>
                <input className={FIELD} value={f.designation} onChange={e => set({ designation: e.target.value })} placeholder="Senior Faculty - Polity" />
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <label className={LBL}>Photograph</label>
            <PhotoPicker value={f.photo} onChange={photo => set({ photo })} alt="Staff photo" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Mobile number *</label>
            <input type="tel" className={FIELD} value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="+91 9XXXX XXXXX" />
          </div>
          <div>
            <label className={LBL}>Official email * {staff && <span className="font-normal text-slate-400">(login stays the same)</span>}</label>
            <input type="email" className={FIELD} value={f.email} onChange={e => set({ email: e.target.value })} placeholder="name@vrmiasacademy.com" />
          </div>
          <div>
            <label className={LBL}>Joining date *</label>
            <input type="date" className={FIELD} value={f.joiningDate} onChange={e => set({ joiningDate: e.target.value })} />
          </div>
          <div>
            <label className={LBL}>Agreed monthly salary (₹) *</label>
            <input type="number" min={0} className={`${FIELD} font-mono`} value={f.monthlySalary} onChange={e => set({ monthlySalary: e.target.value })} />
          </div>
          <div>
            <label className={LBL}>Qualification</label>
            <input className={FIELD} value={f.qualification} onChange={e => set({ qualification: e.target.value })} placeholder="e.g. M.A. Political Science, NET" />
          </div>
          <div>
            <label className={LBL}>Subjects handling (comma separated)</label>
            <input className={FIELD} value={f.subjects} onChange={e => set({ subjects: e.target.value })} placeholder="Polity, Governance, IR" />
          </div>
        </div>
        <div>
          <label className={LBL}>Address</label>
          <textarea rows={2} className={FIELD} value={f.address} onChange={e => set({ address: e.target.value })} />
        </div>
        {f.department === 'Faculty' && (
          <div>
            <label className={LBL}>Batches assigned</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {batches.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={f.batchNames.includes(b.name)}
                    onChange={e => set({ batchNames: e.target.checked ? [...f.batchNames, b.name] : f.batchNames.filter(n => n !== b.name) })}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </form>
    </Modal>
  );
};

const StaffProfileModal: React.FC<{ staff: StaffMember; onClose: () => void; onEdit: () => void }> = ({ staff, onClose, onEdit }) => {
  const { today, leaveRequests, salaryPayouts, schedule, role } = useApp();
  const year = today.slice(0, 4);
  const myLeave = leaveRequests.filter(l => l.staffId === staff.id).slice(0, 5);
  const myPayouts = salaryPayouts.filter(p => p.staffId === staff.id);
  const slots = schedule.filter(s => s.facultyName === staff.name);
  const row = (label: string, value: React.ReactNode) => (
    <div className="py-2 grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="col-span-2 font-medium text-slate-900 dark:text-white break-words">{value || '—'}</span>
    </div>
  );
  return (
    <Modal
      title="Staff profile"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end">
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            <Pencil className="w-3.5 h-3.5" /> Edit profile
          </button>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="shrink-0">
          {staff.photo ? (
            <img src={staff.photo} alt={staff.name} className="w-32 h-40 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-32 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-400">
              {staff.name.replace(/^(Dr|Col)\.?\s+/i, '').charAt(0)}
            </div>
          )}
          <span
            className={`mt-2 inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
              staff.status === 'on_leave' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
          >
            {staff.status === 'on_leave' ? 'On leave today' : 'Active'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{staff.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {staff.designation} · {staff.department}
          </p>
          {row('Joining date', `${formatDate(staff.joiningDate)} (${tenureLabel(staff.joiningDate, today)})`)}
          {row('Mobile', <span className="font-mono">{staff.phone}</span>)}
          {row('Email', staff.email)}
          {row('Qualification', staff.qualification)}
          {row('Address', staff.address)}
          {row('Attendance', `${staff.attendanceRate}% (approved leave not counted)`)}
          {(role === 'management' || role === 'office_staff') && row('Monthly salary', `₹${staff.monthlySalary.toLocaleString('en-IN')}`)}
        </div>
      </div>

      {(staff.subjectsHandling?.length || slots.length > 0) && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Subjects & classes
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {staff.subjectsHandling?.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {s}
              </span>
            ))}
          </div>
          {slots.length > 0 && (
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              {slots.map(s => (
                <li key={s.id}>
                  {s.day} {s.time}: <b className="text-slate-800 dark:text-slate-200">{s.subject}</b> · {s.batchName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Leave balance {year}
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['casual', 'sick', 'earned'] as const).map(t => (
              <div key={t} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500">{LEAVE_LABEL[t]}</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {LEAVE_QUOTA[t] - leaveUsed(leaveRequests, staff.id, t, year)}/{LEAVE_QUOTA[t]}
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            {myLeave.length === 0 && <li>No leave requests.</li>}
            {myLeave.map(l => (
              <li key={l.id}>
                {formatDate(l.from)}
                {l.to !== l.from && ` – ${formatDate(l.to)}`} · {LEAVE_LABEL[l.type]} · {l.days}d · <b className="capitalize">{l.status}</b>
              </li>
            ))}
          </ul>
        </div>
        {(role === 'management' || role === 'office_staff') && (
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Recent salary payouts</h4>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              {myPayouts.length === 0 && <li>No payouts yet.</li>}
              {myPayouts.slice(0, 4).map(p => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.month}</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{p.netPayout.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const StaffManagement: React.FC = () => {
  const { staffMembers, salaryPayouts, staffAttendance, markStaffAttendance, today, setActiveTab: goToTab, leaveRequests } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'payroll'>('roster');
  const [notice, setNotice] = useState<{ name: string; username?: string; password?: string } | null>(null);
  const [formStaff, setFormStaff] = useState<StaffMember | null | 'new'>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<'all' | StaffMember['department']>('all');
  const profile = staffMembers.find(s => s.id === profileId) || null;
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length;

  const visibleStaff = useMemo(
    () =>
      staffMembers.filter(
        s =>
          (dept === 'all' || s.department === dept) &&
          (!search.trim() || `${s.name} ${s.designation} ${(s.subjectsHandling || []).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
      ),
    [staffMembers, dept, search]
  );

  // Staff attendance marking
  type StaffMark = 'present' | 'absent' | 'leave';
  const [attDate, setAttDate] = useState(today);
  const [attMarks, setAttMarks] = useState<Record<string, StaffMark>>({});
  const [attSaved, setAttSaved] = useState(false);
  const activeStaff = staffMembers.filter(s => s.joiningDate <= attDate);
  const onApprovedLeave = (staffId: string, date: string) =>
    leaveRequests.some(l => l.staffId === staffId && l.status === 'approved' && l.from <= date && l.to >= date);
  useEffect(() => {
    const marks: Record<string, StaffMark> = {};
    staffAttendance.filter(a => a.date === attDate).forEach(a => (marks[a.staffId] = a.status));
    staffMembers.forEach(s => {
      if (!marks[s.id] && onApprovedLeave(s.id, attDate)) marks[s.id] = 'leave';
    });
    setAttMarks(marks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attDate]);
  const alreadyMarked = staffAttendance.some(a => a.date === attDate && a.status !== 'leave');
  const saveStaffAttendance = () => {
    markStaffAttendance(
      attDate,
      activeStaff.map(s => ({ staffId: s.id, status: attMarks[s.id] || 'present' }))
    );
    setAttSaved(true);
    setTimeout(() => setAttSaved(false), 2500);
  };

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
        activeTab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Staff & Faculty Administration</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Staff profiles · Subject allocations · Attendance · Salary ledger</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => goToTab('leave')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Leave & calendar{pendingLeave > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">{pendingLeave}</span>}
          </button>
          <button
            onClick={() => setFormStaff('new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New Staff</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {notice.username ? (
            <span>
              <b>{notice.name}</b> is onboarded. Login: <code className="font-mono">{notice.username}</code> / password <code className="font-mono">{notice.password}</code> (sent by
              email, simulated).
            </span>
          ) : (
            <span>
              <b>{notice.name}</b>'s profile is updated.
            </span>
          )}
          <button onClick={() => setNotice(null)} className="self-start text-emerald-700 dark:text-emerald-300 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit max-w-full overflow-x-auto">
        {tabBtn('roster', `Staff Directory (${staffMembers.length})`)}
        {tabBtn('attendance', 'Staff Attendance')}
        {tabBtn('payroll', `Salary Ledger (${salaryPayouts.length})`)}
      </div>

      {activeTab === 'roster' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, designation or subject"
              className={`${FIELD} sm:max-w-xs`}
            />
            <select value={dept} onChange={e => setDept(e.target.value as typeof dept)} className={`${FIELD} sm:max-w-[200px]`}>
              <option value="all">All departments</option>
              <option value="Faculty">Faculty</option>
              <option value="Administration">Administration</option>
              <option value="Counseling">Counseling</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleStaff.map(staff => (
              <div
                key={staff.id}
                data-staff-card={staff.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar photo={staff.photo} name={staff.name} className="w-12 h-12 text-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                          {staff.department}
                        </span>
                        {staff.status === 'on_leave' && (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">On leave today</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">{staff.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{staff.designation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Attendance</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">{staff.attendanceRate}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Joined {formatDate(staff.joiningDate)} · {tenureLabel(staff.joiningDate, today)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{staff.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                  </div>
                  {staff.subjectsHandling && staff.subjectsHandling.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {staff.subjectsHandling.map((sub, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">₹{staff.monthlySalary.toLocaleString('en-IN')} / mo</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setProfileId(staff.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => setFormStaff(staff)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {visibleStaff.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <Users className="w-5 h-5 mx-auto mb-1" /> No staff match this search.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date"
                value={attDate}
                max={today}
                onChange={e => e.target.value && setAttDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-slate-500">{formatDate(attDate)}</span>
              {alreadyMarked && <span className="text-amber-700 dark:text-amber-400 font-semibold">Already marked: editing</span>}
            </div>
            <button onClick={saveStaffAttendance} className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg shadow-xs self-start">
              {alreadyMarked ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Staff with approved leave on this date are pre-marked as Leave. Leave is not counted against attendance.</p>
          {attSaved && (
            <div className="p-2 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              Staff attendance saved. Attendance rates are updated.
            </div>
          )}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Staff</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Overall Rate</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeStaff.map(st => {
                  const mark = attMarks[st.id] || 'present';
                  return (
                    <tr key={st.id}>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <Avatar photo={st.photo} name={st.name} className="w-7 h-7 text-xs" />
                          {st.name}
                          {onApprovedLeave(st.id, attDate) && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">approved leave</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{st.department}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{st.attendanceRate}%</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1">
                        {(['present', 'leave', 'absent'] as StaffMark[]).map(m => (
                          <button
                            key={m}
                            onClick={() => setAttMarks(prev => ({ ...prev, [st.id]: m }))}
                            className={`px-2.5 py-1 rounded-md font-semibold ${
                              mark === m
                                ? m === 'present'
                                  ? 'bg-emerald-600 text-white'
                                  : m === 'leave'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-rose-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {m === 'present' ? 'Present' : m === 'leave' ? 'Leave' : 'Absent'}
                          </button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Staff / Faculty</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Incentives</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Payout</th>
                  <th className="px-4 py-3 font-mono">NEFT Ref</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salaryPayouts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                      No payouts recorded yet.
                    </td>
                  </tr>
                )}
                {salaryPayouts.map(sal => (
                  <tr key={sal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{sal.month}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{sal.staffName}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">₹{sal.baseSalary.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">+₹{sal.incentives.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400">-₹{sal.deductions.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">₹{sal.netPayout.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{sal.transactionRef}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disbursed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formStaff && (
        <StaffFormModal
          staff={formStaff === 'new' ? null : formStaff}
          onClose={() => setFormStaff(null)}
          onSaved={msg => {
            setNotice(msg);
            setFormStaff(null);
          }}
        />
      )}
      {profile && !formStaff && <StaffProfileModal staff={profile} onClose={() => setProfileId(null)} onEdit={() => setFormStaff(profile)} />}
    </div>
  );
};
