import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/calc";
import { Inp } from "./clientes";
import { Plus, Trash2, X, TrendingUp, TrendingDown, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/caixa")({
  component: CashFlowPage,
});

const ENTRADA_CATS = ["pagamento_os", "adiantamento", "outros"] as const;
const SAIDA_CATS = ["material", "fornecedor", "salario", "servico_externo", "outros"] as const;

type Tx = {
  id: string; type: "entrada" | "saida"; category: string;
  description: string; amount: number; date: string;
  service_order_id: string | null; created_at: string;
  service_orders?: { code: string; title: string } | null;
};

type TxForm = {
  type: "entrada" | "saida"; category: string;
  description: string; amount: string; date: string;
  service_order_id: string;
};

const EMPTY_FORM: TxForm = {
  type: "entrada", category: "outros",
  description: "", amount: "", date: new Date().toISOString().slice(0, 10),
  service_order_id: "",
};

function CashFlowPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<TxForm>(EMPTY_FORM);

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ["cash", user?.id, month],
    enabled: !!user,
    queryFn: async () => {
      const start = `${month}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*, service_orders(code, title)")
        .gte("date", start).lt("date", end)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tx[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["os-select", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_orders").select("id, code, title").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error();
      const { error } = await supabase.from("cash_transactions").insert({
        user_id: user.id, type: form.type, category: form.category,
        description: form.description, amount: Number(form.amount),
        date: form.date, service_order_id: form.service_order_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash"] });
      qc.invalidateQueries({ queryKey: ["cash-dash"] });
      setModal(false); setForm(EMPTY_FORM);
      toast.success("Lançamento registrado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cash"] }); qc.invalidateQueries({ queryKey: ["cash-dash"] }); toast.success("Excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const entradas = txs.filter(t => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const saidas = txs.filter(t => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
  const saldo = entradas - saidas;

  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  const catLabel = (cat: string) => cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">Financeiro</p>
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
            {months.map(m => <option key={m} value={m}>{new Date(m + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</option>)}
          </select>
          <button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}
            className="inline-flex items-center gap-2 bg-orange text-primary-foreground font-semibold px-4 py-2 rounded-md hover:opacity-90">
            <Plus className="w-4 h-4" /> Lançamento
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Entradas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="tabular text-2xl font-bold text-emerald-400">{brl(entradas)}</div>
        </div>
        <div className="bg-surface border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Saídas</span>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <div className="tabular text-2xl font-bold text-destructive">{brl(saidas)}</div>
        </div>
        <div className={`bg-surface border rounded-lg p-4 ${saldo >= 0 ? "border-orange/30" : "border-destructive/30"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Saldo</span>
            <Wallet className={`w-4 h-4 ${saldo >= 0 ? "text-orange" : "text-destructive"}`} />
          </div>
          <div className={`tabular text-2xl font-bold ${saldo >= 0 ? "text-orange" : "text-destructive"}`}>{brl(saldo)}</div>
        </div>
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>
      ) : txs.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum lançamento neste mês.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">OS vinculada</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {txs.map(t => (
                  <tr key={t.id} className="hover:bg-surface-2 group">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px]">
                      <div className="truncate">{t.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        t.type === "entrada" ? "bg-emerald-500/15 text-emerald-300" : "bg-destructive/15 text-destructive"
                      }`}>
                        {catLabel(t.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {t.service_orders ? `${t.service_orders.code}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular font-semibold">
                      <span className={t.type === "entrada" ? "text-emerald-400" : "text-destructive"}>
                        {t.type === "entrada" ? "+" : "-"}{brl(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => confirm("Excluir lançamento?") && del.mutate(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-background rounded text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Novo lançamento</h2>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-surface-2 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              {/* Tipo */}
              <div className="flex gap-2">
                {(["entrada", "saida"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, type: t, category: "outros" })}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition border ${
                      form.type === t
                        ? t === "entrada" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-destructive/20 border-destructive/50 text-destructive"
                        : "border-border text-muted-foreground hover:bg-surface-2"
                    }`}>
                    {t === "entrada" ? "↑ Entrada" : "↓ Saída"}
                  </button>
                ))}
              </div>
              {/* Categoria */}
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Categoria</span>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  {(form.type === "entrada" ? ENTRADA_CATS : SAIDA_CATS).map(c => (
                    <option key={c} value={c}>{catLabel(c)}</option>
                  ))}
                </select>
              </label>
              <Inp label="Descrição *" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} required placeholder="Ex: Pagamento parcial portão Construtora Aurora" />
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Valor (R$) *" type="number" step="0.01" value={form.amount} onChange={(v: string) => setForm({ ...form, amount: v })} required />
                <Inp label="Data" type="date" value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} />
              </div>
              {/* OS vinculada */}
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">OS vinculada (opcional)</span>
                <select value={form.service_order_id} onChange={e => setForm({ ...form, service_order_id: e.target.value })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="">— Nenhuma —</option>
                  {orders.map((o: any) => <option key={o.id} value={o.id}>{o.code} — {o.title}</option>)}
                </select>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-border rounded-md text-sm hover:bg-surface-2">Cancelar</button>
                <button type="submit" disabled={create.isPending || !form.description || !form.amount}
                  className="flex-1 py-2.5 bg-orange text-primary-foreground font-semibold rounded-md hover:opacity-90 disabled:opacity-50">
                  {create.isPending ? "Salvando…" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
