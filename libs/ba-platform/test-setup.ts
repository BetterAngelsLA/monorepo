import { vi } from 'vitest';

// Suppress expected console output from intentional guards and warnings
const noop = () => {
  /* intentionally empty */
};
vi.spyOn(console, 'error').mockImplementation(noop);
vi.spyOn(console, 'warn').mockImplementation(noop);
