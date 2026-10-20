import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { invoiceBalance } from '../../lib/fees';
import { BarsChart, ChartCard, LinesChart, lakhs, pct } from '../charts/Charts';
import { addDays, parseISODate } from '../../lib/dates';
import { weeklyAttendance } from '../../lib/metrics';

const lakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

const SOURCE_LABELS: Record<string, string> = {
  website: 'Website enquiry form',
  walk_in: 'Walk-in',
  referral: 'Student referral',
  field_agent: 'Field agent / college visit',
  seminar: 'Seminar'
};

const Card: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {right && <span className="text-xs text-slate-400 shrink-0">{right}</span>}
    </div>
    {children}
  </div>
);

const Delta: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '%' }) => (
  <span className={`text-[11px] font-bold flex items-center ${value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
    {value >= 0 ? '+' : ''}
    {value}
    {suffix}
    {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
  </span>
);

export const AnalyticsDashboard: React.FC = () => {
  const { students, leads, counselors, invoices, receipts, batches, assessmentTests, studentAttempts, staffMembers, tickets, attendance, dailyQuizAttempts, today, setActiveTab } = useApp();

  const months = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const base = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      });
    }
    return out;
  }, [today]);

  // ---------- finance ----------
  const collectedByMonth = months.map(m => receipts.filter(r => (r.paidOn || '').slice(0, 7) === m.key).reduce((s, r) => s + r.amountPaid, 0));
  const maxCollected = Math.max(1, ...collectedByMonth);
  const thisMonthCollected = collectedByMonth[5];
  const dayOfMonth = Number(today.slice(8, 10));
  const daysInLastMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 0).getDate();
  const collectionPace = collectedByMonth[4] > 0 ? Math.round(((thisMonthCollected / dayOfMonth) / (collectedByMonth[4] / daysInLastMonth) - 1) * 100) : 0;
  const totalCollected = receipts.reduce((s, r) => s + r.amountPaid, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + invoiceBalance(i), 0);
  const collectionRate = totalCollected + outstanding > 0 ? Math.round((totalCollected / (totalCollected + outstanding)) * 100) : 0;

  // ---------- admissions ----------
  const active = students.filter(s => s.status === 'active');
  const admissionsByMonth = months.map(m => students.filter(s => s.admissionDate.slice(0, 7) === m.key).length);
  const maxAdmissions = Math.max(1, ...admissionsByMonth);
  const totalSeats = batches.reduce((s, b) => s + b.maxCapacity, 0);
  const occupancyPct = totalSeats ? Math.round((active.length / totalSeats) * 100) : 0;

  // ---------- leads ----------
  const closed = leads.filter(l => l.status === 'converted' || l.status === 'dropped');
  const converted = leads.filter(l => l.status === 'converted');
  const conversionRate = closed.length ? Math.round((converted.length / closed.length) * 100) : 0;
  const responseMins = leads
    .filter(l => l.followUps.length)
    .map(l => (new Date(l.followUps[0].timestamp).getTime() - new Date(l.createdAt).getTime()) / 60000)
    .filter(m => m >= 0 && m < 4320);
  const avgResponse = responseMins.length ? Math.round(responseMins.reduce((a, b) => a + b, 0) / responseMins.length) : 0;
  const sourceStats = Object.keys(SOURCE_LABELS)
    .map(src => {
      const all = leads.filter(l => l.source === src);
      const conv = all.filter(l => l.status === 'converted').length;
      return { src, count: all.length, conv };
    })
    .sort((a, b) => b.count - a.count);

  // ---------- academics ----------
  const avgAttendance = active.length ? Math.round((active.reduce((s, x) => s + x.attendancePercentage, 0) / active.length) * 10) / 10 : 0;
  const lowAttendance = active.filter(s => s.attendancePercentage < 75).length;
  const testTrend = assessmentTests
    .filter(t => t.scheduledDate <= today)
    .map(t => {
      const atts = studentAttempts.filter(a => a.testId === t.id);
      const avg = atts.length ? Math.round((atts.reduce((s, a) => s + Math.max(0, a.score) / (a.totalMarks || 1), 0) / atts.length) * 100) : 0;
      return { test: t, takers: atts.length, avg };
    })
    .filter(x => x.takers > 0)
    .sort((a, b) => a.test.scheduledDate.localeCompare(b.test.scheduledDate));
  const avgScore = testTrend.length ? Math.round(testTrend.reduce((s, x) => s + x.avg, 0) / testTrend.length) : 0;

  // ---------- operations ----------
  const staffAttendance = staffMembers.length
    ? Math.round((staffMembers.reduce((s, x) => s + x.attendanceRate, 0) / staffMembers.length) * 10) / 10
    : 0;
  const openTickets = tickets.filter(t => t.status !== 'resolved').length;

  const counselorRows = counselors.map(c => {
    const mine = leads.filter(l => l.assignedCounselorId === c.id);
    const cClosed = mine.filter(l => l.status === 'converted' || l.status === 'dropped');
    const cConv = mine.filter(l => l.status === 'converted').length;
    return { c, total: mine.length, conv: cConv, rate: cClosed.length ? Math.round((cConv / cClosed.length) * 100) : 0 };
  });

  // ---------- chart rows ----------
  const collectionRows = months.map((m, i) => ({ month: m.label.split(' ')[0], collected: collectedByMonth[i] }));
  const funnelRows = months.map((m, i) => ({
    month: m.label.split(' ')[0],
    enquiries: leads.filter(l => l.createdAt.slice(0, 7) === m.key).length,
    admissions: admissionsByMonth[i]
  }));
  const attendanceRows = weeklyAttendance(attendance, students, today, 12);
  const testRows = testTrend.map(t => ({ test: t.test.code.replace('VRM-', ''), average: t.avg }));
  const quizRows = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    return {
      day: parseISODate(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      answered: dailyQuizAttempts.filter(a => a.date === d).length
    };
  });

  const kpi = 'p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Revenue, admissions, academic performance and team efficiency, from live records</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Collected This Month</span>
            {collectedByMonth[4] > 0 && <Delta value={collectionPace} />}
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{lakh(thisMonthCollected)}</div>
          <p className="text-[11px] text-slate-400 mt-1">vs last month's daily pace</p>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Outstanding Fees</span>
            <span className="text-[11px] font-bold text-slate-500">{collectionRate}% collected</span>
          </div>
          <div className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">{lakh(outstanding)}</div>
          <button onClick={() => setActiveTab('fees')} className="text-[11px] text-rose-600 font-semibold mt-1 hover:underline">
            {lakh(overdue)} overdue →
          </button>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Students</span>
            <span className="text-[11px] text-emerald-600 font-bold">{occupancyPct}% seats filled</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{active.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {admissionsByMonth[5]} admitted this month · {active.length}/{totalSeats} seats
          </p>
        </div>
        <div className={kpi}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lead Conversion</span>
            <span className={`text-[11px] font-bold ${avgResponse <= 20 ? 'text-emerald-600' : 'text-rose-600'}`}>{avgResponse} min response</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{conversionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {converted.length} joined of {closed.length} closed leads
          </p>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Class Attendance</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{avgAttendance}%</div>
          <p className={`text-[11px] mt-1 ${lowAttendance ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>{lowAttendance} students below 75%</p>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Test Score</span>
          <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">{avgScore}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Across {testTrend.length} tests conducted</p>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Staff Attendance</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{staffAttendance}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{staffMembers.length} staff · last 4 months</p>
        </div>
        <div className={kpi}>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open Support Tickets</span>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{openTickets}</div>
          <button onClick={() => setActiveTab('support')} className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 hover:underline">
            Open help desk →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Fee collections" note="Per month, last 6 months" empty={totalCollected === 0} emptyText="No payments recorded yet.">
          <BarsChart data={collectionRows} xKey="month" series={[{ key: 'collected', label: 'Collected' }]} formatValue={lakhs} />
        </ChartCard>

        <ChartCard title="Enquiries and admissions" note="Per month" empty={leads.length === 0 && students.length === 0} emptyText="No enquiries or admissions yet.">
          <BarsChart
            data={funnelRows}
            xKey="month"
            series={[
              { key: 'enquiries', label: 'Enquiries' },
              { key: 'admissions', label: 'Admissions' }
            ]}
          />
        </ChartCard>

        <ChartCard title="Class attendance" note="Weekly average, last 12 weeks" empty={attendanceRows.every(r => r.attendance === null)} emptyText="Attendance appears here once faculty start marking classes.">
          <LinesChart data={attendanceRows} xKey="week" series={[{ key: 'attendance', label: 'Attendance' }]} formatValue={pct} yMax={100} />
        </ChartCard>

        <ChartCard title="Test performance" note="Average score per test" empty={testTrend.length === 0} emptyText="No tests attempted yet.">
          <LinesChart data={testRows} xKey="test" series={[{ key: 'average', label: 'Average score' }]} formatValue={pct} yMax={100} />
        </ChartCard>

        <ChartCard title="Daily quiz participation" note="Students answering, last 14 days" empty={dailyQuizAttempts.length === 0} emptyText="No daily quiz answers yet.">
          <BarsChart data={quizRows} xKey="day" series={[{ key: 'answered', label: 'Students answered' }]} />
        </ChartCard>

        <ChartCard title="Where enquiries come from" note={`${leads.length} enquiries`} empty={leads.length === 0} emptyText="No enquiries yet.">
          <BarsChart
            horizontal
            data={sourceStats.map(x => ({ source: SOURCE_LABELS[x.src], enquiries: x.count, joined: x.conv }))}
            xKey="source"
            series={[
              { key: 'enquiries', label: 'Enquiries' },
              { key: 'joined', label: 'Joined' }
            ]}
            height={260}
          />
        </ChartCard>
      </div>

      <Card title="Batch Health" right="Occupancy, attendance and fees by batch">
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-2.5">Batch</th>
                <th className="px-4 py-2.5">Seats</th>
                <th className="px-4 py-2.5">Avg Attendance</th>
                <th className="px-4 py-2.5">Avg Test Score</th>
                <th className="px-4 py-2.5 text-right">Fees Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {batches.map(b => {
                const roster = active.filter(s => s.enrolledBatchId === b.id);
                const att = roster.length ? Math.round((roster.reduce((s, x) => s + x.attendancePercentage, 0) / roster.length) * 10) / 10 : 0;
                const tested = roster.filter(s => s.averageTestScore > 0);
                const score = tested.length ? Math.round(tested.reduce((s, x) => s + x.averageTestScore, 0) / tested.length) : 0;
                const due = roster.reduce((s, x) => s + x.balanceFee, 0);
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">{b.name}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                      {b.enrolledCount}/{b.maxCapacity}
                    </td>
                    <td className={`px-4 py-2.5 font-mono ${att < 80 ? 'text-amber-700' : 'text-emerald-700 dark:text-emerald-400'}`}>{att}%</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{score ? `${score}%` : '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-right text-rose-700 dark:text-rose-400">₹{due.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Counselor Efficiency" right="All-time lead outcomes">
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-2.5">Counselor</th>
                <th className="px-4 py-2.5">Open Leads</th>
                <th className="px-4 py-2.5">Avg First Response</th>
                <th className="px-4 py-2.5">Joined This Month</th>
                <th className="px-4 py-2.5 text-right">Conversion (closed leads)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {counselorRows.map(({ c, total, conv, rate }) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {total} leads handled · {conv} joined
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">{c.activeLeadsCount}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${c.averageResponseMinutes <= 20 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {c.averageResponseMinutes} min
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white">{c.conversionsThisMonth}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">{rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
