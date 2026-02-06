/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-color': '#ffffff',
        'black-color': '#000000',
        'royal-purple': '#4b248c',
        'primary-blue': '#0047AB',
        'gold-color': '#F3CC3C',
        'background-color': '#f9f9f9',
        'nav-bg': 'rgba(255, 255, 255, 0.98)',
      },
    },
  },
  plugins: [],
}
