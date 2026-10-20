import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Users,
  CreditCard,
  Award,
  Clock,
  CheckCircle2,
  BarChart2,
  PieChart,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const {
    students,
    leads,
    counselors,
    invoices,
    courses,
    batches
  } = useApp();

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingRevenue = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalSeats = batches.reduce((sum, b) => sum + b.maxCapacity, 0);
  const enrolledSeats = batches.reduce((sum, b) => sum + b.enrolledCount, 0);
  const occupancyPct = totalSeats > 0 ? Math.round((enrolledSeats / totalSeats) * 100) : 0;

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Executive Analytics & Operational KPIs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enrollment trends · Financial realization · Counselor conversion velocity
          </p>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Realized Collections</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              +24% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            ₹{(totalRevenue / 100000).toFixed(2)}L
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending: ₹{(pendingRevenue / 100000).toFixed(2)}L</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Classroom Aspirants</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              {occupancyPct}% Filled
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {students.length} Enrolled
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{enrolledSeats} / {totalSeats} Batch Seats</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">CRM Conversion Velocity</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              Top Tier
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-700 mt-1 tabular-nums">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{convertedLeads} admissions from {totalLeads} inquiries</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Average Response Latency</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center">
              Fast Track
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-amber-700 mt-1 tabular-nums">
            14.2 min
          </div>
          <p className="text-[11px] text-slate-400 mt-1">SLA Benchmark: &lt;20 min</p>
        </div>
      </div>

      {/* Visual Analytics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Trend Simulation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Monthly Fee Realization (₹ in Lakhs)
            </h3>
            <span className="text-xs font-mono text-slate-400">FY 2026</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { month: 'June 2026 (Batch Launch)', amount: 18.5, max: 25 },
              { month: 'July 2026', amount: 14.2, max: 25 },
              { month: 'August 2026', amount: 16.8, max: 25 },
              { month: 'September 2026', amount: 21.0, max: 25 },
              { month: 'October 2026 (Ongoing)', amount: 12.4, max: 25 }
            ].map((item, idx) => {
              const widthPct = Math.round((item.amount / item.max) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.month}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">₹{item.amount}L</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inbound Lead Channel Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Inbound Lead Source Channel Performance
            </h3>
            <span className="text-xs text-slate-400">Real-time sync</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { channel: 'Official Website & SEO Portal', count: 18, pct: 45, color: 'bg-amber-500' },
              { channel: 'Field Agent Seminars (Loyola / Anna Univ)', count: 12, pct: 30, color: 'bg-emerald-600' },
              { channel: 'Walk-in Admissions Center', count: 6, pct: 15, color: 'bg-blue-600' },
              { channel: 'Alumni Rank Holder Referrals', count: 4, pct: 10, color: 'bg-purple-600' }
            ].map((src, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium">{src.channel}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {src.count} Inquiries ({src.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${src.color} h-full rounded-full`}
                    style={{ width: `${src.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Counselor Team Efficiency Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Counselor Efficiency & Conversion Leaderboard
          </h3>
          <span className="text-xs text-slate-500">Live SLA monitoring</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Counselor Specialist</th>
                <th className="px-4 py-3">Assigned Active Leads</th>
                <th className="px-4 py-3">Avg Response Latency</th>
                <th className="px-4 py-3">Admissions Converted</th>
                <th className="px-4 py-3 text-right">Conversion Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {counselors.map(c => {
                const eff = Math.round((c.conversionsThisMonth / (c.activeLeadsCount + c.conversionsThisMonth)) * 100);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {c.activeLeadsCount} Leads
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">
                      {c.averageResponseMinutes} mins
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {c.conversionsThisMonth} Students
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {eff}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
