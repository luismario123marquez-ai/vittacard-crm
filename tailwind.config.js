export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vitta: { teal: '#00B4B4', dark: '#1A2B3C', purple: '#7C3AED', light: '#E0F7F7' }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
