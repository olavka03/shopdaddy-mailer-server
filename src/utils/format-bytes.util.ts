const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BYTES_IN_UNIT = 1024;

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_IN_UNIT)), BYTE_UNITS.length - 1);
  const value = bytes / Math.pow(BYTES_IN_UNIT, unitIndex);
  const rounded = unitIndex === 0 || value >= 100 ? Math.round(value) : Number(value.toFixed(1));

  return `${rounded} ${BYTE_UNITS[unitIndex]}`;
};
