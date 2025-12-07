import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Award, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ParallaxHero from "@/components/ParallaxHero";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Tarsi Sweet</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/catalogo">
              <Button variant="ghost">Catálogo</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/meus-pedidos">
                  <Button variant="ghost">Meus Pedidos</Button>
                </Link>
                <Link to="/carrinho">
                  <Button size="icon" variant="outline">
                    <ShoppingBag className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Parallax Hero Section */}
      <ParallaxHero isAuthenticated={isAuthenticated} />

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl bg-card card-shadow-sweet transition-sweet hover:scale-105">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Feito com Amor</h3>
            <p className="text-muted-foreground">
              Cada doce é preparado artesanalmente com ingredientes de primeira qualidade
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card card-shadow-sweet transition-sweet hover:scale-105">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/50 mb-4">
              <ShoppingBag className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Entrega Rápida</h3>
            <p className="text-muted-foreground">
              Receba seus doces fresquinhos no conforto da sua casa ou retire na loja
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card card-shadow-sweet transition-sweet hover:scale-105">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
              <Award className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Programa de Fidelidade</h3>
            <p className="text-muted-foreground">
              Acumule pontos e selos a cada compra e ganhe recompensas especiais
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl p-12 text-center text-white card-shadow-sweet">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para adoçar seu dia?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Explore nosso catálogo e descubra o doce perfeito para cada momento
          </p>
          <Link to="/catalogo">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Começar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Tarsi Sweet. Feito com 💖 e muito açúcar.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;