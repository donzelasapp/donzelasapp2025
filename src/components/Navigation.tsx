import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  ShoppingBag as ShoppingBagIcon, 
  MessageCircle as MessageCircleIcon, 
  Sparkles as SparklesIcon, 
  Heart as HeartIcon, 
  User as UserIcon 
} from 'lucide-react';
import { useAuth } from '../auth';

// Habilitar HMR
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      newModule.default;
    }
  });
}

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!user) return null;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-[9999] shadow-lg">
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/home')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/home' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <HomeIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button 
            onClick={() => navigate('/products')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/products' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <ShoppingBagIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Produtos</span>
          </button>
          
          <button 
            onClick={() => navigate('/chats')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/chats' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageCircleIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Chats</span>
          </button>
          
          <button 
            onClick={() => navigate('/promos')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/promos' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <SparklesIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Promos</span>
          </button>
          
          <button 
            onClick={() => navigate('/donzela')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/donzela' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <HeartIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Donzela</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile')} 
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              location.pathname === '/profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <UserIcon size={22} strokeWidth={1.8} />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;