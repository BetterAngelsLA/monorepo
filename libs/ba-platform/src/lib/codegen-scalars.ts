/**
 * Shared GraphQL scalar → TypeScript type mappings.
 *
 * Import this in every codegen.ts and use as `scalars: SHARED_SCALARS`.
 * Keeps all scalar mappings in one place so they don't drift across packages.
 *
 * @see {@link ./branded-types.ts} for the branded string type definitions.
 */
export const SHARED_SCALARS: Record<string, string> = {
    // --- Branded string scalars ---
    // Paths are relative to the generated types.ts at
    // libs/ba-platform/src/lib/apollo/graphql/__generated__/types.ts
    Date: "import('../../../../types').DateString",
    DateTime: "import('../../../../types').DateTimeString",
    Time: "import('../../../../types').TimeString",
    UUID: "import('../../../../types').UUIDString",
    PhoneNumber: "import('../../../../types').PhoneNumberString",

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
