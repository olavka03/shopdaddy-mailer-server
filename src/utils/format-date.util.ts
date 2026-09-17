const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const padNumber = (value: number): string => String(value).padStart(2, '0');

export const formatDateTime = (date: Date): string => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  const day = padNumber(value.getUTCDate());
  const month = MONTH_NAMES[value.getUTCMonth()];
  const year = value.getUTCFullYear();
  const hours = padNumber(value.getUTCHours());
  const minutes = padNumber(value.getUTCMinutes());

  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
};
