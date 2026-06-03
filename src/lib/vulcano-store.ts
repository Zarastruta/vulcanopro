import { useSyncExternalStore } from "react";

export type ServicoStatus =
  | "Novo"
  | "Medição"
  | "Projeto"
  | "Compras"
  | "Fabricação"
  | "Galvanização"
  | "Pintura"
  | "Instalação"
  | "Finalizado";

export const STATUS_ETAPAS: ServicoStatus[] = [
  "Novo",
  "Medição",
  "Projeto",
  "Compras",
  "Fabricação",
  "Galvanização",
  "Pintura",
  "Instalação",
  "Finalizado",
];

export type Prioridade = "Baixa" | "Média" | "Alta" | "Crítica";

export interface Cliente {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface MembroEquipe {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  telefone: string;
}

export interface Servico {
  id: string;
  codigo: string;
  clienteId: string;
  tipo: string;
  valor: number;
  prazo: string; // ISO date
  responsavelId: string;
  prioridade: Prioridade;
  status: ServicoStatus;
  observacoes: string;
  comprasPendentes?: boolean;
  criadoEm: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  servicoId?: string;
  responsavelId?: string;
  prazo: string;
  concluida: boolean;
}

export interface Ocorrencia {
  id: string;
  servicoId?: string;
  tipo: "Atraso" | "Defeito" | "Acidente" | "Reclamação" | "Outro";
  descricao: string;
  data: string;
  resolvida: boolean;
}

interface State {
  clientes: Cliente[];
  equipe: MembroEquipe[];
  servicos: Servico[];
  tarefas: Tarefa[];
  ocorrencias: Ocorrencia[];
}

const STORAGE_KEY = "vulcano-os-v1";

const seed = (): State => {
  const clientes: Cliente[] = [
    {
      id: "c1",
      nome: "Construtora Aurora",
      contato: "Marcos Lima",
      telefone: "(11) 98888-1212",
      email: "marcos@aurora.com.br",
      endereco: "Av. Faria Lima, 1500 - SP",
    },
    {
      id: "c2",
      nome: "Edifício Skyline",
      contato: "Renata Souza",
      telefone: "(11) 97777-3434",
      email: "renata@skyline.com",
      endereco: "R. Oscar Freire, 800 - SP",
    },
    {
      id: "c3",
      nome: "Hotel Pátio Real",
      contato: "João Bertoldo",
      telefone: "(21) 96666-5656",
      email: "joao@patioreal.com",
      endereco: "Av. Atlântica, 2000 - RJ",
    },
  ];
  const equipe: MembroEquipe[] = [
    {
      id: "e1",
      nome: "Carlos Mendes",
      cargo: "Encarregado",
      setor: "Fabricação",
      telefone: "(11) 99999-0001",
    },
    {
      id: "e2",
      nome: "Patrícia Alves",
      cargo: "Projetista",
      setor: "Projeto",
      telefone: "(11) 99999-0002",
    },
    {
      id: "e3",
      nome: "Rogério Pinto",
      cargo: "Soldador Sênior",
      setor: "Fabricação",
      telefone: "(11) 99999-0003",
    },
    {
      id: "e4",
      nome: "Aline Castro",
      cargo: "Compradora",
      setor: "Suprimentos",
      telefone: "(11) 99999-0004",
    },
    {
      id: "e5",
      nome: "Diego Ramos",
      cargo: "Instalador Líder",
      setor: "Instalação",
      telefone: "(11) 99999-0005",
    },
  ];
  const today = new Date();
  const d = (offset: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };
  const servicos: Servico[] = [
    {
      id: "s1",
      codigo: "VUL-0001",
      clienteId: "c1",
      tipo: "Guarda-corpo de inox",
      valor: 48000,
      prazo: d(-3),
      responsavelId: "e1",
      prioridade: "Alta",
      status: "Fabricação",
      observacoes: "Modelo H1.10m, fixação química.",
      comprasPendentes: true,
      criadoEm: d(-30),
    },
    {
      id: "s2",
      codigo: "VUL-0002",
      clienteId: "c2",
      tipo: "Esquadria de aço corten",
      valor: 126000,
      prazo: d(12),
      responsavelId: "e2",
      prioridade: "Crítica",
      status: "Projeto",
      observacoes: "Aprovação cliente pendente.",
      criadoEm: d(-15),
    },
    {
      id: "s3",
      codigo: "VUL-0003",
      clienteId: "c3",
      tipo: "Escada helicoidal",
      valor: 89000,
      prazo: d(25),
      responsavelId: "e3",
      prioridade: "Média",
      status: "Medição",
      observacoes: "Agendar visita técnica.",
      criadoEm: d(-7),
    },
    {
      id: "s4",
      codigo: "VUL-0004",
      clienteId: "c1",
      tipo: "Portão pivotante",
      valor: 32000,
      prazo: d(5),
      responsavelId: "e1",
      prioridade: "Alta",
      status: "Galvanização",
      observacoes: "",
      criadoEm: d(-20),
    },
    {
      id: "s5",
      codigo: "VUL-0005",
      clienteId: "c2",
      tipo: "Brises metálicos",
      valor: 215000,
      prazo: d(40),
      responsavelId: "e2",
      prioridade: "Média",
      status: "Compras",
      observacoes: "Aço galvalume sob encomenda.",
      comprasPendentes: true,
      criadoEm: d(-10),
    },
    {
      id: "s6",
      codigo: "VUL-0006",
      clienteId: "c3",
      tipo: "Cobertura metálica",
      valor: 178000,
      prazo: d(-1),
      responsavelId: "e5",
      prioridade: "Crítica",
      status: "Instalação",
      observacoes: "Cliente cobrando entrega.",
      criadoEm: d(-45),
    },
    {
      id: "s7",
      codigo: "VUL-0007",
      clienteId: "c1",
      tipo: "Pergolado de aço",
      valor: 55000,
      prazo: d(-10),
      responsavelId: "e5",
      prioridade: "Média",
      status: "Finalizado",
      observacoes: "Entregue com vistoria OK.",
      criadoEm: d(-60),
    },
    {
      id: "s8",
      codigo: "VUL-0008",
      clienteId: "c2",
      tipo: "Mão-francesa decorativa",
      valor: 18000,
      prazo: d(8),
      responsavelId: "e3",
      prioridade: "Baixa",
      status: "Pintura",
      observacoes: "Pintura eletrostática preta fosca.",
      criadoEm: d(-12),
    },
  ];
  const tarefas: Tarefa[] = [
    {
      id: "t1",
      titulo: "Conferir nota de aço inox 304",
      servicoId: "s1",
      responsavelId: "e4",
      prazo: d(1),
      concluida: false,
    },
    {
      id: "t2",
      titulo: "Enviar projeto executivo ao cliente",
      servicoId: "s2",
      responsavelId: "e2",
      prazo: d(2),
      concluida: false,
    },
    {
      id: "t3",
      titulo: "Agendar galvanizadora",
      servicoId: "s4",
      responsavelId: "e1",
      prazo: d(0),
      concluida: true,
    },
    {
      id: "t4",
      titulo: "Visita de medição no Hotel Pátio Real",
      servicoId: "s3",
      responsavelId: "e2",
      prazo: d(3),
      concluida: false,
    },
  ];
  const ocorrencias: Ocorrencia[] = [
    {
      id: "o1",
      servicoId: "s6",
      tipo: "Atraso",
      descricao: "Chuva impediu içamento da cobertura.",
      data: d(-2),
      resolvida: false,
    },
    {
      id: "o2",
      servicoId: "s1",
      tipo: "Defeito",
      descricao: "Solda reprovada em inspeção visual, refazendo cordão.",
      data: d(-4),
      resolvida: true,
    },
  ];
  return { clientes, equipe, servicos, tarefas, ocorrencias };
};

const load = (): State => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as State;
  } catch {
    return seed();
  }
};

let state: State = typeof window === "undefined" ? seed() : load();
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
};

export const store = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    return state;
  },
  reset() {
    state = seed();
    persist();
  },
  // Servicos
  nextCodigo(): string {
    const nums = state.servicos
      .map((s) => parseInt(s.codigo.replace("VUL-", ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `VUL-${String(next).padStart(4, "0")}`;
  },
  addServico(s: Omit<Servico, "id" | "codigo" | "criadoEm">) {
    const novo: Servico = {
      ...s,
      id: crypto.randomUUID(),
      codigo: this.nextCodigo(),
      criadoEm: new Date().toISOString().slice(0, 10),
    };
    state = { ...state, servicos: [novo, ...state.servicos] };
    persist();
  },
  updateServico(id: string, patch: Partial<Servico>) {
    state = {
      ...state,
      servicos: state.servicos.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    persist();
  },
  deleteServico(id: string) {
    state = { ...state, servicos: state.servicos.filter((s) => s.id !== id) };
    persist();
  },
  // Clientes
  addCliente(c: Omit<Cliente, "id">) {
    state = { ...state, clientes: [{ ...c, id: crypto.randomUUID() }, ...state.clientes] };
    persist();
  },
  deleteCliente(id: string) {
    state = { ...state, clientes: state.clientes.filter((c) => c.id !== id) };
    persist();
  },
  // Equipe
  addMembro(m: Omit<MembroEquipe, "id">) {
    state = { ...state, equipe: [{ ...m, id: crypto.randomUUID() }, ...state.equipe] };
    persist();
  },
  deleteMembro(id: string) {
    state = { ...state, equipe: state.equipe.filter((m) => m.id !== id) };
    persist();
  },
  // Tarefas
  addTarefa(t: Omit<Tarefa, "id">) {
    state = { ...state, tarefas: [{ ...t, id: crypto.randomUUID() }, ...state.tarefas] };
    persist();
  },
  toggleTarefa(id: string) {
    state = {
      ...state,
      tarefas: state.tarefas.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)),
    };
    persist();
  },
  deleteTarefa(id: string) {
    state = { ...state, tarefas: state.tarefas.filter((t) => t.id !== id) };
    persist();
  },
  // Ocorrencias
  addOcorrencia(o: Omit<Ocorrencia, "id">) {
    state = { ...state, ocorrencias: [{ ...o, id: crypto.randomUUID() }, ...state.ocorrencias] };
    persist();
  },
  toggleOcorrencia(id: string) {
    state = {
      ...state,
      ocorrencias: state.ocorrencias.map((o) =>
        o.id === id ? { ...o, resolvida: !o.resolvida } : o,
      ),
    };
    persist();
  },
  deleteOcorrencia(id: string) {
    state = { ...state, ocorrencias: state.ocorrencias.filter((o) => o.id !== id) };
    persist();
  },
};

export function useVulcano() {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.get(),
    () => store.get(),
  );
}

export const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const diasAteHoje = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const prioridadeColor = (p: Prioridade) => {
  switch (p) {
    case "Crítica":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Alta":
      return "bg-primary/15 text-primary border-primary/30";
    case "Média":
      return "bg-warning/15 text-warning border-warning/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const statusColor = (s: ServicoStatus) => {
  const map: Record<ServicoStatus, string> = {
    Novo: "bg-steel/15 text-foreground border-steel/30",
    Medição: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    Projeto: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    Compras: "bg-warning/15 text-warning border-warning/30",
    Fabricação: "bg-primary/15 text-primary border-primary/30",
    Galvanização: "bg-zinc-500/15 text-zinc-200 border-zinc-500/30",
    Pintura: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    Instalação: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Finalizado: "bg-success/15 text-success border-success/30",
  };
  return map[s];
};
