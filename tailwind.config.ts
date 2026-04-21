import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080808',
          2: '#0d0d0d',
          3: '#111111',
        },
        accent: {
          DEFAULT: '#C8F135',
          2: '#ff6b2b',
          3: '#38bdf8',
        },
        cream: '#f0ede6',
        muted: {
          DEFAULT: '#888888',
          2: '#bbbbbb',
        },
        border: {
          DEFAULT: '#1a1a1a',
          2: '#222222',
        },
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        jakarta: ['var(--font-syne)', 'sans-serif'], // alias for clarity
      },
      fontSize: {
        'label': ['0.72rem', { letterSpacing: '0.16em' }],
        'micro': ['0.68rem', { letterSpacing: '0.08em' }],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'float': 'float 7s ease-in-out infinite',
        'pulse-slow': 'pulse 6s ease-in-out infinite',
        'pulse-slower': 'pulse 8s ease-in-out infinite',
        'fadeUp': 'fadeUp 0.7s ease both',
        'fadeDown': 'fadeDown 0.6s ease both',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        nav: '14px',
      },
    },
  },
  plugins: [],
}

export default config
