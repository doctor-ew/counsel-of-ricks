/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy "legal" palette — additive; remove in a follow-up cleanup PR
        // once nothing references them.
        'legal-navy': '#1a365d',
        'legal-gold': '#b7791f',
        'coach-green': '#276749',
        'defense-red': '#9b2c2c',

        // V1 Citadel Holo palette (GH-9)
        vacuum: '#07090c',
        'cit-bg-1': '#0e1218',
        'cit-bg-2': '#161b22',
        'cit-text': '#cfe9d8',
        'cit-text-dim': '#7a8a83',

        portal: '#5dffaf',
        'portal-dim': '#1e6a47',
        plasma: '#ff4ad7',
        'scan-cyan': '#7df1ff',
        flare: '#ffc857',
        alarm: '#ff5573',
      },
      fontFamily: {
        // pair with the Google Fonts link in index.html
        display: ['Audiowide', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'portal-glow':
          '0 0 18px rgba(93, 255, 175, 0.4), inset 0 0 12px rgba(93, 255, 175, 0.2)',
      },
    },
  },
  plugins: [],
}
