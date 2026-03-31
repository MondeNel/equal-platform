/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'equal-bg': '#05050e',
        'equal-panel': '#0d0820',
        'equal-card': '#0a0a1e',
        'equal-border': '#1e1e3a',
        'equal-dim': '#5050a0',
        'equal-cyan': '#38bdf8',
        'equal-green': '#4ade80',
        'equal-red': '#f87171',
        'equal-gold': '#facc15',
        'equal-pink': '#f472b6',
        'equal-orange': '#f97316',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
