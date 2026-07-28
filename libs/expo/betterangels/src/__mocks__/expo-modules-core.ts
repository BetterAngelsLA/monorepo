// Thin shim for expo-modules-core — provides only what expo-file-system needs.
export class UnavailabilityError extends Error {
  constructor(moduleName: string, propertyName: string) {
    super(`The ${moduleName}.${propertyName} is not available`);
    this.name = 'UnavailabilityError';
  }
}

export function uuid(): string {
  return '00000000-0000-0000-0000-000000000000';
}

export type EventSubscription = { remove: () => void };
