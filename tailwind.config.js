/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)', /* Off-white with warm undertones */
        foreground: 'var(--color-foreground)', /* Rich dark brown */
        primary: {
          DEFAULT: 'var(--color-primary)', /* Warm nude */
          foreground: 'var(--color-primary-foreground)', /* Rich dark brown */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* Light nude */
          foreground: 'var(--color-secondary-foreground)', /* Rich dark brown */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* Sophisticated terracotta */
          foreground: 'var(--color-destructive-foreground)', /* Off-white */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* Light nude */
          foreground: 'var(--color-muted-foreground)', /* Medium brown */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* Muted gold */
          foreground: 'var(--color-accent-foreground)', /* Rich dark brown */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* Card background */
          foreground: 'var(--color-popover-foreground)', /* Rich dark brown */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* Card background */
          foreground: 'var(--color-card-foreground)', /* Rich dark brown */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* Muted sage green */
          foreground: 'var(--color-success-foreground)', /* Off-white */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* Warm amber */
          foreground: 'var(--color-warning-foreground)', /* Rich dark brown */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* Sophisticated terracotta */
          foreground: 'var(--color-error-foreground)', /* Off-white */
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Source Sans 3', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        caption: ['Nunito Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(44, 36, 32, 0.08)',
        'soft': '0 2px 4px 0 rgba(44, 36, 32, 0.08)',
        'soft-md': '0 4px 8px 0 rgba(44, 36, 32, 0.08)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}