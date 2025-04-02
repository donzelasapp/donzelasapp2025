import { AuthError } from '@supabase/supabase-js';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelay: 5000,    // 5 segundos
  maxDelay: 15000,       // 15 segundos
  backoffFactor: 2
};

export class RateLimitHandler {
  private static attempts = new Map<string, number>();
  private static lastAttemptTime = new Map<string, number>();
  private static operationQueue: Array<{
    operation: () => Promise<any>,
    email: string,
    resolve: (value: any) => void,
    reject: (error: any) => void
  }> = [];
  private static isProcessingQueue = false;
  private static GLOBAL_COOLDOWN = 5000; // 5 segundos de cooldown global
  private static lastGlobalAttempt = 0;

  private static async processQueue() {
    if (this.isProcessingQueue || this.operationQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.operationQueue.length > 0) {
      const current = this.operationQueue[0];
      
      try {
        console.log(`Executando operação para ${current.email}...`);
        const result = await this.executeOperation(
          current.operation,
          current.email
        );
        current.resolve(result);
        this.operationQueue.shift();
        
        // Pequena pausa entre operações
        if (this.operationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        // Se for erro de rate limit, manter na fila e tentar novamente
        if (error?.message?.includes('rate limit') || error?.status === 429) {
          console.log('Rate limit atingido, aguardando...');
          await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.initialDelay));
          continue;
        }
        
        console.error(`Erro na operação para ${current.email}:`, error);
        current.reject(error);
        this.operationQueue.shift();
      }
    }
    
    this.isProcessingQueue = false;
  }

  private static async executeOperation<T>(
    operation: () => Promise<T>,
    email: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      console.error(`Tentativa ${retryCount + 1} falhou para ${email}:`, error);

      if (retryCount < DEFAULT_CONFIG.maxRetries) {
        const delay = Math.min(
          DEFAULT_CONFIG.initialDelay * Math.pow(DEFAULT_CONFIG.backoffFactor, retryCount),
          DEFAULT_CONFIG.maxDelay
        );
        
        console.log(`Aguardando ${delay/1000} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeOperation(operation, email, retryCount + 1);
      }
      throw error;
    }
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    email: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({ operation, email, resolve, reject });
      this.processQueue();
    });
  }

  static clearAttempts(email: string): void {
    this.attempts.delete(email);
    this.lastAttemptTime.delete(email);
  }

  static clearAllAttempts(): void {
    this.attempts.clear();
    this.lastAttemptTime.clear();
    this.operationQueue = [];
    this.isProcessingQueue = false;
    this.lastGlobalAttempt = 0;
  }
} 