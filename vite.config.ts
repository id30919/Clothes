import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // 確保部署到 GitHub Pages 時的路徑正確
    base: '/Clothes/', 
    
    plugins: [react(), tailwindcss()],
    
    resolve: {
      alias: {
        // 設定 @ 指向根目錄，方便程式碼中引用組件
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    server: {
      // 保持 HMR 設定，確保本機開發時預覽順暢
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});