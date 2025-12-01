import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface CartItem {
  id: string;
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem_url?: string;
}

const Carrinho = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "delivery">("retirada");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>("pix");
  const [endereco, setEndereco] = useState("");
  const [observacao, setObservacao] = useState("");
  const [horarioDesejado, setHorarioDesejado] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(items));
    setCartItems(items);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    saveCart(cartItems.filter(item => item.id !== id));
    toast.success("Item removido do carrinho");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const taxaEntrega = tipoEntrega === "delivery" ? 5 : 0;
  const total = subtotal + taxaEntrega;

  const handleFinalizarPedido = async () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (tipoEntrega === "delivery" && !endereco) {
      toast.error("Informe o endereço de entrega");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça login para finalizar o pedido");
        navigate("/auth");
        return;
      }

      const pontosGanhos = Math.floor(total);

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: session.user.id,
          total,
          taxa_entrega: taxaEntrega,
          forma_pagamento: formaPagamento,
          endereco_entrega: tipoEntrega === "delivery" ? endereco : null,
          horario_desejado: horarioDesejado || null,
          observacao: observacao || null,
          pontos_ganhos: pontosGanhos,
          status: "novo"
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const itens = cartItems.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      }));

      const { error: itensError } = await supabase
        .from("itens_pedido")
        .insert(itens);

      if (itensError) throw itensError;

      // Registrar entrada no caixa
      await supabase.from("caixa").insert({
        tipo: "entrada",
        valor: total,
        descricao: `Pedido #${pedido.id.slice(0, 8)}`,
        forma_pagamento: formaPagamento,
        pedido_id: pedido.id
      });

      localStorage.removeItem("cart");
      toast.success("Pedido realizado com sucesso!");
      navigate("/meus-pedidos");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Tarsi Sweet</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Meu Carrinho</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
              <Link to="/catalogo">
                <Button>Ver Catálogo</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.nome}</h3>
                      <p className="text-primary font-bold">R$ {item.preco.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantidade}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Finalizar Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tipo de Entrega</Label>
                    <RadioGroup value={tipoEntrega} onValueChange={(v) => setTipoEntrega(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retirada" id="retirada" />
                        <Label htmlFor="retirada">Retirada na loja</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery">Delivery</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {tipoEntrega === "delivery" && (
                    <div>
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Forma de Pagamento</Label>
                    <RadioGroup value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as PaymentMethod)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix">Pix</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dinheiro" id="dinheiro" />
                        <Label htmlFor="dinheiro">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao" id="cartao" />
                        <Label htmlFor="cartao">Cartão</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pagamento_retirada" id="pagamento_retirada" />
                        <Label htmlFor="pagamento_retirada">Pagar na retirada</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="horario">Horário Desejado (opcional)</Label>
                    <Input
                      id="horario"
                      type="datetime-local"
                      value={horarioDesejado}
                      onChange={(e) => setHorarioDesejado(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="obs">Observações</Label>
                    <Textarea
                      id="obs"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Alguma observação especial?"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {tipoEntrega === "delivery" && (
                      <div className="flex justify-between">
                        <span>Taxa de entrega</span>
                        <span>R$ {taxaEntrega.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleFinalizarPedido}
                    disabled={loading}
                  >
                    {loading ? "Finalizando..." : "Finalizar Pedido"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrinho;
