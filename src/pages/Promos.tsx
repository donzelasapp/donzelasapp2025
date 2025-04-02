import React, { useState } from 'react';
import { Sparkles, Star, Check, Gift, Crown, ShoppingCart } from 'lucide-react';
import { useAuth } from '../auth';

type PromoPackage = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  highlight?: boolean;
  discount?: number;
  icon: React.ReactNode;
};

type SpecialOffer = {
  id: string;
  title: string;
  description: string;
  endDate: string;
  image: string;
  discountPercent: number;
};

// Componente de Promoções - Exibe ofertas e descontos especiais
const Promos = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'packages' | 'offers'>('packages');
  
  // Pacotes disponíveis
  const packages: PromoPackage[] = [
    {
      id: 'basic',
      name: 'Pacote Básico',
      price: 0,
      description: 'Perfeito para começar sua jornada',
      features: [
        'Conversas limitadas',
        'Acesso a perfis básicos',
        'Interface com anúncios'
      ],
      icon: <Star className="h-8 w-8 text-gray-400" />
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 29.90,
      originalPrice: 39.90,
      description: 'A melhor escolha para encontrar seu par ideal',
      features: [
        'Conversas ilimitadas',
        'Sem anúncios',
        'Acesso a perfis verificados',
        'Destaque na busca',
        'Suporte prioritário'
      ],
      highlight: true,
      discount: 25,
      icon: <Crown className="h-8 w-8 text-yellow-500" />
    },
    {
      id: 'vip',
      name: 'Exclusivo VIP',
      price: 49.90,
      description: 'Experiência premium completa',
      features: [
        'Todos os benefícios Premium',
        'Eventos exclusivos',
        'Filtros avançados de busca',
        'Visibilidade máxima',
        'Acesso a perfis verificados Premium'
      ],
      icon: <Gift className="h-8 w-8 text-purple-500" />
    }
  ];
  
  // Ofertas especiais
  const specialOffers: SpecialOffer[] = [
    {
      id: 'summer_sale',
      title: 'Promoção de Inauguração',
      description: 'Aproveite 50% de desconto em todos os planos Premium por 3 meses!',
      endDate: '2023-12-31',
      image: 'https://images.unsplash.com/photo-1565339119892-7f5dd3acc4e8?w=800&auto=format&fit=crop&q=60',
      discountPercent: 50
    },
    {
      id: 'vip_offer',
      title: 'Oferta VIP',
      description: 'Assine o plano VIP agora e ganhe uma sessão de consultoria de relacionamento gratuita.',
      endDate: '2023-11-30',
      image: 'https://images.unsplash.com/photo-1542327897-4141b355e20e?w=800&auto=format&fit=crop&q=60',
      discountPercent: 0
    },
    {
      id: 'referral',
      title: 'Indique um Amigo',
      description: 'Convide seus amigos e ganhe 1 mês grátis de Premium para cada indicação que se tornar Premium.',
      endDate: '2024-01-31',
      image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&auto=format&fit=crop&q=60',
      discountPercent: 0
    }
  ];
  
  // Renderiza um pacote
  const renderPackage = (pkg: PromoPackage) => (
    <div 
      key={pkg.id}
      className={`
        relative rounded-xl overflow-hidden
        ${pkg.highlight 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30' 
          : 'bg-gray-900/50'}
        backdrop-blur-sm p-6 shadow-xl transition-transform hover:scale-[1.02]
      `}
    >
      {pkg.highlight && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-white text-xs font-bold px-3 py-1 transform rotate-45 translate-y-2 translate-x-8">
            POPULAR
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-4">
        {pkg.icon}
        <div className="ml-3">
          <h3 className={`text-xl font-semibold ${pkg.highlight ? 'text-primary' : 'text-white'}`}>
            {pkg.name}
          </h3>
          {pkg.discount ? (
            <div className="text-xs font-medium bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full inline-block mt-1">
              {pkg.discount}% OFF
            </div>
          ) : null}
        </div>
      </div>
      
      <p className="text-gray-400 text-sm mb-4">
        {pkg.description}
      </p>
      
      <div className="mb-6">
        <div className="flex items-end">
          {pkg.price === 0 ? (
            <span className="text-2xl font-bold text-white">Grátis</span>
          ) : (
            <>
              <span className="text-2xl font-bold text-white">R$ {pkg.price.toFixed(2)}</span>
              <span className="text-gray-400 text-sm ml-1">/mês</span>
            </>
          )}
        </div>
        
        {pkg.originalPrice && (
          <div className="text-sm text-gray-500 line-through">
            De R$ {pkg.originalPrice.toFixed(2)}
          </div>
        )}
      </div>
      
      <ul className="space-y-2 mb-6">
        {pkg.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        className={`
          w-full py-2 rounded-lg font-medium transition-colors
          ${pkg.highlight 
            ? 'bg-primary hover:bg-primary-dark text-white' 
            : 'bg-white/10 hover:bg-white/20 text-white'}
        `}
      >
        {pkg.price === 0 ? 'Plano Atual' : 'Assinar Agora'}
      </button>
    </div>
  );

  // Renderiza uma oferta especial
  const renderOffer = (offer: SpecialOffer) => (
    <div 
      key={offer.id}
      className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl"
    >
      <div className="h-48 overflow-hidden relative">
        <img 
          src={offer.image} 
          alt={offer.title} 
          className="w-full h-full object-cover"
        />
        
        {offer.discountPercent > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {offer.discountPercent}% OFF
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-xl font-semibold text-white">{offer.title}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-300 text-sm mb-3">
          {offer.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-amber-500">
            Válido até {new Date(offer.endDate).toLocaleDateString('pt-BR')}
          </div>
          
          <button className="flex items-center space-x-1 bg-primary/80 hover:bg-primary text-white px-3 py-1 rounded-lg text-sm transition-colors">
            <ShoppingCart className="h-4 w-4" />
            <span>Aproveitar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Promoções</h1>
          <p className="text-gray-300 mt-2">
            {userProfile.accountType === 'donzela' 
              ? 'Ofertas exclusivas para donzelas' 
              : 'Ofertas especiais para você'}
          </p>
        </header>
        
        {/* Abas de navegação */}
        <div className="flex mb-6 bg-gray-900/30 rounded-lg p-1 max-w-xs">
          <button 
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'packages' 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center justify-center">
              <Crown className="h-4 w-4 mr-1" />
              <span>Assinaturas</span>
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('offers')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'offers' 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>Ofertas</span>
            </span>
          </button>
        </div>
        
        {/* Conteúdo das abas */}
        {activeTab === 'packages' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map(renderPackage)}
          </div>
        ) : (
          <div className="space-y-6">
            {specialOffers.map(renderOffer)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Promos;
