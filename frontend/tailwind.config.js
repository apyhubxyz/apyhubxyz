/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#fdf8f6',
          100: '#f9f0e9',
          200: '#f2ddd0',
          300: '#e9c2a7',
          400: '#dda077',
          500: '#d28654',
          600: '#c16d48',
          700: '#a0553d',
          800: '#834536',
          900: '#6c3a2e',
          950: '#3a1c17',
        },
        purple: {
          50: '#faf7fc',
          100: '#f3ebf9',
          200: '#ead9f3',
          300: '#dab9e9',
          400: '#c28dd9',
          500: '#a766c3',
          600: '#8c49a5',
          700: '#733989',
          800: '#5f3270',
          900: '#4f2b5b',
          950: '#33153d',
        },
        accent: {
          brown: '#a0553d',
          purple: '#8c49a5',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px rgba(167, 102, 195, 0.5)' },
          'to': { boxShadow: '0 0 20px rgba(167, 102, 195, 0.8)' },
        },
        slideUp: {
          'from': { transform: 'translateY(100px)', opacity: 0 },
          'to': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          'from': { opacity: 0 },
          'to': { opacity: 1 },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}