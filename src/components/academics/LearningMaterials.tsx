import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudyMaterial } from '../../types';
import {
  BookOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  X,
  Share2,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const LearningMaterials: React.FC = () => {
  const {
    materials,
    addStudyMaterial,
    batches,
    students,
    currentUser,
    role
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMaterialForView, setSelectedMaterialForView] = useState<StudyMaterial | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // New Material Form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Indian Polity (GS-2)');
  const [newType, setNewType] = useState<StudyMaterial['type']>('PDF Notes');
  const [newScope, setNewScope] = useState<StudyMaterial['targetScope']>('all');
  const [newBatchId, setNewBatchId] = useState(batches[0]?.id || '');
  const [newStudentId, setNewStudentId] = useState(students[0]?.id || '');
  const [newPageCount, setNewPageCount] = useState(45);
  const [newSummary, setNewSummary] = useState('');

  const filteredMaterials = materials.filter(mat => {
    const matchesSearch =
      mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || mat.subject.includes(selectedSubject);

    // If viewing as student, check if it's for all, or their batch, or them directly
    if (role === 'student') {
      const studentObj = students.find(s => s.name === currentUser.name || s.id === 'stu-01');
      if (mat.targetScope === 'batch' && mat.targetBatchId && studentObj && mat.targetBatchId !== studentObj.enrolledBatchId) {
        return false;
      }
      if (mat.targetScope === 'individual' && mat.targetStudentId && studentObj && mat.targetStudentId !== studentObj.id) {
        return false;
      }
    }

    return matchesSearch && matchesSubject;
  });

  const handleShareMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary) return;

    const targetBatch = batches.find(b => b.id === newBatchId);

    addStudyMaterial({
      title: newTitle,
      subject: newSubject,
      type: newType,
      fileSize: `${Math.floor(2 + Math.random() * 6)}.${Math.floor(1 + Math.random() * 9)} MB`,
      uploadedBy: currentUser.name,
      targetScope: newScope,
      targetBatchId: newScope === 'batch' ? newBatchId : undefined,
      targetBatchName: newScope === 'batch' ? targetBatch?.name : undefined,
      targetStudentId: newScope === 'individual' ? newStudentId : undefined,
      pageCount: Number(newPageCount),
      summary: newSummary
    });

    setIsShareModalOpen(false);
    setNewTitle('');
    setNewSummary('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Learning Materials & Mentorship Dossiers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Subject handbooks · Current affairs monthly digest · Model answers & GIS atlases
          </p>
        </div>

        {role !== 'student' && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Share Material</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, dossiers, subjects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg shrink-0">
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'Polity', label: 'Polity (GS-2)' },
            { id: 'Economy', label: 'Economy (GS-3)' },
            { id: 'Ethics', label: 'Ethics (GS-4)' },
            { id: 'Current Affairs', label: 'Current Affairs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubject(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSubject === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map(mat => (
          <div
            key={mat.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {mat.type}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {mat.pageCount} pages · {mat.fileSize}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                {mat.title}
              </h3>

              <div className="text-[11px] text-slate-500">
                <span>{mat.subject}</span>
                <span className="mx-1">·</span>
                <span>By {mat.uploadedBy}</span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {mat.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[10px] text-slate-400">
                {mat.targetScope === 'all' ? (
                  <span>Available to All Aspirants</span>
                ) : mat.targetScope === 'batch' ? (
                  <span className="text-amber-700 font-medium">{mat.targetBatchName}</span>
                ) : (
                  <span>Exclusive Student Copy</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedMaterialForView(mat)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Read Digest</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Reader Simulator Modal */}
      {selectedMaterialForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    VRM ACADEMY COMPILATION
                  </span>
                  <span className="text-xs font-mono text-slate-400">{selectedMaterialForView.subject}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedMaterialForView.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepared by {selectedMaterialForView.uploadedBy} · {selectedMaterialForView.pageCount} Pages · Published {selectedMaterialForView.uploadedAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedMaterialForView(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated PDF Reader Content */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs text-slate-700 leading-relaxed font-serif">
              <div className="bg-white p-4 rounded-lg border border-slate-200 font-sans text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Executive Abstract & Core Civil Services Scope
                </h4>
                <p className="text-slate-600">{selectedMaterialForView.summary}</p>
              </div>

              <div className="space-y-3 font-sans">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Key Topics & Syllabus Linkages (UPSC GS Standard)
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 text-xs">
                  <li>Direct correlation with Constitutional Bench precedents and statutory provisions.</li>
                  <li>Critical analysis framework: Arguments in favor, reservations, and administrative way forward.</li>
                  <li>Prelims high-yield elimination pointers and trap alerts based on past 10 years papers.</li>
                  <li>Mains 15-marker model answers with flowchart representations and committee references.</li>
                </ul>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-3 text-[11px] font-sans text-amber-950">
                <span className="font-bold block mb-0.5">Faculty Recommendation:</span>
                "Revise this digest alongside NCERT Class XI & XII standards. Attempt the associated mock test on this topic in the Tests & Assessment module."
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">File verified & indexed in VRM Document Repository</span>
              <button
                onClick={() => setSelectedMaterialForView(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Share Material Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Upload & Share Learning Material</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShareMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dossier / Material Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Modern India: Governor Generals & Administrative Reforms"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Area</label>
                  <select
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Indian Polity (GS-2)">Indian Polity (GS-2)</option>
                    <option value="Indian Economy (GS-3)">Indian Economy (GS-3)</option>
                    <option value="Modern History (GS-1)">Modern History (GS-1)</option>
                    <option value="Ethics & Integrity (GS-4)">Ethics & Integrity (GS-4)</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Material Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="PDF Notes">PDF Comprehensive Notes</option>
                    <option value="Handwritten Digest">Handwritten Digest</option>
                    <option value="Mindmap">Mindmap / Infographic</option>
                    <option value="Question Compendium">Question Compendium</option>
                    <option value="Current Affairs">Current Affairs Dossier</option>
                  </select>
                </div>
              </div>

              {/* Target Scope: All, Specific Batch, or Individual */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Access Sharing Scope *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewScope('all')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      newScope === 'all' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    All Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('batch')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      newScope === 'batch' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Specific Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('individual')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      newScope === 'individual' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    1-on-1 Student
                  </button>
                </div>
              </div>

              {newScope === 'batch' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Batch</label>
                  <select
                    value={newBatchId}
                    onChange={e => setNewBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {newScope === 'individual' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={newStudentId}
                    onChange={e => setNewStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Pages</label>
                  <input
                    type="number"
                    value={newPageCount}
                    onChange={e => setNewPageCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Simulated Upload</label>
                  <div className="px-3 py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-center">
                    PDF Attached (Ready)
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Executive Summary & Instructions *</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Key concepts covered, landmark Supreme Court rulings, and Prelims focus points..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Publish & Distribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
