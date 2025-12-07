import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Award, Gift, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Interface atualizada para incluir os itens
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
  itens_pedido: OrderItem[]; // Adicionado array de itens
}

interface Profile {
  nome: string;
  pontos_fidelidade: number;
  selos: number;
}

const MeusPedidos = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Faça login para ver seus pedidos");
      navigate("/auth");
      return;
    }
    loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    console.log("Iniciando carregamento de dados para o usuário:", userId);
    try {
      const [ordersRes, profileRes] = await Promise.all([
        supabase
          .from("pedidos")
          .select(`
            *,
            itens_pedido (
              quantidade,
              produtos (
                nome
              )
            )
          `)
          .eq("cliente_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("nome, pontos_fidelidade, selos")
          .eq("id", userId)
          .single()
      ]);

      if (ordersRes.error) {
        console.error("Erro ao buscar pedidos:", ordersRes.error);
        throw ordersRes.error;
      }
      if (profileRes.error) {
        console.error("Erro ao buscar perfil:", profileRes.error);
        throw profileRes.error;
      }

      console.log("Pedidos carregados com sucesso:", ordersRes.data);
      // Casting forçado aqui pois o type gerado do supabase as vezes é estrito demais com joins profundos
      setOrders(ordersRes.data as unknown as Order[] || []);
      setProfile(profileRes.data);
    } catch (error) {
      console.error("Erro geral no loadData:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
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

  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      novo: "Novo",
      aceito: "Aceito",
      producao: "Em Produção",
      pronto: "Pronto",
      a_caminho: "A Caminho",
      entregue: "Entregue",
      cancelado: "Cancelado"
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Tarsi Sweet</span>
          </Link>
          <Link to="/catalogo">
            <Button variant="ghost">Catálogo</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Minha Conta</h1>

        <Tabs defaultValue="pedidos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pedidos">Meus Pedidos</TabsTrigger>
            <TabsTrigger value="fidelidade">Fidelidade</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido</p>
                  <Link to="/catalogo">
                    <Button>Ver Catálogo</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              orders.map(order => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Pedido #{order.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Lista de Produtos */}
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        Itens do Pedido:
                      </p>
                      <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                        {order.itens_pedido && order.itens_pedido.length > 0 ? (
                          order.itens_pedido.map((item, idx) => (
                            <div key={idx} className="text-sm flex justify-between items-center border-b border-border/50 last:border-0 pb-1 last:pb-0">
                              <span className="text-muted-foreground">
                                {item.quantidade}x {item.produtos?.nome || "Produto Indisponível"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Detalhes dos itens indisponíveis</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t pt-4 mt-2">
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Pagamento:</span> {order.forma_pagamento}
                        </p>
                        {order.endereco_entrega && (
                          <p className="text-muted-foreground max-w-[250px] truncate">
                            <span className="font-medium text-foreground">Entrega:</span> {order.endereco_entrega}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="fidelidade">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-shadow-sweet">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    Pontos de Fidelidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-bold text-primary mb-2">
                    {profile?.pontos_fidelidade || 0}
                  </p>
                  <p className="text-muted-foreground">
                    Você ganha 1 ponto para cada R$ 1,00 em compras
                  </p>
                </CardContent>
              </Card>

              <Card className="card-shadow-sweet">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-secondary" />
                    Selos Coletados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-bold text-secondary mb-2">
                    {profile?.selos || 0}
                  </p>
                  <p className="text-muted-foreground">
                    Você ganha 1 selo a cada pedido concluído
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Como funciona o programa de fidelidade?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>🎁 A cada 100 pontos, ganhe um desconto especial</p>
                <p>🏆 Acumule 10 selos e ganhe um brinde surpresa</p>
                <p>🎂 Desconto especial no seu aniversário</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MeusPedidos;