import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Trash2, Plus, Minus, Truck, Loader2, Search, ShoppingBag, ArrowLeft, MapPin, CreditCard, Clock, MessageSquare, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import PaymentBrick from "@/components/payment/PaymentBrick";

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

  // NOVO: Estado para armazenar os dados do Pix (QR Code)
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  
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

      const fee = data.fee ? data.fee / 100 : 15;
      setTaxaEntregaCalculada(fee);
      setUberQuoteId(data.id || null);
      toast.success(`Frete calculado: R$ ${fee.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
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
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Função para copiar o código Pix para a área de transferência
  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      toast.success("Código Pix copiado!");
    }
  };

  // Função principal de finalização
  const handleFinalizarPedido = async (paymentData?: { id: string; status: string; qrCode?: string; qrCodeBase64?: string }) => {
    // Se o carrinho estiver vazio E não tivermos dados de Pix (ou seja, não é o caso de "já paguei"), barra
    if (cartItems.length === 0 && !pixData) {
      toast.error("Carrinho vazio");
      return;
    }

    if (tipoEntrega === "delivery" && (!rua || !numero || !bairro || !cidade)) {
      toast.error("Preencha o endereço completo");
      return;
    }

    if (tipoEntrega === "delivery" && !taxaEntregaCalculada && !pixData) {
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

      // Se já temos os dados do Pix, o usuário está na tela de sucesso e clicou em "Já paguei"
      // Nesse caso, apenas limpamos e redirecionamos, pois o pedido já foi criado
      if (pixData) {
        navigate("/meus-pedidos");
        return;
      }

      const pontosGanhos = Math.floor(total);
      const enderecoCompleto = getEnderecoCompleto();
      
      const obsFinal = paymentData?.id 
        ? `${observacao ? observacao + ' | ' : ''}Pago Online (MP ID: ${paymentData.id})`
        : observacao;

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: session.user.id,
          total,
          taxa_entrega: taxaEntrega,
          forma_pagamento: formaPagamento,
          endereco_entrega: tipoEntrega === "delivery" ? enderecoCompleto : null,
          horario_desejado: horarioDesejado || null,
          observacao: obsFinal || null,
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

      await supabase.from("caixa").insert({
        tipo: "entrada",
        valor: total,
        descricao: `Pedido #${pedido.id.slice(0, 8)}`,
        forma_pagamento: formaPagamento,
        pedido_id: pedido.id
      });

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
        }
      }

      // Limpa o carrinho do localStorage
      localStorage.removeItem("cart");

      // LÓGICA DE DECISÃO: Redirecionar ou Mostrar QR Code
      if (paymentData?.status === 'pending' && paymentData.qrCode && paymentData.qrCodeBase64) {
        // É Pix Pendente! Salva os dados para mostrar o QR Code e esconde o resto
        setPixData({
          qrCode: paymentData.qrCode,
          qrCodeBase64: paymentData.qrCodeBase64
        });
        setCartItems([]); // Limpa a lista visualmente para "limpar" a tela de fundo
        toast.success("Pedido gerado! Escaneie o QR Code.");
        setLoading(false); // Para o loading
        // NÃO redireciona aqui, deixa o return renderizar a tela de Pix
      } else {
        // Cartão aprovado ou Pagamento na Entrega/Retirada -> Vai para pedidos
        toast.success("Pedido realizado com sucesso!");
        navigate("/meus-pedidos");
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar pedido");
      setLoading(false);
    }
  };

  const isOnlinePayment = formaPagamento === "cartao" || formaPagamento === "pix";

  // --- RENDERIZAÇÃO ESPECIAL: Tela de Sucesso do Pix ---
  if (pixData) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center card-shadow-sweet animate-fade-in">
          <CardHeader>
            <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Pedido Registrado!</CardTitle>
            <p className="text-muted-foreground">Escaneie o QR Code para pagar via Pix</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Imagem do QR Code */}
            <div className="flex justify-center">
              <img 
                src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                alt="QR Code Pix" 
                className="w-64 h-64 object-contain border-2 border-dashed border-primary/30 rounded-lg p-2 bg-white shadow-sm"
              />
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-2">
              <Label className="text-left block text-sm font-semibold ml-1">Pix Copia e Cola</Label>
              <div className="flex gap-2">
                <Input value={pixData.qrCode} readOnly className="bg-muted text-xs font-mono h-10" />
                <Button size="icon" variant="outline" onClick={copyPixCode} className="h-10 w-10 shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold shadow-md" onClick={() => navigate("/meus-pedidos")}>
              Já fiz o pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDERIZAÇÃO PADRÃO: Carrinho ---
  return (
    <div className="min-h-screen bg-background pb-32 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Meu Carrinho</h1>
            <p className="text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <Link to="/" className="shrink-0">
            <ChefHat className="h-7 w-7 text-primary" />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-4xl">
        {cartItems.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Adicione delícias ao seu carrinho
              </p>
              <Link to="/catalogo">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver Catálogo
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.imagem_url ? (
                           <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" />
                        ) : (
                           <ShoppingBag className="h-6 w-6 text-primary/40" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate pr-2">
                          {item.nome}
                        </h3>
                        <p className="text-primary font-bold text-base sm:text-lg mt-0.5">
                          R$ {item.preco.toFixed(2)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-muted/50 rounded-full p-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantidade}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delivery Type */}
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Tipo de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <RadioGroup 
                  value={tipoEntrega} 
                  onValueChange={(v) => setTipoEntrega(v as any)}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="retirada"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                      tipoEntrega === "retirada" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="retirada" id="retirada" className="sr-only" />
                    <ShoppingBag className="h-4 w-4" />
                    <span className="font-medium">Retirada</span>
                  </Label>
                  <Label
                    htmlFor="delivery"
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                      tipoEntrega === "delivery" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">Delivery</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {tipoEntrega === "delivery" && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <div>
                    <Label htmlFor="cep" className="text-xs text-muted-foreground">CEP</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="cep"
                        type="text"
                        inputMode="numeric"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => {
                          setCep(formatCep(e.target.value));
                          setTaxaEntregaCalculada(null);
                        }}
                        maxLength={9}
                        className="flex-1 h-11"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={buscarCep}
                        disabled={loadingCep}
                        className="h-11 px-4"
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
                    <Label htmlFor="rua" className="text-xs text-muted-foreground">Rua</Label>
                    <Input
                      id="rua"
                      type="text"
                      placeholder="Nome da rua"
                      value={rua}
                      onChange={(e) => {
                        setRua(e.target.value);
                        setTaxaEntregaCalculada(null);
                      }}
                      className="mt-1 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="numero" className="text-xs text-muted-foreground">Número *</Label>
                      <Input
                        id="numero"
                        type="text"
                        inputMode="numeric"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => {
                          setNumero(e.target.value);
                          setTaxaEntregaCalculada(null);
                        }}
                        className="mt-1 h-11"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="complemento" className="text-xs text-muted-foreground">Complemento</Label>
                      <Input
                        id="complemento"
                        type="text"
                        placeholder="Apto, Bloco..."
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        className="mt-1 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bairro" className="text-xs text-muted-foreground">Bairro</Label>
                    <Input
                      id="bairro"
                      type="text"
                      placeholder="Bairro"
                      value={bairro}
                      onChange={(e) => {
                        setBairro(e.target.value);
                        setTaxaEntregaCalculada(null);
                      }}
                      className="mt-1 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <Label htmlFor="cidade" className="text-xs text-muted-foreground">Cidade</Label>
                      <Input
                        id="cidade"
                        type="text"
                        placeholder="Cidade"
                        value={cidade}
                        onChange={(e) => {
                          setCidade(e.target.value);
                          setTaxaEntregaCalculada(null);
                        }}
                        className="mt-1 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado" className="text-xs text-muted-foreground">UF</Label>
                      <Input
                        id="estado"
                        type="text"
                        placeholder="SP"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                        maxLength={2}
                        className="mt-1 h-11 text-center"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 mt-2"
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
                        Calcular Frete
                      </>
                    )}
                  </Button>
                  
                  {taxaEntregaCalculada !== null && (
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Frete via Uber Flash</p>
                      <p className="text-lg font-bold text-primary">R$ {taxaEntregaCalculada.toFixed(2)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <RadioGroup 
                  value={formaPagamento} 
                  onValueChange={(v) => setFormaPagamento(v as PaymentMethod)}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: "pix", label: "Pix", icon: "📱" },
                    { value: "cartao", label: "Cartão", icon: "💳" },
                    { value: "dinheiro", label: "Dinheiro", icon: "💵" },
                    { value: "pagamento_retirada", label: "Na retirada", icon: "🏪" },
                  ].map((method) => (
                    <Label
                      key={method.value}
                      htmlFor={method.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                        formaPagamento === method.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                      <span className="text-lg">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Horário e Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div>
                  <Label htmlFor="horario" className="text-xs text-muted-foreground">
                    Horário Desejado (opcional)
                  </Label>
                  <Input
                    id="horario"
                    type="datetime-local"
                    value={horarioDesejado}
                    onChange={(e) => setHorarioDesejado(e.target.value)}
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="obs" className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Observações
                  </Label>
                  <Textarea
                    id="obs"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Sem lactose, entregar na portaria..."
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total and Checkout */}
            <Card className="mb-20 md:mb-0 border-t-4 border-primary">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} itens)</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {tipoEntrega === "delivery" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ {taxaEntrega.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>

                {/* Conditional Payment/Finish Button */}
                {isOnlinePayment ? (
                  <div className="border rounded-xl p-4 bg-muted/20 animate-fade-in">
                    <h3 className="font-bold mb-4 text-center text-primary flex items-center justify-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pagamento Seguro
                    </h3>
                    <PaymentBrick 
                      amount={total} 
                      // Passa um e-mail randomico para evitar erro de 'mesmo usuário' no teste
                      customerEmail={`test_user_${Math.floor(Math.random() * 100000)}@test.com`} 
                      onSuccess={handleFinalizarPedido}
                    />
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    onClick={() => handleFinalizarPedido()}
                    disabled={loading || (tipoEntrega === "delivery" && !taxaEntregaCalculada)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      "Finalizar Pedido"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrinho;