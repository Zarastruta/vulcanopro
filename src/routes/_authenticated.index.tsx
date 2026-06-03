import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/calc";
import { OS_STATUSES, type OsStatus } from "@/integrations/supabase/types";
import {
  Activity, AlertOctagon, CheckCircle2, Banknote,
  ShoppingCart, TrendingUp, Flame, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Dashboard — Vulcano CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["os-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, code, title, status, priority, deadline, value, payment_status, purchases_pending, clients(name), team_members(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, status, profit_margin_pct, labor_cost, transport_cost, painting_cost, galvanizing_cost, installation_cost, quote_items(quantity, unit_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: cashMonth = [] } = useQuery({
    queryKey: ["cash-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setDate(1);
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("type, amount")
        .gte("date", start.toISOString().slice(0, 10));
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  };

  const ativos = orders.filter((o: any) => o.status !== "Finalizado");
  const atrasados = ativos.filter((o: any) => { const d = daysLeft(o.deadline); return d !== null && d < 0; });
  const finalizados = orders.filter((o: any) => o.status === "Finalizado");
  const compras = ativos.filter((o: any) => o.purchases_pending);
  const proximos = [...ativos].filter((o: any) => { const d = daysLeft(o.deadline); return d !== null && d >= 0; })
    .sort((a: any, b: any) => (a.deadline ?? "").localeCompare(b.deadline ?? "")).slice(0, 6);

  const valorEmProd = ativos.reduce((s: number, o: any) => s + Number(o.value), 0);

  const pipeline = OS_STATUSES.map(s => ({
    etapa: s, qtd: orders.filter((o: any) => o.status === s).length,
  }));
  const maxP = Math.max(1, ...pipeline.map(p => p.qtd));

  const totalQuotes = quotes.reduce((s: number, q: any) => {
    const mat = (q.quote_items ?? []).reduce((a: number, i: any) => a + Number(i.quantity) * Number(i.unit_price), 0);
    const ex = Number(q.labor_cost) + Number(q.transport_cost) + Number(q.painting_cost) + Number(q.galvanizing_cost) + Number(q.installation_cost);
    const sub = mat + ex;
    return s + (q.status === "enviado" ? sub + sub * (Number(q.profit_margin_pct) / 100) : 0);
  }, 0);

  const entradas = cashMonth.filter((t: any) => t.type === "entrada").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const saidas = cashMonth.filter((t: any) => t.type === "saida").reduce((s: number, t: any) => s + Number(t.amount), 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">Painel</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface/60">
          <Flame className="w-3.5 h-3.5 text-orange" />
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Stat label="OS Ativas" value={ativos.length} icon={Activity} tone="primary" hint={brl(valorEmProd)} />
        <Stat label="Atrasadas" value={atrasados.length} icon={AlertOctagon} tone="danger" hint={atrasados.length ? "Ação necessária" : "Em dia"} />
        <Stat label="Finalizadas" value={finalizados.length} icon={CheckCircle2} tone="success" />
        <Stat label="Compras Pend." value={compras.length} icon={ShoppingCart} tone="warning" />
        <Stat label="Em negociação" value={brl(totalQuotes)} icon={TrendingUp} />
        <Stat label="Saldo do mês" value={brl(entradas - saidas)} icon={Banknote} tone={entradas >= saidas ? "success" : "danger"} hint={`+${brl(entradas)} / -${brl(saidas)}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Próximos prazos */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold">Próximos prazos</h2>
            <Link to="/os" className="text-xs font-mono text-muted-foreground hover:text-orange flex items-center gap-1">
              VER TODOS <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {proximos.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">Sem prazos próximos.</div>
            )}
            {proximos.map((o: any) => {
              const dias = daysLeft(o.deadline);
              return (
                <Link key={o.id} to="/os/$id" params={{ id: o.id }}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-surface-2 transition">
                  <span className="font-mono text-xs text-orange w-20 shrink-0">{o.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{o.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{(o.clients as any)?.name ?? "—"}</div>
                  </div>
                  <StatusChip status={o.status} />
                  <div className="text-right w-20 shrink-0">
                    <div className="text-sm font-mono">{o.deadline ? new Date(o.deadline + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
                    <div className={`text-[10px] ${dias !== null && dias <= 3 ? "text-orange" : "text-muted-foreground"}`}>
                      {dias === 0 ? "hoje" : dias !== null ? `em ${dias}d` : "—"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange" /> Pipeline
          </h2>
          <div className="space-y-2.5">
            {pipeline.map(p => (
              <div key={p.etapa}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/80">{p.etapa}</span>
                  <span className="font-mono text-muted-foreground">{p.qtd}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-orange/70 transition-all"
                    style={{ width: `${(p.qtd / maxP) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atrasados banner */}
      {atrasados.length > 0 && (
        <div className="mt-5 p-5 bg-destructive/5 border border-destructive/30 rounded-lg">
          <h2 className="font-bold mb-3 flex items-center gap-2 text-destructive">
            <AlertOctagon className="w-5 h-5" /> OS Atrasadas
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {atrasados.map((o: any) => (
              <Link key={o.id} to="/os/$id" params={{ id: o.id }}
                className="p-3 rounded-md border border-destructive/20 bg-surface/60 hover:bg-surface flex items-center gap-3 transition">
                <span className="font-mono text-xs text-destructive w-20 shrink-0">{o.code}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{o.title}</div>
                  <div className="text-xs text-muted-foreground">{(o.clients as any)?.name ?? "—"}</div>
                </div>
                <span className="text-xs font-mono bg-destructive/15 text-destructive px-2 py-1 rounded">
                  {Math.abs(daysLeft(o.deadline) ?? 0)}d atraso
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "default", hint }: {
  label: string; value: string | number; icon: any;
  tone?: "default" | "danger" | "warning" | "success" | "primary"; hint?: string;
}) {
  const cls = { default: "text-foreground", primary: "text-orange", danger: "text-destructive", warning: "text-yellow-400", success: "text-emerald-400" };
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${cls[tone]}`} />
      </div>
      <div className={`tabular text-2xl font-bold ${cls[tone]}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1 truncate">{hint}</div>}
    </div>
  );
}

export function StatusChip({ status }: { status: OsStatus }) {
  const map: Record<OsStatus, string> = {
    Novo: "bg-zinc-500/20 text-zinc-300",
    Medição: "bg-sky-500/20 text-sky-300",
    Projeto: "bg-violet-500/20 text-violet-300",
    Compras: "bg-yellow-500/20 text-yellow-300",
    Fabricação: "bg-orange/20 text-orange",
    Galvanização: "bg-slate-500/20 text-slate-300",
    Pintura: "bg-fuchsia-500/20 text-fuchsia-300",
    Instalação: "bg-blue-500/20 text-blue-300",
    Finalizado: "bg-emerald-500/20 text-emerald-300",
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-1 rounded ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

export function PriorityChip({ p }: { p: string }) {
  const map: Record<string, string> = {
    Crítica: "bg-destructive/20 text-destructive",
    Alta: "bg-orange/20 text-orange",
    Média: "bg-yellow-500/20 text-yellow-300",
    Baixa: "bg-muted text-muted-foreground",
  };
  return <span className={`text-[10px] font-mono px-2 py-1 rounded ${map[p] ?? "bg-muted"}`}>{p}</span>;
}
