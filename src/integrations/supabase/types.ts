export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          preco: number
          produto_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          preco: number
          produto_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          preco?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa: {
        Row: {
          created_at: string | null
          data_hora: string | null
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          pedido_id: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_hora?: string | null
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          pedido_id?: string | null
          tipo: Database["public"]["Enums"]["transaction_type"]
          valor: number
        }
        Update: {
          created_at?: string | null
          data_hora?: string | null
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          pedido_id?: string | null
          tipo?: Database["public"]["Enums"]["transaction_type"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          desconto_percentual: number | null
          desconto_valor: number | null
          id: string
          minimo_compra: number | null
          updated_at: string | null
          validade: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          minimo_compra?: number | null
          updated_at?: string | null
          validade?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          minimo_compra?: number | null
          updated_at?: string | null
          validade?: string | null
        }
        Relationships: []
      }
      ingredientes: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          quantidade_atual: number
          unidade: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          quantidade_atual?: number
          unidade: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          quantidade_atual?: number
          unidade?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          addons: Json | null
          created_at: string | null
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          variacao_id: string | null
        }
        Insert: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          variacao_id?: string | null
        }
        Update: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes_produto"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          endereco_entrega: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          horario_desejado: string | null
          id: string
          observacao: string | null
          pontos_ganhos: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          taxa_entrega: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          endereco_entrega?: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          horario_desejado?: string | null
          id?: string
          observacao?: string | null
          pontos_ganhos?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          taxa_entrega?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          endereco_entrega?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          horario_desejado?: string | null
          id?: string
          observacao?: string | null
          pontos_ganhos?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          taxa_entrega?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          endereco: string | null
          id: string
          nascimento: string | null
          nome: string
          pontos_fidelidade: number | null
          selos: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endereco?: string | null
          id: string
          nascimento?: string | null
          nome: string
          pontos_fidelidade?: number | null
          selos?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endereco?: string | null
          id?: string
          nascimento?: string | null
          nome?: string
          pontos_fidelidade?: number | null
          selos?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          created_at: string | null
          id: string
          ingrediente_id: string
          produto_id: string
          quantidade_usada: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingrediente_id: string
          produto_id: string
          quantidade_usada: number
        }
        Update: {
          created_at?: string | null
          id?: string
          ingrediente_id?: string
          produto_id?: string
          quantidade_usada?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variacoes_produto: {
        Row: {
          created_at: string | null
          id: string
          preco: number
          produto_id: string
          variacao: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preco: number
          produto_id: string
          variacao: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preco?: number
          produto_id?: string
          variacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente"
      order_status:
        | "novo"
        | "aceito"
        | "producao"
        | "pronto"
        | "a_caminho"
        | "entregue"
        | "cancelado"
      payment_method: "pix" | "dinheiro" | "cartao" | "pagamento_retirada"
      transaction_type: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cliente"],
      order_status: [
        "novo",
        "aceito",
        "producao",
        "pronto",
        "a_caminho",
        "entregue",
        "cancelado",
      ],
      payment_method: ["pix", "dinheiro", "cartao", "pagamento_retirada"],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const
