import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  confirmPasswordReset,
  confirmVerificationCode,
  requestPasswordResetCode,
  requestVerificationCode,
} from "@/lib/auth";

const validPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@#%_-]).{8,128}$/;

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Restoring secure session…</div>;
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
    setOtp("");
    setNewPassword("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        await login(normalizedEmail, password);
        navigate(location.state?.from?.pathname || "/", { replace: true });
      } else if (mode === "verify") {
        await confirmVerificationCode(normalizedEmail, otp.trim());
        setMode("login");
        setPassword("");
        setNotice("Your email is verified. You can now sign in.");
      } else if (mode === "forgot") {
        await requestPasswordResetCode(normalizedEmail);
        setMode("reset");
        setNotice("If an account exists for that address, a reset code has been sent.");
      } else if (mode === "reset") {
        if (!validPassword.test(newPassword)) {
          throw new Error("Use 8–128 characters with uppercase, lowercase, a number, and one of $ @ # % _ -.");
        }
        await confirmPasswordReset(normalizedEmail, otp.trim(), newPassword);
        setMode("login");
        setPassword("");
        setNotice("Your password has been updated. Sign in with your new password.");
      }
    } catch (cause) {
      if (mode === "login" && cause.message?.toLowerCase().includes("not verified")) {
        setMode("verify");
        setNotice("Your account is waiting for email verification. Enter your code or request a fresh one if it expired.");
        setError("");
        return;
      }
      setError(cause.message || "We couldn’t complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await requestVerificationCode(email.trim().toLowerCase());
      setNotice("A new verification code has been sent.");
    } catch (cause) {
      setError(cause.message || "Could not send a new verification code.");
    } finally {
      setSubmitting(false);
    }
  };

  const titles = {
    login: ["Welcome back", "Sign in to your account", "Use your Safe Way dashboard credentials to continue."],
    verify: ["One last step", "Verify your email", `Enter the six-digit code sent to ${email}.`],
    forgot: ["Account recovery", "Forgot your password?", "We’ll email you a one-time password reset code."],
    reset: ["Secure your account", "Choose a new password", `Enter the reset code sent to ${email} and your new password.`],
  };
  const [eyebrow, title, subtitle] = titles[mode];

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
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {mode === "login" && <LockKeyhole className="h-5 w-5" />}
              {mode === "verify" && <Mail className="h-5 w-5" />}
              {(mode === "forgot" || mode === "reset") && <KeyRound className="h-5 w-5" />}
            </div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium" htmlFor="email">Email address
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={mode === "verify" || mode === "reset"} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/70 disabled:opacity-70" />
            </label>

            {mode === "login" && (
              <label className="block space-y-2 text-sm font-medium" htmlFor="password">Password
                <span className="relative block">
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </span>
              </label>
            )}

            {(mode === "verify" || mode === "reset") && (
              <label className="block space-y-2 text-sm font-medium" htmlFor="otp">Six-digit code
                <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-foreground placeholder:text-muted-foreground/50" />
              </label>
            )}

            {mode === "reset" && (
              <label className="block space-y-2 text-sm font-medium" htmlFor="new-password">New password
                <input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Create a strong password" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/70" />
                <span className="block text-xs font-normal text-muted-foreground">Use uppercase, lowercase, a number, and one of $ @ # % _ -.</span>
              </label>
            )}

            {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">{notice}</p>}

            <button type="submit" disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Please wait…" : ({ login: "Sign in", verify: "Verify email", forgot: "Send reset code", reset: "Update password" })[mode]}
              {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-start gap-3 text-sm">
            {mode === "login" && <>
              <button type="button" onClick={() => changeMode("forgot")} className="text-primary hover:underline">Forgot password?</button>
              <button type="button" onClick={() => changeMode("verify")} className="text-primary hover:underline">Verify a pending account</button>
            </>}
            {mode === "verify" && <>
              <button type="button" disabled={submitting} onClick={resendVerification} className="text-primary hover:underline disabled:opacity-50">Resend verification code</button>
              <button type="button" onClick={() => changeMode("login")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</button>
            </>}
            {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => changeMode(mode === "reset" ? "forgot" : "login")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {mode === "reset" ? "Change email address" : "Back to sign in"}</button>}
          </div>
          <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Access is provided by your workspace administrator. Contact them if you need dashboard access.</p>
        </section>
      </div>
    </main>
  );
}
