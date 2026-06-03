import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Inp } from "./clientes";
import { Plus, Trash2, Pencil, X, UsersRound, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/equipe")({
  component: TeamPage,
});

const SECTORS = ["Fabricação", "Projeto", "Suprimentos", "Instalação", "Administração", "Comercial"] as const;

type Member = { id: string; name: string; role: string | null; sector: string | null; phone: string | null };

function TeamPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Member> | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("name");
      if (error) throw error;
      return data as Member[];
    },
  });

  // OS count por membro
  const { data: osCounts = [] } = useQuery({
    queryKey: ["team-os-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("responsible_id")
        .neq("status", "Finalizado");
      if (error) throw error;
      return data ?? [];
    },
  });

  const osCount = (id: string) => osCounts.filter((o: any) => o.responsible_id === id).length;

  const save = useMutation({
    mutationFn: async (m: Partial<Member>) => {
      if (!user) throw new Error();
      const payload = { name: m.name!, role: m.role, sector: m.sector, phone: m.phone };
      if (m.id) {
        const { error } = await supabase.from("team_members").update(payload).eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_members").insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team"] }); setEditing(null); toast.success("Membro salvo"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team"] }); toast.success("Membro removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  const sectorColor: Record<string, string> = {
    Fabricação: "bg-orange/15 text-orange",
    Projeto: "bg-violet-500/15 text-violet-300",
    Suprimentos: "bg-yellow-500/15 text-yellow-300",
    Instalação: "bg-blue-500/15 text-blue-300",
    Administração: "bg-zinc-500/15 text-zinc-300",
    Comercial: "bg-emerald-500/15 text-emerald-300",
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">Pessoas</p>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} membro{members.length !== 1 ? "s" : ""} cadastrado{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 bg-orange text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:opacity-90">
          <Plus className="w-4 h-4" /> Novo membro
        </button>
      </div>

      {members.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <UsersRound className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => {
            const count = osCount(m.id);
            const initials = m.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
            return (
              <div key={m.id} className="bg-surface border border-border rounded-lg p-5 hover:border-orange/30 transition group">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center text-orange font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                    {m.role && <div className="text-xs text-muted-foreground">{m.role}</div>}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                    <button onClick={() => setEditing(m)} className="p-1.5 hover:bg-surface-2 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => confirm(`Remover ${m.name}?`) && del.mutate(m.id)} className="p-1.5 hover:bg-surface-2 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {m.sector && (
                    <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded ${sectorColor[m.sector] ?? "bg-muted text-muted-foreground"}`}>
                      {m.sector}
                    </span>
                  )}
                  {m.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {m.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-2">
                    <span className="text-xs text-muted-foreground">OS ativas</span>
                    <span className={`font-mono text-sm font-bold ${count > 0 ? "text-orange" : "text-muted-foreground"}`}>{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editing.id ? "Editar membro" : "Novo membro"}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-surface-2 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
              <Inp label="Nome *" value={editing.name ?? ""} onChange={(v: string) => setEditing({ ...editing, name: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Cargo" value={editing.role ?? ""} onChange={(v: string) => setEditing({ ...editing, role: v })} placeholder="Ex: Soldador" />
                <label className="block">
                  <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Setor</span>
                  <select value={editing.sector ?? ""} onChange={e => setEditing({ ...editing, sector: e.target.value || null })}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                    <option value="">— Selecione —</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <Inp label="Telefone" value={editing.phone ?? ""} onChange={(v: string) => setEditing({ ...editing, phone: v })} placeholder="(11) 9xxxx-xxxx" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-border rounded-md text-sm hover:bg-surface-2">Cancelar</button>
                <button type="submit" disabled={save.isPending}
                  className="flex-1 py-2.5 bg-orange text-primary-foreground font-semibold rounded-md hover:opacity-90 disabled:opacity-50">
                  {save.isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
