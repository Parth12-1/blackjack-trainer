import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/blackjack-trainer/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
