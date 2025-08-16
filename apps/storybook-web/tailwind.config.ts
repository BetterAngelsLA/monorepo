import { join } from 'path';
import type { Config } from 'tailwindcss';
import tailwindBase from '../../tailwind/tailwind.base.config';

// import hello from '../../ta'
// import hello from '../../libs/react'

const config: Config = {
  presets: [tailwindBase],
  content: [
    // host
    join(__dirname, './.storybook/**/*.{ts,tsx,mdx,html}'),
    // local src stories
    join(__dirname, '../src/**/*.{ts,tsx,mdx,html}'),
    // libs stories
    join(__dirname, '../../libs/react/components/src/**/*.{ts,tsx,mdx,html}'),
    join(__dirname, '../../libs/react/icons/src/**/*.{ts,tsx,mdx,html}'),
  ],
  // SB-only tweaks are safe here:
  // corePlugins: { preflight: false },
  // daisyui: { themes: [] }, // if you want Daisy but no themes in SB
};

export default config;
