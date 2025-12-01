import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface Transaction {
  id: string;
  tipo: TransactionType;
  valor: number;
  descricao: string;
  forma_pagamento: PaymentMethod | null;
  data_hora: string | null;
}

const CashRegister = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [tipo, setTipo] = useState<TransactionType>("entrada");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("caixa")
        .select("*")
        .order("data_hora", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!valor || !descricao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { error } = await supabase.from("caixa").insert({
        tipo,
        valor: parseFloat(valor),
        descricao,
        forma_pagamento: formaPagamento
      });

      if (error) throw error;

      toast.success("Transação registrada com sucesso");
      setDialogOpen(false);
      setValor("");
      setDescricao("");
      setFormaPagamento(null);
      loadTransactions();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar transação");
    }
  };

  const calcularSaldo = () => {
    return transactions.reduce((acc, t) => {
      return t.tipo === "entrada" ? acc + t.valor : acc - t.valor;
    }, 0);
  };

  const calcularEntradas = () => {
    return transactions
      .filter(t => t.tipo === "entrada")
      .reduce((acc, t) => acc + t.valor, 0);
  };

  const calcularSaidas = () => {
    return transactions
      .filter(t => t.tipo === "saida")
      .reduce((acc, t) => acc + t.valor, 0);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {calcularEntradas().toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {calcularSaidas().toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${calcularSaldo() >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {calcularSaldo().toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Controle de Caixa</CardTitle>
              <CardDescription>Registre entradas e saídas</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TransactionType)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrada" id="entrada" />
                        <Label htmlFor="entrada">Entrada</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saida" id="saida" />
                        <Label htmlFor="saida">Saída</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="desc">Descrição</Label>
                    <Textarea
                      id="desc"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Ex: Compra de ingredientes"
                    />
                  </div>

                  <div>
                    <Label>Forma de Pagamento (opcional)</Label>
                    <RadioGroup value={formaPagamento || ""} onValueChange={(v) => setFormaPagamento(v as PaymentMethod)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix-caixa" />
                        <Label htmlFor="pix-caixa">Pix</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dinheiro" id="dinheiro-caixa" />
                        <Label htmlFor="dinheiro-caixa">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao" id="cartao-caixa" />
                        <Label htmlFor="cartao-caixa">Cartão</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    Registrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {transaction.tipo === "entrada" ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.data_hora &&
                        new Date(transaction.data_hora).toLocaleString("pt-BR")}
                      {transaction.forma_pagamento && ` • ${transaction.forma_pagamento}`}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-lg font-bold ${
                    transaction.tipo === "entrada" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.tipo === "entrada" ? "+" : "-"}R${" "}
                  {transaction.valor.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegister;
