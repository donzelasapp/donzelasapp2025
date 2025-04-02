import { useEffect } from 'react';
import { useAuth } from '../auth';

// Componente para forçar o logout e redirecionar
const ForceLogout = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    // Função para executar logout e redirecionamento
    const logout = async () => {
      try {
        // Limpar armazenamentos
        localStorage.clear();
        sessionStorage.clear();
        
        // Remover qualquer cookie de autenticação definindo expiração no passado
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        // Tentar fazer logout via API
        await signOut();
        
        // Forçar navegação após pequeno delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        
        // Em caso de erro, ainda tentamos redirecionar
        window.location.href = '/login';
      }
    };

    // Executar imediatamente
    logout();
    
    // Segunda linha de defesa: se por algum motivo a função acima falhar
    const redirectTimeout = setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    
    return () => clearTimeout(redirectTimeout);
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="p-6 bg-gray-900/50 rounded-xl max-w-md text-center">
        <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <h1 className="text-xl font-medium text-white mb-2">Saindo...</h1>
        <p className="text-gray-400">Você será redirecionado em instantes.</p>
      </div>
    </div>
  );
};

export default ForceLogout; 
