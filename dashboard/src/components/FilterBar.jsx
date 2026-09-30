import { CalendarRange, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const monthLabel = (key) => {
  if (!key) return "—";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
};

export default function FilterBar({ months, value, onChange }) {
  const { mode, from, to, specific } = value;
  const setMode = (nextMode) => onChange({ ...value, mode: nextMode });
  const toggleMonth = (month) => {
    const next = new Set(specific);
    if (next.has(month)) next.delete(month);
    else next.add(month);
    onChange({ ...value, specific: [...next].sort() });
  };
  const inView = mode === "range"
    ? months.filter((month) => (!from || month >= from) && (!to || month <= to)).length
    : specific.filter((month) => months.includes(month)).length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-primary" /><span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Period</span></div>
      <div className="inline-flex self-start overflow-hidden rounded-lg border border-border">
        {[["range", "Range"], ["specific", "Specific months"]].map(([key, label], index) => <button key={key} type="button" onClick={() => setMode(key)} className={cn("px-3.5 py-1.5 text-xs font-medium transition-colors", mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground", index && "border-l border-border")}>{label}</button>)}
      </div>
      {mode === "range" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">From<input type="month" value={from} onChange={(event) => onChange({ ...value, from: event.target.value })} className="h-9 w-40 rounded-md border border-input bg-secondary/30 px-2 text-sm text-foreground" /></label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">To<input type="month" value={to} onChange={(event) => onChange({ ...value, to: event.target.value })} className="h-9 w-40 rounded-md border border-input bg-secondary/30 px-2 text-sm text-foreground" /></label>
        </div>
      ) : (
        <details className="group relative">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 text-sm marker:hidden">{specific.length} month{specific.length === 1 ? "" : "s"} selected<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
          <div className="absolute left-0 top-11 z-20 max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
            {months.map((month) => <button key={month} type="button" onClick={() => toggleMonth(month)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-secondary/50"><span className={specific.includes(month) ? "text-foreground" : "text-muted-foreground"}>{monthLabel(month)}</span>{specific.includes(month) && <Check className="h-4 w-4 text-primary" />}</button>)}
            {!months.length && <p className="p-3 text-xs text-muted-foreground">No months available.</p>}
          </div>
        </details>
      )}
      <div className="text-xs text-muted-foreground lg:ml-auto">{inView} month{inView === 1 ? "" : "s"} in view</div>
    </div>
  );
}
