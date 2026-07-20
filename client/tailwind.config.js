/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#F4F2EA",
        paper: "#FBFAF5",
        ink: "#17150F",
        subink: "#57534A",
        faint: "#9A958A",
        rule: "#1715221A",
        vermillion: "#E5341A",
        vermillionSoft: "#F6D9D2",
        ochre: "#B8892B",
        graymark: "#CFCABB",
      },
      fontFamily: {
        display: ['"Georgia"', "ui-serif", "Cambria", "Times New Roman", "serif"],
        sans: ['"Helvetica Neue"', "Inter", "system-ui", "-apple-system", "Arial", "sans-serif"],
        mono: ['"SF Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: { micro: "0.14em" },
    },
  },
  plugins: [],
};
