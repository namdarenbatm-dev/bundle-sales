export const FIELD_KEYS = [
  'posCount',
  'cashCount',
  'posBasePrice',
  'posTargetPrice',
  'factoryMarketing',
  'cashCost',
  'cashSalePrice',
  'cashTargetMargin',
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

/** مقدار خام ورودی‌ها (رشته‌ای؛ همان چیزی که کاربر تایپ کرده است) */
export type RawInputs = Record<FieldKey, string>;

/** ورودی‌های معتبر و عددی. همه مبالغ بر حسب میلیون تومان‌اند. */
export type BundleInputs = Record<FieldKey, number>;

export interface BundleResult {
  /** POS_REFERENCE = P_pos_base + M_factory */
  posReference: number;
  /** max(0, POS_REFERENCE − P_pos_target) */
  posAdjustmentPerUnit: number;
  totalPosAdjustment: number;
  cashBudgetPerUnit: number;
  initialBundleBudget: number;
  remainingBundleBudget: number;
  totalCashMarkup: number;
  finalEconomicBalance: number;
  /** شاخص تخصیص مدیریتی — نه قیمت ثبت‌شده فروش و نه سود خالص */
  effectiveCashPrice: number;
  /** ارزش اسمی فروش بسته — جدا از مانده بودجه و سود هدف */
  bundleSalesValue: number;
  remainingSharePct: number;
  markupSharePct: number;
  /** کمترین قیمت هدف کارتخوان که مانده بودجه را صفر نگه می‌دارد (مرز کسری) */
  breakEvenPosTarget: number;
  /** قیمت پایه − قیمت هدف؛ اگر هدف بالاتر از قیمت پایه باشد منفی می‌شود */
  posDiscountVsList: number;
}

export type ModelStatus = 'valid' | 'deficit' | 'invalid';

export type IssueLevel = 'error' | 'warning' | 'info';

export interface Issue {
  id: string;
  level: IssueLevel;
  field?: FieldKey;
  message: string;
}

export interface ValidationOutcome {
  /** فقط وقتی هیچ خطایی نیست مقدار دارد */
  inputs: BundleInputs | null;
  issues: Issue[];
  fieldErrors: Partial<Record<FieldKey, string>>;
  hasErrors: boolean;
}
