import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/avqa-viewer/' // 👈 cần thiết nếu deploy vào subfolder
});
