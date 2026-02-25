export default {
  get: jest.fn(),
  set: jest.fn(),
  setFromResponse: jest.fn(() => Promise.resolve()),
  clearAll: jest.fn(),
};
