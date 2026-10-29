import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Laravel: php artisan serve (port 8000)
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
});
