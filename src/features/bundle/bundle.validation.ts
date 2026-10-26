import { FIELD_META } from './bundle.defaults';
import type {
  BundleInputs,
  FieldKey,
  Issue,
  RawInputs,
  ValidationOutcome,
} from './bundle.types';
import { FIELD_KEYS } from './bundle.types';
import { formatMillion } from '../../lib/format';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام فارسی/عربی را لاتین و جداکننده‌های هزارگان را حذف می‌کند */
export function normalizeDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const p = PERSIAN_DIGITS.indexOf(ch);
    const a = ARABIC_DIGITS.indexOf(ch);
    if (p >= 0) out += String(p);
    else if (a >= 0) out += String(a);
    else if (ch === '٫') out += '.';
    else if (ch === '٬' || ch === ',' || ch === '،' || /\s/.test(ch)) continue;
    else out += ch;
  }
  return out;
}

/** خالی یا غیرعددی ⇒ NaN (هرگز Crash نمی‌کند) */
export function parseNumber(text: string): number {
  const t = normalizeDigits(text ?? '');
  if (t === '' || !/^-?\d+(\.\d+)?$/.test(t)) return Number.NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}

function fieldError(field: FieldKey, raw: string): string | null {
  const meta = FIELD_META[field];
  const value = parseNumber(raw);
  if (raw.trim() === '') return `«${meta.label}» نمی‌تواند خالی باشد`;
  if (Number.isNaN(value)) return `«${meta.label}» باید عدد باشد`;
  if (meta.kind === 'int') {
    if (!Number.isInteger(value)) return `«${meta.label}» باید عدد صحیح باشد`;
    if (value < 1) return `«${meta.label}» باید حداقل ۱ باشد`;
  } else if (value < 0) {
    return `«${meta.label}» نمی‌تواند منفی باشد`;
  }
  return null;
}

export function validateInputs(raw: RawInputs): ValidationOutcome {
  const issues: Issue[] = [];
  const fieldErrors: Partial<Record<FieldKey, string>> = {};
  const values = {} as Record<FieldKey, number>;

  const push = (issue: Issue) => {
    issues.push(issue);
    if (issue.level === 'error' && issue.field && !fieldErrors[issue.field]) {
      fieldErrors[issue.field] = issue.message;
    }
  };

  for (const key of FIELD_KEYS) {
    const message = fieldError(key, raw[key] ?? '');
    if (message) {
      push({ id: `field-${key}`, level: 'error', field: key, message });
      values[key] = Number.NaN;
    } else {
      values[key] = parseNumber(raw[key]);
    }
  }
  const ok = (k: FieldKey) => !fieldErrors[k];

  // قاعده‌های بین‌فیلدی؛ فقط وقتی فیلدهای دخیل معتبرند
  if (ok('posCount') && ok('cashCount') && values.cashCount > values.posCount) {
    push({
      id: 'cash-over-pos',
      level: 'error',
      field: 'cashCount',
      message: 'تعداد کش‌لس نباید از تعداد کارتخوان بیشتر شود',
    });
  }
  if (ok('cashSalePrice') && ok('cashCost') && ok('cashTargetMargin')) {
    const need = values.cashCost + values.cashTargetMargin;
    if (values.cashSalePrice < need) {
      push({
        id: 'cash-sale-too-low',
        level: 'error',
        field: 'cashSalePrice',
        message: `قیمت فروش کش‌لس باید هزینه تمام‌شده و حاشیه سود هدف را پوشش دهد (حداقل ${formatMillion(need)})`,
      });
    }
  }
  if (ok('posBasePrice') && ok('posTargetPrice') && values.posTargetPrice > values.posBasePrice) {
    push({
      id: 'target-above-base',
      level: 'warning',
      field: 'posTargetPrice',
      message: 'قیمت هدف کارتخوان از قیمت پایه بیشتر است؛ این وضعیت معمولاً مقصود مدل نیست',
    });
  }
  if (
    ok('posBasePrice') &&
    ok('factoryMarketing') &&
    ok('posTargetPrice') &&
    values.posTargetPrice > values.posBasePrice + values.factoryMarketing
  ) {
    push({
      id: 'target-above-reference',
      level: 'info',
      field: 'posTargetPrice',
      message:
        'قیمت هدف از مرجع اقتصادی کارتخوان بیشتر است؛ تعدیل (تخفیف) برابر صفر در نظر گرفته می‌شود',
    });
  }

  const hasErrors = issues.some((i) => i.level === 'error');
  return {
    inputs: hasErrors ? null : (values as BundleInputs),
    issues,
    fieldErrors,
    hasErrors,
  };
}
