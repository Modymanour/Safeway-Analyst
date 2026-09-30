import { ShieldAlert, Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary/90">Access Management</p>
        <h1 className="mt-1 font-display text-3xl text-foreground md:text-4xl">Dashboard Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage access to Safe Way analytics.</p>
      </header>
      <section className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
        <h2 className="font-display text-xl">User management is not available yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The connected API currently provides no authentication, authorization, invitations, or role-management endpoints. This screen is intentionally read-only rather than exposing account data through an unprotected API.</p>
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/40 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">Implement and protect the backend access-control endpoints before enabling user administration or deploying this dashboard to a public network.</p>
        </div>
      </section>
    </div>
  );
}
