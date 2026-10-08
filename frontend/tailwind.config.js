/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fff1f1',
          200: '#ffd3d0',
          300: '#ffa099',
          400: '#f57268',
          500: '#e85d4a',
          600: '#d1463a',
          700: '#b3392e',
        },
        forest: {
          50: '#f0faf5',
          100: '#e6f7ee',
          200: '#b3e0cc',
          300: '#80c9a9',
          400: '#4caf85',
          500: '#28704f',
          600: '#1f5a3a',
          700: '#18472f',
        },
        mint: {
          50: '#ebf5ef',
          100: '#d6efe4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}