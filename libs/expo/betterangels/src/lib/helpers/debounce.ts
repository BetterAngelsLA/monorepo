export default function debounce<F extends (...args: any[]) => void>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<F>) {
    const later = () => {
      clearTimeout(timeout!);
      func(...args);
    };

    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
  };
}
