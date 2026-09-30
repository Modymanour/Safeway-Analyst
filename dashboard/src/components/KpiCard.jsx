import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export default function KpiCard({ label, value, sub, delta, accent }) {
  const finiteDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = finiteDelta && delta > 0;
  const negative = finiteDelta && delta < 0;
  return (
    <article className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm ${accent ? "border-primary/40" : "border-border"}`}>
      {accent && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none text-foreground">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
      {finiteDelta && <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${positive ? "bg-primary/15 text-primary" : negative ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {positive ? "+" : ""}{delta.toFixed(1)}% vs last month
      </span>}
    </article>
  );
}
