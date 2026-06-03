import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useVulcano,
  store,
  statusColor,
  prioridadeColor,
  fmtMoney,
  fmtDate,
  diasAteHoje,
  STATUS_ETAPAS,
} from "@/lib/vulcano-store";
import { ServicoFormDialog } from "@/components/ServicoFormDialog";
import { Plus, Search, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Vulcano OS" }] }),
  component: ServicosPage,
});

function ServicosPage() {
  const { servicos, clientes, equipe } = useVulcano();
  const [q, setQ] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const cliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "—";
  const resp = (id: string) => equipe.find((m) => m.id === id)?.nome ?? "—";

  const filtrados = servicos.filter((s) => {
    const matchQ =
      !q ||
      s.codigo.toLowerCase().includes(q.toLowerCase()) ||
      s.tipo.toLowerCase().includes(q.toLowerCase()) ||
      cliente(s.clienteId).toLowerCase().includes(q.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchQ && matchStatus;
  });

  return (
    <AppShell
      title="Serviços"
      subtitle={`${servicos.length} ordens cadastradas · ${fmtMoney(servicos.reduce((s, x) => s + x.valor, 0))} em carteira`}
      actions={
        <ServicoFormDialog
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" /> Novo Serviço
            </Button>
          }
        />
      }
    >
      <Card className="p-4 mb-4 bg-card/80 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, tipo ou cliente..."
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_ETAPAS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="bg-card/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-mono text-xs uppercase">Código</TableHead>
              <TableHead className="font-mono text-xs uppercase">Tipo / Cliente</TableHead>
              <TableHead className="font-mono text-xs uppercase">Responsável</TableHead>
              <TableHead className="font-mono text-xs uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase">Prioridade</TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">Valor</TableHead>
              <TableHead className="font-mono text-xs uppercase">Prazo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((s) => {
              const dias = diasAteHoje(s.prazo);
              const atrasado = dias < 0 && s.status !== "Finalizado";
              return (
                <TableRow key={s.id} className="border-border">
                  <TableCell className="font-mono text-primary">{s.codigo}</TableCell>
                  <TableCell>
                    <div className="font-medium">{s.tipo}</div>
                    <div className="text-xs text-muted-foreground">{cliente(s.clienteId)}</div>
                  </TableCell>
                  <TableCell className="text-sm">{resp(s.responsavelId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(s.status)}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={prioridadeColor(s.prioridade)}>
                      {s.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtMoney(s.valor)}</TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{fmtDate(s.prazo)}</div>
                    <div
                      className={`text-[11px] ${atrasado ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {atrasado
                        ? `${Math.abs(dias)}d atrasado`
                        : dias === 0
                          ? "hoje"
                          : `em ${dias}d`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ServicoFormDialog
                        servico={s}
                        trigger={
                          <Button size="icon" variant="ghost" className="size-8">
                            <Pencil className="size-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => store.deleteServico(s.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
