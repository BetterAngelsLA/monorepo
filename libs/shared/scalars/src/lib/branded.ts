/**
 * Branded string types for the GraphQL custom scalars.
 *
 * Each is a compile-time-only wrapper around `string` — at runtime they are
 * plain strings, zero cost.
 *
 * All brands share one symbol key and differ only in its literal value. That
 * is what makes them mutually exclusive: two brands built from *different*
 * keys would both be optional-and-absent on each other and assign freely.
 *
 * The brand is optional, so a plain `string` is still assignable to a branded
 * type. That is deliberate — it keeps adoption incremental. What it buys is
 * that a `DateString` cannot be passed where a `UUIDString` is expected.
 *
 * @see {@link ./date/dateString.ts} and siblings for the functions that
 * produce these values — they are the only sanctioned way to build one.
 */

declare const scalarBrand: unique symbol;

type Branded<K extends string> = string & { readonly [scalarBrand]?: K };

/** ISO 8601 calendar date, e.g. `"2026-07-27"`. */
export type DateString = Branded<'Date'>;

/** ISO 8601 datetime, e.g. `"2026-07-27T14:30:00.000Z"`. */
export type DateTimeString = Branded<'DateTime'>;

/** Time of day as `HH:mm:ss`, e.g. `"14:30:00"`. */
export type TimeString = Branded<'Time'>;

/** UUID, e.g. `"550e8400-e29b-41d4-a716-446655440000"`. */
export type UUIDString = Branded<'UUID'>;

/**
 * A phone number as the API serializes it: national digits only, with an
 * optional `x`-delimited extension — e.g. `"2135551234"` or
 * `"2135551234x22"`. Note this is *not* E.164; the backend's
 * `_serialize_phone_number` emits `national_number`, so the country code is
 * already gone by the time the client sees it.
 */
export type PhoneNumberString = Branded<'PhoneNumber'>;
