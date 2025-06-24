/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts}", "./libs/**/*.{html,ts}"],
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0052FF", // New primary blue
          dark: "#0046DB", // Darker shade for hover
          light: "#3385FF", // Lighter shade
        },
      },
      fontFamily: {
        serif: ["Helvetica", "Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwindcss/nesting"),
    require("tailwindcss-primeui"),
  ],
};
