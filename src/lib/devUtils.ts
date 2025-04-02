/**
 * Utilitários para desenvolvimento e teste
 */

// Verifica se estamos em ambiente de desenvolvimento
export const isDev = import.meta.env.DEV;

// Notifica sobre alterações
export const notifyChanges = (componentName: string) => {
  if (isDev) {
    console.log(`[HMR] Componente ${componentName} atualizado ${new Date().toLocaleTimeString()}`);
  }
};

// Registra reinicializações automáticas de componentes
export class HotReloadTracker {
  private static counters: Record<string, number> = {};

  static track(componentName: string) {
    if (isDev) {
      if (!this.counters[componentName]) {
        this.counters[componentName] = 0;
      }
      this.counters[componentName]++;
      
      console.log(`[Recargas] ${componentName}: ${this.counters[componentName]} vezes`);
      
      // Pergunta se quer reiniciar após muitas alterações
      if (this.counters[componentName] % 5 === 0) {
        const restart = confirm(`Componente ${componentName} foi alterado ${this.counters[componentName]} vezes. Deseja reiniciar a aplicação para garantir um estado limpo?`);
        if (restart) {
          window.location.reload();
        }
      }
    }
    
    return null; // Para uso em useEffect sem efeitos colaterais
  }
}

// Oferece uma função para perguntar se o usuário quer reiniciar a aplicação
export const askForRestart = (message: string = "Alterações detectadas. Deseja reiniciar a aplicação?"): boolean => {
  if (isDev) {
    return confirm(message);
  }
  return false;
};

// Reusar entre componentes
export const useAutoSave = () => {
  if (isDev) {
    console.log("[AutoSave] Ativado");
  }
  
  return {
    saved: true,
    offerRestart: askForRestart
  };
}; 