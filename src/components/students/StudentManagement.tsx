import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  CreditCard,
  FileText,
  Calendar,
  X
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const {
    students,
    courses,
    batches,
    invoices,
    receipts,
    viewReceipt,
    openModal,
    role
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery);

    const matchesBatch = batchFilter === 'all' || student.enrolledBatchId === batchFilter;
    
    let matchesFee = true;
    if (feeStatusFilter === 'paid') {
      matchesFee = student.balanceFee === 0;
    } else if (feeStatusFilter === 'pending') {
      matchesFee = student.balanceFee > 0;
    }

    return matchesSearch && matchesBatch && matchesFee;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Management & Classroom Rosters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active civil services aspirants · Batch allocation · Fee settlement & Academic tracking
          </p>
        </div>

        {role !== 'faculty' && (
          <button
            onClick={() => openModal('admission')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Enroll New Aspirant</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll number, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={feeStatusFilter}
            onChange={e => setFeeStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Fee Status</option>
            <option value="paid">Fully Cleared (₹0 Due)</option>
            <option value="pending">Balance Pending</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Student Name & Roll No</th>
                <th className="px-4 py-3">Course & Batch</th>
                <th className="px-4 py-3">Attendance Rate</th>
                <th className="px-4 py-3">Test Avg</th>
                <th className="px-4 py-3">Fee Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const isFullyPaid = student.balanceFee === 0;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{student.name}</div>
                        <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {student.rollNumber} · Enrolled {student.admissionDate}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{student.enrolledBatchName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs">{student.enrolledCourseName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          <span>{student.attendancePercentage}%</span>
                        </div>
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${student.attendancePercentage >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${student.attendancePercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono tabular-nums">
                        {student.averageTestScore > 0 ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{student.averageTestScore}</span>
                            <span className="text-[10px] text-slate-400"> / 20</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">First Mock Due</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono tabular-nums">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          ₹{student.paidFee.toLocaleString('en-IN')}
                          <span className="text-slate-400 font-normal"> / ₹{student.netFee.toLocaleString('en-IN')}</span>
                        </div>
                        {isFullyPaid ? (
                          <span className="text-[11px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                            Fully Cleared
                          </span>
                        ) : (
                          <span className="text-[11px] font-sans font-semibold text-rose-700 dark:text-rose-400">
                            Due: ₹{student.balanceFee.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          Profile 360°
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student 360 Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  Roll ID: {selectedStudent.rollNumber} · Batch: {selectedStudent.enrolledBatchName}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Attendance Record</span>
                <span className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  {selectedStudent.attendancePercentage}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Average Mock Score</span>
                <span className="text-base font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                  {selectedStudent.averageTestScore || 'Pending'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Balance Fee</span>
                <span className={`text-base font-mono font-bold mt-1 block ${selectedStudent.balanceFee === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  ₹{selectedStudent.balanceFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Detailed Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Contact & Location</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.phone}</p>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedStudent.email}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedStudent.address}</p>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium">Guardian Details</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.guardianName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400 mt-0.5">{selectedStudent.guardianPhone}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Scholarship: <span className="capitalize font-semibold text-amber-800 dark:text-amber-400">{selectedStudent.scholarshipApplied.replace('_', ' ')}</span></p>
              </div>
            </div>

            {/* Fee Invoices History */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Invoices & Payment Records
              </h4>
              <div className="space-y-2">
                {invoices.filter(i => i.studentId === selectedStudent.id).map(inv => {
                  const receipt = receipts.find(r => r.invoiceId === inv.id);
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Installment {inv.installmentIndex} of {inv.totalInstallments} · Due {inv.dueDate}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </span>
                        {inv.status === 'paid' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">Paid</span>
                            {receipt && (
                              <button
                                onClick={() => viewReceipt(receipt)}
                                className="px-2 py-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded"
                              >
                                View Receipt
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold text-xs">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
