import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Wrench,
  KanbanSquare,
  Users,
  CheckSquare,
  AlertTriangle,
  HardHat,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { to: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
  { to: "/equipe", label: "Equipe", icon: HardHat },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-forge-gradient">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="size-10 rounded-md bg-gradient-to-br from-primary to-destructive grid place-items-center shadow-forge">
            <Flame className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-lg leading-none tracking-wider uppercase">
              Vulcano
            </div>
            <div className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase mt-0.5">
              OS · Metalúrgica
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-0.5 flex-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary border-l-2 border-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center justify-between">
            <span>SISTEMA</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="mt-1">v1.0.0 — Forge Build</div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-background/60 backdrop-blur px-8 py-5 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-display uppercase tracking-wide">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
