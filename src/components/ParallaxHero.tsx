import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import heroCake from "@/assets/hero-cake-parallax.jpg";

interface ParallaxHeroProps {
  isAuthenticated: boolean;
}

const ParallaxHero = ({ isAuthenticated }: ParallaxHeroProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative h-screen overflow-hidden"
    >
      {/* Background Layer - Moves slower (Parallax) */}
      <div 
        className="absolute inset-0 scale-110"
        style={{ 
          transform: `translateY(${scrollY * 0.5}px) scale(1.1)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background z-10" />
        <img 
          src={heroCake} 
          alt="Bolo artesanal sendo construído" 
          className={`w-full h-full object-cover transition-all duration-1000 ${
            isLoaded ? 'scale-100 blur-0' : 'scale-110 blur-sm'
          }`}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              transform: `translateY(${scrollY * (0.2 + Math.random() * 0.3)}px)`,
            }}
          />
        ))}
      </div>

      {/* Content Layer - Moves faster for depth effect */}
      <div 
        className="relative z-20 h-full flex flex-col items-center justify-center px-4"
        style={{ 
          transform: `translateY(${scrollY * 0.3}px)`,
          opacity: Math.max(0, 1 - scrollY / 500),
        }}
      >
        {/* Logo/Brand */}
        <div 
          className={`transition-all duration-1000 delay-300 ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="text-primary/80 uppercase tracking-[0.3em] text-sm font-medium mb-4 block">
            Confeitaria Artesanal
          </span>
        </div>

        {/* Main Title with Staggered Animation */}
        <h1 
          className={`text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 transition-all duration-1000 delay-500 ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="block text-white drop-shadow-2xl" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
            Tarsi Sweet
          </span>
          <span 
            className="block text-primary mt-2 text-3xl md:text-4xl lg:text-5xl font-light"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            Doces que encantam
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-lg md:text-xl text-white/90 text-center max-w-2xl mb-10 transition-all duration-1000 delay-700 ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
        >
          Cada camada conta uma história de sabor, cada decoração é feita com amor artesanal
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex gap-4 flex-wrap justify-center transition-all duration-1000 delay-1000 ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <Link to="/catalogo">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
            >
              Explorar Catálogo
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-6 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Criar Conta
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-1000 delay-1200 ${
          isLoaded 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <div className="flex flex-col items-center text-white/70 animate-bounce">
          <span className="text-sm mb-2">Descubra mais</span>
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default ParallaxHero;
