import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('[PrivateRoute] Estado:', {
      hasUser: !!user,
      hasProfile: !!userProfile,
      loading,
      path: location.pathname
    });
  }, [user, loading, userProfile, location]);

  if (loading) {
    console.log('[PrivateRoute] Carregando...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isPublicRoute = isLoginPage || isRegisterPage;

  if (!user || !userProfile) {
    console.log('[PrivateRoute] Sem autenticação. Redirecionando para:', isPublicRoute ? 'permanecendo na rota atual' : '/login');
    return isPublicRoute ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isPublicRoute) {
    console.log('[PrivateRoute] Usuário autenticado tentando acessar rota pública. Redirecionando para /home');
    return <Navigate to="/home" replace />;
  }

  console.log('[PrivateRoute] Renderizando rota protegida');
  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>
    </div>
  );
};

export default PrivateRoute; 