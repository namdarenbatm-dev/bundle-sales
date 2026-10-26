import type { BundleInputs, FieldKey, RawInputs } from './bundle.types';

/**
 * مقادیر پیش‌فرض مدل (میلیون تومان). برای تغییر مقادیر اولیه فقط همین فایل را ویرایش کنید.
 */
export const DEFAULT_INPUTS: BundleInputs = {
  posCount: 10,
  cashCount: 10,
  posBasePrice: 19,
  posTargetPrice: 15,
  factoryMarketing: 1,
  cashCost: 25,
  cashSalePrice: 42,
  cashTargetMargin: 2,
};

export const DEFAULT_RAW: RawInputs = Object.fromEntries(
  Object.entries(DEFAULT_INPUTS).map(([k, v]) => [k, String(v)]),
) as RawInputs;

export type FieldGroupId = 'basket' | 'pos' | 'cash';

export interface FieldMeta {
  label: string;
  unit: string;
  group: FieldGroupId;
  kind: 'int' | 'money';
  hint?: string;
}

export const FIELD_META: Record<FieldKey, FieldMeta> = {
  posCount: { label: 'تعداد کارتخوان', unit: 'دستگاه', group: 'basket', kind: 'int' },
  cashCount: {
    label: 'تعداد کش‌لس',
    unit: 'عدد',
    group: 'basket',
    kind: 'int',
    hint: 'نباید از تعداد کارتخوان بیشتر باشد',
  },
  posBasePrice: { label: 'قیمت پایه کارتخوان', unit: 'میلیون تومان', group: 'pos', kind: 'money' },
  posTargetPrice: {
    label: 'قیمت هدف کارتخوان در بسته',
    unit: 'میلیون تومان',
    group: 'pos',
    kind: 'money',
  },
  factoryMarketing: {
    label: 'بودجه بازاریابی کارخانه (هر کارتخوان)',
    unit: 'میلیون تومان',
    group: 'pos',
    kind: 'money',
    hint: 'در مرجع اقتصادی کارتخوان لحاظ شده و دوباره کسر نمی‌شود',
  },
  cashCost: {
    label: 'هزینه تمام‌شده هر کش‌لس',
    unit: 'میلیون تومان',
    group: 'cash',
    kind: 'money',
  },
  cashSalePrice: {
    label: 'قیمت فروش هر کش‌لس',
    unit: 'میلیون تومان',
    group: 'cash',
    kind: 'money',
  },
  cashTargetMargin: {
    label: 'حاشیه سود هدف هر کش‌لس',
    unit: 'میلیون تومان',
    group: 'cash',
    kind: 'money',
    hint: 'هدف مدیریتی است، نه سود تحقق‌یافته',
  },
};

export const FIELD_GROUPS: { id: FieldGroupId; title: string; fields: FieldKey[] }[] = [
  { id: 'basket', title: 'سبد محصولات', fields: ['posCount', 'cashCount'] },
  {
    id: 'pos',
    title: 'اقتصاد کارتخوان',
    fields: ['posBasePrice', 'posTargetPrice', 'factoryMarketing'],
  },
  {
    id: 'cash',
    title: 'اقتصاد کش‌لس',
    fields: ['cashCost', 'cashSalePrice', 'cashTargetMargin'],
  },
];
