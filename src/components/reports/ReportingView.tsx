import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Users
} from 'lucide-react';

export const ReportingView: React.FC = () => {
  const {
    students,
    batches,
    courses,
    invoices
  } = useApp();

  const [reportType, setReportType] = useState<'progress' | 'attendance' | 'finance'>('progress');
  const [selectedBatchId, setSelectedBatchId] = useState('all');

  const filteredStudents = students.filter(s =>
    selectedBatchId === 'all' ? true : s.enrolledBatchId === selectedBatchId
  );

  const selectedBatchObj = batches.find(b => b.id === selectedBatchId);

  // Aggregated Stats
  const avgAttendance = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / filteredStudents.length * 10) / 10
    : 0;

  const avgScore = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((sum, s) => sum + (s.averageTestScore || 0), 0) / filteredStudents.length * 10) / 10
    : 0;

  const lowAttendanceStudents = filteredStudents.filter(s => s.attendancePercentage < 80);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Comprehensive Progress Reports & Stakeholder Summaries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Board-level academic tracking · Attendance compliance audits · Executive export
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export Report</span>
        </button>
      </div>

      {/* Control Bar (hidden in print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Report Type */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setReportType('progress')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              reportType === 'progress'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Academic Progress Matrix
          </button>
          <button
            onClick={() => setReportType('attendance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              reportType === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Compliance Audit
          </button>
          <button
            onClick={() => setReportType('finance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              reportType === 'finance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue & Concession Audit
          </button>
        </div>

        {/* Batch Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Classroom Cohort:</span>
          <select
            value={selectedBatchId}
            onChange={e => setSelectedBatchId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            <option value="all">All Batches Combined</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs print:m-0 print:border-none print:shadow-none space-y-6">
        
        {/* Report Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/vrm_academy_emblem_1792414585733.jpg"
              alt="VRM IAS Academy Crest"
              className="w-14 h-14 rounded-full object-cover border border-amber-200 shadow-2xs"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">VRM IAS ACADEMY</h1>
              <p className="text-xs text-slate-500 font-medium">Directorate of Academic Standards & Mentorship Evaluations</p>
              <p className="text-xs text-slate-400">Anna Nagar Campus, Chennai · Official Academic Report</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono text-slate-400">Generated On:</span>
            <p className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            <p className="text-slate-500 mt-1">Scope: {selectedBatchObj ? selectedBatchObj.name : 'Academy-Wide'}</p>
          </div>
        </div>

        {/* Executive KPI Overview Strip */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Total Evaluated Cohort</span>
            <span className="text-xl font-mono font-bold text-slate-900 mt-0.5 block tabular-nums">
              {filteredStudents.length} Students
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Cohort Avg Attendance</span>
            <span className="text-xl font-mono font-bold text-emerald-700 mt-0.5 block tabular-nums">
              {avgAttendance}%
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Mock Test Avg Score</span>
            <span className="text-xl font-mono font-bold text-slate-900 mt-0.5 block tabular-nums">
              {avgScore} / 20
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Attendance Defaulters (&lt;80%)</span>
            <span className={`text-xl font-mono font-bold mt-0.5 block tabular-nums ${lowAttendanceStudents.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lowAttendanceStudents.length} Aspirants
            </span>
          </div>
        </div>

        {/* Progress Report Table */}
        {reportType === 'progress' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student-by-Student Comprehensive Evaluation Matrix
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Roll Number</th>
                    <th className="px-4 py-2.5">Candidate Name</th>
                    <th className="px-4 py-2.5">Batch</th>
                    <th className="px-4 py-2.5">Attendance</th>
                    <th className="px-4 py-2.5">Mock Test Avg</th>
                    <th className="px-4 py-2.5">Mentor Evaluation</th>
                    <th className="px-4 py-2.5 text-right">Fee Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {student.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">
                        {student.enrolledBatchName}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums font-semibold text-slate-800">
                        {student.attendancePercentage}%
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums font-bold text-slate-900">
                        {student.averageTestScore > 0 ? `${student.averageTestScore} / 20` : 'Due'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {student.averageTestScore >= 16 ? (
                          <span className="text-emerald-700 font-medium">Interview Ready · High Yield</span>
                        ) : student.averageTestScore >= 12 ? (
                          <span className="text-blue-700 font-medium">Consistent · Moderate</span>
                        ) : (
                          <span className="text-amber-800 font-medium">Needs Answer Writing Booster</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {student.balanceFee === 0 ? (
                          <span className="text-emerald-700 font-semibold">100% Cleared</span>
                        ) : (
                          <span className="text-rose-700 font-semibold">₹{student.balanceFee.toLocaleString('en-IN')} Due</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Compliance Report */}
        {reportType === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Classroom Attendance Audit & SMS Parent Notification Roster
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Roll Number</th>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">Attendance Percentage</th>
                    <th className="px-4 py-2.5">Compliance Tier</th>
                    <th className="px-4 py-2.5">Guardian Phone</th>
                    <th className="px-4 py-2.5 text-right">Defaulter Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => {
                    const isDefaulter = student.attendancePercentage < 80;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          {student.rollNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold tabular-nums">
                          {student.attendancePercentage}%
                        </td>
                        <td className="px-4 py-3">
                          {student.attendancePercentage >= 90 ? (
                            <span className="text-emerald-700 font-semibold">Exemplary (90%+)</span>
                          ) : student.attendancePercentage >= 80 ? (
                            <span className="text-blue-700 font-medium">Standard (80–89%)</span>
                          ) : (
                            <span className="text-rose-700 font-bold">Defaulter Risk (&lt;80%)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {student.guardianPhone}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isDefaulter ? (
                            <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              SMS Alert Dispatched
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Regular</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial & Concession Audit Report */}
        {reportType === 'finance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cohort Tuition Invoicing & Concession Subsidy Audit
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Student / Roll</th>
                    <th className="px-4 py-2.5">Course</th>
                    <th className="px-4 py-2.5">Concession Category</th>
                    <th className="px-4 py-2.5 text-right">Base Tuition</th>
                    <th className="px-4 py-2.5 text-right">Scholarship Subsidy</th>
                    <th className="px-4 py-2.5 text-right">Net Remittance</th>
                    <th className="px-4 py-2.5 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{student.rollNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[130px]">
                        {student.enrolledCourseName}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700 font-medium">
                        {student.scholarshipApplied.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                        ₹{student.totalFee.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-800 font-semibold">
                        -₹{student.discountAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₹{student.paidFee.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                        {student.balanceFee === 0 ? (
                          <span className="text-emerald-700">₹0</span>
                        ) : (
                          <span className="text-rose-700">₹{student.balanceFee.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stakeholder Sign-Off Block */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-center">
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">P. Sangeetha</span>
            <span className="text-[11px] text-slate-400">Head Registrar & Accounts Controller</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">Dr. K. Ramanathan</span>
            <span className="text-[11px] text-slate-400">Dean of Academics & Senior Mentor</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <span className="font-bold text-slate-800 block">Dr. V. R. Murugan, Ex-IRS</span>
            <span className="text-[11px] text-slate-400">Founder & Director General</span>
          </div>
        </div>

      </div>

    </div>
  );
};
