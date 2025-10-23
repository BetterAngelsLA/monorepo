const input = process.env.CALENDAR_TEST_DATE || '2026-10-21';

// Construct a local calendar date for the input (no time zone math)
const [y, m, d] = input.split('-').map(Number);
const date = new Date(y, m - 1, d);

// Print the local rendering in en-CA (yyyy-MM-dd)
process.stdout.write(date.toLocaleDateString('en-CA'));
