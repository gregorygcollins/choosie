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
        brand: '#7C5BB8', // lilac purple
        'brand-light': '#E6D7FF', // lilac
        'brand-dark': '#4B2E83', // deep lilac
      },
      fontFamily: {
        cursive: ['Pacifico', 'cursive'],
      },
    },
  },
  important: true,
  plugins: [],
};
