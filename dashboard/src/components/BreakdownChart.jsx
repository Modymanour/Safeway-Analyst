import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["hsl(46 65% 52%)", "hsl(178 40% 56%)", "hsl(212 60% 70%)", "hsl(355 45% 60%)", "hsl(44 46% 80%)", "hsl(265 45% 70%)"];
const gridColor = "hsl(216 40% 26% / 0.6)";
const axisColor = "hsl(40 18% 65%)";

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"><p className="text-muted-foreground">{label}</p><p className="font-display text-base text-foreground">{Number(payload[0].value || 0).toLocaleString()}</p></div>;
}

export default function BreakdownChart({ title, subtitle, data = [], height = 280, className = "" }) {
  const total = data.reduce((sum, row) => sum + (row.count || 0), 0);
  return <section className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg leading-tight text-foreground">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}</div><span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-primary/80">{total.toLocaleString()} total</span></div>
    {data.length ? <ResponsiveContainer width="100%" height={height}><BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} /><XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={120} /><Tooltip cursor={{ fill: "hsl(214 48% 24% / 0.4)" }} content={<CountTooltip />} /><Bar dataKey="count" name="Visits" radius={[0, 4, 4, 0]} barSize={22}>{data.map((row, index) => <Cell key={row.label} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer> : <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>No data for this period.</div>}
  </section>;
}
