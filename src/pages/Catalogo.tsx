import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, ShoppingBag, Search } from "lucide-react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImages";
import { seedInitialProducts } from "@/lib/seedData";

interface Product {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  imagem_url: string | null;
  ativo: boolean;
}

const Catalogo = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  useEffect(() => {
    loadProducts();
    seedInitialData();
  }, []);

  const seedInitialData = async () => {
    await seedInitialProducts();
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.categoria)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Tarsi Sweet</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/meus-pedidos">
              <Button variant="ghost">Meus Pedidos</Button>
            </Link>
            <Link to="/carrinho">
              <Button size="icon" variant="outline">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Nosso Catálogo</h1>
          <p className="text-muted-foreground text-lg">Descubra nossos deliciosos doces artesanais</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="card-shadow-sweet transition-sweet hover:scale-105">
                <CardHeader>
                  <div className="aspect-square rounded-lg bg-muted mb-4 overflow-hidden">
                    {product.imagem_url && getProductImage(product.imagem_url) ? (
                      <img
                        src={getProductImage(product.imagem_url)!}
                        alt={product.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardTitle>{product.nome}</CardTitle>
                  <CardDescription>{product.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{product.categoria}</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {product.preco.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => toast.info("Carrinho em desenvolvimento")}>
                    Adicionar ao Carrinho
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;