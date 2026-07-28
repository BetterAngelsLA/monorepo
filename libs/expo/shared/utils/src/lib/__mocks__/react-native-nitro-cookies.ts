export default {
  get: vi.fn(),
  set: vi.fn(),
  setFromResponse: vi.fn(() => Promise.resolve()),
  clearAll: vi.fn(),
};
