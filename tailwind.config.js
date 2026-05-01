/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#1A365D', // navy structure
        'brand-light': '#F8F9FF', // soft conversation surface
        'brand-dark': '#102A43', // deep navy
        consensus: '#00D1C1', // teal consensus core
        'consensus-dark': '#00AFA3',
        depth: '#2F3F9E',
      },
      fontFamily: {
        cursive: ['Pacifico', 'cursive'],
      },
    },
  },
  important: true,
  plugins: [],
};
