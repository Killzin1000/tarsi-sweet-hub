import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ShoppingCart, Plus, Minus, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImages";

interface Product {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  imagem_url: string | null;
  ativo: boolean;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const addToCart = () => {
    setIsAdding(true);
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      id: product.id + Date.now(),
      produto_id: product.id,
      nome: product.nome,
      preco: product.preco,
      quantidade: quantity,
      imagem_url: product.imagem_url
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{quantity}x {product.nome} adicionado!</span>
        </div>
      );
    }, 500);
  };

  const imageUrl = product.imagem_url ? getProductImage(product.imagem_url) : null;

  return (
    <div
      className="group relative bg-card rounded-3xl overflow-hidden card-shadow-sweet transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {/* Category Badge */}
        <Badge 
          className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm text-foreground hover:bg-background/90 border-0 font-medium"
        >
          {product.categoria}
        </Badge>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-300 ${
            isFavorite 
              ? 'bg-primary text-primary-foreground scale-110' 
              : 'bg-background/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Product Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.nome}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <ChefHat className={`h-20 w-20 text-muted-foreground/50 transition-transform duration-500 ${
              isHovered ? 'scale-110 rotate-12' : ''
            }`} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Description */}
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {product.nome}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {product.descricao || "Delicioso doce artesanal feito com muito carinho"}
        </p>

        {/* Price */}
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold text-primary">
            R$ {product.preco.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-muted-foreground line-through mb-1">
            R$ {(product.preco * 1.2).toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground">Quantidade:</span>
          <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 rounded-full hover:bg-background transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1.5 rounded-full hover:bg-background transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          className={`w-full h-12 text-base font-semibold rounded-2xl transition-all duration-300 ${
            isAdding 
              ? 'bg-accent text-accent-foreground scale-95' 
              : 'hover:scale-105 hover:shadow-lg hover:shadow-primary/30'
          }`}
          onClick={addToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>Adicionando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Adicionar ao Carrinho</span>
            </div>
          )}
        </Button>
      </div>

      {/* Decorative Elements */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export default ProductCard;
