import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import handler from './api/gerar-plano.js';

function apiDevServerPlugin(env) {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/gerar-plano', async (req, res) => {
        // Injeta chave do Gemini carregada das variáveis de ambiente
        process.env.GOOGLE_API_KEY = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || '';
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 200;
          res.end();
          return;
        }

        const executeHandler = async () => {
          try {
            await handler(req, res);
          } catch (err) {
            console.error('Erro no middleware da API /api/gerar-plano:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        };

        if (req.body) {
          await executeHandler();
          return;
        }

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          try {
            req.body = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            req.body = rawBody;
          }
          await executeHandler();
        });
      });
    },
  };
}



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      apiDevServerPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'logo-bear.png', 'bg-fruits.jpg', 'apple-touch-icon.png'],
        manifest: {
          name: 'MSV Nutrição — Gestão Clínica',
          short_name: 'MSV Nutrição',
          description: 'Sistema de Gestão Clínica e Acompanhamento Nutricional',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        },
      }),
    ],
    server: {
      port: 3000,
      open: false,
    },
  };
});


