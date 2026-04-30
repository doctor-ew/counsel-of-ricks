/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legal-themed colors
        'legal-navy': '#1a365d',
        'legal-gold': '#b7791f',
        'coach-green': '#276749',
        'defense-red': '#9b2c2c',
      },
    },
  },
  plugins: [],
}
