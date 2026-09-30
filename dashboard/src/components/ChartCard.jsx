import { useId } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const gridColor = "hsl(216 40% 26% / 0.6)";
const axisColor = "hsl(40 18% 65%)";
const duration = (seconds) => `${Math.floor(seconds / 60)}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`;

function ChartTooltip({ active, payload, label, metrics }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
    <p className="mb-1 font-display text-sm text-foreground">{label}</p>
    {payload.map((entry) => {
      const metric = metrics.find(({ key }) => key === entry.dataKey);
      const value = metric?.isTime ? duration(entry.value || 0) : Number(entry.value || 0).toLocaleString();
      return <div key={entry.dataKey} className="flex items-center gap-2 py-0.5"><span className="h-2 w-2 rounded-full" style={{ background: entry.color }} /><span className="text-muted-foreground">{metric?.name || entry.name}:</span><span className="font-medium text-foreground">{value}</span></div>;
    })}
  </div>;
}

export default function ChartCard({ title, subtitle, type, data, metrics, selectedKeys, onToggleMetric, height = 300, className = "" }) {
  const chartId = useId().replace(/:/g, "");
  const selectedMetrics = metrics.filter(({ key }) => selectedKeys.includes(key));
  const axes = <><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} /><XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} /><YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={48} /><Tooltip content={<ChartTooltip metrics={metrics} />} /></>;
  let chart;
  if (!selectedMetrics.length) {
    chart = <div className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground" style={{ height }}>Select at least one metric to display.</div>;
  } else if (type === "bar") {
    chart = <ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }} barGap={4}>{axes}{selectedMetrics.map((metric) => <Bar key={metric.key} dataKey={metric.key} name={metric.name} fill={metric.color} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer>;
  } else if (type === "area") {
    chart = <ResponsiveContainer width="100%" height={height}><AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}><defs>{selectedMetrics.map((metric) => <linearGradient key={metric.key} id={`${chartId}-${metric.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={metric.color} stopOpacity={0.42} /><stop offset="100%" stopColor={metric.color} stopOpacity={0.02} /></linearGradient>)}</defs>{axes}{selectedMetrics.map((metric) => <Area key={metric.key} type="monotone" dataKey={metric.key} name={metric.name} stroke={metric.color} strokeWidth={2} fill={`url(#${chartId}-${metric.key})`} />)}</AreaChart></ResponsiveContainer>;
  } else {
    chart = <ResponsiveContainer width="100%" height={height}><LineChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>{axes}{selectedMetrics.map((metric) => <Line key={metric.key} type="monotone" dataKey={metric.key} name={metric.name} stroke={metric.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer>;
  }
  return <section className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg leading-tight text-foreground">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}</div><span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-primary/80">{type} chart</span></div>
    <div className="mb-4 flex flex-wrap gap-2">{metrics.map((metric) => {
      const active = selectedKeys.includes(metric.key);
      return <button key={metric.key} type="button" aria-pressed={active} onClick={() => onToggleMetric(metric.key)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? "border-transparent text-slate-950" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`} style={active ? { backgroundColor: metric.color } : undefined}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />{metric.name}</button>;
    })}</div>
    {chart}
  </section>;
}
