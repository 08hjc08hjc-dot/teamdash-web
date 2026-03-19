/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Freesentation', 'sans-serif'],
      },
      colors: {
        glass: {
          surface: 'rgba(255,255,255,0.06)',
          'surface-strong': 'rgba(255,255,255,0.1)',
          border: 'rgba(255,255,255,0.1)',
          'border-strong': 'rgba(255,255,255,0.15)',
        },
        accent: {
          purple: '#0d9488',
          blue: '#3b82f6',
          teal: '#06b6d4',
          rose: '#f43f5e',
          orange: '#f97316',
        },
        dark: {
          bg: '#0f0d1a',
          card: '#1a1333',
          surface: '#1e1a2e',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
