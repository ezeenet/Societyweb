import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F7FFF',
          dark: '#3A6AEE',
          light: '#7FA3FF',
        },
        success: '#22C55E',
        danger:  '#EF4444',
        warning: '#F59E0B',
      },
      borderRadius: {
        card:  '12px',
        modal: '16px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
