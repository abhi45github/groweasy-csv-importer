import type { Config } from 'tailwindcss';

/**
 * Colors are driven by CSS variables (space-separated RGB channels) declared in
 * globals.css, so the same class names theme correctly in light & dark modes and
 * still support Tailwind's `/opacity` modifiers via `rgb(var(--x) / <alpha>)`.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity('--c-bg'),
        surface: withOpacity('--c-surface'),
        'surface-2': withOpacity('--c-surface-2'),
        line: withOpacity('--c-line'),
        ink: withOpacity('--c-ink'),
        muted: withOpacity('--c-muted'),
        faint: withOpacity('--c-faint'),
        primary: withOpacity('--c-primary'),
        'primary-ink': withOpacity('--c-primary-ink'),
        accent: withOpacity('--c-accent'),
        'accent-ink': withOpacity('--c-accent-ink'),
        warn: withOpacity('--c-warn'),
        danger: withOpacity('--c-danger'),
        info: withOpacity('--c-info'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.375rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 30px -12px rgb(0 0 0 / 0.18)',
        lift: '0 2px 4px rgb(0 0 0 / 0.06), 0 24px 60px -20px rgb(0 0 0 / 0.28)',
        glow: '0 0 0 1px rgb(var(--c-accent) / 0.35), 0 12px 48px -12px rgb(var(--c-accent) / 0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
