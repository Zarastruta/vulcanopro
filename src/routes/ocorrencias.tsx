import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVulcano, store, fmtDate, type Ocorrencia } from "@/lib/vulcano-store";
import { Plus, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/ocorrencias")({
  head: () => ({ meta: [{ title: "Ocorrências — Vulcano OS" }] }),
  component: OcorrenciasPage,
});

const TIPOS: Ocorrencia["tipo"][] = ["Atraso", "Defeito", "Acidente", "Reclamação", "Outro"];

function OcorrenciasPage() {
  const { ocorrencias, servicos } = useVulcano();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    servicoId: string;
    tipo: Ocorrencia["tipo"];
    descricao: string;
    data: string;
    resolvida: boolean;
  }>({
    servicoId: "",
    tipo: "Atraso",
    descricao: "",
    data: new Date().toISOString().slice(0, 10),
    resolvida: false,
  });

  const submit = () => {
    if (!form.descricao) return;
    store.addOcorrencia(form);
    setForm({
      servicoId: "",
      tipo: "Atraso",
      descricao: "",
      data: new Date().toISOString().slice(0, 10),
      resolvida: false,
    });
    setOpen(false);
  };

  const abertas = ocorrencias.filter((o) => !o.resolvida);

  return (
    <AppShell
      title="Ocorrências"
      subtitle={`${abertas.length} abertas · ${ocorrencias.length - abertas.length} resolvidas`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Registrar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-wide">
                Nova Ocorrência
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) => setForm({ ...form, tipo: v as Ocorrencia["tipo"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Serviço (opcional)</Label>
                <Select
                  value={form.servicoId || "_"}
                  onValueChange={(v) => setForm({ ...form, servicoId: v === "_" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">Nenhum</SelectItem>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.codigo} — {s.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submit}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-3">
        {ocorrencias.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground bg-card/80">
            Nenhuma ocorrência registrada.
          </Card>
        )}
        {ocorrencias.map((o) => {
          const servico = servicos.find((s) => s.id === o.servicoId);
          return (
            <Card
              key={o.id}
              className={`p-4 flex items-start gap-4 bg-card/80 ${o.resolvida ? "opacity-60" : ""}`}
            >
              <div
                className={`size-10 rounded-md grid place-items-center shrink-0 ${o.resolvida ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
              >
                {o.resolvida ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="bg-muted text-foreground">
                    {o.tipo}
                  </Badge>
                  {servico && (
                    <span className="font-mono text-xs text-primary">{servico.codigo}</span>
                  )}
                  <span className="text-xs text-muted-foreground">· {fmtDate(o.data)}</span>
                </div>
                <p className="text-sm">{o.descricao}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => store.toggleOcorrencia(o.id)}>
                  {o.resolvida ? "Reabrir" : "Resolver"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 text-destructive"
                  onClick={() => store.deleteOcorrencia(o.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
