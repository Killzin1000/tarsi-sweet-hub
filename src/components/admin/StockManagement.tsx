import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Package } from "lucide-react";

interface Ingredient {
  id: string;
  nome: string;
  quantidade_atual: number;
  unidade: string;
}

const StockManagement = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [nome, setNome] = useState("");
  const [quantidadeAtual, setQuantidadeAtual] = useState("");
  const [unidade, setUnidade] = useState("");

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredientes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar ingredientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nome || !quantidadeAtual || !unidade) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { error } = await supabase.from("ingredientes").insert({
        nome,
        quantidade_atual: parseFloat(quantidadeAtual),
        unidade
      });

      if (error) throw error;

      toast.success("Ingrediente adicionado com sucesso");
      setDialogOpen(false);
      setNome("");
      setQuantidadeAtual("");
      setUnidade("");
      loadIngredients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar ingrediente");
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from("ingredientes")
        .update({ quantidade_atual: newQuantity })
        .eq("id", id);

      if (error) throw error;
      toast.success("Quantidade atualizada");
      loadIngredients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar quantidade");
    }
  };

  if (loading) {
    return <div>Carregando estoque...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>Gerencie ingredientes e produtos</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ingredients">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            <TabsTrigger value="products">Produtos Prontos</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ingrediente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Ingrediente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Chocolate"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quantidade">Quantidade Atual</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        step="0.01"
                        value={quantidadeAtual}
                        onChange={(e) => setQuantidadeAtual(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="unidade">Unidade</Label>
                      <Input
                        id="unidade"
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        placeholder="Ex: kg, g, ml, un"
                      />
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {ingredients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum ingrediente cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {ingredients.map(ingredient => (
                  <div
                    key={ingredient.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{ingredient.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque: {ingredient.quantidade_atual} {ingredient.unidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24"
                        defaultValue={ingredient.quantidade_atual}
                        onBlur={(e) =>
                          updateQuantity(ingredient.id, parseFloat(e.target.value))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {ingredient.unidade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            <p className="text-muted-foreground text-center py-8">
              Estoque de produtos prontos em desenvolvimento
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockManagement;
