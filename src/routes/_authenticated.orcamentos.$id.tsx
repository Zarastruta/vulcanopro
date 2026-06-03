import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Inp } from "./clientes";
import { computeQuote, brl, itemTotal, type QuoteItem, type QuoteCosts } from "@/lib/calc";
import { generateQuotePDF } from "@/lib/pdf";
import { ArrowLeft, Plus, Trash2, Save, FileDown, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orcamentos/$id")({
  component: QuoteEditor,
});

type QuoteState = {
  id?: string; number?: number;
  client_id: string | null; title: string; status: string;
  service_description: string; payment_conditions: string;
  deadline: string; notes: string; costs: QuoteCosts; items: QuoteItem[];
};

const EMPTY: QuoteState = {
  client_id: null, title: "Orçamento de fabricação", status: "rascunho",
  service_description: "", payment_conditions: "50% na assinatura, 50% na entrega.",
  deadline: "30 dias úteis após aprovação.", notes: "",
  costs: { labor_cost: 0, transport_cost: 0, painting_cost: 0, galvanizing_cost: 0, installation_cost: 0, profit_margin_pct: 20 },
  items: [],
};

function QuoteEditor() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isNew = id === "novo";
  const [q, setQ] = useState<QuoteState>(EMPTY);
  const [prevStatus, setPrevStatus] = useState<string>("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, phone, email, address, whatsapp").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: loaded, isLoading } = useQuery({
    queryKey: ["quote", id, user?.id],
    enabled: !!user && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*, quote_items(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (loaded) {
      const s: QuoteState = {
        id: loaded.id, number: loaded.number,
        client_id: loaded.client_id, title: loaded.title, status: loaded.status,
        service_description: loaded.service_description ?? "",
        payment_conditions: loaded.payment_conditions ?? "",
        deadline: loaded.deadline ?? "", notes: loaded.notes ?? "",
        costs: {
          labor_cost: Number(loaded.labor_cost), transport_cost: Number(loaded.transport_cost),
          painting_cost: Number(loaded.painting_cost), galvanizing_cost: Number(loaded.galvanizing_cost),
          installation_cost: Number(loaded.installation_cost),
          profit_margin_pct: Number(loaded.profit_margin_pct),
        },
        items: (loaded.quote_items ?? []).sort((a: any, b: any) => a.position - b.position).map((it: any) => ({
          id: it.id, service_name: it.service_name, material_description: it.material_description,
          quantity: Number(it.quantity), unit_price: Number(it.unit_price),
        })),
      };
      setQ(s);
      setPrevStatus(loaded.status);
    }
  }, [loaded]);

  const totals = computeQuote(q.items, q.costs);
  const client = clients.find((c: any) => c.id === q.client_id) ?? null;

  // Auto-create OS when quote is approved
  const createOs = useMutation({
    mutationFn: async (quoteId: string) => {
      if (!user) throw new Error();
      // Check if OS already exists for this quote
      const { data: existing } = await supabase.from("service_orders").select("id").eq("quote_id", quoteId).maybeSingle();
      if (existing) return null; // already exists
      const { data: codeData, error: codeErr } = await supabase.rpc("next_os_code", { p_user_id: user.id });
      if (codeErr) throw codeErr;
      const { data, error } = await supabase.from("service_orders").insert({
        user_id: user.id, client_id: q.client_id, quote_id: quoteId,
        code: codeData as string, title: q.title,
        status: "Novo", priority: "Média",
        value: totals.total,
        payment_status: "pendente", amount_paid: 0,
        notes: q.service_description,
      }).select("id, code").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: ["service-orders"] });
        qc.invalidateQueries({ queryKey: ["os-dashboard"] });
        toast.success(`OS ${data.code} criada automaticamente!`, {
          action: { label: "Abrir OS", onClick: () => router.navigate({ to: "/os/$id", params: { id: data.id } }) },
        });
      }
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error();
      const payload = {
        client_id: q.client_id, title: q.title, status: q.status,
        service_description: q.service_description, payment_conditions: q.payment_conditions,
        deadline: q.deadline, notes: q.notes,
        labor_cost: q.costs.labor_cost, transport_cost: q.costs.transport_cost,
        painting_cost: q.costs.painting_cost, galvanizing_cost: q.costs.galvanizing_cost,
        installation_cost: q.costs.installation_cost,
        profit_margin_pct: q.costs.profit_margin_pct,
      };
      let quoteId = q.id;
      if (quoteId) {
        const { error } = await supabase.from("quotes").update(payload).eq("id", quoteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("quotes").insert({ ...payload, user_id: user.id }).select("id, number").single();
        if (error) throw error;
        quoteId = data!.id;
        setQ(prev => ({ ...prev, id: data!.id, number: data!.number }));
      }
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      if (q.items.length) {
        const rows = q.items.map((it, i) => ({
          user_id: user.id, quote_id: quoteId!,
          service_name: it.service_name, material_description: it.material_description,
          quantity: Number(it.quantity) || 0, unit_price: Number(it.unit_price) || 0, position: i,
        }));
        const { error } = await supabase.from("quote_items").insert(rows);
        if (error) throw error;
      }
      return quoteId!;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-list"] });
      qc.invalidateQueries({ queryKey: ["quote", newId] });
      toast.success("Orçamento salvo");
      if (isNew) router.navigate({ to: "/orcamentos/$id", params: { id: newId } });
      // Auto-create OS if just approved
      if (q.status === "aprovado" && prevStatus !== "aprovado") {
        createOs.mutate(newId);
      }
      setPrevStatus(q.status);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportPdf = () => {
    if (!q.number) { toast.error("Salve o orçamento antes de exportar"); return; }
    generateQuotePDF({
      number: q.number, title: q.title,
      service_description: q.service_description,
      payment_conditions: q.payment_conditions,
      deadline: q.deadline, notes: q.notes,
      created_at: new Date().toISOString(),
      client: client ? { name: client.name, phone: (client as any).phone, email: (client as any).email, address: (client as any).address, whatsapp: (client as any).whatsapp } : null,
      items: q.items, costs: q.costs,
    });
  };

  if (!isNew && isLoading) {
    return <div className="p-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>;
  }

  const addItem = () => setQ({ ...q, items: [...q.items, { service_name: "", material_description: "", quantity: 1, unit_price: 0 }] });
  const upItem = (i: number, patch: Partial<QuoteItem>) =>
    setQ({ ...q, items: q.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  const rmItem = (i: number) => setQ({ ...q, items: q.items.filter((_, idx) => idx !== i) });

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <button onClick={() => router.history.back()} className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">
            {q.number ? `Orçamento #${String(q.number).padStart(4, "0")}` : "Novo orçamento"}
          </p>
          <input value={q.title} onChange={e => setQ({ ...q, title: e.target.value })}
            className="text-3xl font-bold bg-transparent border-0 focus:outline-none w-full max-w-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="inline-flex items-center gap-2 bg-orange text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:opacity-90 disabled:opacity-50">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
          <button onClick={exportPdf} disabled={!q.number}
            className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 rounded-md hover:bg-surface-2 disabled:opacity-50">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          {q.status === "aprovado" && q.id && (
            <Link to="/os"
              className="inline-flex items-center gap-2 border border-orange/30 text-orange px-4 py-2.5 rounded-md hover:bg-orange/10 text-sm">
              <Wrench className="w-4 h-4" /> Ver OS
            </Link>
          )}
        </div>
      </div>

      {/* Aviso aprovação */}
      {q.status === "aprovado" && prevStatus !== "aprovado" && (
        <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 flex items-center gap-2">
          <Wrench className="w-4 h-4 shrink-0" />
          Ao salvar, uma OS será criada automaticamente para este orçamento aprovado.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Informações">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Cliente</span>
                <select value={q.client_id ?? ""} onChange={e => setQ({ ...q, client_id: e.target.value || null })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="">— Sem cliente —</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Status</span>
                <select value={q.status} onChange={e => setQ({ ...q, status: e.target.value })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado ✓</option>
                  <option value="recusado">Recusado</option>
                </select>
              </label>
            </div>
            <label className="block mt-3">
              <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Descrição do serviço</span>
              <textarea value={q.service_description} onChange={e => setQ({ ...q, service_description: e.target.value })} rows={3}
                placeholder="Descreva o escopo da fabricação…"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange" />
            </label>
          </Section>

          <Section title="Itens"
            action={<button onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:opacity-80"><Plus className="w-3.5 h-3.5" /> Adicionar item</button>}>
            {q.items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum item. Clique em "Adicionar item".</div>
            ) : (
              <div className="space-y-2">
                {q.items.map((it, i) => (
                  <div key={i} className="bg-background border border-border rounded-md p-3">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 sm:col-span-5">
                        <Inp label="Serviço" value={it.service_name} onChange={(v: string) => upItem(i, { service_name: v })} placeholder="Ex: Portão basculante" />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <Inp label="Qtd" type="number" step="0.01" value={it.quantity} onChange={(v: string) => upItem(i, { quantity: Number(v) })} />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <Inp label="V. Unit" type="number" step="0.01" value={it.unit_price} onChange={(v: string) => upItem(i, { unit_price: Number(v) })} />
                      </div>
                      <div className="col-span-9 sm:col-span-2 flex flex-col">
                        <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Total</span>
                        <div className="tabular text-sm font-semibold py-2">{brl(itemTotal(it))}</div>
                      </div>
                      <div className="col-span-3 sm:col-span-1 flex items-end justify-end">
                        <button onClick={() => rmItem(i)} className="p-2 text-destructive hover:bg-surface-2 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="col-span-12">
                        <Inp label="Material" value={it.material_description ?? ""} onChange={(v: string) => upItem(i, { material_description: v })} placeholder='Metalon 30x30 1.20mm, chapa 1/8"…' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Custos adicionais">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CostInp label="Mão de obra" value={q.costs.labor_cost} onChange={v => setQ({ ...q, costs: { ...q.costs, labor_cost: v } })} />
              <CostInp label="Transporte" value={q.costs.transport_cost} onChange={v => setQ({ ...q, costs: { ...q.costs, transport_cost: v } })} />
              <CostInp label="Pintura" value={q.costs.painting_cost} onChange={v => setQ({ ...q, costs: { ...q.costs, painting_cost: v } })} />
              <CostInp label="Galvanização" value={q.costs.galvanizing_cost} onChange={v => setQ({ ...q, costs: { ...q.costs, galvanizing_cost: v } })} />
              <CostInp label="Instalação" value={q.costs.installation_cost} onChange={v => setQ({ ...q, costs: { ...q.costs, installation_cost: v } })} />
              <CostInp label="Margem (%)" value={q.costs.profit_margin_pct} onChange={v => setQ({ ...q, costs: { ...q.costs, profit_margin_pct: v } })} />
            </div>
          </Section>

          <Section title="Condições">
            <div className="space-y-3">
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Pagamento</span>
                <textarea value={q.payment_conditions} onChange={e => setQ({ ...q, payment_conditions: e.target.value })} rows={2}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange" />
              </label>
              <Inp label="Prazo" value={q.deadline} onChange={(v: string) => setQ({ ...q, deadline: v })} />
              <label className="block">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">Observações</span>
                <textarea value={q.notes} onChange={e => setQ({ ...q, notes: e.target.value })} rows={2}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange" />
              </label>
            </div>
          </Section>
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-mono text-[10px] tracking-widest text-orange uppercase">Resumo</p>
              <h3 className="font-bold mt-1">Cálculo final</h3>
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              <Row label="Materiais" value={totals.materialsTotal} />
              <Row label="Extras" value={totals.extras} />
              <Row label="Subtotal" value={totals.subtotal} bold />
              <Row label={`Margem ${q.costs.profit_margin_pct}%`} value={totals.margin} muted />
            </div>
            <div className="bg-background border-t border-border p-5 flex items-baseline justify-between">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Total</span>
              <span className="tabular text-2xl font-bold text-orange">{brl(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CostInp({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <Inp label={label} type="number" step="0.01" value={value} onChange={(v: string) => onChange(Number(v) || 0)} />;
}

function Row({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className={`tabular ${bold ? "font-semibold" : ""}`}>{brl(value)}</span>
    </div>
  );
}
