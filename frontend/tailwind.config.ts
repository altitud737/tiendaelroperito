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
        pink: {
          DEFAULT: '#F2A2B1',
          dark: '#e8869a',
        },
        blue: {
          DEFAULT: '#96C3EB',
        },
        yellow: {
          DEFAULT: '#F9E076',
        },
        white: '#FDFDFD',
        text: {
          DEFAULT: '#2D2D2D',
          light: '#6B6B6B',
        },
        border: '#E8E8E8',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Nunito', 'sans-serif'],
        label: ['Jost', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '8px',
      },
      boxShadow: {
        soft: '0 2px 16px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};

export default config;
