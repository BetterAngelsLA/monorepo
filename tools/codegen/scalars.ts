import type { CodegenConfig } from '@graphql-codegen/cli';

type ScalarsMap = CodegenConfig['generates'][string]['config']['scalars'];

/**
 * Shared GraphQL scalar → TypeScript type mappings.
 *
 * Scalars map to bare type names, with SCALAR_IMPORT_PLUGIN prepending the
 * matching static import to each generated file. The alternative — inlining
 * `import('@monorepo/shared/scalars').DateString` at every usage — reads worse
 * and makes nx classify the library as lazy-loaded, which then rejects every
 * static import of it elsewhere in the project.
 *
 * Every scalar the backend declares must appear here. `strictScalars` turns a
 * missing entry into a failed codegen run rather than a silent `any`, which is
 * the failure this map exists to prevent.
 *
 * @see `@monorepo/shared/scalars` for the branded types and their constructors.
 */
export const SHARED_SCALARS: ScalarsMap = {
  // --- Branded string scalars ---
  Date: 'DateString',
  DateTime: 'DateTimeString',
  Time: 'TimeString',
  UUID: 'UUIDString',
  PhoneNumber: 'PhoneNumberString',

  // --- Plain string scalars ---
  NonBlankString: 'string',
  NonEmptyString: 'string',

  // --- Numeric scalars ---
  LatitudeScalar: 'number',
  LongitudeScalar: 'number',

  // --- Intentionally untyped scalars ---
  JSON: 'any',
  Point: 'any',
  Upload: 'any',
};

/** Spread into every codegen output's `config`, so the map and the strictness stay together. */
export const SHARED_SCALAR_CONFIG = {
  scalars: SHARED_SCALARS,
  strictScalars: true,
} as const;

/** List first in every output's `plugins`, so the branded names resolve. */
export const SCALAR_IMPORT_PLUGIN = {
  add: {
    content:
      "import type { DateString, DateTimeString, PhoneNumberString, TimeString, UUIDString } from '@monorepo/shared/scalars';",
  },
} as const;
