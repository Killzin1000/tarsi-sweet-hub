import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  forma_pagamento: string;
  endereco_entrega: string | null;
  observacao: string | null;
  profiles: {
    nome: string;
    telefone: string | null;
  } | null;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    
    const channel = supabase
      .channel("orders-changes")
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
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          profiles:cliente_id (nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error(error);
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
      toast.success("Status atualizado com sucesso");
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      novo: "bg-blue-500",
      aceito: "bg-purple-500",
      producao: "bg-orange-500",
      pronto: "bg-green-500",
      a_caminho: "bg-cyan-500",
      entregue: "bg-emerald-500",
      cancelado: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
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

  const statusLabels: Record<OrderStatus, string> = {
    novo: "Novo",
    aceito: "Aceito",
    producao: "Em Produção",
    pronto: "Pronto",
    a_caminho: "A Caminho",
    entregue: "Entregue",
    cancelado: "Cancelado"
  };

  if (loading) {
    return <div>Carregando pedidos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Pedidos</CardTitle>
        <CardDescription>Acompanhe e gerencie todos os pedidos em tempo real</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum pedido encontrado</p>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="border-2">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold">Pedido #{order.id.slice(0, 8)}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Cliente:</strong> {order.profiles?.nome || "N/A"}
                    </p>
                    {order.profiles?.telefone && (
                      <p className="text-sm">
                        <strong>Telefone:</strong> {order.profiles.telefone}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>Pagamento:</strong> {order.forma_pagamento}
                    </p>
                    {order.endereco_entrega && (
                      <p className="text-sm">
                        <strong>Endereço:</strong> {order.endereco_entrega}
                      </p>
                    )}
                    {order.observacao && (
                      <p className="text-sm">
                        <strong>Obs:</strong> {order.observacao}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <p className="text-3xl font-bold text-primary">
                      R$ {order.total.toFixed(2)}
                    </p>
                    <div className="w-full max-w-xs">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger>
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
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersManagement;
