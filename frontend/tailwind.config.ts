import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#F37021',
        'brand-dark': '#D95B10',
        'brand-light': '#FFF3EB',
        obsidian: '#030303',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        sansation: ['var(--font-montserrat)', 'Sansation', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
