export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enums / constants ────────────────────────────────────────────────────────
export const OS_STATUSES = [
  "Novo", "Medição", "Projeto", "Compras",
  "Fabricação", "Galvanização", "Pintura", "Instalação", "Finalizado",
] as const;
export type OsStatus = typeof OS_STATUSES[number];

export const PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type Priority = typeof PRIORITIES[number];

export const PAYMENT_STATUSES = ["pendente", "parcial", "pago"] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// ─── Calc helpers (re-exported here for convenience) ─────────────────────────
export type QuoteItem = {
  id?: string;
  service_name: string;
  material_description?: string | null;
  quantity: number;
  unit_price: number;
};

export type QuoteCosts = {
  labor_cost: number;
  transport_cost: number;
  painting_cost: number;
  galvanizing_cost: number;
  installation_cost: number;
  profit_margin_pct: number;
};

// ─── Database ─────────────────────────────────────────────────────────────────
export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      clients: {
        Row: {
          id: string; user_id: string; name: string;
          phone: string | null; whatsapp: string | null;
          email: string | null; address: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      materials: {
        Row: {
          id: string; user_id: string; category: string; name: string;
          size: string | null; thickness: string | null;
          price_per_bar: number | null; price_per_meter: number | null;
          weight: number | null; created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string; user_id: string; client_id: string | null;
          number: number; title: string; status: string;
          service_description: string | null;
          labor_cost: number | null; transport_cost: number | null;
          painting_cost: number | null; galvanizing_cost: number | null;
          installation_cost: number | null; profit_margin_pct: number | null;
          payment_conditions: string | null; deadline: string | null;
          notes: string | null; project_data: Json | null;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "number" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["quotes"]["Row"], "id" | "number" | "created_at" | "updated_at">>;
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
        Relationships: [{ foreignKeyName: "quotes_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] }];
      };
      quote_items: {
        Row: {
          id: string; user_id: string; quote_id: string;
          service_name: string; material_description: string | null;
          quantity: number; unit_price: number; position: number; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quote_items"]["Row"], "id" | "created_at"> & Partial<Pick<Database["public"]["Tables"]["quote_items"]["Row"], "id" | "created_at">>;
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>;
        Relationships: [{ foreignKeyName: "quote_items_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] }];
      };
      team_members: {
        Row: {
          id: string; user_id: string; name: string;
          role: string | null; sector: string | null;
          phone: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["team_members"]["Row"], "id" | "created_at"> & Partial<Pick<Database["public"]["Tables"]["team_members"]["Row"], "id" | "created_at">>;
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [];
      };
      service_orders: {
        Row: {
          id: string; user_id: string;
          client_id: string | null; quote_id: string | null; responsible_id: string | null;
          code: string; title: string; status: OsStatus; priority: Priority;
          deadline: string | null; value: number; payment_status: PaymentStatus;
          amount_paid: number; notes: string | null; purchases_pending: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["service_orders"]["Row"], "id" | "created_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["service_orders"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Database["public"]["Tables"]["service_orders"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "service_orders_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "service_orders_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] },
          { foreignKeyName: "service_orders_responsible_id_fkey"; columns: ["responsible_id"]; referencedRelation: "team_members"; referencedColumns: ["id"] },
        ];
      };
      cash_transactions: {
        Row: {
          id: string; user_id: string; service_order_id: string | null;
          type: "entrada" | "saida"; category: string;
          description: string; amount: number; date: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cash_transactions"]["Row"], "id" | "created_at"> & Partial<Pick<Database["public"]["Tables"]["cash_transactions"]["Row"], "id" | "created_at">>;
        Update: Partial<Database["public"]["Tables"]["cash_transactions"]["Insert"]>;
        Relationships: [{ foreignKeyName: "cash_transactions_so_fkey"; columns: ["service_order_id"]; referencedRelation: "service_orders"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<never, never>;
    Functions: {
      next_os_code: { Args: { p_user_id: string }; Returns: string };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type DefaultSchema = Database["public"];
export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"];

export const Constants = { public: { Enums: {} } } as const;
