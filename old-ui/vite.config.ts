import { URL, fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
        // Keep the browser's Host so Neon Auth's cookies and redirects use the dev origin.
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
