/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--c-surface)',
          hover: 'var(--c-surface-hover)',
          elevated: 'var(--c-surface-elevated)',
        },
        primary: {
          DEFAULT: 'var(--c-primary)',
          stop: 'var(--c-primary-stop)',
          light: 'var(--c-primary-light)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          light: 'var(--c-accent-light)',
        },
        text: {
          DEFAULT: 'var(--c-text)',
          secondary: 'var(--c-text-secondary)',
          muted: 'var(--c-text-muted)',
        },
        border: {
          DEFAULT: 'var(--c-border)',
          light: 'var(--c-border-light)',
        },
        danger: {
          DEFAULT: 'var(--c-danger)',
          light: 'var(--c-danger-light)',
        },
        success: {
          DEFAULT: 'var(--c-success)',
          light: 'var(--c-success-light)',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Noto Serif SC', 'serif'],
        body: ['DM Sans', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-sm)',
        card: 'var(--shadow-md)',
        lifted: 'var(--shadow-lg)',
        modal: 'var(--shadow-xl)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
