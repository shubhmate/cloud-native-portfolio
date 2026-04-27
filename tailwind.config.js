/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "src/templates/**/*.html",
    "src/scripts/**/*.js",
    "automation/**/*.js",
    "config/site-config.json",
    "src/scripts/commands.json"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Renamed to avoid overriding default palettes
        'brand-accent': 'var(--accent)',
        'brand-green': 'var(--green)',
        'brand-bg': 'var(--bg)',
        'brand-surface': 'var(--surface)',
        'brand-border': 'var(--border)',
        'brand-text': 'var(--text)',
        'brand-muted': 'var(--muted)',
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  safelist: [
    'text-cyan-400', 'text-teal-400', 'text-emerald-400',
    'bg-green-400/10', 'text-green-400', 'bg-green-500/10', 'border-green-500/20',
    'bg-yellow-400/5', 'border-yellow-400/30', 'text-yellow-400',
    'bg-purple-400/5', 'border-purple-400/30', 'text-purple-400',
    'bg-blue-400/5', 'border-blue-400/30', 'text-blue-400',
    'bg-orange-400/5', 'border-orange-400/30', 'text-orange-400',
    'bg-red-400/5', 'border-red-400/30', 'text-red-400',
    'bg-green-400/5', 'border-green-400/30', 'text-green-400',
    'bg-blue-400/10', 'border-blue-400/30', 'text-blue-400',
    'bg-green-400/10', 'border-green-400/30', 'text-green-400',
    'bg-purple-400/10', 'border-purple-400/30', 'text-purple-400',
    'bg-yellow-400/10', 'border-yellow-400/30', 'text-yellow-400',
    'text-[var(--accent)]', 'text-blue-400', 'text-yellow-400', 'text-purple-400', 'text-green-400',
    'flipped', 'flip-card-inner', 'flip-card-front', 'flip-card-back', 'pulse-dot', 'pulse-ring', 'animate-pulse'
  ],
  plugins: [],
}
