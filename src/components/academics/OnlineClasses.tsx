import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { OnlineClass, OnlinePlatform } from '../../types';
import { addDays, formatDate } from '../../lib/dates';
import {
  ClassOccurrence,
  audienceLabel,
  classIsFor,
  occurrenceKey,
  occurrenceStatus,
  occurrencesBetween,
  repeatLabel,
  timeLabel
} from '../../lib/onlineClasses';
import { Video, Plus, Send, Youtube, ExternalLink, Pencil, Trash2, Ban, RotateCcw, PlayCircle, BellRing, Radio, Link2 } from 'lucide-react';

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLATFORMS: OnlinePlatform[] = ['YouTube Live', 'Google Meet', 'Zoom', 'Other'];

/** Re-renders every 30 s so "Live now" / "Join" states stay current. */
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
};

const dayHeading = (date: string, today: string) =>
  date === today ? 'Today' : date === addDays(today, 1) ? 'Tomorrow' : date === addDays(today, -1) ? 'Yesterday' : formatDate(date);

const StatusPill: React.FC<{ status: ReturnType<typeof occurrenceStatus> }> = ({ status }) => {
  const style = {
    live: 'bg-rose-600 text-white',
    upcoming: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    ended: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    cancelled: 'bg-slate-200 text-slate-600 line-through dark:bg-slate-800 dark:text-slate-500'
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style}`}>
      {status === 'live' && <Radio className="w-3 h-3 animate-pulse" />}
      {status === 'live' ? 'Live now' : status}
    </span>
  );
};

export const OnlineClasses: React.FC = () => {
  const {
    role,
    currentStudent,
    currentStaff,
    onlineClasses,
    classReminders,
    batches,
    staffMembers,
    schedule,
    today,
    settings,
    updateSettings,
    saveOnlineClass,
    deleteOnlineClass,
    setOccurrenceCancelled,
    setRecordingLink,
    sendClassReminder,
    classAudienceSize
  } = useApp();
  const now = useNow();
  const isStudent = role === 'student';
  const canManage = role === 'management' || role === 'office_staff' || role === 'faculty';

  const [view, setView] = useState<'upcoming' | 'series' | 'recordings' | 'reminders'>('upcoming');
  const [mineOnly, setMineOnly] = useState(role === 'faculty');
  const [editing, setEditing] = useState<OnlineClass | 'new' | null>(null);
  const [recordingFor, setRecordingFor] = useState<ClassOccurrence | null>(null);
  const [toast, setToast] = useState('');
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 3500);
  };

  const myClasses = useMemo(
    () =>
      onlineClasses.filter(c =>
        isStudent ? classIsFor(c, currentStudent?.enrolledBatchId) : !mineOnly || !currentStaff || c.facultyName === currentStaff.name
      ),
    [onlineClasses, isStudent, currentStudent, mineOnly, currentStaff]
  );

  const upcoming = useMemo(
    () => occurrencesBetween(myClasses, today, addDays(today, 13)).filter(o => occurrenceStatus(o, now) !== 'ended' || o.date === today),
    [myClasses, today, now]
  );
  const past = useMemo(() => occurrencesBetween(myClasses, addDays(today, -60), today).filter(o => occurrenceStatus(o, now) === 'ended').reverse(), [myClasses, today, now]);
  const recordings = past.filter(o => o.recording);

  const remindersFor = (o: ClassOccurrence) => classReminders.filter(r => r.classId === o.cls.id && r.date === o.date);
  const grouped = upcoming.reduce<Record<string, ClassOccurrence[]>>((acc, o) => ((acc[o.date] ||= []).push(o), acc), {});
  const liveNow = upcoming.filter(o => occurrenceStatus(o, now) === 'live');

  const canJoin = (o: ClassOccurrence) => {
    const st = occurrenceStatus(o, now);
    return st === 'live' || (st === 'upcoming' && o.start.getTime() - now.getTime() <= 15 * 60_000);
  };

  const tab = (id: typeof view, label: string) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
        view === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  const occurrenceCard = (o: ClassOccurrence) => {
    const st = occurrenceStatus(o, now);
    const sent = remindersFor(o);
    return (
      <div
        key={occurrenceKey(o)}
        data-occurrence={occurrenceKey(o)}
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-3 ${
          st === 'live' ? 'border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="w-24 shrink-0">
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{timeLabel(o.start)}</div>
          <div className="text-[11px] text-slate-500">{o.cls.durationMinutes} min</div>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={st} />
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
              {o.cls.platform === 'YouTube Live' ? <Youtube className="w-3 h-3 text-rose-600" /> : <Video className="w-3 h-3" />}
              {o.cls.platform}
            </span>
            {o.cls.repeat !== 'none' && <span className="text-[10px] text-slate-500">{repeatLabel(o.cls)}</span>}
          </div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">{o.cls.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {o.cls.subject} · {o.cls.facultyName}
            {!isStudent && <> · {audienceLabel(o.cls, batches)}</>}
          </div>
          {o.cls.notes && <div className="text-[11px] text-slate-500 italic">{o.cls.notes}</div>}
          {!isStudent && (sent.length > 0 || st === 'upcoming' || st === 'live') && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <BellRing className="w-3 h-3" />
              {sent.length
                ? `Link sent ${new Date(sent[0].sentAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} to ${sent[0].recipients || classAudienceSize(o.cls)} students (${sent[0].channels})`
                : `Link goes out automatically ${o.cls.remindBeforeMinutes} min before (${classAudienceSize(o.cls)} students)`}
            </div>
          )}
          {isStudent && sent.length > 0 && st !== 'cancelled' && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <BellRing className="w-3 h-3" /> Link sent to your phone (SMS/WhatsApp) and here.
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 md:justify-end shrink-0">
          {st !== 'cancelled' && (
            <a
              href={o.cls.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canJoin(o)}
              onClick={e => {
                if (!canJoin(o) && isStudent) {
                  e.preventDefault();
                  flash(`The join link opens 15 minutes before the class (${timeLabel(o.start)}).`);
                }
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                canJoin(o) ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" /> {canJoin(o) ? 'Join class' : isStudent ? 'Join (opens 15 min before)' : 'Open link'}
            </a>
          )}
          {canManage && st !== 'cancelled' && st !== 'ended' && (
            <button
              onClick={() => {
                const r = sendClassReminder(o.cls.id, o.date);
                flash(`Class link sent to ${r.recipients} students by app, SMS and WhatsApp (simulated).`);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Send className="w-3.5 h-3.5" /> Send link now
            </button>
          )}
          {canManage && st !== 'ended' && (
            <button
              onClick={() => setOccurrenceCancelled(o.cls.id, o.date, st !== 'cancelled')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              {st === 'cancelled' ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
              {st === 'cancelled' ? 'Restore' : 'Cancel this day'}
            </button>
          )}
          {canManage && st === 'ended' && (
            <button
              onClick={() => setRecordingFor(o)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Link2 className="w-3.5 h-3.5" /> {o.recording ? 'Edit recording' : 'Add recording'}
            </button>
          )}
          {o.recording && (
            <a href={o.recording} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-700">
              <PlayCircle className="w-3.5 h-3.5" /> Watch recording
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Online Classes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isStudent
              ? 'Your live classes and recordings. Links are also sent to your phone before each class.'
              : 'Schedule live classes on YouTube, Google Meet or Zoom. Repeating classes send the link to the students before every session.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.youtubeChannelUrl && (
            <a
              href={settings.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg"
            >
              <Youtube className="w-4 h-4" /> VRM YouTube channel
            </a>
          )}
          {canManage && (
            <button onClick={() => setEditing('new')} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Schedule online class
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div role="status" className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">
          {toast}
        </div>
      )}

      {liveNow.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="w-4 h-4 animate-pulse" /> Live now: {liveNow.map(o => o.cls.title).join(', ')}
          </div>
          <a href={liveNow[0].cls.link} target="_blank" rel="noopener noreferrer" className="self-start px-4 py-2 rounded-lg bg-white text-rose-700 text-xs font-bold">
            Join now
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit max-w-full overflow-x-auto">
          {tab('upcoming', 'Upcoming (14 days)')}
          {tab('recordings', `Recordings (${recordings.length})`)}
          {canManage && tab('series', `All schedules (${myClasses.length})`)}
          {canManage && tab('reminders', 'Links sent')}
        </div>
        {role === 'faculty' && (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} /> Only my classes
          </label>
        )}
      </div>

      {view === 'upcoming' && (
        <div className="space-y-5">
          {upcoming.length === 0 && (
            <div className={`${card} p-8 text-center text-xs text-slate-500`}>
              <Video className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              {isStudent ? 'No online classes scheduled for your batch in the next two weeks.' : 'No online classes scheduled. Use “Schedule online class” to add one.'}
            </div>
          )}
          {Object.entries(grouped).map(([date, list]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {dayHeading(date, today)} <span className="font-normal normal-case">· {new Date(list[0].start).toLocaleDateString('en-IN', { weekday: 'long' })}</span>
              </h3>
              {list.map(occurrenceCard)}
            </div>
          ))}
        </div>
      )}

      {view === 'recordings' && (
        <div className="space-y-2">
          {recordings.length === 0 && (
            <div className={`${card} p-8 text-center text-xs text-slate-500`}>
              No recordings yet. {canManage ? 'After a class ends, use “Add recording” to post the YouTube video link.' : 'Recordings appear here after each class.'}
            </div>
          )}
          {recordings.map(o => (
            <div key={occurrenceKey(o)} className={`${card} p-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs`}>
              <PlayCircle className="w-8 h-8 text-rose-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white">{o.cls.title}</div>
                <div className="text-slate-500">
                  {formatDate(o.date)} · {o.cls.subject} · {o.cls.facultyName}
                </div>
              </div>
              <a href={o.recording} target="_blank" rel="noopener noreferrer" className="self-start px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-semibold">
                Watch
              </a>
            </div>
          ))}
        </div>
      )}

      {view === 'series' && canManage && (
        <div className="space-y-4">
          {role !== 'faculty' && (
            <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-end gap-2`}>
              <div className="flex-1">
                <label className={LBL}>Academy YouTube channel (shown to students)</label>
                <input className={FIELD} value={settings.youtubeChannelUrl} onChange={e => updateSettings({ youtubeChannelUrl: e.target.value })} placeholder="https://www.youtube.com/@yourchannel" />
              </div>
            </div>
          )}
          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Class</th>
                    <th className="px-4 py-2.5">When</th>
                    <th className="px-4 py-2.5">Students</th>
                    <th className="px-4 py-2.5">Platform</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myClasses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Nothing scheduled yet.
                      </td>
                    </tr>
                  )}
                  {myClasses.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.title}</div>
                        <div className="text-slate-500">
                          {c.subject} · {c.facultyName}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {repeatLabel(c)} · {c.startTime}
                        <div className="text-slate-500">
                          {c.repeat === 'none' ? formatDate(c.startDate) : `${formatDate(c.startDate)} → ${c.endDate ? formatDate(c.endDate) : 'no end'}`}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                        {audienceLabel(c, batches)}
                        <div className="text-slate-500">{classAudienceSize(c)} students</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.platform}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => setEditing(c)} aria-label={`Edit ${c.title}`} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => window.confirm(`Delete “${c.title}” and all its sessions?`) && deleteOnlineClass(c.id)}
                          aria-label={`Delete ${c.title}`}
                          className="p-1.5 text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'reminders' && canManage && (
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Sent</th>
                  <th className="px-4 py-2.5">Class</th>
                  <th className="px-4 py-2.5">For</th>
                  <th className="px-4 py-2.5">Recipients</th>
                  <th className="px-4 py-2.5">How</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classReminders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No links sent yet. They go out automatically before each class.
                    </td>
                  </tr>
                )}
                {classReminders.slice(0, 100).map(r => {
                  const c = onlineClasses.find(x => x.id === r.classId);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{new Date(r.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{c?.title || 'Deleted class'}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{formatDate(r.date)}</td>
                      <td className="px-4 py-2.5 font-mono">{r.recipients || (c ? classAudienceSize(c) : 0)}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {r.channels} · {r.manual ? 'sent by staff' : 'automatic'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <ScheduleClassModal
          cls={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={c => {
            setEditing(null);
            setView('upcoming');
            flash(`“${c.title}” is scheduled. ${c.repeat === 'none' ? 'Students get the link' : 'Before every session, students get the link'} ${c.remindBeforeMinutes} min ahead.`);
          }}
          save={saveOnlineClass}
          batches={batches}
          faculty={staffMembers.filter(s => s.department === 'Faculty')}
          subjects={[...new Set(schedule.map(s => s.subject))]}
          defaultFaculty={role === 'faculty' ? currentStaff?.name : undefined}
          today={today}
        />
      )}

      {recordingFor && (
        <RecordingModal
          occ={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSave={link => {
            setRecordingLink(recordingFor.cls.id, recordingFor.date, link);
            setRecordingFor(null);
            flash(link ? 'Recording link saved. Students can watch it under Recordings.' : 'Recording link removed.');
          }}
        />
      )}
    </div>
  );
};

const RecordingModal: React.FC<{ occ: ClassOccurrence; onClose: () => void; onSave: (link: string) => void }> = ({ occ, onClose, onSave }) => {
  const [link, setLink] = useState(occ.recording || '');
  return (
    <Modal
      title="Recording link"
      subtitle={`${occ.cls.title} · ${formatDate(occ.date)}`}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={() => onSave(link)} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
            Save
          </button>
        </div>
      }
    >
      <label className={LBL}>YouTube (or other) video link</label>
      <input className={FIELD} value={link} onChange={e => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
      <p className="mt-2 text-[11px] text-slate-500">For YouTube Live, the same live link usually becomes the recording once the stream ends.</p>
    </Modal>
  );
};

const ScheduleClassModal: React.FC<{
  cls: OnlineClass | null;
  onClose: () => void;
  onSaved: (c: OnlineClass) => void;
  save: ReturnType<typeof useApp>['saveOnlineClass'];
  batches: ReturnType<typeof useApp>['batches'];
  faculty: ReturnType<typeof useApp>['staffMembers'];
  subjects: string[];
  defaultFaculty?: string;
  today: string;
}> = ({ cls, onClose, onSaved, save, batches, faculty, subjects, defaultFaculty, today }) => {
  const { classAudienceSize } = useApp();
  const [f, setF] = useState({
    title: cls?.title || '',
    subject: cls?.subject || '',
    batchIds: cls?.batchIds || ([] as string[]),
    facultyName: cls?.facultyName || defaultFaculty || faculty[0]?.name || '',
    platform: cls?.platform || ('YouTube Live' as OnlinePlatform),
    link: cls?.link || '',
    startDate: cls?.startDate || today,
    startTime: cls?.startTime || '19:00',
    durationMinutes: String(cls?.durationMinutes || 60),
    repeat: cls?.repeat || ('none' as OnlineClass['repeat']),
    repeatDays: cls?.repeatDays || ([] as number[]),
    endDate: cls?.endDate || addDays(today, 30),
    remindBeforeMinutes: String(cls?.remindBeforeMinutes ?? 30),
    notes: cls?.notes || ''
  });
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof f>) => setF(prev => ({ ...prev, ...patch }));
  const allStudents = f.batchIds.length === 0;
  const facultySubjects = faculty.find(x => x.name === f.facultyName)?.subjectsHandling || [];
  const subjectOptions = [...new Set([...facultySubjects, ...subjects])];

  const submit = () => {
    const missing = [!f.title.trim() && 'title', !f.subject.trim() && 'subject', !f.link.trim() && 'class link', !f.startTime && 'time'].filter(Boolean);
    if (missing.length) return setError(`Please fill in: ${missing.join(', ')}.`);
    if (!/^https?:\/\/\S+\.\S+/.test(f.link.trim())) return setError('The class link should start with https://');
    if (f.repeat === 'weekly' && f.repeatDays.length === 0) return setError('Pick at least one day for a weekly class.');
    if (f.repeat !== 'none' && f.endDate < f.startDate) return setError('The last date is before the first class.');
    const c = save({
      id: cls?.id,
      title: f.title.trim(),
      subject: f.subject.trim(),
      batchIds: f.batchIds,
      facultyName: f.facultyName,
      platform: f.platform,
      link: f.link.trim(),
      startDate: f.startDate,
      startTime: f.startTime,
      durationMinutes: Math.max(10, Number(f.durationMinutes) || 60),
      repeat: f.repeat,
      repeatDays: f.repeat === 'weekly' ? f.repeatDays : [],
      endDate: f.repeat === 'none' ? undefined : f.endDate,
      remindBeforeMinutes: Number(f.remindBeforeMinutes),
      notes: f.notes.trim() || undefined
    });
    onSaved(c);
  };

  const audience = classAudienceSize({ batchIds: f.batchIds } as OnlineClass);

  return (
    <Modal
      title={cls ? 'Edit online class' : 'Schedule online class'}
      subtitle="Students in the chosen batches see it in their portal and get the link before each session."
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">Link goes to {audience} student{audience === 1 ? '' : 's'} by app, SMS and WhatsApp (simulated).</span>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button onClick={submit} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg">
              {cls ? 'Save changes' : 'Schedule class'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Class title *</label>
            <input className={FIELD} value={f.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Polity Revision: Parliament" />
          </div>
          <div>
            <label className={LBL}>Subject *</label>
            <input className={FIELD} list="online-subjects" value={f.subject} onChange={e => set({ subject: e.target.value })} placeholder="Pick or type" />
            <datalist id="online-subjects">
              {subjectOptions.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={LBL}>Faculty</label>
            <select className={FIELD} value={f.facultyName} onChange={e => set({ facultyName: e.target.value })}>
              {faculty.map(x => (
                <option key={x.id} value={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Platform</label>
            <select className={FIELD} value={f.platform} onChange={e => set({ platform: e.target.value as OnlinePlatform })}>
              {PLATFORMS.map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={LBL}>Class link * (YouTube Live, Meet or Zoom URL)</label>
          <input
            className={FIELD}
            value={f.link}
            onChange={e => set({ link: e.target.value })}
            placeholder={f.platform === 'YouTube Live' ? 'https://www.youtube.com/live/…' : f.platform === 'Zoom' ? 'https://zoom.us/j/…' : 'https://meet.google.com/…'}
          />
        </div>

        <div>
          <label className={LBL}>Students</label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 mb-1.5">
            <input type="checkbox" checked={allStudents} onChange={e => set({ batchIds: e.target.checked ? [] : [batches[0]?.id].filter(Boolean) as string[] })} /> All students (open class)
          </label>
          {!allStudents && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              {batches.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={f.batchIds.includes(b.id)}
                    onChange={e => set({ batchIds: e.target.checked ? [...f.batchIds, b.id] : f.batchIds.filter(x => x !== b.id) })}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={LBL}>{f.repeat === 'none' ? 'Date' : 'First class'}</label>
            <input type="date" className={FIELD} value={f.startDate} onChange={e => set({ startDate: e.target.value })} />
          </div>
          <div>
            <label className={LBL}>Start time</label>
            <input type="time" className={FIELD} value={f.startTime} onChange={e => set({ startTime: e.target.value })} />
          </div>
          <div>
            <label className={LBL}>Duration (min)</label>
            <input type="number" min={10} step={5} className={FIELD} value={f.durationMinutes} onChange={e => set({ durationMinutes: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LBL}>Send link</label>
            <select className={FIELD} value={f.remindBeforeMinutes} onChange={e => set({ remindBeforeMinutes: e.target.value })}>
              <option value="15">15 min before</option>
              <option value="30">30 min before</option>
              <option value="60">1 hour before</option>
              <option value="120">2 hours before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <label className={LBL}>Repeat</label>
          <div className="flex flex-wrap gap-1.5">
            {(['none', 'daily', 'weekly'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => set({ repeat: r })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  f.repeat === r ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-600 dark:border-amber-600' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {r === 'none' ? 'Does not repeat' : r === 'daily' ? 'Every day' : 'Weekly on…'}
              </button>
            ))}
          </div>
          {f.repeat === 'weekly' && (
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={f.repeatDays.includes(i)}
                  onClick={() => set({ repeatDays: f.repeatDays.includes(i) ? f.repeatDays.filter(x => x !== i) : [...f.repeatDays, i] })}
                  className={`w-11 py-1.5 rounded-lg text-xs font-semibold border ${
                    f.repeatDays.includes(i) ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          {f.repeat !== 'none' && (
            <div className="max-w-[220px]">
              <label className={LBL}>Last date</label>
              <input type="date" className={FIELD} value={f.endDate} min={f.startDate} onChange={e => set({ endDate: e.target.value })} />
            </div>
          )}
        </div>

        <div>
          <label className={LBL}>Notes for students</label>
          <textarea rows={2} className={FIELD} value={f.notes} onChange={e => set({ notes: e.target.value })} placeholder="e.g. Keep the polity notes handy" />
        </div>
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};

/** Compact card for the student dashboard: the next few classes with join links. */
export const UpcomingOnlineClassesCard: React.FC<{ batchId?: string }> = ({ batchId }) => {
  const { onlineClasses, today, setActiveTab, classReminders } = useApp();
  const now = useNow();
  const list = occurrencesBetween(
    onlineClasses.filter(c => classIsFor(c, batchId)),
    today,
    addDays(today, 7)
  )
    .filter(o => !o.cancelled && occurrenceStatus(o, now) !== 'ended')
    .slice(0, 3);
  return (
    <div className={`${card} p-5 space-y-3`} data-upcoming-online>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Video className="w-4 h-4 text-rose-600" /> Online classes
        </h3>
        <button onClick={() => setActiveTab('online_classes')} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
          View all
        </button>
      </div>
      {list.length === 0 && <p className="text-xs text-slate-500">No online classes in the next 7 days.</p>}
      {list.map(o => {
        const st = occurrenceStatus(o, now);
        const sent = classReminders.some(r => r.classId === o.cls.id && r.date === o.date);
        const joinable = st === 'live' || o.start.getTime() - now.getTime() <= 15 * 60_000;
        return (
          <div key={occurrenceKey(o)} className="flex items-center gap-3 text-xs">
            <div className="w-16 shrink-0">
              <div className="font-bold text-slate-900 dark:text-white">{dayHeading(o.date, today)}</div>
              <div className="font-mono text-slate-500">{timeLabel(o.start)}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white truncate">{o.cls.title}</div>
              <div className="text-slate-500 truncate">
                {o.cls.platform} · {o.cls.facultyName}
                {sent && ' · link sent'}
              </div>
            </div>
            {joinable ? (
              <a href={o.cls.link} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold">
                {st === 'live' ? 'Join live' : 'Join'}
              </a>
            ) : (
              <StatusPill status={st} />
            )}
          </div>
        );
      })}
    </div>
  );
};
