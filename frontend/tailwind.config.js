/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          dark: '#121212',
          neon: '#ccff00', // Cyber Lime
          blue: '#00f3ff',
        },
      },
      backgroundImage: {
        'main-bg': "url('/bg.png')",
      },
    },
  },
  plugins: [],
}
