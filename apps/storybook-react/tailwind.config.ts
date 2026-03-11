import type { Config } from 'tailwindcss';
import tailwindBase from '../../libs/tailwind/src/index';
import { TAILWIND_CONTENT_GLOBS } from './config/index';

const config: Config = {
  presets: [tailwindBase],
  content: [...TAILWIND_CONTENT_GLOBS],
};

export default config;
