import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, User, Phone, MapPin, CreditCard, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  quantidade: number;
  produtos: {
    nome: string;
  } | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  forma_pagamento: string;
  endereco_entrega: string | null;
  observacao: string | null;
  // Apenas "profiles" é suficiente, o Supabase infere a relação
  profiles: {
    nome: string;
    telefone: string | null;
  } | null;
  itens_pedido: OrderItem[];
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    
    const channel = supabase
      .channel("orders-changes-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      // Ajustei a query para usar 'profiles' direto em vez do alias complexo
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          profiles (
            nome, 
            telefone
          ),
          itens_pedido (
            quantidade,
            produtos (
              nome
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Pedidos Admin carregados:", data);
      setOrders(data as unknown as Order[] || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Status atualizado para ${newStatus}`);
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      novo: "bg-blue-500 hover:bg-blue-600",
      aceito: "bg-purple-500 hover:bg-purple-600",
      producao: "bg-orange-500 hover:bg-orange-600",
      pronto: "bg-green-500 hover:bg-green-600",
      a_caminho: "bg-cyan-500 hover:bg-cyan-600",
      entregue: "bg-emerald-500 hover:bg-emerald-600",
      cancelado: "bg-red-500 hover:bg-red-600"
    };
    return colors[status] || "bg-gray-500";
  };

  const statusLabels: Record<OrderStatus, string> = {
    novo: "Novo",
    aceito: "Aceito",
    producao: "Em Produção",
    pronto: "Pronto",
    a_caminho: "A Caminho",
    entregue: "Entregue",
    cancelado: "Cancelado"
  };

  const statusOptions: OrderStatus[] = [
    "novo",
    "aceito",
    "producao",
    "pronto",
    "a_caminho",
    "entregue",
    "cancelado"
  ];

  if (loading) {
    return <div className="text-center py-8">Carregando painel...</div>;
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle>Gestão de Pedidos</CardTitle>
        <CardDescription>Acompanhe e gerencie todos os pedidos em tempo real</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {orders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mt-2">Nenhum pedido encontrado</p>
          </div>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="border border-border/50 shadow-sm overflow-hidden">
              <div className={`h-1 w-full ${getStatusColor(order.status)} opacity-80`} />
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Coluna da Esquerda: Detalhes do Cliente e Entrega */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        Pedido #{order.id.slice(0, 8)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold block">Cliente:</span>
                          <span className="text-muted-foreground font-medium">
                            {order.profiles?.nome || "Nome não disponível"}
                          </span>
                        </div>
                      </div>

                      {order.profiles?.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">{order.profiles.telefone}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold block">Pagamento:</span>
                          <span className="text-muted-foreground capitalize">
                            {order.forma_pagamento.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {order.endereco_entrega && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold block">Entrega:</span>
                            <span className="text-muted-foreground">{order.endereco_entrega}</span>
                          </div>
                        </div>
                      )}

                      {order.observacao && (
                        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                          <MessageSquare className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold block text-orange-600">Observação:</span>
                            <span className="text-muted-foreground italic">"{order.observacao}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna da Direita: Itens e Ações */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div className="bg-background border rounded-lg p-4">
                      <p className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        Itens do Pedido
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {order.itens_pedido && order.itens_pedido.length > 0 ? (
                          order.itens_pedido.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-border/30 last:border-0">
                              <span className="font-medium text-foreground">
                                {item.produtos?.nome || "Produto Removido"}
                              </span>
                              <Badge variant="secondary" className="ml-2">x{item.quantidade}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Nenhum item registrado</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                      <div className="text-center sm:text-left">
                        <p className="text-sm text-muted-foreground">Total do Pedido</p>
                        <p className="text-3xl font-bold text-primary">
                          R$ {order.total.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="w-full sm:w-auto min-w-[200px]">
                        <Select
                          value={order.status || "novo"}
                          onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className={`${getStatusColor(order.status)} text-white border-none h-11`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersManagement;