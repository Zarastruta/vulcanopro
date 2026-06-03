import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useVulcano, store } from "@/lib/vulcano-store";
import { Plus, Trash2, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Vulcano OS" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const { clientes, servicos } = useVulcano();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    contato: "",
    telefone: "",
    email: "",
    endereco: "",
  });

  const submit = () => {
    if (!form.nome) return;
    store.addCliente(form);
    setForm({ nome: "", contato: "", telefone: "", email: "", endereco: "" });
    setOpen(false);
  };

  return (
    <AppShell
      title="Clientes"
      subtitle={`${clientes.length} clientes ativos`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-wide">
                Novo Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome / Razão Social</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Contato</Label>
                <Input
                  value={form.contato}
                  onChange={(e) => setForm({ ...form, contato: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Endereço</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((c) => {
          const qtd = servicos.filter((s) => s.clienteId === c.id).length;
          return (
            <Card key={c.id} className="p-5 bg-card/80 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display uppercase tracking-wide text-lg leading-tight">
                    {c.nome}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.contato}</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => store.deleteCliente(c.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {c.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5" />
                    {c.telefone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5" />
                    {c.email}
                  </div>
                )}
                {c.endereco && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {c.endereco}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Serviços
                </span>
                <span className="font-mono text-primary text-lg">{qtd}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
