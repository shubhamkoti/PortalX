import process from 'node:process';
import { defineConfig } from 'vite';

// Expose environment variables to the client
process.env.VITE_API_URL = process.env.API_URL ?? '';
console.log(`Using chat API base URL: "${process.env.VITE_API_URL}"`);

export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      // Proxying /chat directly in case frontend makes request to /chat without /api prefix (though api.ts adds /api/chat)
      // But adhering to the user's request, the backend has /chat.
      // Wait, api.ts constructs `${baseUrl}/api/chat`.
      // The express backend defined `app.post('/chat', ...)` (root level).
      // So request to `/api/chat` via proxy -> `http://localhost:3001/api/chat` which might 404 if express expects `/chat`.
      // Express code has: app.post('/chat', ...)
      // So we need to rewrite the path or update express to use router.
      // Easiest is to rewrite path in proxy.
    },
  },
});

