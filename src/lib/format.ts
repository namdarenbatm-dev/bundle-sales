// قالب‌بندی نمایش. دقت نمایش از دقت محاسبه جداست: محاسبات در بسته مالی انجام می‌شود.
const nf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3, minimumFractionDigits: 0 });
const pf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1, minimumFractionDigits: 0 });

export const MILLION_TOMAN = 'میلیون تومان';

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? nf.format(value) : '—';
}

export function formatMillion(value: number): string {
  return Number.isFinite(value) ? `${nf.format(value)} ${MILLION_TOMAN}` : '—';
}

export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${pf.format(value)}٪` : '—';
}

export function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
