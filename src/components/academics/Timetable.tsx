import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, MapPin, User, BookOpen, Layers } from 'lucide-react';

export const Timetable: React.FC = () => {
  const { schedule, batches } = useApp();
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'all');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const filteredSchedule = schedule.filter(s =>
    selectedBatchId === 'all' ? true : s.batchId === selectedBatchId
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Class Schedules & Lecture Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily lecture distribution · Classroom venues · Faculty subject alignment
          </p>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Batch:</span>
          <select
            value={selectedBatchId}
            onChange={e => setSelectedBatchId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Schedule Cards */}
      <div className="space-y-4">
        {daysOfWeek.map(day => {
          const dayItems = filteredSchedule.filter(s => s.day === day);
          return (
            <div
              key={day}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
            >
              <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {day}
                </span>
                <span className="text-[11px] text-slate-400">
                  {dayItems.length} Lecture{dayItems.length === 1 ? '' : 's'} Scheduled
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {dayItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Self-study / Library research day for this batch.
                  </p>
                ) : (
                  dayItems.map(item => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.subject}</span>
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {item.batchName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{item.topic}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 shrink-0">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.room}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-900 font-medium">
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
