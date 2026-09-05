import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/grok-api': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grok-api/, ''),
      },
      '/groq-api': {
        target: 'https://api.groq.com/openai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/groq-api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Pecah vendor besar agar cache browser optimal & bundle entry lebih kecil.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'charts';
            }
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'spreadsheet';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (
              id.includes('react/') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'react';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
