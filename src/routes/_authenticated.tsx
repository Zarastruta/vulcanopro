import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Package, FileText, Flame, Menu, X,
  Wrench, LayoutKanban, Wallet, UsersRound,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

const NAV = [
  { to: "/",          label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { to: "/os",        label: "Ordens de Serviço", icon: Wrench },
  { to: "/kanban",    label: "Kanban",       icon: LayoutKanban },
  { to: "/orcamentos",label: "Orçamentos",   icon: FileText },
  { to: "/clientes",  label: "Clientes",     icon: Users },
  { to: "/equipe",    label: "Equipe",       icon: UsersRound },
  { to: "/materiais", label: "Materiais",    icon: Package },
  { to: "/caixa",     label: "Fluxo de Caixa", icon: Wallet },
] as const;

function AuthedLayout() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      supabase.auth.signInAnonymously().catch((e) => console.error("anon signin", e));
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile topbar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur border-b border-border">
        <Brand />
        <button onClick={() => setOpen(!open)} className="p-2 rounded-md hover:bg-surface">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-20 h-screen w-60 shrink-0
        bg-surface border-r border-border flex flex-col
        transition-transform lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 hidden lg:flex items-center px-5 border-b border-border">
          <Brand />
        </div>
        <div className="h-14 lg:hidden" />
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: exact ?? false }}
              activeProps={{ className: "bg-surface-2 text-foreground border-l-2 border-orange" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-surface-2 border-l-2 border-transparent" }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-r text-sm font-medium transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">CRM v2.0</p>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-10 bg-black/60 lg:hidden" />}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-md bg-orange flex items-center justify-center glow-orange">
        <Flame className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-sm tracking-tight">VULCANO</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">CRM</div>
      </div>
    </div>
  );
}
