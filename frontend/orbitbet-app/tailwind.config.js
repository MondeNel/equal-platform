/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // eQual Brand Colors
        'equal-bg': '#05050e',
        'equal-panel': '#0d0820',
        'equal-card': '#0a0a1e',
        'equal-border': '#1e1e3a',
        // Functional Colors
        'equal-cyan': '#38bdf8',
        'equal-gold': '#facc15',
        'equal-orange': '#f97316',
        'equal-green': '#4ade80',
        'equal-red': '#f87171',
        'equal-purple': '#a78bfa',
      },
      fontFamily: {
        mono: ['"Courier New"', 'monospace'],
      },
      letterSpacing: {
        'widest-labels': '2px',
      }
    },
  },
  plugins: [],
}