import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bronze: {
          50: '#fff5ee',
          100: '#ffe8d8',
          200: '#fad4bc',
          300: '#f7b48b',
          400: '#f58f51',
          500: '#F37021',
          600: '#d95b10',
          700: '#b84909',
          800: '#943a08',
          900: '#783009',
        },
      },
    },
  },
  plugins: [],
};

export default config;
