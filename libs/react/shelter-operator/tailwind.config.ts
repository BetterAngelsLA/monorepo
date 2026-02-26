import daisyui from 'daisyui';
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'primary-main': '#008CEE',
        'primary-hover': '#0374c4',
        'primary-pressed': '#055288',

        'secondary-main': '#DCF1FF',
        'secondary-hover': '#A7DBFF',
        'secondary-pressed': '#6AC1FF',
        'secondary-main-light': '#F2FAFF',

        'accent-main': '#FFF82E',
        'accent-dark-hover': '#E6DE0011',
        'accent-dark-pressed': '#c8c10011',

        'success-main': '#23CE6B',
        'success-light': '#A0EEC1',
        'success-extralight': '#DDF8E8',

        'warning-main': '#FFC700',
        'warning-light': '#FFE178',
        'warning-extralight': '#FFF8E0',

        'alert-main': '#CB0808',
        'alert-light': '#FFC5BF',
        'alert-extralight': '#FFECE8',

        'tags-blue': '#DCF1FF',
        'tags-yellow': '#FFF7AE',
        'tags-purple': '#E2C6FF',
        'tags-pink': '#FFD7E7',
        'tags-main': '#C3F4FF',

        'brand-skyblue': '#9CDCED',
        'brand-steelblue': '#375C76',
        'brand-darkblue': '#1E3342',
        'brand-angelblue': '#F2FAFC',

        neutral: '#000000',
        'neutral-20': '#383B40',
        'neutral-50': '#747A82',
        'neutral-70': '#A8AEB8',
        'neutral-90': '#D3D9E3',
        'neutral-97': '#F4F6FD',
        'neutral-white': '#ffffff',

        'neutral-warm-70': '#676767',
        'neutral-warm-50': '#767676',
        'neutral-warm-80': '#E7E7E7',
        'neutral-warm-90': '#F3F3F9',
        'neutral-warm-95': '#F8F7F9',
        'neutral-warm-99': '#FAFAFA',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: false, // disable DaisyUI default themes
  },
};

export default config;
