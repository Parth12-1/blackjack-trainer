/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: '#1a5c38',
        'felt-dark': '#0f3d26',
        gold: '#f59e0b',
      },
    },
  },
  plugins: [],
}
