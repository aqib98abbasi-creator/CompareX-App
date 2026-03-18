/**
 * Formatting utilities for numbers, prices, dates, etc.
 */

export function formatPrice(price: number): string {
  if (price === 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  }).format(d);
}

export function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${formatNumber(bytes / Math.pow(k, i), 2)} ${sizes[i]}`;
}

export function formatFrequency(mhz: number): string {
  if (mhz >= 1000) {
    return `${formatNumber(mhz / 1000, 2)} GHz`;
  }
  return `${formatNumber(mhz, 0)} MHz`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatWattage(watts: number): string {
  return `${formatNumber(watts, 0)}W`;
}

export function formatDimensions(
  height: number,
  width: number,
  depth: number
): string {
  return `${formatNumber(height)} × ${formatNumber(width)} × ${formatNumber(depth)} mm`;
}
