/** Canonical date used for timezone round-trip testing */
export const CALENDAR_TEST_DATE = '2026-10-21';

/**
 * Representative world time zones to verify calendar-date consistency.
 *
 * Offsets are shown relative to Los Angeles (Pacific Time, UTC-8 / UTC-7 DST).
 * NOTE: can vary during daylight savings etc...
 */
export const TIME_ZONES = [
  // --- Americas ---
  'America/Los_Angeles', // baseline (UTC−08:00)
  'America/Denver', // +1h from LA (UTC−07:00)
  'America/Chicago', // +2h (UTC−06:00)
  'America/New_York', // +3h (UTC−05:00)
  'America/Sao_Paulo', // +5h (UTC−03:00)

  // --- Europe & Africa ---
  'UTC', // +8h from LA (UTC±00:00)
  'Europe/London', // +8h (UTC±00:00 / +01:00 DST)
  'Europe/Paris', // +9h (UTC+01:00)
  'Europe/Moscow', // +10h (UTC+03:00)
  'Africa/Johannesburg', // +10h (UTC+02:00)

  // --- Asia ---
  'Asia/Dubai', // +12h (UTC+04:00)
  'Asia/Karachi', // +13h (UTC+05:00)
  'Asia/Kathmandu', // +13h 45m (UTC+05:45)
  'Asia/Bangkok', // +14h (UTC+07:00)
  'Asia/Hong_Kong', // +15h (UTC+08:00)
  'Asia/Tokyo', // +16h (UTC+09:00)
  'Asia/Seoul', // +16h (UTC+09:00)

  // --- Oceania ---
  'Australia/Sydney', // +18h (UTC+10:00)
  'Australia/Lord_Howe', // +18h 30m (UTC+10:30)
  'Pacific/Auckland', // +20h (UTC+12:00)
  'Pacific/Chatham', // +20h 45m (UTC+12:45)
  'Pacific/Kiritimati', // +22h (UTC+14:00) — one of the earliest time zones on Earth
];
