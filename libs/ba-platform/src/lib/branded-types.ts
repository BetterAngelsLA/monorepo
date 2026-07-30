/**
 * Branded string types for GraphQL custom scalars.
 *
 * Each type is a compile-time-only wrapper around `string`. At runtime they
 * are plain strings — zero cost. The brand prevents accidentally passing an
 * arbitrary string where a specific format is expected (e.g. passing a name
 * where a UUID is required).
 *
 * @see {@link ./codegen-scalars.ts} for the GraphQL Codegen scalar mappings.
 */

declare const DateStringBrand: unique symbol;
/**
 * ISO 8601 date string, e.g. `"2026-07-27"`.
 *
 * Uses the "Flavor" pattern (optional brand). `string` is assignable to
 * `DateString` for gradual adoption, but `DateString` cannot be silently
 * used where a different branded type (e.g. `UUIDString`) is expected.
 */
export type DateString = string & { [DateStringBrand]?: true };

declare const DateTimeStringBrand: unique symbol;
/** ISO 8601 datetime string, e.g. `"2026-07-27T14:30:00Z"`. */
export type DateTimeString = string & { [DateTimeStringBrand]?: true };

declare const TimeStringBrand: unique symbol;
/** ISO 8601 time string, e.g. `"14:30:00"`. */
export type TimeString = string & { [TimeStringBrand]?: true };

declare const UUIDStringBrand: unique symbol;
/** UUID string, e.g. `"550e8400-e29b-41d4-a716-446655440000"`. */
export type UUIDString = string & { [UUIDStringBrand]?: true };

declare const PhoneNumberStringBrand: unique symbol;
/** E.164 phone number string, e.g. `"+12135551234"`. */
export type PhoneNumberString = string & { [PhoneNumberStringBrand]?: true };
