import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Necesario para alias de rutas

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Transformación moderna de JSX (React 17+)
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // Alias para imports como @/components
    },
    extensions: ['.js', '.jsx', '.json'] // Extensiones que Vite reconocerá
  },

  server: {
    port: 5173, // Puerto personalizado (opcional)
    open: true   // Abre el navegador automáticamente
  },

  optimizeDeps: {
    include: ['react', 'react-dom'] // Pre-empaqueta estas dependencias
  }
});