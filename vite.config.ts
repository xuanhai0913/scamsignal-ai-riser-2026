import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/v1': 'http://127.0.0.1:8080',
        '/api': 'http://127.0.0.1:8080',
        '/health': 'http://127.0.0.1:8080',
      },
      // AI Studio's preview proxy does not expose a stable Vite WebSocket. Keep
      // file watching so Code-tab saves invalidate transformed modules, but use
      // an explicit preview refresh instead of a failing HMR connection.
      hmr: false,
      watch: {},
    },
  };
});
