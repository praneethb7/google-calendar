/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Google Sans", "Roboto", "Arial", "sans-serif"],
      },
      colors: {
        "google-blue": {
          DEFAULT: "#1a73e8",
          dark: "#1557b0",
          light: "#d2e3fc",
          lighter: "#e8f0fe",
        },
        "google-red": {
          DEFAULT: "#d93025",
          dark: "#b31412",
        },
        "google-green": {
          DEFAULT: "#188038",
          light: "#ceead6",
        },
        "google-yellow": {
          DEFAULT: "#f9ab00",
          light: "#fef7e0",
        },
        "google-gray": {
          50: "#f8f9fa",
          100: "#f1f3f4",
          200: "#e8eaed",
          300: "#dadce0",
          400: "#bdc1c6",
          500: "#9aa0a6",
          600: "#80868b",
          700: "#5f6368",
          800: "#3c4043",
          900: "#202124",
        },
      },
      boxShadow: {
        "google-sm": "0 1px 2px 0 rgba(60,64,67,0.3),0 1px 3px 1px rgba(60,64,67,0.15)",
        "google-md": "0 1px 3px 0 rgba(60,64,67,0.3),0 4px 8px 3px rgba(60,64,67,0.15)",
        "google-hover": "0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
