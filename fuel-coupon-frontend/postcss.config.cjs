// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/nesting': {}, // Or 'postcss-nesting': {} if you prefer that package
    '@tailwindcss/postcss': {}, // Use the new package for the main Tailwind plugin
    // 'autoprefixer': {}, // Uncomment if you also use autoprefixer
  },
};