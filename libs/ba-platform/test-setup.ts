/// <reference types="jest" />

// Suppress expected console output from intentional guards and warnings
const noop = () => {
  /* intentionally empty */
};
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(console, 'warn').mockImplementation(noop);
