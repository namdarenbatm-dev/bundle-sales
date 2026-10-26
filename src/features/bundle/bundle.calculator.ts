import type { BundleInputs, BundleResult, FieldKey } from './bundle.types';
import { FIELD_KEYS } from './bundle.types';

/**
 * تنها محل فرمول‌های مالی مدل. UI هیچ فرمول مستقلی ندارد.
 *
 * دقت: مبالغ ورودی (میلیون تومان) به «هزار تومان» صحیح تبدیل و همه جمع/ضرب‌ها
 * روی اعداد صحیح انجام می‌شود تا خطای اعشاری (مثل 0.1+0.2) پیش نیاید.
 * گردکردن فقط هنگام نمایش انجام می‌شود (src/lib/format.ts).
 */
const SCALE = 1000;
export const toUnits = (million: number): number => Math.round(million * SCALE);
export const fromUnits = (units: number): number => units / SCALE;

function assertFinite(inputs: BundleInputs): void {
  for (const key of FIELD_KEYS) {
    if (!Number.isFinite(inputs[key])) {
      throw new RangeError(`مقدار ورودی «${key}» عددی معتبر نیست`);
    }
  }
  const counts: FieldKey[] = ['posCount', 'cashCount'];
  for (const key of counts) {
    if (!Number.isInteger(inputs[key]) || inputs[key] < 0) {
      throw new RangeError(`مقدار «${key}» باید عدد صحیح غیرمنفی باشد`);
    }
  }
}

export function calculateBundle(inputs: BundleInputs): BundleResult {
  assertFinite(inputs);

  const nPos = inputs.posCount;
  const nCash = inputs.cashCount;
  const base = toUnits(inputs.posBasePrice);
  const target = toUnits(inputs.posTargetPrice);
  const factory = toUnits(inputs.factoryMarketing);
  const cost = toUnits(inputs.cashCost);
  const sale = toUnits(inputs.cashSalePrice);
  const margin = toUnits(inputs.cashTargetMargin);

  // ۱) مرجع اقتصادی کارتخوان (بودجه بازاریابی کارخانه اینجا لحاظ می‌شود، نه دوباره از کش‌لس)
  const reference = base + factory;
  // ۲–۳) تعدیل
  const adjustmentPerUnit = Math.max(0, reference - target);
  const totalAdjustment = adjustmentPerUnit * nPos;
  // ۴–۵) بودجه کش‌لس
  const budgetPerCash = sale - cost - margin;
  const initialBudget = budgetPerCash * nCash;
  // ۶) مانده پس از تعدیل
  const remaining = initialBudget - totalAdjustment;
  // ۷–۸) حاشیه سود هدف و مانده اقتصادی نهایی
  const totalMarkup = margin * nCash;
  const finalBalance = remaining + totalMarkup;
  // ۹) شاخص تخصیص مدیریتی (فقط اگر N_cash > 0)
  const effectiveCash = nCash > 0 ? (cost * nCash + finalBalance) / nCash : 0;
  // ۱۰) ارزش اسمی فروش
  const salesValue = target * nPos + sale * nCash;
  // ۱۱–۱۲) سهم‌ها؛ مخرج صفر ⇒ ۰٪
  const remainingPositive = Math.max(0, remaining);
  const markupPositive = Math.max(0, totalMarkup);
  const denominator = remainingPositive + markupPositive;
  const remainingShare = denominator > 0 ? (remainingPositive / denominator) * 100 : 0;
  const markupShare = denominator > 0 ? (markupPositive / denominator) * 100 : 0;
  // مرز: کمترین قیمت هدف با مانده بودجه صفر ⇒ (مرجع×N_pos − بودجه اولیه) / N_pos
  const breakEven = nPos > 0 ? (reference * nPos - initialBudget) / nPos : 0;

  return {
    posReference: fromUnits(reference),
    posAdjustmentPerUnit: fromUnits(adjustmentPerUnit),
    totalPosAdjustment: fromUnits(totalAdjustment),
    cashBudgetPerUnit: fromUnits(budgetPerCash),
    initialBundleBudget: fromUnits(initialBudget),
    remainingBundleBudget: fromUnits(remaining),
    totalCashMarkup: fromUnits(totalMarkup),
    finalEconomicBalance: fromUnits(finalBalance),
    effectiveCashPrice: fromUnits(effectiveCash),
    bundleSalesValue: fromUnits(salesValue),
    remainingSharePct: remainingShare,
    markupSharePct: markupShare,
    breakEvenPosTarget: fromUnits(breakEven),
    posDiscountVsList: fromUnits(base - target),
  };
}

/** مانده منفی ⇒ «نیازمند اصلاح». مانده صفر کسری نیست. */
export function hasDeficit(result: BundleResult): boolean {
  return result.remainingBundleBudget < 0;
}
