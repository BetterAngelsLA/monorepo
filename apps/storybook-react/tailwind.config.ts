import tailwindBase from '../../libs/tailwind/src/index';
import { TAILWIND_CONTENT_GLOBS } from './config/index';

const config = {
  presets: [tailwindBase],
  content: [...TAILWIND_CONTENT_GLOBS],
};

export default config;
