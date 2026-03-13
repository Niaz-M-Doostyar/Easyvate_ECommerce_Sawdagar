/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#38B6FF', dark: '#0098e0', light: '#6ccaff', 50: '#eff9ff' },
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
