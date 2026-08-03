import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // dist/index.html をそのままダブルクリック（file://）で開けるように相対パスにする
  plugins: [react()],
})
