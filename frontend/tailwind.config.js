import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        "dropdown-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(-8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "badge-in": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "dropdown-in": "dropdown-in 0.15s ease-out",
        "badge-in": "badge-in 0.3s ease-out",
      },
    }
  },
  plugins: [typography]
};
