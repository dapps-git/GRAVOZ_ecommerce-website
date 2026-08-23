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
          50: '#fdf8f3',
          100: '#f9eee0',
          200: '#f3d9c1',
          300: '#e8bb96',
          400: '#da9867',
          500: '#89591C',
          600: '#a36b22',
          700: '#7e4d1b',
          800: '#673f1b',
          900: '#543419',
        },
      },
    },
  },
  plugins: [],
};

export default config;
