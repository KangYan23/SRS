const plugin = require('tailwindcss/plugin')

module.exports = {
  content: ['./**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addBase, theme }) {
      addBase({
        ':root': {
          '--mb-accent': theme('colors.sky.500', '#0ea5e9'),
          '--mb-accent-2': theme('colors.pink.400', '#f472b6'),
        },
      })
    }),
  ],
}
