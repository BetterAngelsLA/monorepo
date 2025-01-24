export function sortByPriority<T>(items: T[], priorityKey: keyof T): T[] {
  return items.sort((a, b) => {
    // Get the priority for each item, default to -Infinity if null or undefined
    const priorityA = a[priorityKey] ?? -Infinity;
    const priorityB = b[priorityKey] ?? -Infinity;

    // Compare priorities: higher number first
    if (priorityA > priorityB) {
      return -1; // a comes before b
    } else if (priorityA < priorityB) {
      return 1; // b comes before a
    } else {
      return 0; // equal priorities, keep original order
    }
  });
}
