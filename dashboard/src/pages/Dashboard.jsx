import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Gauge, Loader2, MapPin, RefreshCw, Users } from "lucide-react";
import { getDashboardRange, getDashboardSpecificMonths } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/ChartCard";
import FilterBar from "@/components/FilterBar";
import BreakdownChart from "@/components/BreakdownChart";

const METRICS = [
  { key: "total_visits", name: "Visits", color: "hsl(46 65% 52%)" },
  { key: "average_time_on_page", name: "Avg. Time on Page", color: "hsl(178 40% 56%)", isTime: true },
  { key: "contact_clicks", name: "Contact Clicks", color: "hsl(212 60% 70%)" },
  { key: "whatsapp_clicks", name: "WhatsApp Clicks", color: "hsl(355 45% 60%)" },
  { key: "phone_clicks", name: "Phone Clicks", color: "hsl(44 46% 80%)" },
  { key: "email_clicks", name: "Email Clicks", color: "hsl(265 45% 70%)" },
];

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const monthTitle = (key) => {
  if (!key) return "—";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
};
const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds))) return "—";
  const value = Math.round(Number(seconds));
  return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
};
const changePercent = (current, previous) => {
  if (previous == null || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const zeroSummary = () => ({
  total_visits: 0,
  average_time_on_page: 0,
  email_clicks: 0,
  whatsapp_clicks: 0,
  phone_clicks: 0,
  contact_clicks: 0,
  traffic_source: [],
  device_type: [],
  location: [],
});

function normalizeMonths(response) {
  return (response?.months || []).map((month) => {
    const detail = month.data || {};
    const summary = detail.summary || {};
    const date = new Date(month.start_date || detail.date_start);
    const monthNumber = Number(month.month_number) || date.getUTCMonth() + 1;
    const year = Number.isNaN(date.getTime())
      ? new Date().getFullYear()
      : date.getUTCFullYear() + (monthNumber === 1 && date.getUTCMonth() === 11 ? 1 : 0);
    return {
      month: `${year}-${String(monthNumber).padStart(2, "0")}`,
      label: month.month_name || monthTitle(`${year}-${String(monthNumber).padStart(2, "0")}`),
      total_visits: Number(summary.total_visits) || 0,
      average_time_on_page: Number(summary.average_time_on_page) || 0,
      email_clicks: Number(summary.email_clicks) || 0,
      whatsapp_clicks: Number(summary.whatsapp_clicks) || 0,
      phone_clicks: Number(summary.phone_clicks) || 0,
      contact_clicks: (Number(summary.email_clicks) || 0) + (Number(summary.whatsapp_clicks) || 0) + (Number(summary.phone_clicks) || 0),
      traffic_source: detail.traffic_source || [],
      device_type: detail.device_type || [],
      location: detail.location || [],
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
}

function aggregate(months, key, labelField) {
  const totals = new Map();
  months.forEach((month) => (month[key] || []).forEach((row) => {
    const label = row[labelField] || "Unknown";
    totals.set(label, (totals.get(label) || 0) + (Number(row.visits) || 0));
  }));
  return [...totals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export default function Dashboard() {
  const now = new Date();
  const initialTo = monthKey(now);
  const initialFrom = monthKey(new Date(now.getFullYear(), now.getMonth() - 8, 1));
  const [filter, setFilter] = useState({ mode: "range", from: initialFrom, to: initialTo, specific: [] });
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [lineKeys, setLineKeys] = useState(["contact_clicks", "whatsapp_clicks", "phone_clicks", "email_clicks"]);
  const [barKeys, setBarKeys] = useState(["total_visits"]);
  const [areaKeys, setAreaKeys] = useState(["total_visits", "contact_clicks"]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (filter.mode === "specific" && filter.specific.length === 0) {
        setMonths([]);
        setLoading(false);
        setError("");
        return;
      }
      if (filter.mode === "range" && (!filter.from || !filter.to)) {
        setMonths([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = filter.mode === "specific"
          ? await getDashboardSpecificMonths(filter.specific.map((key) => {
              const [year, month_number] = key.split("-").map(Number);
              return { year, month_number };
            }))
          : await getDashboardRange(...[filter.from, filter.to].sort());
        if (active) setMonths(normalizeMonths(response));
      } catch (cause) {
        if (active) setError(cause.message || "Could not load analytics data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [filter.mode, filter.from, filter.to, filter.specific, retryKey]);

  const monthKeys = useMemo(() => {
    const keys = new Set(months.map(({ month }) => month));
    const cursor = new Date(initialFrom + "-01T00:00:00");
    const end = new Date(initialTo + "-01T00:00:00");
    for (let date = new Date(cursor); date <= end; date.setMonth(date.getMonth() + 1)) keys.add(monthKey(date));
    return [...keys].sort();
  }, [months, initialFrom, initialTo]);
  const current = months.at(-1) || zeroSummary();
  const previous = months.at(-2) || null;
  const chartData = months.map((month) => ({ ...month, month: monthTitle(month.month) }));
  const trafficData = useMemo(() => aggregate(months, "traffic_source", "traffic_source"), [months]);
  const deviceData = useMemo(() => aggregate(months, "device_type", "device_type"), [months]);
  const locationData = useMemo(() => aggregate(months, "location", "location"), [months]);
  const toggle = (setter) => (key) => setter((previousKeys) => previousKeys.includes(key)
    ? previousKeys.filter((item) => item !== key)
    : [...previousKeys, key]);

  const exportCsv = () => {
    const rows = [
      ["Month", "Visits", "Average time on page (seconds)", "Contact clicks", "WhatsApp clicks", "Phone clicks", "Email clicks"],
      ...months.map((row) => [row.month, row.total_visits, row.average_time_on_page, row.contact_clicks, row.whatsapp_clicks, row.phone_clicks, row.email_clicks]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `safe-way-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Visits", value: current.total_visits.toLocaleString(), delta: changePercent(current.total_visits, previous?.total_visits), accent: true },
    { label: "Avg. Time on Page", value: formatDuration(current.average_time_on_page), delta: changePercent(current.average_time_on_page, previous?.average_time_on_page) },
    { label: "Contact Clicks", value: current.contact_clicks.toLocaleString(), delta: changePercent(current.contact_clicks, previous?.contact_clicks) },
    { label: "WhatsApp Clicks", value: current.whatsapp_clicks.toLocaleString(), delta: changePercent(current.whatsapp_clicks, previous?.whatsapp_clicks) },
    { label: "Phone Clicks", value: current.phone_clicks.toLocaleString(), delta: changePercent(current.phone_clicks, previous?.phone_clicks) },
    { label: "Email Clicks", value: current.email_clicks.toLocaleString(), delta: changePercent(current.email_clicks, previous?.email_clicks) },
  ];

  if (loading && !months.length) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Loading analytics</span></div>;

  return (
    <div className="mx-auto max-w-[1500px] p-6 md:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary/90">{months.length ? `${months.at(-1).label} · Latest in selection` : "Live API data"}</p>
          <h1 className="mt-1 font-display text-3xl text-foreground md:text-4xl">Analytics Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Safe Way site engagement, loaded directly from your analytics API.</p>
        </div>
        <button onClick={exportCsv} disabled={!months.length} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"><Download className="h-4 w-4" /> Export CSV</button>
      </header>

      <div className="mb-8">
        <FilterBar months={monthKeys} value={filter} onChange={setFilter} />
        <p className="mt-2 text-xs text-muted-foreground">Showing {months.length} month{months.length === 1 ? "" : "s"} · Visits represent recorded user-visit events.</p>
      </div>

      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><div className="flex-1"><p className="font-medium text-foreground">Analytics API request failed</p><p className="mt-1 text-muted-foreground">{error}</p></div><button onClick={() => setRetryKey((key) => key + 1)} aria-label="Retry" className="rounded p-1 hover:bg-secondary"><RefreshCw className="h-4 w-4" /></button></div>}
      {loading && <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Updating selected period…</div>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="xl:col-span-2"><ChartCard title="Engagement Comparison" subtitle="Monthly visit and contact trends for the selected period" type="line" data={chartData} metrics={METRICS} selectedKeys={lineKeys} onToggleMetric={toggle(setLineKeys)} height={320} /></div>
        <ChartCard title="Monthly Breakdown" subtitle="Side-by-side monthly metrics" type="bar" data={chartData} metrics={METRICS} selectedKeys={barKeys} onToggleMetric={toggle(setBarKeys)} />
        <ChartCard title="Volume Trend" subtitle="Monthly trends for selected metrics" type="area" data={chartData} metrics={METRICS} selectedKeys={areaKeys} onToggleMetric={toggle(setAreaKeys)} />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl text-foreground">Audience Breakdown</h2><span className="ml-2 text-xs text-muted-foreground">For selected period</span></div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BreakdownChart title="Traffic Sources" subtitle="Where your visitors came from" data={trafficData} height={300} />
          <BreakdownChart title="Device Types" subtitle="What your visitors browsed on" data={deviceData} height={300} />
        </div>
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-display text-lg"><MapPin className="h-4 w-4 text-primary" />Visitor Locations</h3><p className="mt-0.5 text-xs text-muted-foreground">Visit distribution by recorded location</p></div><span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-primary/80">{locationData.reduce((sum, row) => sum + row.count, 0).toLocaleString()} total · {locationData.length} regions</span></div>
          {locationData.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{locationData.slice(0, 12).map((row) => <div key={row.label} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"><span className="truncate text-muted-foreground">{row.label}</span><strong className="ml-3 text-foreground">{row.count.toLocaleString()}</strong></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No location data for this period.</p>}
        </div>
      </section>
      <footer className="mt-10 flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5 text-primary/70" />Safe Way Analytics · internal dashboard · live backend data</footer>
    </div>
  );
}
