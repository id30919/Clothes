import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    /**
     * 動態路徑設定：
     * 1. 當執行 npm run build 時 (command === 'build')，使用 GitHub Pages 的子路徑 '/Clothes/'
     * 2. 當執行 npm run dev 時，使用根目錄 '/'，確保本機 localhost:3000 能正常運作
     */
    base: command === 'build' ? '/Clothes/' : '/',

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        /**
         * 設定 @ 指向根目錄
         * 這樣在程式碼中可以使用 import ... from '@/src/components/...'
         */
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // 確保開發伺服器埠號固定（可依需求修改，例如 3000）
      port: 3000,
      // 保持 HMR 設定，確保本機開發時預覽順暢
      hmr: process.env.DISABLE_HMR !== 'true',
    },

    build: {
      // 設定打包輸出的目錄名稱，GitHub Actions 預設通常是 dist
      outDir: 'dist',
    },
  };
});