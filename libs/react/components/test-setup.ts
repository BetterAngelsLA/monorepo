// Minimal IntersectionObserver mock for jsdom
class IntersectionObserverMock {
  observe() {
    // no-op for jsdom tests
  }

  unobserve() {
    // no-op for jsdom tests
  }

  disconnect() {
    // no-op for jsdom tests
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});
