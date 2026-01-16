/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm Humanised Palette
        terracotta: {
          50: '#FDF6F4',
          100: '#FCE8E3',
          200: '#F8D1C6',
          300: '#F2B09E',
          400: '#E8907A',
          500: '#E07A5F', // Primary
          600: '#C96B52',
          700: '#A85544',
          800: '#874437',
          900: '#6B372D',
        },
        sage: {
          50: '#F4F9F6',
          100: '#E5F2EC',
          200: '#C7E4D7',
          300: '#A1D1BC',
          400: '#81B29A', // Primary sage
          500: '#6A9E84',
          600: '#548069',
          700: '#446654',
          800: '#385243',
          900: '#2E4337',
        },
        sand: {
          50: '#FEFCF7',
          100: '#FDF8EC',
          200: '#F9EFDA',
          300: '#F5E3C2',
          400: '#F2CC8F', // Primary sand/gold
          500: '#E5B96D',
          600: '#D9A54D',
          700: '#B8893F',
          800: '#946E34',
          900: '#77592B',
        },
        cream: {
          50: '#FDFCFB',
          100: '#FAF8F5', // Primary cream
          200: '#F5F2ED',
          300: '#EBE6DE',
          400: '#DDD6CA',
          500: '#CCC3B4',
        },
        charcoal: {
          50: '#F5F5F7',
          100: '#E8E8EC',
          200: '#CDCDD6',
          300: '#A7A7B5',
          400: '#7A7A8C',
          500: '#5A5A6D',
          600: '#4A4A5C',
          700: '#3D405B', // Primary charcoal
          800: '#32334A',
          900: '#28293D',
        },
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}

