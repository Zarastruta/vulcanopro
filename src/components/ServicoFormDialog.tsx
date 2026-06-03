import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  store,
  useVulcano,
  STATUS_ETAPAS,
  type Prioridade,
  type Servico,
  type ServicoStatus,
} from "@/lib/vulcano-store";

const PRIORIDADES: Prioridade[] = ["Baixa", "Média", "Alta", "Crítica"];

export function ServicoFormDialog({ trigger, servico }: { trigger: ReactNode; servico?: Servico }) {
  const { clientes, equipe } = useVulcano();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clienteId: servico?.clienteId ?? clientes[0]?.id ?? "",
    tipo: servico?.tipo ?? "",
    valor: servico?.valor?.toString() ?? "",
    prazo: servico?.prazo ?? new Date().toISOString().slice(0, 10),
    responsavelId: servico?.responsavelId ?? equipe[0]?.id ?? "",
    prioridade: (servico?.prioridade ?? "Média") as Prioridade,
    status: (servico?.status ?? "Novo") as ServicoStatus,
    observacoes: servico?.observacoes ?? "",
    comprasPendentes: servico?.comprasPendentes ?? false,
  });

  const submit = () => {
    const payload = {
      clienteId: form.clienteId,
      tipo: form.tipo,
      valor: parseFloat(form.valor) || 0,
      prazo: form.prazo,
      responsavelId: form.responsavelId,
      prioridade: form.prioridade,
      status: form.status,
      observacoes: form.observacoes,
      comprasPendentes: form.comprasPendentes,
    };
    if (servico) store.updateServico(servico.id, payload);
    else store.addServico(payload);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {servico ? `Editar ${servico.codigo}` : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Tipo de serviço</Label>
            <Input
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              placeholder="Ex: Guarda-corpo em aço inox"
            />
          </div>

          <div>
            <Label>Cliente</Label>
            <Select
              value={form.clienteId}
              onValueChange={(v) => setForm({ ...form, clienteId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável</Label>
            <Select
              value={form.responsavelId}
              onValueChange={(v) => setForm({ ...form, responsavelId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {equipe.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </div>

          <div>
            <Label>Prazo</Label>
            <Input
              type="date"
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            />
          </div>

          <div>
            <Label>Prioridade</Label>
            <Select
              value={form.prioridade}
              onValueChange={(v) => setForm({ ...form, prioridade: v as Prioridade })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as ServicoStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ETAPAS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>

          <label className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.comprasPendentes}
              onChange={(e) => setForm({ ...form, comprasPendentes: e.target.checked })}
              className="size-4 accent-primary"
            />
            Possui compras pendentes
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!form.tipo || !form.clienteId}>
            {servico ? "Salvar alterações" : "Criar Serviço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
