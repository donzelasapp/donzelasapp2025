import React, { useState } from 'react';
import { ShoppingCart, Heart, Share } from 'lucide-react';

// Dados simulados de produtos
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Lingerie Butterfly Love",
    price: 159.90,
    description: "Conjunto de lingerie premium com detalhes em renda.",
    image: "https://images.unsplash.com/photo-1602438221185-1176f831db77?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Vibrador Rose Gold",
    price: 299.90,
    description: "Vibrador de alta qualidade com 6 modos de vibração.",
    image: "https://images.unsplash.com/photo-1584947897878-55596cd20292?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Óleo de Massagem Relaxante",
    price: 69.90,
    description: "Óleo aromático para massagem e relaxamento do corpo.",
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&auto=format&fit=crop&q=80"
  }
];

// Tipo para produtos
type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
};

const Products = () => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const [cartCount, setCartCount] = useState(0);

  const handleLike = (productId: number) => {
    setLikedProducts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(productId)) {
        newLiked.delete(productId);
      } else {
        newLiked.add(productId);
      }
      return newLiked;
    });
  };

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  const handleShare = (productName: string) => {
    if (navigator.share) {
      navigator.share({
        title: productName,
        text: `Confira este produto incrível na Donzelas: ${productName}`,
        url: window.location.href,
      })
      .catch(error => console.log('Erro ao compartilhar:', error));
    } else {
      alert('Compartilhamento não suportado neste navegador');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Produtos</h1>
            <p className="text-gray-300 mt-1">Descubra nossos produtos exclusivos</p>
          </div>
          
          <div className="relative">
            <ShoppingCart className="text-white" size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </header>
        
        <div className="space-y-6">
          {products.map(product => (
            <div key={product.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-60 object-cover"
              />
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-white">{product.name}</h2>
                  <span className="font-medium text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">
                  {product.description}
                </p>
                
                <div className="flex justify-between">
                  <button 
                    onClick={() => handleLike(product.id)}
                    className={`rounded-full p-2 ${
                      likedProducts.has(product.id) 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-gray-800 text-gray-400'
                    } hover:bg-primary/30 transition-colors`}
                  >
                    <Heart size={20} />
                  </button>
                  
                  <button 
                    onClick={() => handleAddToCart()}
                    className="rounded-lg bg-primary py-2 px-4 text-white hover:bg-primary-dark transition-colors"
                  >
                    Adicionar ao Carrinho
                  </button>
                  
                  <button 
                    onClick={() => handleShare(product.name)}
                    className="rounded-full p-2 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                  >
                    <Share size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
