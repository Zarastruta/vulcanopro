import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/calc";
import { OS_STATUSES, PRIORITIES, type OsStatus, type Priority } from "@/integrations/supabase/types";
import { StatusChip, PriorityChip } from "./_authenticated.index";
import { Plus, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/os/")({
  component: OsListPage,
});

function OsListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPriority, setFilterPriority] = useState<string>("todos");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["service-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(name), team_members(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); toast.success("OS excluída"); },
    onError: (e: any) => toast.error(e.message),
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  };

  const filtered = orders.filter((o: any) => {
    if (filterStatus !== "todos" && o.status !== filterStatus) return false;
    if (filterPriority !== "todos" && o.priority !== filterPriority) return false;
    return true;
  });

  const payColor: Record<string, string> = {
    pendente: "text-muted-foreground", parcial: "text-yellow-300", pago: "text-emerald-400",
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">Gestão</p>
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.filter((o: any) => o.status !== "Finalizado").length} ativas de {orders.length} no total</p>
        </div>
        <Link to="/os/$id" params={{ id: "nova" }}
          className="inline-flex items-center gap-2 bg-orange text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:opacity-90">
          <Plus className="w-4 h-4" /> Nova OS
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5 bg-surface border border-border rounded-lg px-4 py-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-orange">
          <option value="todos">Todos os status</option>
          {OS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="bg-input border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-orange">
          <option value="todos">Todas as prioridades</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus !== "todos" || filterPriority !== "todos") && (
          <button onClick={() => { setFilterStatus("todos"); setFilterPriority("todos"); }}
            className="text-xs text-muted-foreground hover:text-orange transition">Limpar</button>
        )}
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma OS encontrada.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Pgto</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o: any) => {
                  const dias = daysLeft(o.deadline);
                  const atrasada = dias !== null && dias < 0 && o.status !== "Finalizado";
                  return (
                    <tr key={o.id} className="hover:bg-surface-2 group">
                      <td className="px-4 py-3 font-mono text-xs text-orange">{o.code}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <Link to="/os/$id" params={{ id: o.id }} className="font-medium hover:text-orange truncate block">
                          {o.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{(o.clients as any)?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{(o.team_members as any)?.name ?? "—"}</td>
                      <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                      <td className="px-4 py-3"><PriorityChip p={o.priority} /></td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono">
                          {o.deadline ? new Date(o.deadline + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </div>
                        {dias !== null && o.status !== "Finalizado" && (
                          <div className={`text-[10px] ${atrasada ? "text-destructive" : dias <= 3 ? "text-orange" : "text-muted-foreground"}`}>
                            {atrasada ? `${Math.abs(dias)}d atraso` : dias === 0 ? "hoje" : `em ${dias}d`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular font-semibold">{brl(o.value)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono ${payColor[o.payment_status] ?? ""}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end">
                          <button
                            onClick={() => confirm(`Excluir ${o.code}?`) && del.mutate(o.id)}
                            className="p-1.5 hover:bg-background rounded text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
