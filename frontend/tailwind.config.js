/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FFFDF8',
          100: '#FFF9EF',
          200: '#F7EBD5',
          300: '#EAD9B9',
          400: '#D9C49F',
          500: '#D5B77C',
          600: '#B58A45',
          700: '#776A5C',
          800: '#493421',
          900: '#29231D',
        },
        gold: {
          light: '#D5B77C',
          DEFAULT: '#B58A45',
          dark: '#8A6A35',
        },
        terracotta: {
          DEFAULT: '#A94C32',
          dark: '#8A3D28',
        },
        maroon: {
          DEFAULT: '#702D27',
          dark: '#5A2320',
        },
        heritage: {
          ivory: '#FFF9EF',
          card: '#FFFDF8',
          border: '#D9C49F',
          text: '#776A5C',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Cormorant Garamond', 'serif'],
        indic: ['Noto Sans Malayalam', 'Noto Sans Devanagari', 'sans-serif'],
      },
      backgroundImage: {
        'parchment-texture': "url('/textures/parchment-bg.png')",
        'manuscript-grain': "url('/textures/manuscript-grain.png')",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'scan-line': 'scan-line 3s ease-in-out infinite',
        'dust': 'dust 12s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        dust: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: 0 },
          '10%': { opacity: 1 },
          '90%': { opacity: 1 },
          '100%': { transform: 'translateY(-100vh) translateX(100px)', opacity: 0 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(181, 138, 69, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(181, 138, 69, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
