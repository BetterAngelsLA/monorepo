export default function debounce<F extends (...args: any[]) => void>(
  func: F,
  wait: number
): { (...args: Parameters<F>): void; cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debouncedFunction = function (...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debouncedFunction;
}
