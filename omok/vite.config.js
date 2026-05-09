import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포 시 저장소 이름을 base로 설정
  // 로컬 개발은 '/'로 자동 처리됨
  base: process.env.NODE_ENV === 'production' ? '/OMOK/' : '/',
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.js'],
  },
})
