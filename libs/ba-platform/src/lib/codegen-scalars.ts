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
    Date: "import('@monorepo/ba-platform').DateString",
    DateTime: "import('@monorepo/ba-platform').DateTimeString",
    Time: "import('@monorepo/ba-platform').TimeString",
    UUID: "import('@monorepo/ba-platform').UUIDString",
    PhoneNumber: "import('@monorepo/ba-platform').PhoneNumberString",

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
