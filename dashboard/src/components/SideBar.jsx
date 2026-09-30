import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Analytics", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Users", icon: UsersIcon, end: false },
];

export default function Sidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:w-56 lg:w-64">
      <div className="border-b border-sidebar-border px-3 py-5 sm:px-5 sm:py-7">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full overflow-hidden ring-1 ring-primary/40 bg-card shrink-0">
            <span className="flex h-full w-full items-center justify-center font-display text-lg text-primary">SW</span>
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="font-display text-xl tracking-wide text-foreground">Safe Way</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary/90">Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-5 sm:px-3 sm:py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all sm:justify-start sm:px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-2 py-3 sm:px-3 sm:py-4">
        <div className="flex items-center justify-center gap-3 rounded-lg bg-sidebar-accent/60 px-2 py-2.5 sm:justify-start sm:px-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm text-sidebar-foreground">Analytics workspace</p>
            <p className="text-[11px] uppercase tracking-wider text-primary/80">API connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}