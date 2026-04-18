import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          soft: 'hsl(var(--secondary-soft))',
        },
        honey: {
          DEFAULT: 'hsl(var(--honey))',
          foreground: 'hsl(var(--honey-foreground))',
          soft: 'hsl(var(--honey-soft))',
        },
        lavender: {
          DEFAULT: 'hsl(var(--lavender))',
          soft: 'hsl(var(--lavender-soft))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'float-y': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'float-y-lg': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'coin-pop': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1.2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        wobble: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-3px) rotate(1deg)' },
        },
      },
      animation: {
        'float-y': 'float-y 4s ease-in-out infinite',
        'float-y-lg': 'float-y-lg 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'coin-pop': 'coin-pop 1.4s ease-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'ticker': 'ticker 40s linear infinite',
        'wobble': 'wobble 3s ease-in-out infinite',
        'ping-soft': 'ping-soft 2.4s ease-out infinite',
        'bob': 'bob 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
