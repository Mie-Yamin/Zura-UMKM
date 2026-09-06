import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // Middleware lokal: Menjalankan simulasi backend /api/ai saat pengembangan (npm run dev)
      {
        name: 'local-api-ai-middleware',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const { messages, model = 'openai/gpt-oss-20b', temperature = 0.3 } = parsed;

                const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error: 'GROQ_API_KEY belum disetel di file .env lokal Anda.',
                    })
                  );
                  return;
                }

                const groqRes = await fetch(
                  'https://api.groq.com/openai/v1/chat/completions',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      model,
                      messages,
                      temperature,
                    }),
                  }
                );

                const data = await groqRes.json();
                res.statusCode = groqRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: err?.message || 'Gagal memproses request AI lokal',
                  })
                );
              }
            });
          });
        },
      },
    ],
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
  };
});
