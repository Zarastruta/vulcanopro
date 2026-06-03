import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/calc";
import { OS_STATUSES, PRIORITIES, PAYMENT_STATUSES, type OsStatus, type Priority, type PaymentStatus } from "@/integrations/supabase/types";
import { Inp } from "./clientes";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/os/$id")({
  component: OsEditor,
});

type OsState = {
  id?: string;
  client_id: string | null;
  quote_id: string | null;
  responsible_id: string | null;
  title: string;
  status: OsStatus;
  priority: Priority;
  deadline: string;
  value: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  notes: string;
  purchases_pending: boolean;
};

const EMPTY: OsState = {
  client_id: null, quote_id: null, responsible_id: null,
  title: "", status: "Novo", priority: "Média",
  deadline: "", value: 0, payment_status: "pendente",
  amount_paid: 0, notes: "", purchases_pending: false,
};

function OsEditor() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isNew = id === "nova";
  const [os, setOs] = useState<OsState>(EMPTY);
  const [code, setCode] = useState<string>("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("id, name, role").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes-select", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("id, number, title, status").order("number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: loaded, isLoading } = useQuery({
    queryKey: ["os", id, user?.id],
    enabled: !!user && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (loaded) {
      setCode(loaded.code);
      setOs({
        id: loaded.id,
        client_id: loaded.client_id, quote_id: loaded.quote_id, responsible_id: loaded.responsible_id,
        title: loaded.title, status: loaded.status as OsStatus, priority: loaded.priority as Priority,
        deadline: loaded.deadline ?? "", value: Number(loaded.value),
        payment_status: loaded.payment_status as PaymentStatus,
        amount_paid: Number(loaded.amount_paid), notes: loaded.notes ?? "",
        purchases_pending: loaded.purchases_pending ?? false,
      });
    }
  }, [loaded]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error();
      const payload = {
        client_id: os.client_id, quote_id: os.quote_id, responsible_id: os.responsible_id,
        title: os.title, status: os.status, priority: os.priority,
        deadline: os.deadline || null, value: os.value,
        payment_status: os.payment_status, amount_paid: os.amount_paid,
        notes: os.notes, purchases_pending: os.purchases_pending,
      };
      if (os.id) {
        const { error } = await supabase.from("service_orders").update(payload).eq("id", os.id);
        if (error) throw error;
        return os.id;
      } else {
        const { data: codeData, error: codeErr } = await supabase.rpc("next_os_code", { p_user_id: user.id });
        if (codeErr) throw codeErr;
        const newCode = codeData as string;
        const { data, error } = await supabase.from("service_orders")
          .insert({ ...payload, user_id: user.id, code: newCode })
          .select("id, code").single();
        if (error) throw error;
        setCode(data!.code);
        setOs(prev => ({ ...prev, id: data!.id }));
        return data!.id;
      }
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["service-orders"] });
      qc.invalidateQueries({ queryKey: ["os-dashboard"] });
      toast.success("OS salva");
      if (isNew) router.navigate({ to: "/os/$id", params: { id: newId } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isNew && isLoading) {
    return <div className="p-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>;
  }

  const linked = os.quote_id ? quotes.find((q: any) => q.id === os.quote_id) : null;

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <button onClick={() => router.history.back()}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-orange uppercase mb-1">
            {code || "Nova Ordem"}
          </p>
          <input value={os.title} onChange={e => setOs({ ...os, title: e.target.value })}
            placeholder="Título da OS…"
            className="text-3xl font-bold bg-transparent border-0 focus:outline-none w-full max-w-lg placeholder:text-muted-foreground/40" />
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending || !os.title}
          className="inline-flex items-center gap-2 bg-orange text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:opacity-90 disabled:opacity-50">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Informações */}
          <Section title="Informações">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Cliente">
                <select value={os.client_id ?? ""} onChange={e => setOs({ ...os, client_id: e.target.value || null })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="">— Sem cliente —</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Responsável">
                <select value={os.responsible_id ?? ""} onChange={e => setOs({ ...os, responsible_id: e.target.value || null })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="">— Nenhum —</option>
                  {team.map((m: any) => <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ""}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <Field label="Status">
                <select value={os.status} onChange={e => setOs({ ...os, status: e.target.value as OsStatus })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  {OS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Prioridade">
                <select value={os.priority} onChange={e => setOs({ ...os, priority: e.target.value as Priority })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Inp label="Prazo" type="date" value={os.deadline} onChange={(v: string) => setOs({ ...os, deadline: v })} />
            </div>
          </Section>

          {/* Financeiro */}
          <Section title="Financeiro">
            <div className="grid sm:grid-cols-3 gap-3">
              <Inp label="Valor total (R$)" type="number" step="0.01" value={os.value} onChange={(v: string) => setOs({ ...os, value: Number(v) || 0 })} />
              <Field label="Status pagamento">
                <select value={os.payment_status} onChange={e => setOs({ ...os, payment_status: e.target.value as PaymentStatus })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  {PAYMENT_STATUSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Inp label="Valor recebido (R$)" type="number" step="0.01" value={os.amount_paid} onChange={(v: string) => setOs({ ...os, amount_paid: Number(v) || 0 })} />
            </div>
            <div className="mt-3 flex items-center gap-3 p-3 bg-background/50 rounded-md border border-border">
              <input type="checkbox" id="purch" checked={os.purchases_pending}
                onChange={e => setOs({ ...os, purchases_pending: e.target.checked })}
                className="w-4 h-4 accent-orange" />
              <label htmlFor="purch" className="text-sm cursor-pointer">Compras pendentes (aguardando suprimentos)</label>
            </div>
          </Section>

          {/* Orçamento vinculado */}
          <Section title="Orçamento vinculado">
            <Field label="Orçamento de origem">
              <select value={os.quote_id ?? ""} onChange={e => setOs({ ...os, quote_id: e.target.value || null })}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange">
                <option value="">— Nenhum —</option>
                {quotes.map((q: any) => <option key={q.id} value={q.id}>#{String(q.number).padStart(4, "0")} — {q.title}</option>)}
              </select>
            </Field>
            {linked && (
              <Link to="/orcamentos/$id" params={{ id: linked.id }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir orçamento #{String((linked as any).number).padStart(4, "0")}
              </Link>
            )}
          </Section>

          {/* Observações */}
          <Section title="Observações">
            <label className="block">
              <textarea value={os.notes} onChange={e => setOs({ ...os, notes: e.target.value })} rows={4}
                placeholder="Anotações, detalhes técnicos, pendências…"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange resize-none" />
            </label>
          </Section>
        </div>

        {/* Resumo lateral */}
        <div className="self-start sticky top-6">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-mono text-[10px] tracking-widest text-orange uppercase">Resumo</p>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Row label="Valor total" value={brl(os.value)} bold />
              <Row label="Recebido" value={brl(os.amount_paid)} />
              <Row label="A receber" value={brl(os.value - os.amount_paid)} accent />
            </div>
            {os.id && (
              <div className="px-5 pb-5">
                <Link to="/kanban"
                  className="w-full block text-center text-xs border border-border rounded-md py-2 hover:bg-surface-2 transition">
                  Ver no Kanban →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular ${bold ? "font-semibold" : ""} ${accent ? "text-orange" : ""}`}>{value}</span>
    </div>
  );
}
