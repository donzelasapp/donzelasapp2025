import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Navigation from '../components/Navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - Estado do usuário:', user);
  console.log('ProtectedRoute - Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-white">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <Navigation />
    </div>
  );
};

export default ProtectedRoute; 