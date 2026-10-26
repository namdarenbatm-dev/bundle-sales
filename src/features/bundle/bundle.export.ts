import { FIELD_META } from './bundle.defaults';
import type { AgentOffer, ScenarioResult } from './bundle.presets';
import type { BundleInputs, BundleResult, ModelStatus } from './bundle.types';
import { FIELD_KEYS } from './bundle.types';
import { formatPersianDate } from '../../lib/format';

export const CSV_BOM = '﻿';
const HEADER = ['بخش', 'شاخص', 'مقدار', 'واحد'];

export function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** اعداد در CSV لاتین و با حداکثر ۳ رقم اعشار تا Excel بتواند آن‌ها را عدد بخواند */
const num = (n: number): string => String(Math.round(n * 1000) / 1000);

type Row = [string, string, string, string];

function toCsv(rows: Row[]): string {
  return CSV_BOM + [HEADER, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
}

const STATUS_TEXT: Record<ModelStatus, string> = {
  valid: 'معتبر از نظر بودجه تعریف‌شده',
  deficit: 'نیازمند اصلاح (کسری بودجه)',
  invalid: 'ورودی نامعتبر',
};

const MM = 'میلیون تومان';

/** گزارش مدیریتی: ورودی‌ها، نتایج، وضعیت و سناریوها. فقط برای نمای مدیریتی. */
export function buildManagementCsv(args: {
  date: Date;
  inputs: BundleInputs;
  result: BundleResult;
  status: ModelStatus;
  scenarios: ScenarioResult[];
}): string {
  const { date, inputs, result, status, scenarios } = args;
  const rows: Row[] = [];
  rows.push(['گزارش', 'عنوان', 'FINAL Bundle | اتاق فرمان باندلینگ توسن تکنو', '']);
  rows.push(['گزارش', 'تاریخ گزارش', formatPersianDate(date), '']);
  rows.push(['گزارش', 'وضعیت اعتبار مدل', STATUS_TEXT[status], '']);
  for (const key of FIELD_KEYS) {
    rows.push(['ورودی‌ها', FIELD_META[key].label, num(inputs[key]), FIELD_META[key].unit]);
  }
  const r = result;
  rows.push(
    ['نتایج', 'مرجع اقتصادی کارتخوان', num(r.posReference), MM],
    ['نتایج', 'تعدیل هر کارتخوان', num(r.posAdjustmentPerUnit), MM],
    ['نتایج', 'تعدیل کل کارتخوان', num(r.totalPosAdjustment), MM],
    ['نتایج', 'بودجه هر کش‌لس (پیش از حاشیه سود هدف)', num(r.cashBudgetPerUnit), MM],
    ['نتایج', 'بودجه اولیه باندلینگ', num(r.initialBundleBudget), MM],
    ['نتایج', 'مانده بودجه پس از تعدیل', num(r.remainingBundleBudget), MM],
    ['نتایج', 'حاشیه سود هدف کل کش‌لس (هدف، نه سود تحقق‌یافته)', num(r.totalCashMarkup), MM],
    ['نتایج', 'مانده اقتصادی نهایی', num(r.finalEconomicBalance), MM],
    ['نتایج', 'قیمت تخصیصی واقعی کش‌لس در بسته (شاخص مدیریتی)', num(r.effectiveCashPrice), MM],
    ['نتایج', 'ارزش فروش اسمی بسته', num(r.bundleSalesValue), MM],
    ['نتایج', 'سهم مانده بودجه از نمودار', num(r.remainingSharePct), 'درصد'],
    ['نتایج', 'سهم حاشیه سود هدف از نمودار', num(r.markupSharePct), 'درصد'],
    ['نتایج', 'کمترین قیمت هدف کارتخوان برای مانده بودجه صفر', num(r.breakEvenPosTarget), MM],
  );
  for (const s of scenarios) {
    const section = `سناریو: ${s.rule.name}`;
    rows.push([section, 'وضعیت', STATUS_TEXT[s.status], '']);
    if (s.inputs && s.result) {
      rows.push(
        [section, 'تعداد کارتخوان', num(s.inputs.posCount), 'دستگاه'],
        [section, 'تعداد کش‌لس', num(s.inputs.cashCount), 'عدد'],
        [section, 'قیمت هدف کارتخوان', num(s.inputs.posTargetPrice), MM],
        [section, 'مانده بودجه پس از تعدیل', num(s.result.remainingBundleBudget), MM],
        [section, 'ارزش فروش اسمی بسته', num(s.result.bundleSalesValue), MM],
      );
    }
  }
  rows.push([
    'توضیح',
    'محدودیت',
    'حاشیه سود هدف و قیمت تخصیصی شاخص مدیریتی‌اند؛ سود خالص یا تحقق‌یافته محسوب نمی‌شوند',
    '',
  ]);
  return toCsv(rows);
}

/** گزارش نماینده: فقط فیلدهای AgentOffer؛ هیچ داده داخلی ندارد. */
export function buildAgentCsv(offers: AgentOffer[], date: Date): string {
  const rows: Row[] = [
    ['گزارش', 'عنوان', 'پیشنهادهای بسته توسن تکنو', ''],
    ['گزارش', 'تاریخ گزارش', formatPersianDate(date), ''],
  ];
  for (const o of offers) {
    rows.push(
      [o.name, 'تعداد کارتخوان', num(o.posCount), 'دستگاه'],
      [o.name, 'تعداد کش‌لس', num(o.cashCount), 'عدد'],
      [o.name, 'قیمت پیشنهادی هر کارتخوان', num(o.posPrice), MM],
      [o.name, 'قیمت پیشنهادی هر کش‌لس', num(o.cashPrice), MM],
      [o.name, 'ارزش اسمی بسته', num(o.nominalValue), MM],
    );
    if (o.posDiscountVsList !== null) {
      rows.push([o.name, 'تخفیف هر کارتخوان نسبت به قیمت لیست', num(o.posDiscountVsList), MM]);
    }
  }
  return toCsv(rows);
}

/** دانلود فایل CSV در مرورگر (UTF-8 با BOM) */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
