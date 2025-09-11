import type { Config } from 'tailwindcss';
import tailwindBase from '../../tailwind/tailwind.base.config';
import { TAILWIND_CONTENT_GLOBS } from './config';

const config: Config = {
  presets: [tailwindBase],
  content: [...TAILWIND_CONTENT_GLOBS],
  // SB-only tweaks are safe here:
  // corePlugins: { preflight: false },
  // daisyui: { themes: [] }, // if you want Daisy but no themes in SB
};

export default config;
