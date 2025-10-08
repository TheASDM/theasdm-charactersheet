import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const projectDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Change process.cwd() to projectDir
  const env = loadEnv(mode, projectDir, '');
  const enablePwa = env.VITE_ENABLE_PWA !== 'false';
  const plugins = [react()];

  if (enablePwa) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
        manifest: {
          name: 'D&D Character Sheet Generator',
          short_name: 'D&D CharSheet',
          description:
            'D&D 2024 Character Sheet Generator with Nimble TTRPG homebrew integration',
          theme_color: '#8B5A2B',
          background_color: '#1a1a1a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
        },
      })
    );
  }

  return {
    base: '/',
    plugins,
    resolve: {
      alias: {
        '@': resolve(projectDir, './src'),
      },
    },
    server: {
      allowedHosts: [
        'beta.vanyas.quest',
        'dnd.raptornet.dev',
        'localhost',
        '.localhost',
      ],
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
