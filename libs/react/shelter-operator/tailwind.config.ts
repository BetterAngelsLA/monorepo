import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const fontConfig: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};

export default fontConfig;
