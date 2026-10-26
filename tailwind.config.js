/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk Variable"', '"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: { 950: '#06070a', 925: '#090b0f', 900: '#0d1016', 850: '#11141b', 800: '#171b24', 700: '#232835', 600: '#323848', 500: '#5d6679', 300: '#a3acc0', 100: '#e8ebf2' },
        evm: { DEFAULT: '#8b7bff', soft: '#8b7bff1f', deep: '#5a48f0' },
        native: { DEFAULT: '#2fe0a6', soft: '#2fe0a61f', deep: '#14a87a' },
        deposit: { DEFAULT: '#ffb547', soft: '#ffb5471f' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px -20px rgba(0,0,0,0.8)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: { marquee: 'marquee 40s linear infinite' },
    },
  },
  plugins: [],
};
