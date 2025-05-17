/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F8FF',
          100: '#ECF1FF',
          200: '#D9E4FD',
          300: '#B3C7FA',
          400: '#809CF7',
          500: '#4C6EF5', // Primary blue - more modern
          600: '#3B5CF0',
          700: '#2A4DE0',
          800: '#1D3FD0',
          900: '#1633B0',
        },
        secondary: {
          50: '#F8FAFB',
          100: '#F1F4F7',
          200: '#E2E8EF',
          300: '#D1DAE4',
          400: '#9EABBE',
          500: '#64748B', // Secondary gray/blue
          600: '#485670',
          700: '#37435D',
          800: '#232C3F',
          900: '#121A2C',
        },
        accent: {
          50: '#F0FDF9',
          100: '#DCFDF3',
          200: '#B7F8E5',
          300: '#86F1D3',
          400: '#4CE7BE',
          500: '#10B981', // Accent green
          600: '#0D9B6E',
          700: '#0A7D5A',
          800: '#075E44',
          900: '#04422F',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(18, 26, 44, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(18, 26, 44, 0.1), 0 1px 2px -1px rgba(18, 26, 44, 0.1)',
        'md': '0 4px 6px -1px rgba(18, 26, 44, 0.1), 0 2px 4px -2px rgba(18, 26, 44, 0.1)',
        'lg': '0 10px 15px -3px rgba(18, 26, 44, 0.1), 0 4px 6px -4px rgba(18, 26, 44, 0.1)',
        'xl': '0 20px 25px -5px rgba(18, 26, 44, 0.1), 0 8px 10px -6px rgba(18, 26, 44, 0.1)',
        '2xl': '0 25px 50px -12px rgba(18, 26, 44, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
