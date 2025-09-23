/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          sky: '#38bdf8',
          indigo: '#6366f1',
        },
      },
    },
  },
  plugins: [],
}
