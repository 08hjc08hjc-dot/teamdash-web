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
        td: {
          bg: 'var(--td-bg)',
          'bg-soft': 'var(--td-bg-soft)',
          card: 'var(--td-card)',
          'card-hover': 'var(--td-card-hover)',
          surface: 'var(--td-surface)',
          'surface-alt': 'var(--td-surface-alt)',
          input: 'var(--td-input)',
          'input-border': 'var(--td-input-border)',
          text: 'var(--td-text)',
          'text-bright': 'var(--td-text-bright)',
          'text-secondary': 'var(--td-text-secondary)',
          'text-muted': 'var(--td-text-muted)',
          'text-faint': 'var(--td-text-faint)',
          border: 'var(--td-border)',
          'border-subtle': 'var(--td-border-subtle)',
          'border-strong': 'var(--td-border-strong)',
          hover: 'var(--td-hover)',
          'hover-strong': 'var(--td-hover-strong)',
          sidebar: 'var(--td-sidebar)',
          overlay: 'var(--td-overlay)',
          select: 'var(--td-select)',
        },
        accent: {
          purple: '#0d9488',
          blue: '#3b82f6',
          teal: '#06b6d4',
          rose: '#f43f5e',
          orange: '#f97316',
        },
      },
      boxShadow: {
        td: 'var(--td-shadow)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
