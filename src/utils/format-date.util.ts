const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const padNumber = (value: number): string => String(value).padStart(2, '0');

/** Formats a date in UTC, for example `October 1, 2026 at 13:05 UTC`. */
export const formatDateTime = (date: Date): string => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  const month = MONTH_NAMES[value.getUTCMonth()];
  const day = value.getUTCDate();
  const year = value.getUTCFullYear();
  const hours = padNumber(value.getUTCHours());
  const minutes = padNumber(value.getUTCMinutes());

  return `${month} ${day}, ${year} at ${hours}:${minutes} UTC`;
};
