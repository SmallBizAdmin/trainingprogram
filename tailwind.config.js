/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Oswald"', "sans-serif"],
        body: ['"Archivo"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        ink: "#0c0d0e",
        panel: "#161719",
        panel2: "#1d1f22",
        line: "#2a2d31",
        chalk: "#f4f1ea",
        muted: "#8a8f98",
        acid: "#d4ff3f",
        ember: "#ff5c39",
        steel: "#5b9dff",
      },
    },
  },
  plugins: [],
};
