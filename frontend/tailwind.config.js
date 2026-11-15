/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#050B16',
          dark: '#081020',
          surface: '#0E1A33',
          card: '#132347',
          border: '#1E3566',
          hover: '#26427D',
        },
        cyan: {
          glow: '#32E6E0',
          dark: '#0e706c',
        },
        holo: {
          blue: '#278BFF',
          glow: '#59A6FF',
        },
        violet: {
          space: '#9275FF',
          glow: '#B39DFF',
        },
        emergency: {
          red: '#FF526B',
          glow: '#FF7B8E',
        },
        alert: {
          amber: '#FFA927',
          green: '#10B981',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 4px #32E6E0)' },
          '100%': { filter: 'drop-shadow(0 0 16px #278BFF)' },
        },
      },
    },
  },
  plugins: [],
};
