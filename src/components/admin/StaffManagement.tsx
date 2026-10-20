import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember, SalaryPayout } from '../../types';
import {
  Building2,
  Users,
  Plus,
  CreditCard,
  CheckCircle2,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const {
    staffMembers,
    salaryPayouts,
    addStaffMember,
    batches
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'payroll'>('roster');
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  // New Staff Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Faculty - Indian Economy');
  const [department, setDepartment] = useState<StaffMember['department']>('Faculty');
  const [subjects, setSubjects] = useState('Indian Economy, Economic Survey');
  const [phone, setPhone] = useState('+91 98401 99887');
  const [email, setEmail] = useState('faculty@vrmiasacademy.in');
  const [monthlySalary, setMonthlySalary] = useState(120000);
  const [selectedBatchNames, setSelectedBatchNames] = useState([batches[0]?.name || 'Morning Regular Batch']);

  const handleOnboardStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addStaffMember({
      name,
      designation,
      department,
      subjectsHandling: subjects.split(',').map(s => s.trim()).filter(Boolean),
      assignedBatches: selectedBatchNames,
      phone,
      email,
      monthlySalary: Number(monthlySalary),
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    setIsOnboardModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Staff & Faculty Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Faculty onboarding · Subject allocations · Monthly salary ledger & Attendance tracking
          </p>
        </div>

        <button
          onClick={() => setIsOnboardModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Onboard New Staff</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'roster'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Staff & Mentor Directory ({staffMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'payroll'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Salary Disbursements & Ledger ({salaryPayouts.length})
        </button>
      </div>

      {/* Staff Roster Grid */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.map(staff => (
            <div
              key={staff.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                      {staff.department}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{staff.name}</h3>
                    <p className="text-xs text-slate-500">{staff.designation}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Attendance</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {staff.attendanceRate}%
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                </div>

                {/* Subjects & Batches */}
                {staff.subjectsHandling && staff.subjectsHandling.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Subjects Handling
                    </span>
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {staff.subjectsHandling.map((sub, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Monthly Compensation</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{staff.monthlySalary.toLocaleString('en-IN')} / mo
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Salary Disbursement Ledger */}
      {activeTab === 'payroll' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Disbursement Month</th>
                  <th className="px-4 py-3">Staff / Faculty Name</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Incentives</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Payout</th>
                  <th className="px-4 py-3 font-mono">NEFT Txn Ref</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaryPayouts.map(sal => (
                  <tr key={sal.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {sal.month}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {sal.staffName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      ₹{sal.baseSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700">
                      +₹{sal.incentives.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-700">
                      -₹{sal.deductions.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      ₹{sal.netPayout.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {sal.transactionRef}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
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

      {/* Onboard Staff Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Onboard New Faculty / Staff Member</h3>
              <button onClick={() => setIsOnboardModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Raghavan Swaminathan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Faculty">Academic Faculty</option>
                    <option value="Administration">Administration & Front Desk</option>
                    <option value="Counseling">Inbound Counseling & Outreach</option>
                    <option value="Finance">Finance & Fee Accounts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation Title</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="Senior Faculty - Polity"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agreed Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={e => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subjects Handling</label>
                  <input
                    type="text"
                    value={subjects}
                    onChange={e => setSubjects(e.target.value)}
                    placeholder="Polity, Governance, IR"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
