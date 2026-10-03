import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Restoring secure session…</div>;
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (cause) {
      setError(cause.message || "Could not sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12">
      <div className="pointer-events-none absolute -left-32 -top-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-border bg-sidebar/70 p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-display text-xl text-primary">SW</div>
            <div><p className="font-display text-xl">Safe Way</p><p className="text-[10px] uppercase tracking-[0.26em] text-primary">Analytics</p></div>
          </div>
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">A clearer view of every journey</p>
            <h1 className="mt-5 font-display text-5xl leading-tight">Your operations, in focus.</h1>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">Sign in to explore site engagement, understand your audience, and manage access to your analytics workspace.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Protected by Safe Way account access</div>
        </section>
        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-display text-lg text-primary">SW</div>
            <div><p className="font-display text-xl">Safe Way</p><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Analytics</p></div>
          </div>
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Welcome back</p>
            <h2 className="mt-2 font-display text-3xl">Sign in to your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use your Safe Way dashboard credentials to continue.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium" htmlFor="email">Email address
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/70" />
            </label>
            <label className="block space-y-2 text-sm font-medium" htmlFor="password">Password
              <span className="relative block">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</p>}
            <button type="submit" disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Access is provided by your workspace administrator. Contact them if you need an account.</p>
        </section>
      </div>
    </main>
  );
}
