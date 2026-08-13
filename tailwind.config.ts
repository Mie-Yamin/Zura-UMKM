import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        dmsans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        'deep-teal': 'var(--color-deep-teal)',
        'neon-green': 'var(--color-neon-green)',
        'soft-red': 'var(--color-soft-red)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
      spacing: {
        base: 'var(--spacing-base)',
      },
    },
  },
  plugins: [],
};

export default config;