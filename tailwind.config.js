/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark-blue': '#2B3A67',
        'light-blue-bg': '#E0F2F7',
        'main-text': '#333333',
        'light-gray-text': '#6B7280',
        'button-blue': '#4A90E2',
        'hover-button-blue': '#357EDD',
      }
    },
  },
  plugins: [],
}