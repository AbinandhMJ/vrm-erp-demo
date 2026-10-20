import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { FIELD, LBL } from '../admissions/AdmissionFormFields';
import { StudyMaterial } from '../../types';
import { formatDate } from '../../lib/dates';
import { formatBytes, openStoredFile, saveFile } from '../../lib/fileStore';
import { MATERIAL_TYPES, MAX_FILE_BYTES, materialIsFor, pdfPageCount, titleFromFileName, typeForFile } from '../../lib/materials';
import { Upload, Search, Download, Eye, Trash2, FileText, Film, Image as ImageIcon, Presentation, File as FileIcon, X, CheckCircle2, HardDrive } from 'lucide-react';

type UploadRow = { key: string; file: File; title: string; subject: string; type: StudyMaterial['type'] };

const iconFor = (m: StudyMaterial) => {
  const t = m.mimeType || '';
  if (t.startsWith('video/') || m.type === 'Video') return <Film className="w-5 h-5" />;
  if (t.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
  if (m.type === 'Slides') return <Presentation className="w-5 h-5" />;
  if (t === 'application/pdf' || m.type === 'PDF Notes') return <FileText className="w-5 h-5" />;
  return <FileIcon className="w-5 h-5" />;
};

const audience = (m: StudyMaterial, batchName: (id: string) => string) =>
  m.targetScope === 'all'
    ? 'All students'
    : m.targetScope === 'batch'
      ? (m.targetBatchIds?.length ? m.targetBatchIds : [m.targetBatchId || '']).map(batchName).join(', ')
      : 'One student';

export const LearningMaterials: React.FC = () => {
  const { materials, deleteStudyMaterial, batches, students, currentUser, currentStudent, role } = useApp();
  const isStudent = role === 'student';
  const canUpload = role === 'management' || role === 'office_staff' || role === 'faculty';
  const canDelete = (m: StudyMaterial) => role === 'management' || role === 'office_staff' || (role === 'faculty' && m.uploadedBy === currentUser.name);

  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('all');
  const [type, setType] = useState<'all' | StudyMaterial['type']>('all');
  const [viewing, setViewing] = useState<StudyMaterial | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [missingFile, setMissingFile] = useState('');

  const batchName = (id: string) => batches.find(b => b.id === id)?.name || id;
  const visible = useMemo(() => (isStudent ? materials.filter(m => materialIsFor(m, currentStudent)) : materials), [materials, isStudent, currentStudent]);
  const subjects = useMemo(() => [...new Set(visible.map(m => m.subject))].sort(), [visible]);
  const filtered = visible.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    return (
      (!q || `${m.title} ${m.subject} ${m.summary} ${m.uploadedBy}`.toLowerCase().includes(q)) &&
      (subject === 'all' || m.subject === subject) &&
      (type === 'all' || m.type === type)
    );
  });

  const open = async (m: StudyMaterial, download = false) => {
    if (!m.fileId) return setViewing(m);
    const ok = await openStoredFile(m.fileId, m.fileName || m.title, download);
    if (!ok) setMissingFile(`“${m.title}” was uploaded on another device or browser. In this demo, files are stored in the browser that uploaded them.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Learning Materials</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isStudent
              ? `Notes, slides and videos shared with you and ${currentStudent?.enrolledBatchName || 'your batch'}.`
              : 'One central library. Upload many files at once and choose who can see them: all students, chosen batches, or one student.'}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 rounded-lg shadow-xs self-start"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload materials</span>
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 flex justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {notice}
          </span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {missingFile && (
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex justify-between gap-2">
          <span>{missingFile}</span>
          <button onClick={() => setMissingFile('')} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, subject or faculty"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`${FIELD} pl-9`}
          />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)} className={`${FIELD} md:max-w-[240px]`} aria-label="Subject">
          <option value="all">All subjects</option>
          {subjects.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={type} onChange={e => setType(e.target.value as typeof type)} className={`${FIELD} md:max-w-[200px]`} aria-label="Type">
          <option value="all">All types</option>
          {MATERIAL_TYPES.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          {visible.length === 0 ? (canUpload ? 'No materials yet. Use “Upload materials” to add notes, slides or videos.' : 'No materials have been shared with you yet.') : 'Nothing matches these filters.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-materials-grid>
        {filtered.map(mat => (
          <div key={mat.id} data-material={mat.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">{iconFor(mat)}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{mat.title}</h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {mat.subject} · {mat.type}
                  </div>
                </div>
              </div>
              {mat.summary && <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">{mat.summary}</p>}
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                By {mat.uploadedBy} · {formatDate(mat.uploadedAt)}
                {mat.fileName && <> · <span className="font-mono">{mat.fileName}</span></>}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-mono">
                  {mat.pageCount ? `${mat.pageCount} pages · ` : ''}
                  {mat.fileSize}
                </div>
                {!isStudent && <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate">{audience(mat, batchName)}</div>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => open(mat)} className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                  <Eye className="w-3.5 h-3.5" /> {mat.fileId ? 'Open' : 'Read'}
                </button>
                {mat.fileId && (
                  <button onClick={() => open(mat, true)} aria-label={`Download ${mat.title}`} className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete(mat) && (
                  <button
                    onClick={() => window.confirm(`Delete “${mat.title}”? Students will no longer see it.`) && deleteStudyMaterial(mat.id)}
                    aria-label={`Delete ${mat.title}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <Modal title={viewing.title} subtitle={`${viewing.subject} · ${viewing.uploadedBy} · ${formatDate(viewing.uploadedAt)}`} onClose={() => setViewing(null)} size="lg">
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>{viewing.summary}</p>
            <p className="text-[11px] text-slate-500">This sample item has a summary only. Materials uploaded through “Upload materials” open as the real file (PDF, slides, image or video).</p>
          </div>
        </Modal>
      )}

      {uploadOpen && (
        <BulkUploadModal
          onClose={() => setUploadOpen(false)}
          onDone={n => {
            setUploadOpen(false);
            setNotice(`${n} file${n === 1 ? '' : 's'} uploaded and shared.`);
          }}
          batches={batches}
          students={students}
        />
      )}
    </div>
  );
};

const BulkUploadModal: React.FC<{
  onClose: () => void;
  onDone: (n: number) => void;
  batches: ReturnType<typeof useApp>['batches'];
  students: ReturnType<typeof useApp>['students'];
}> = ({ onClose, onDone, batches, students }) => {
  const { addStudyMaterial, currentUser, currentStaff, schedule, role } = useApp();
  const subjectOptions = useMemo(
    () => [...new Set([...(currentStaff?.subjectsHandling || []), ...schedule.filter(s => role !== 'faculty' || s.facultyName === currentUser.name).map(s => s.subject), 'Current Affairs', 'General Studies'])],
    [currentStaff, schedule, role, currentUser.name]
  );
  const myBatchIds = role === 'faculty' ? new Set(schedule.filter(s => s.facultyName === currentUser.name).map(s => s.batchId)) : null;

  const [rows, setRows] = useState<UploadRow[]>([]);
  const [defaultSubject, setDefaultSubject] = useState(subjectOptions[0] || 'General Studies');
  const [scope, setScope] = useState<StudyMaterial['targetScope']>('all');
  const [batchIds, setBatchIds] = useState<string[]>(myBatchIds ? [...myBatchIds] : []);
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [drag, setDrag] = useState(false);
  const [space, setSpace] = useState<{ used: number; quota: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.estimate?.().then(e => e.quota && setSpace({ used: e.usage || 0, quota: e.quota })).catch(() => undefined);
  }, []);

  const addFiles = (list: FileList | File[]) => {
    const files = [...list];
    const tooBig = files.filter(f => f.size > MAX_FILE_BYTES);
    setError(tooBig.length ? `Skipped ${tooBig.map(f => f.name).join(', ')}: larger than ${formatBytes(MAX_FILE_BYTES)}.` : '');
    setRows(prev => [
      ...prev,
      ...files
        .filter(f => f.size <= MAX_FILE_BYTES)
        .map(f => ({ key: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 6)}`, file: f, title: titleFromFileName(f.name), subject: defaultSubject, type: typeForFile(f) }))
    ]);
  };
  const setRow = (key: string, patch: Partial<UploadRow>) => setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));
  const total = rows.reduce((s, r) => s + r.file.size, 0);
  const matchingStudents = students
    .filter(s => s.status === 'active' && `${s.name} ${s.rollNumber}`.toLowerCase().includes(studentSearch.trim().toLowerCase()))
    .slice(0, 50);

  const submit = async () => {
    if (rows.length === 0) return setError('Add at least one file.');
    if (rows.some(r => !r.title.trim())) return setError('Every file needs a title.');
    if (scope === 'batch' && batchIds.length === 0) return setError('Choose at least one batch.');
    if (scope === 'individual' && !studentId) return setError('Choose the student.');
    setError('');
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        setBusy(`Saving ${i + 1} of ${rows.length}: ${r.file.name}`);
        const fileId = `file-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 7)}`;
        await saveFile(fileId, r.file);
        const pages = r.file.type === 'application/pdf' || r.file.name.toLowerCase().endsWith('.pdf') ? await pdfPageCount(r.file) : 0;
        addStudyMaterial({
          title: r.title.trim(),
          subject: r.subject,
          type: r.type,
          fileSize: formatBytes(r.file.size),
          uploadedBy: currentUser.name,
          targetScope: scope,
          targetBatchId: scope === 'batch' ? batchIds[0] : undefined,
          targetBatchIds: scope === 'batch' ? batchIds : undefined,
          targetBatchName: scope === 'batch' ? batchIds.map(id => batches.find(b => b.id === id)?.name).join(', ') : undefined,
          targetStudentId: scope === 'individual' ? studentId : undefined,
          pageCount: pages,
          summary: summary.trim(),
          fileId,
          fileName: r.file.name,
          mimeType: r.file.type || 'application/octet-stream'
        });
      }
      onDone(rows.length);
    } catch (e) {
      setBusy('');
      setError(
        e instanceof DOMException && e.name === 'QuotaExceededError'
          ? 'This browser is out of storage space. Remove some large files or videos and try again.'
          : 'Could not save the files in this browser. Try fewer or smaller files.'
      );
    }
  };

  const availableBatches = myBatchIds && myBatchIds.size ? batches.filter(b => myBatchIds.has(b.id)) : batches;

  return (
    <Modal
      title="Upload learning materials"
      subtitle="Add several files at once. Students only see what is shared with them."
      onClose={busy ? () => undefined : onClose}
      dismissible={!busy}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            {rows.length} file{rows.length === 1 ? '' : 's'} · {formatBytes(total)}
            {busy && <span className="ml-2 font-semibold text-amber-700 dark:text-amber-400">{busy}</span>}
          </span>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={!!busy} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={submit} disabled={!!busy || rows.length === 0} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 rounded-lg disabled:opacity-50">
              {busy ? 'Uploading…' : `Upload & share ${rows.length || ''}`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={e => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
            drag ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-300 dark:border-slate-700 hover:border-amber-500'
          }`}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Drop files here or click to choose</div>
          <div className="text-[11px] text-slate-500 mt-1">PDF, Word, PowerPoint, Excel, images or videos · up to {formatBytes(MAX_FILE_BYTES)} each · select many at once</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            data-testid="materials-input"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,image/*,video/*,audio/*"
            className="sr-only"
            onChange={e => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {rows.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map(r => (
                    <tr key={r.key}>
                      <td className="px-3 py-1.5 min-w-[200px]">
                        <input aria-label={`Title for ${r.file.name}`} className={FIELD} value={r.title} onChange={e => setRow(r.key, { title: e.target.value })} />
                        <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{r.file.name}</div>
                      </td>
                      <td className="px-3 py-1.5 min-w-[170px]">
                        <input className={FIELD} list="material-subjects" value={r.subject} onChange={e => setRow(r.key, { subject: e.target.value })} />
                      </td>
                      <td className="px-3 py-1.5 min-w-[150px]">
                        <select className={FIELD} value={r.type} onChange={e => setRow(r.key, { type: e.target.value as StudyMaterial['type'] })}>
                          {MATERIAL_TYPES.map(t => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-500 whitespace-nowrap">{formatBytes(r.file.size)}</td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => setRows(prev => prev.filter(x => x.key !== r.key))} aria-label={`Remove ${r.file.name}`} className="p-1 text-slate-400 hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <datalist id="material-subjects">
          {subjectOptions.map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Subject for new files</label>
            <input
              className={FIELD}
              list="material-subjects"
              value={defaultSubject}
              onChange={e => setDefaultSubject(e.target.value)}
            />
            {rows.length > 0 && (
              <button type="button" onClick={() => setRows(prev => prev.map(r => ({ ...r, subject: defaultSubject })))} className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                Apply to all {rows.length} files
              </button>
            )}
          </div>
          <div>
            <label className={LBL}>Note for students (optional)</label>
            <input className={FIELD} value={summary} onChange={e => setSummary(e.target.value)} placeholder="e.g. Read before Friday's class" />
          </div>
        </div>

        <div>
          <label className={LBL}>Who can see these files</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(
              [
                ['all', 'All students'],
                ['batch', 'Chosen batches'],
                ['individual', 'One student']
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScope(id)}
                className={`py-2 px-2 rounded-lg border font-semibold ${
                  scope === id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {scope === 'batch' && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              {availableBatches.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={batchIds.includes(b.id)} onChange={e => setBatchIds(e.target.checked ? [...batchIds, b.id] : batchIds.filter(x => x !== b.id))} />
                  {b.name}
                </label>
              ))}
            </div>
          )}
          {scope === 'individual' && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className={FIELD} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search name or roll number" />
              <select className={FIELD} value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">Choose student…</option>
                {matchingStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {space && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <HardDrive className="w-3.5 h-3.5" />
            Storage in this browser: {formatBytes(space.used)} used of about {formatBytes(space.quota)}. (In production, files go to the academy's cloud storage.)
          </div>
        )}
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
      </div>
    </Modal>
  );
};
