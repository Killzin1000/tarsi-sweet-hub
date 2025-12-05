import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Trash2, Plus, Minus, Truck, Loader2, Search } from "lucide-react";
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

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const Carrinho = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<"retirada" | "delivery">("retirada");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>("pix");
  const [observacao, setObservacao] = useState("");
  const [horarioDesejado, setHorarioDesejado] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [taxaEntregaCalculada, setTaxaEntregaCalculada] = useState<number | null>(null);
  const [uberQuoteId, setUberQuoteId] = useState<string | null>(null);
  
  // Address fields
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("endereco")
        .eq("id", session.user.id)
        .single();
      
      if (profile?.endereco) {
        // Try to parse the stored address
        const parts = profile.endereco.split(", ");
        if (parts.length >= 6) {
          setRua(parts[0] || "");
          setNumero(parts[1] || "");
          setComplemento(parts[2] || "");
          setBairro(parts[3] || "");
          setCidade(parts[4] || "");
          setEstado(parts[5] || "");
          setCep(parts[6] || "");
        }
      }
    }
  };

  const buscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, "");
    
    if (cepLimpo.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setRua(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setEstado(data.uf);
      setTaxaEntregaCalculada(null);
      toast.success("Endereço encontrado! Informe o número.");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const getEnderecoCompleto = () => {
    const partes = [rua, numero, complemento, bairro, cidade, estado, cep].filter(Boolean);
    return partes.join(", ");
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const calcularFrete = async () => {
    if (!rua || !numero || !bairro || !cidade) {
      toast.error("Preencha o endereço completo para calcular o frete");
      return;
    }

    const enderecoCompleto = getEnderecoCompleto();

    setLoadingFrete(true);
    try {
      const response = await supabase.functions.invoke('uber-direct', {
        body: {
          action: 'quote',
          dropoff_address: enderecoCompleto
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (data.error) {
        throw new Error(data.error);
      }

      // Uber returns fee in cents, convert to reais
      const fee = data.fee ? data.fee / 100 : 15;
      setTaxaEntregaCalculada(fee);
      setUberQuoteId(data.id || null);
      toast.success(`Frete calculado: R$ ${fee.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      // Use a default delivery fee if Uber API fails
      setTaxaEntregaCalculada(15);
      toast.error("Não foi possível calcular o frete via Uber. Taxa padrão aplicada: R$ 15,00");
    } finally {
      setLoadingFrete(false);
    }
  };

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
  const taxaEntrega = tipoEntrega === "delivery" ? (taxaEntregaCalculada || 0) : 0;
  const total = subtotal + taxaEntrega;

  const handleFinalizarPedido = async () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (tipoEntrega === "delivery" && (!rua || !numero || !bairro || !cidade)) {
      toast.error("Preencha o endereço completo");
      return;
    }

    if (tipoEntrega === "delivery" && !taxaEntregaCalculada) {
      toast.error("Calcule o frete antes de finalizar");
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
      const enderecoCompleto = getEnderecoCompleto();

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: session.user.id,
          total,
          taxa_entrega: taxaEntrega,
          forma_pagamento: formaPagamento,
          endereco_entrega: tipoEntrega === "delivery" ? enderecoCompleto : null,
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

      // Create Uber delivery if delivery type is selected
      if (tipoEntrega === "delivery") {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, telefone")
            .eq("id", session.user.id)
            .single();

          const orderDetails = cartItems.map(item => `${item.quantidade}x ${item.nome}`).join(", ");
          
          const uberResponse = await supabase.functions.invoke('uber-direct', {
            body: {
              action: 'create',
              dropoff_address: enderecoCompleto,
              dropoff_name: profile?.nome || "Cliente",
              dropoff_phone: profile?.telefone || "+5511999999999",
              order_details: `Pedido #${pedido.id.slice(0, 8)}: ${orderDetails}`,
              quote_id: uberQuoteId
            }
          });

          if (uberResponse.data && !uberResponse.data.error) {
            console.log("Uber delivery created:", uberResponse.data);
            toast.success("Entrega Uber Flash solicitada!");
          }
        } catch (uberError) {
          console.error("Erro ao criar entrega Uber:", uberError);
          // Don't fail the order if Uber fails
        }
      }

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
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-base font-semibold">Endereço de Entrega</Label>
                      
                      <div>
                        <Label htmlFor="cep" className="text-sm">CEP</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cep"
                            type="text"
                            placeholder="00000-000"
                            value={cep}
                            onChange={(e) => {
                              setCep(formatCep(e.target.value));
                              setTaxaEntregaCalculada(null);
                            }}
                            maxLength={9}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={buscarCep}
                            disabled={loadingCep}
                          >
                            {loadingCep ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="rua" className="text-sm">Rua</Label>
                        <Input
                          id="rua"
                          type="text"
                          placeholder="Nome da rua"
                          value={rua}
                          onChange={(e) => {
                            setRua(e.target.value);
                            setTaxaEntregaCalculada(null);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="numero" className="text-sm">Número *</Label>
                          <Input
                            id="numero"
                            type="text"
                            placeholder="123"
                            value={numero}
                            onChange={(e) => {
                              setNumero(e.target.value);
                              setTaxaEntregaCalculada(null);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="complemento" className="text-sm">Complemento</Label>
                          <Input
                            id="complemento"
                            type="text"
                            placeholder="Apto..."
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bairro" className="text-sm">Bairro</Label>
                        <Input
                          id="bairro"
                          type="text"
                          placeholder="Bairro"
                          value={bairro}
                          onChange={(e) => {
                            setBairro(e.target.value);
                            setTaxaEntregaCalculada(null);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label htmlFor="cidade" className="text-sm">Cidade</Label>
                          <Input
                            id="cidade"
                            type="text"
                            placeholder="Cidade"
                            value={cidade}
                            onChange={(e) => {
                              setCidade(e.target.value);
                              setTaxaEntregaCalculada(null);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado" className="text-sm">UF</Label>
                          <Input
                            id="estado"
                            type="text"
                            placeholder="SP"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value.toUpperCase())}
                            maxLength={2}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={calcularFrete}
                        disabled={loadingFrete || !rua || !numero}
                      >
                        {loadingFrete ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Calculando...
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4 mr-2" />
                            Calcular Frete (Uber Flash)
                          </>
                        )}
                      </Button>
                      {taxaEntregaCalculada !== null && (
                        <p className="text-sm text-muted-foreground">
                          Frete via Uber Flash: <span className="font-semibold text-primary">R$ {taxaEntregaCalculada.toFixed(2)}</span>
                        </p>
                      )}
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
                    disabled={loading || (tipoEntrega === "delivery" && !taxaEntregaCalculada)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      "Finalizar Pedido"
                    )}
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
