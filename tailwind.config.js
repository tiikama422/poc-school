/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'touch': { 'raw': '(hover: none)' },
      },
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1.25rem' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.5rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.75rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '2rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}