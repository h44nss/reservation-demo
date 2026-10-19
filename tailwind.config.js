/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F4F7F4',
          100: '#E4ECE4',
          200: '#C9D8C9',
          300: '#A3BFA3',
          400: '#7B9F7B',
          500: '#5A7D5B',
          600: '#456246',
          700: '#374E38',
          800: '#2C3E2D',
          900: '#233224',
          950: '#131C14',
        },
        cream: {
          50: '#FCFBF7',
          100: '#FAF6ED',
          200: '#F3ECD9',
          300: '#E9DDBF',
          400: '#DECCA2',
          500: '#CFB57E',
        },
        charcoal: {
          800: '#24282B',
          900: '#181B1D',
          950: '#101213',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'elevated': '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
