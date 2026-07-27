import { vi } from 'vitest';

// Alias jest globals to vitest equivalents so existing tests work without rewriting.
(globalThis as Record<string, unknown>).jest = vi;
