import react from '@vitejs/plugin-react';
import { URL, fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^#\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
        // The per-icon files are CommonJS; the production bundle would render their module object.
        {
          find: /^@mui\/icons-material\/(?!esm\/)([^/]+)$/,
          replacement: '@mui/icons-material/esm/$1',
        },
      ],
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:1338',
          changeOrigin: true,
        },
        '/external-api': {
          target: env.VITE_MAIN_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/external-api/, '/api'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
