import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0D1B2A',
          slate: '#23364D',
          gold: '#D4A017',
          lightGold: '#F2C14E',
          cream: '#F8F6F1',
          gray: '#9CA3AF'
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
