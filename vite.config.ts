import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar env file baseado no modo
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        include: "**/*.tsx",
        fastRefresh: true,
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { refresh: true }]
          ]
        }
      })
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    define: {
      // Expor variáveis de ambiente para o cliente
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://potbcroawzbgtqfjmuwr.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGJjcm9hd3piZ3RxZmptdXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0ODk4MDMsImV4cCI6MjA1ODA2NTgwM30.hmqyu4BdVuJh0QJCCIYc1kFqbu1w-vL_eCC1d4v_jVg'),
    },
    // Configuração aprimorada de HMR (Hot Module Replacement)
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 100
      },
      hmr: {
        overlay: true,
        clientPort: 5173,
        timeout: 120000,
        protocol: 'ws',
        host: 'localhost',
        path: '/hmr',
      },
      middlewareMode: false,
    },
    build: {
      sourcemap: true,
      commonjsOptions: {
        include: [/node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    }
  };
});
