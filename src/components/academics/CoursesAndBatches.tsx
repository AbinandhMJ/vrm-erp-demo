import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, Batch } from '../../types';
import {
  Layers,
  Plus,
  Users,
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react';

export const CoursesAndBatches: React.FC = () => {
  const {
    courses,
    batches,
    addCourse,
    addBatch,
    staffMembers,
    role
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'batches'>('batches');
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);

  // New Course Form State
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<Course['category']>('GS Foundation');
  const [newCourseDuration, setNewCourseDuration] = useState(12);
  const [newCourseFee, setNewCourseFee] = useState(120000);
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseHighlights, setNewCourseHighlights] = useState('Indian Polity, Economy, Ethics, Current Affairs');

  // New Batch Form State
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchCourseId, setNewBatchCourseId] = useState(courses[0]?.id || '');
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newBatchTiming, setNewBatchTiming] = useState('07:30 AM – 10:30 AM');
  const [newBatchDays, setNewBatchDays] = useState('Monday to Friday');
  const [newBatchRoom, setNewBatchRoom] = useState('Hall 101 (Chanakya Block)');
  const [newBatchCapacity, setNewBatchCapacity] = useState(50);
  const [newBatchStartDate, setNewBatchStartDate] = useState('2026-11-01');
  const [newBatchEndDate, setNewBatchEndDate] = useState('2027-10-31');
  const [newBatchFacultyId, setNewBatchFacultyId] = useState(staffMembers[0]?.id || '');

  const canManage = role === 'management' || role === 'office_staff';

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode) return;

    addCourse({
      name: newCourseName,
      code: newCourseCode,
      category: newCourseCategory,
      durationMonths: Number(newCourseDuration),
      totalFee: Number(newCourseFee),
      description: newCourseDesc,
      syllabusHighlights: newCourseHighlights.split(',').map(s => s.trim()).filter(Boolean)
    });

    setIsAddCourseOpen(false);
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseDesc('');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchCourseId) return;

    const course = courses.find(c => c.id === newBatchCourseId);
    const faculty = staffMembers.find(f => f.id === newBatchFacultyId);

    addBatch({
      name: newBatchName,
      courseId: newBatchCourseId,
      courseName: course?.name || 'Civil Services Course',
      code: newBatchCode || `B-${Date.now().toString().slice(-4)}`,
      timing: newBatchTiming,
      days: newBatchDays,
      room: newBatchRoom,
      maxCapacity: Number(newBatchCapacity),
      startDate: newBatchStartDate,
      endDate: newBatchEndDate,
      leadFacultyId: newBatchFacultyId,
      leadFacultyName: faculty?.name || 'Dr. K. Ramanathan'
    });

    setIsAddBatchOpen(false);
    setNewBatchName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Course & Batch Architecture
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Curriculum pathways · Classroom capacity & timings · Faculty allocation
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddCourseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
            <button
              onClick={() => setIsAddBatchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveSubTab('batches')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'batches'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Classroom Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveSubTab('courses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'courses'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Programs & Courses ({courses.length})
        </button>
      </div>

      {/* Batches View */}
      {activeSubTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map(batch => {
            const occupancyPct = Math.round((batch.enrolledCount / batch.maxCapacity) * 100);
            return (
              <div
                key={batch.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block">{batch.code}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{batch.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{batch.courseName}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                    Active Term
                  </span>
                </div>

                {/* Batch Logistics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.timing}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.room}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 col-span-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lead Mentor: <b className="text-slate-900 dark:text-white font-semibold">{batch.leadFacultyName}</b></span>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Classroom Seat Occupancy</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {batch.enrolledCount} / {batch.maxCapacity} Seats ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Term: {batch.startDate} to {batch.endDate}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{batch.days}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Courses View */}
      {activeSubTab === 'courses' && (
        <div className="space-y-4">
          {courses.map(course => (
            <div
              key={course.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{course.category}</span>
                    <span className="text-xs text-slate-400">· {course.durationMonths} Months</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{course.name}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tuition Fee</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{course.totalFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {course.description}
              </p>

              {/* Syllabus Highlights */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Curriculum & Syllabus Highlights
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {course.syllabusHighlights.map((hl, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{hl}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Academic Course</h3>
              <button onClick={() => setIsAddCourseOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={e => setNewCourseName(e.target.value)}
                  placeholder="e.g. UPSC CSE 2027 Two-Year Foundation"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={newCourseCode}
                    onChange={e => setNewCourseCode(e.target.value)}
                    placeholder="UPSC-2YR-27"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCourseCategory}
                    onChange={e => setNewCourseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="GS Foundation">GS Foundation</option>
                    <option value="Optional Subject">Optional Subject</option>
                    <option value="CSAT">CSAT</option>
                    <option value="Test Series">Test Series</option>
                    <option value="State PSC">State PSC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    value={newCourseDuration}
                    onChange={e => setNewCourseDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={newCourseFee}
                    onChange={e => setNewCourseFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCourseDesc}
                  onChange={e => setNewCourseDesc(e.target.value)}
                  placeholder="Comprehensive coverage overview..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Syllabus Highlights (comma-separated)</label>
                <input
                  type="text"
                  value={newCourseHighlights}
                  onChange={e => setNewCourseHighlights(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCourseOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Classroom Batch</h3>
              <button onClick={() => setIsAddBatchOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch Name *</label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                  placeholder="e.g. Morning Regular Batch (Gamma-26)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Course</label>
                <select
                  value={newBatchCourseId}
                  onChange={e => setNewBatchCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Timing</label>
                  <input
                    type="text"
                    value={newBatchTiming}
                    onChange={e => setNewBatchTiming(e.target.value)}
                    placeholder="07:30 AM – 10:30 AM"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Classroom / Room</label>
                  <input
                    type="text"
                    value={newBatchRoom}
                    onChange={e => setNewBatchRoom(e.target.value)}
                    placeholder="Hall 101"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Seating Capacity</label>
                  <input
                    type="number"
                    value={newBatchCapacity}
                    onChange={e => setNewBatchCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lead Faculty Mentor</label>
                  <select
                    value={newBatchFacultyId}
                    onChange={e => setNewBatchFacultyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  >
                    {staffMembers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
