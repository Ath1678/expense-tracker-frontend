/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // nice blue
        secondary: "#f59e0b", // amber accent
      },
    },
  },
  plugins: [],
};
