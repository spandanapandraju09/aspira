/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c9',
          400: '#8590a8',
          500: '#67738d',
          600: '#525c74',
          700: '#434b5e',
          800: '#3a414f',
          900: '#1f2330',
          950: '#131620',
        },
        brand: {
          50: '#ffe4e6',
          100: '#ffccd5',
          200: '#ffb3c1',
          300: '#ff99ad',
          400: '#ff80a0',
          500: '#ff6694',
          600: '#ff4f88',
          700: '#ff357c',
          800: '#ff1b70',
          900: '#ff0064',
        },
        accent: {
          50: '#fff8eb',
          100: '#ffedc6',
          200: '#ffd988',
          300: '#ffc04a',
          400: '#ffa721',
          500: '#f5810b',
          600: '#d96206',
          700: '#b44608',
          800: '#92370e',
          900: '#782e0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
}
