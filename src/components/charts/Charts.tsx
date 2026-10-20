/**
 * Small chart kit on Recharts. Colors follow a validated colour-blind-safe categorical order
 * (blue, orange, aqua) with separate light/dark steps; text uses neutral ink, never the series colour.
 */
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useApp } from '../../context/AppContext';

const PALETTE = {
  light: { series: ['#2a78d6', '#eb6834', '#1baf7a'], grid: '#e8e8e4', axis: '#6b6a64', ink: '#1f2937', surface: '#ffffff', cursor: 'rgba(15,23,42,0.05)' },
  dark: { series: ['#3987e5', '#d95926', '#199e70'], grid: '#2a3446', axis: '#94a3b8', ink: '#e2e8f0', surface: '#0f172a', cursor: 'rgba(255,255,255,0.06)' }
};

export const useChartTheme = (forceLight = false) => {
  const { theme } = useApp();
  return PALETTE[theme === 'dark' && !forceLight ? 'dark' : 'light'];
};

export interface SeriesDef {
  key: string;
  label: string;
}

type Row = Record<string, string | number | null>;

interface BaseProps {
  data: Row[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  formatValue?: (v: number) => string;
  /** Y-axis domain upper bound, e.g. 100 for percentages. */
  yMax?: number;
  /** Force the light palette (charts on printable white documents). */
  light?: boolean;
}

const ChartTooltip: React.FC<any> = ({ active, payload, label, formatValue }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-slate-900 dark:text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-mono font-semibold text-slate-900 dark:text-white">
            {formatValue ? formatValue(Number(p.value)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const axisProps = (c: (typeof PALETTE)['light']) => ({
  tick: { fill: c.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: c.grid }
});

/** Vertical bars. One series = one colour; 2–3 series are grouped with a legend. */
export const BarsChart: React.FC<BaseProps & { horizontal?: boolean }> = ({ data, xKey, series, height = 240, formatValue, yMax, horizontal = false, light }) => {
  const c = useChartTheme(light);
  const multi = series.length > 1;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 8 : -8 }}
          barGap={2}
          barCategoryGap={multi ? '22%' : '30%'}
        >
          <CartesianGrid stroke={c.grid} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps(c)} tickFormatter={formatValue} domain={[0, yMax ?? 'auto']} />
              <YAxis type="category" dataKey={xKey} {...axisProps(c)} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps(c)} interval="preserveStartEnd" />
              <YAxis {...axisProps(c)} tickFormatter={formatValue} width={52} domain={[0, yMax ?? 'auto']} allowDecimals={false} />
            </>
          )}
          <Tooltip cursor={{ fill: c.cursor }} content={<ChartTooltip formatValue={formatValue} />} />
          {multi && <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, color: c.axis }} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={c.series[i % c.series.length]}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={multi ? 22 : 34}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Lines over time (2px strokes, small markers). */
export const LinesChart: React.FC<BaseProps> = ({ data, xKey, series, height = 240, formatValue, yMax, light }) => {
  const c = useChartTheme(light);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps(c)} interval="preserveStartEnd" />
          <YAxis {...axisProps(c)} tickFormatter={formatValue} width={52} domain={[0, yMax ?? 'auto']} />
          <Tooltip cursor={{ stroke: c.axis, strokeWidth: 1 }} content={<ChartTooltip formatValue={formatValue} />} />
          {series.length > 1 && <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 11, color: c.axis }} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={c.series[i % c.series.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: c.series[i % c.series.length] }}
              activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Card wrapper with title, optional note, and an empty state. */
export const ChartCard: React.FC<{
  title: string;
  note?: string;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, note, empty, emptyText = 'No data yet.', children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3 min-w-0 ${className}`}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {note && <span className="text-xs text-slate-500 dark:text-slate-400">{note}</span>}
    </div>
    {empty ? <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center px-4">{emptyText}</div> : children}
  </div>
);

export const lakhs = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);
export const pct = (v: number) => `${Math.round(v)}%`;
