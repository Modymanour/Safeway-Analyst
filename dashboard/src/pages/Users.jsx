import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Plus, ShieldCheck, UserRound, Users as UsersIcon } from "lucide-react";
import { createDashboardUser, getDashboardUsers } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";

const PAGE_SIZE = 10;
const emptyForm = { username: "", email: "", password: "", role: "user" };

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDashboardUsers(page, PAGE_SIZE);
      setResult(response || { data: [], total: 0, totalPages: 0 });
    } catch (cause) {
      setError(cause.message || "Could not load dashboard users.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadUsers(); }, [loadUsers, reloadKey]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await createDashboardUser({ username: form.username.trim(), email: form.email.trim(), password: form.password }, form.role);
      setNotice(`${form.role === "admin" ? "Administrator" : "User"} account created successfully.`);
      setForm(emptyForm);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause.message || "Could not create the account.");
    } finally {
      setSaving(false);
    }
  };

  const users = result?.data || [];
  const totalPages = Math.max(1, Number(result?.totalPages) || 1);

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary/90">Access Management</p>
        <h1 className="mt-1 font-display text-3xl text-foreground md:text-4xl">Dashboard Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">View the accounts with access to Safe Way analytics.</p>
      </header>

      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><p>{error}</p></div>}
      {notice && <div role="status" className="mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">{notice}</div>}

      {isAdmin && <section className="mb-7 rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="h-5 w-5" /></div>
          <div><h2 className="font-display text-xl">Create an account</h2><p className="text-sm text-muted-foreground">Add a dashboard user or another administrator.</p></div>
        </div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Username<input required maxLength={100} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5" placeholder="Alex Morgan" /></label>
          <label className="space-y-2 text-sm font-medium">Email address<input required type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5" placeholder="alex@example.com" /></label>
          <label className="space-y-2 text-sm font-medium">Temporary password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5" placeholder="Use a strong password" /><span className="block text-xs font-normal text-muted-foreground">8–128 characters with uppercase, lowercase, a number, and one of $ @ # %.</span></label>
          <label className="space-y-2 text-sm font-medium">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5"><option value="user">User</option><option value="admin">Administrator</option></select><span className="block text-xs font-normal text-muted-foreground">Administrator accounts can create additional accounts.</span></label>
          <div className="md:col-span-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Creating…" : "Create account"}</button></div>
        </form>
      </section>}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><UsersIcon className="h-4 w-4" /></div><div><h2 className="font-display text-lg">Accounts</h2><p className="text-xs text-muted-foreground">{Number(result?.total) || 0} total</p></div></div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-medium md:px-6">User</th><th className="px-5 py-3 font-medium">Email</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Created</th></tr></thead>
            <tbody className="divide-y divide-border">
              {!loading && users.map((account) => <tr key={account.id} className="hover:bg-secondary/20"><td className="px-5 py-4 md:px-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span><span className="font-medium">{account.username}</span>{account.id === user?.id && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">You</span>}</div></td><td className="px-5 py-4 text-muted-foreground">{account.email}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs capitalize"><ShieldCheck className={`h-3.5 w-3.5 ${account.role === "admin" ? "text-primary" : "text-muted-foreground"}`} />{account.role}</span></td><td className="px-5 py-4 text-muted-foreground">{account.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}</td></tr>)}
              {!loading && users.length === 0 && <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-muted-foreground">No user accounts found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm md:px-6">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} aria-label="Previous page" className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading} aria-label="Next page" className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div>
        </div>
      </section>
      {!isAdmin && <p className="mt-4 text-xs text-muted-foreground">Only administrators can create dashboard accounts.</p>}
    </div>
  );
}
