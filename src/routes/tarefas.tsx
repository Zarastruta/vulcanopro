import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useVulcano, store, fmtDate, diasAteHoje } from "@/lib/vulcano-store";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — Vulcano OS" }] }),
  component: TarefasPage,
});

function TarefasPage() {
  const { tarefas, servicos, equipe } = useVulcano();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    servicoId: "",
    responsavelId: "",
    prazo: new Date().toISOString().slice(0, 10),
    concluida: false,
  });

  const submit = () => {
    if (!form.titulo) return;
    store.addTarefa(form);
    setForm({
      titulo: "",
      servicoId: "",
      responsavelId: "",
      prazo: new Date().toISOString().slice(0, 10),
      concluida: false,
    });
    setOpen(false);
  };

  const pendentes = tarefas.filter((t) => !t.concluida);
  const concluidas = tarefas.filter((t) => t.concluida);

  const linha = (t: (typeof tarefas)[number]) => {
    const dias = diasAteHoje(t.prazo);
    const servico = servicos.find((s) => s.id === t.servicoId);
    const r = equipe.find((m) => m.id === t.responsavelId);
    return (
      <div
        key={t.id}
        className="flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      >
        <Checkbox checked={t.concluida} onCheckedChange={() => store.toggleTarefa(t.id)} />
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium ${t.concluida ? "line-through text-muted-foreground" : ""}`}
          >
            {t.titulo}
          </div>
          <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
            {servico && <span className="font-mono text-primary/80">{servico.codigo}</span>}
            {r && <span>{r.nome}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono">{fmtDate(t.prazo)}</div>
          {!t.concluida && (
            <div
              className={`text-[10px] ${dias < 0 ? "text-destructive" : dias <= 1 ? "text-warning" : "text-muted-foreground"}`}
            >
              {dias < 0 ? `${Math.abs(dias)}d atrasada` : dias === 0 ? "hoje" : `em ${dias}d`}
            </div>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive"
          onClick={() => store.deleteTarefa(t.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <AppShell
      title="Tarefas"
      subtitle={`${pendentes.length} pendentes · ${concluidas.length} concluídas`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-wide">
                Nova Tarefa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
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
                <Label>Responsável</Label>
                <Select
                  value={form.responsavelId || "_"}
                  onValueChange={(v) => setForm({ ...form, responsavelId: v === "_" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">—</SelectItem>
                    {equipe.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submit}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-card/80">
          <div className="px-4 py-3 border-b border-border font-display uppercase tracking-wide text-sm">
            Pendentes
          </div>
          {pendentes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Tudo em dia.</div>
          ) : (
            pendentes.map(linha)
          )}
        </Card>
        <Card className="bg-card/80">
          <div className="px-4 py-3 border-b border-border font-display uppercase tracking-wide text-sm">
            Concluídas
          </div>
          {concluidas.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Nenhuma ainda.</div>
          ) : (
            concluidas.map(linha)
          )}
        </Card>
      </div>
    </AppShell>
  );
}
