import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno según el modo (development, production, etc.)
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: "./",  // Corrige rutas en producción
    build: {
      outDir: "dist",  // Archivos en `dist/`
      assetsDir: "assets",  // Archivos JS/CSS en `dist/assets/`
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_MUESTRAS_URL || "https://back-usuarios-f.onrender.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
});
