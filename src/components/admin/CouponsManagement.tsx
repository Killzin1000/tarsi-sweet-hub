import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

interface Coupon {
  id: string;
  codigo: string;
  desconto_percentual: number | null;
  desconto_valor: number | null;
  minimo_compra: number | null;
  validade: string | null;
  ativo: boolean | null;
}

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [codigo, setCodigo] = useState("");
  const [descontoPercentual, setDescontoPercentual] = useState("");
  const [descontoValor, setDescontoValor] = useState("");
  const [minimoCompra, setMinimoCompra] = useState("");
  const [validade, setValidade] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCodigo("");
    setDescontoPercentual("");
    setDescontoValor("");
    setMinimoCompra("");
    setValidade("");
    setAtivo(true);
    setEditingCoupon(null);
  };

  const handleSubmit = async () => {
    if (!codigo) {
      toast.error("Informe o código do cupom");
      return;
    }

    if (!descontoPercentual && !descontoValor) {
      toast.error("Informe o desconto percentual ou valor");
      return;
    }

    try {
      const couponData = {
        codigo: codigo.toUpperCase(),
        desconto_percentual: descontoPercentual ? parseInt(descontoPercentual) : null,
        desconto_valor: descontoValor ? parseFloat(descontoValor) : null,
        minimo_compra: minimoCompra ? parseFloat(minimoCompra) : null,
        validade: validade || null,
        ativo
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("cupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        toast.success("Cupom atualizado com sucesso");
      } else {
        const { error } = await supabase.from("cupons").insert(couponData);

        if (error) throw error;
        toast.success("Cupom criado com sucesso");
      }

      setDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cupom");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCodigo(coupon.codigo);
    setDescontoPercentual(coupon.desconto_percentual?.toString() || "");
    setDescontoValor(coupon.desconto_valor?.toString() || "");
    setMinimoCompra(coupon.minimo_compra?.toString() || "");
    setValidade(coupon.validade || "");
    setAtivo(coupon.ativo ?? true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cupom?")) return;

    try {
      const { error } = await supabase.from("cupons").delete().eq("id", id);

      if (error) throw error;
      toast.success("Cupom excluído com sucesso");
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cupom");
    }
  };

  if (loading) {
    return <div>Carregando cupons...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestão de Cupons</CardTitle>
            <CardDescription>Crie e gerencie cupons de desconto</CardDescription>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="codigo">Código do Cupom</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="DESCONTO10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentual">Desconto % (ou)</Label>
                    <Input
                      id="percentual"
                      type="number"
                      value={descontoPercentual}
                      onChange={(e) => setDescontoPercentual(e.target.value)}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="valor">Desconto R$</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={descontoValor}
                      onChange={(e) => setDescontoValor(e.target.value)}
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="minimo">Compra Mínima (R$)</Label>
                  <Input
                    id="minimo"
                    type="number"
                    step="0.01"
                    value={minimoCompra}
                    onChange={(e) => setMinimoCompra(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="validade">Validade</Label>
                  <Input
                    id="validade"
                    type="date"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
                  <Label htmlFor="ativo">Cupom Ativo</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingCoupon ? "Atualizar" : "Criar"} Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum cupom cadastrado
            </p>
          ) : (
            coupons.map(coupon => (
              <div
                key={coupon.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <p className="font-bold text-lg">{coupon.codigo}</p>
                  <p className="text-sm text-muted-foreground">
                    {coupon.desconto_percentual
                      ? `${coupon.desconto_percentual}% de desconto`
                      : `R$ ${coupon.desconto_valor?.toFixed(2)} de desconto`}
                  </p>
                  {coupon.minimo_compra && (
                    <p className="text-sm text-muted-foreground">
                      Compra mínima: R$ {coupon.minimo_compra.toFixed(2)}
                    </p>
                  )}
                  {coupon.validade && (
                    <p className="text-sm text-muted-foreground">
                      Válido até: {new Date(coupon.validade).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  <p className="text-sm">
                    Status:{" "}
                    <span className={coupon.ativo ? "text-green-600" : "text-red-600"}>
                      {coupon.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleEdit(coupon)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponsManagement;
