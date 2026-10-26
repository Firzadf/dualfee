/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: { 950: '#0b0d12', 900: '#11141b', 800: '#191d27', 700: '#262b38', 500: '#5b6478', 300: '#a3acc0', 100: '#e7eaf1' },
        evm: { DEFAULT: '#7c8cff', soft: '#7c8cff22' },
        native: { DEFAULT: '#2fd6a3', soft: '#2fd6a322' },
      },
    },
  },
  plugins: [],
};
