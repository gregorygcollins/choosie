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
        brand: '#4a5568', // smoky charcoal
        'brand-light': '#cbd5e0', // light charcoal
        'brand-dark': '#2d3748', // darker charcoal
      },
      fontFamily: {
        cursive: ['Pacifico', 'cursive'],
      },
    },
  },
  important: true,
  plugins: [],
};
