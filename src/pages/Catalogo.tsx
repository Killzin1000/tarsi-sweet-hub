import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, ShoppingBag, Search, Sparkles, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { seedInitialProducts } from "@/lib/seedData";
import ProductCard from "@/components/ProductCard";

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
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadProducts();
    seedInitialData();
    updateCartCount();
    
    // Listen for cart changes
    const handleStorageChange = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  };

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

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      "Todos": "✨",
      "Bolos": "🎂",
      "Brigadeiros": "🍫",
      "Brownies": "🍪",
      "Trufas": "🍬",
      "Tortas": "🥧",
      "Cupcakes": "🧁",
    };
    return emojis[category] || "🍰";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <ChefHat className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-12" />
              <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Tarsi Sweet
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/meus-pedidos">
              <Button variant="ghost" className="hidden sm:flex">Meus Pedidos</Button>
            </Link>
            <Link to="/carrinho" className="relative">
              <Button size="icon" variant="outline" className="rounded-full h-11 w-11 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
              <span className="text-foreground">Nosso </span>
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Catálogo
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
              Cada doce é uma obra de arte feita com amor e ingredientes selecionados
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <Input
                type="text"
                placeholder="Buscar doces deliciosos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg rounded-2xl border-2 border-muted focus:border-primary bg-card shadow-lg transition-all duration-300 focus:shadow-xl focus:shadow-primary/10"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 text-muted-foreground mr-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">Filtrar:</span>
            </div>
            <div className="flex gap-2">
              {categories.map((category, index) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-2 h-auto font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category 
                      ? 'shadow-lg shadow-primary/30 scale-105' 
                      : 'hover:bg-muted hover:scale-105'
                  }`}
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <span className="mr-1.5">{getCategoryEmoji(category)}</span>
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {loading ? 'Carregando...' : (
              <>
                <span className="font-semibold text-foreground">{filteredProducts.length}</span>
                {' '}produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded-lg w-3/4" />
                  <div className="h-4 bg-muted rounded-lg w-full" />
                  <div className="h-8 bg-muted rounded-lg w-1/2" />
                  <div className="h-12 bg-muted rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-6">
              <ChefHat className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Nenhum doce encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Tente ajustar sua busca ou explorar outras categorias
            </p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchTerm(""); setSelectedCategory("Todos"); }}
              className="rounded-full"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && (
        <Link 
          to="/carrinho"
          className="fixed bottom-6 right-6 md:hidden z-50 animate-scale-in"
        >
          <Button 
            size="lg" 
            className="rounded-full h-16 w-16 shadow-2xl shadow-primary/40 hover:scale-110 transition-transform duration-300"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-sm font-bold h-6 w-6 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Catalogo;
