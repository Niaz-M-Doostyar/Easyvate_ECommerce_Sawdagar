/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#059669', dark: '#047a55', light: '#2fb57f', 50: '#ecfff4' },
        navy: { DEFAULT: '#053262', dark: '#01060F', light: '#0a4a8f' },
        body: '#757F95',
        green: '#11B76B',
        yellow: '#FBA707',
        red: '#FD6A6A',
      },
      fontFamily: { heading: ['Inter', 'sans-serif'], body: ['Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
