/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f6f5f1',
        field: '#f3f2ee',
        line: '#e7e5df',
        ink: {
          DEFAULT: '#17211f',
          soft: '#4f5a57',
          muted: '#616b68',
        },
        brand: {
          50: '#eef7f4',
          100: '#d7eee7',
          200: '#b0dccf',
          300: '#7fc4b1',
          400: '#45a68f',
          500: '#138a73',
          600: '#0f7563',
          700: '#0d6153',
          800: '#0b4d43',
          900: '#093d35',
        },
        // Series del gráfico (paleta validada para daltonismo).
        capital: '#138a73',
        interest: { DEFAULT: '#ef9b62', soft: '#fdf0e7' },
        extra: { DEFAULT: '#6f63d3', soft: '#efedfb', ink: '#4d42a8' },
        save: { DEFAULT: '#1d6b45', soft: '#eaf5ee' },
        danger: { DEFAULT: '#b3412e', soft: '#fdf0ec' },
      },
      fontFamily: {
        sans: ['"Kumbh Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Pesos al estilo de la referencia: títulos en 520, énfasis en 560 (no negrita).
      fontWeight: {
        display: '520',
        semibold: '560',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 33, 31, 0.04), 0 12px 32px -16px rgba(23, 33, 31, 0.14)',
        lift: '0 2px 4px rgba(23, 33, 31, 0.05), 0 18px 40px -18px rgba(23, 33, 31, 0.22)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        grow: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(110%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        grow: 'grow 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
