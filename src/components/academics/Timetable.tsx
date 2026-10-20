import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, MapPin, User } from 'lucide-react';
import { weekdayOf } from '../../lib/dates';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const Timetable: React.FC = () => {
  const { schedule, batches, role, currentStudent, currentStaff, today } = useApp();

  // Students only ever see their own batch; faculty default to their own classes.
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty';
  const [selectedBatchId, setSelectedBatchId] = useState(isFaculty ? 'mine' : batches[0]?.id || 'all');
  const effectiveBatch = isStudent ? currentStudent?.enrolledBatchId || '' : selectedBatchId;

  const filteredSchedule = schedule.filter(s => {
    if (effectiveBatch === 'all') return true;
    if (effectiveBatch === 'mine') return s.facultyName === currentStaff?.name;
    return s.batchId === effectiveBatch;
  });
  const todayName = weekdayOf(today);
  const daysToShow = DAYS.filter(d => filteredSchedule.some(s => s.day === d) || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isStudent ? 'My Class Schedule' : 'Class Schedules & Timetable'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isStudent ? currentStudent?.enrolledBatchName : 'Weekly timetable by batch · rooms · faculty'}
          </p>
        </div>

        {!isStudent && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Show:</span>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[70vw]"
            >
              {isFaculty && <option value="mine">My classes (all batches)</option>}
              <option value="all">All batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {daysToShow.map(day => {
          const dayItems = filteredSchedule.filter(s => s.day === day);
          const isToday = day === todayName;
          return (
            <div
              key={day}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-2xs ${
                isToday ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="bg-slate-50/80 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {day}
                  {isToday && <span className="ml-2 text-[10px] text-amber-700 dark:text-amber-400 normal-case">Today</span>}
                </span>
                <span className="text-[11px] text-slate-400">
                  {dayItems.length} class{dayItems.length === 1 ? '' : 'es'}
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {dayItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No classes.</p>
                ) : (
                  dayItems.map(item => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{item.subject}</span>
                          {!isStudent && (
                            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              {item.batchName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{item.topic}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 shrink-0">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.room}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.facultyName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
