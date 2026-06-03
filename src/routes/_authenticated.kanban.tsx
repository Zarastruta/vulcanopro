import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/calc";
import { OS_STATUSES, type OsStatus } from "@/integrations/supabase/types";
import { PriorityChip } from "./_authenticated.index";
import { AlertOctagon, CalendarClock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kanban")({
  component: KanbanPage,
});

const COL_WIDTH = 220;

function KanbanPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dragging, setDragging] = useState<string | null>(null);
  const [filterResp, setFilterResp] = useState<string>("todos");
  const dragOver = useRef<OsStatus | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["service-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(name), team_members(name)")
        .neq("status", "Finalizado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OsStatus }) => {
      const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-orders"] });
      qc.invalidateQueries({ queryKey: ["os-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso + "T12:00:00"); d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  };

  const filtered = filterResp === "todos"
    ? orders
    : orders.filter((o: any) => o.responsible_id === filterResp);

  const colOrders = (status: OsStatus) => filtered.filter((o: any) => o.status === status);

  // Drag and drop (native HTML5)
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent, status: OsStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOver.current = status;
  };
  const onDrop = (e: React.DragEvent, status: OsStatus) => {
    e.preventDefault();
    if (dragging) updateStatus.mutate({ id: dragging, status });
    setDragging(null);
  };

  const VISIBLE = OS_STATUSES.filter(s => s !== "Finalizado");

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">Produção</p>
          <h1 className="text-3xl font-bold">Kanban</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterResp} onChange={e => setFilterResp(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-orange">
            <option value="todos">Todos os responsáveis</option>
            {team.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <span className="font-mono text-xs text-muted-foreground">{filtered.length} OS</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: VISIBLE.length * (COL_WIDTH + 12) }}>
          {VISIBLE.map(status => {
            const cards = colOrders(status);
            return (
              <div key={status}
                onDragOver={e => onDragOver(e, status)}
                onDrop={e => onDrop(e, status)}
                style={{ width: COL_WIDTH }}
                className="flex-shrink-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2 rounded-t-md bg-surface border border-border border-b-0">
                  <span className="text-xs font-semibold">{status}</span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cards.length}</span>
                </div>

                {/* Drop zone */}
                <div className="flex-1 min-h-[300px] p-2 bg-surface/50 border border-border rounded-b-md space-y-2">
                  {cards.map((o: any) => {
                    const dias = daysLeft(o.deadline);
                    const atrasada = dias !== null && dias < 0;
                    return (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={e => onDragStart(e, o.id)}
                        onDragEnd={() => setDragging(null)}
                        className={`bg-surface border rounded-md p-3 cursor-grab active:cursor-grabbing select-none transition-opacity ${
                          dragging === o.id ? "opacity-40" : "opacity-100"
                        } ${atrasada ? "border-destructive/40" : "border-border hover:border-orange/40"}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="font-mono text-[10px] text-orange">{o.code}</span>
                          <PriorityChip p={o.priority} />
                        </div>
                        <Link to="/os/$id" params={{ id: o.id }}
                          onClick={e => e.stopPropagation()}
                          className="block text-xs font-medium leading-snug hover:text-orange mb-2 line-clamp-2">
                          {o.title}
                        </Link>
                        {(o.clients as any)?.name && (
                          <div className="text-[10px] text-muted-foreground truncate mb-2">{(o.clients as any).name}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {o.deadline && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${
                              atrasada ? "bg-destructive/15 text-destructive" :
                              dias !== null && dias <= 3 ? "bg-orange/15 text-orange" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {atrasada ? <AlertOctagon className="w-2.5 h-2.5" /> : <CalendarClock className="w-2.5 h-2.5" />}
                              {atrasada ? `${Math.abs(dias!)}d` : dias === 0 ? "hoje" : `${dias}d`}
                            </span>
                          )}
                          {o.purchases_pending && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-300">
                              <ShoppingCart className="w-2.5 h-2.5" /> compras
                            </span>
                          )}
                        </div>
                        {(o.team_members as any)?.name && (
                          <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50 truncate">
                            👤 {(o.team_members as any).name}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-right mt-1 text-muted-foreground">{brl(o.value)}</div>
                      </div>
                    );
                  })}

                  {cards.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/50 border border-dashed border-border rounded-md">
                      vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
