export const Regex = {
  empty: /^\s*\S.*$/,
  date: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/,
  time: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  number: /^\d*$/,
} as const;
