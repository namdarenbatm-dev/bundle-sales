import { formatMillion, formatNumber } from '../../lib/format';
import type { BundleInputs, BundleResult, ModelStatus } from './bundle.types';

/** خلاصه مدیریتی؛ هر عدد از محاسبه جاری می‌آید (هیچ جمله ثابت با عدد ساختگی نیست) */
export function buildExecutiveSummary(
  inputs: BundleInputs,
  result: BundleResult,
  status: ModelStatus,
): string[] {
  if (status === 'invalid') {
    return ['ورودی‌ها نامعتبرند؛ تا اصلاح خطاها خلاصه مدیریتی محاسبه نمی‌شود.'];
  }
  const lines: string[] = [];

  if (result.posAdjustmentPerUnit > 0) {
    lines.push(
      `قیمت هدف کارتخوان (${formatMillion(inputs.posTargetPrice)}) نسبت به مرجع اقتصادی (${formatMillion(result.posReference)}) ` +
        `تعدیلی برابر ${formatMillion(result.posAdjustmentPerUnit)} برای هر دستگاه ایجاد کرده است؛ ` +
        `جمع تعدیل برای ${formatNumber(inputs.posCount)} کارتخوان ${formatMillion(result.totalPosAdjustment)} می‌شود.`,
    );
  } else {
    lines.push(
      `قیمت هدف کارتخوان (${formatMillion(inputs.posTargetPrice)}) از مرجع اقتصادی (${formatMillion(result.posReference)}) کمتر نیست؛ تعدیل اقتصادی صفر است.`,
    );
  }

  lines.push(
    `بودجه اولیه باندلینگ ${formatMillion(result.initialBundleBudget)} است ` +
      `(${formatMillion(result.cashBudgetPerUnit)} به‌ازای هر کش‌لس × ${formatNumber(inputs.cashCount)} کش‌لس).`,
  );

  if (result.remainingBundleBudget >= 0) {
    lines.push(`پس از تعدیل قیمت کارتخوان، ${formatMillion(result.remainingBundleBudget)} از بودجه باقی می‌ماند.`);
  } else {
    lines.push(
      `پس از تعدیل قیمت کارتخوان، کسری بودجه‌ای برابر ${formatMillion(Math.abs(result.remainingBundleBudget))} ایجاد می‌شود.`,
    );
  }

  if (status === 'valid') {
    lines.push(
      'مدل از نظر بودجه تعریف‌شده معتبر است. این ارزیابی فقط بر پایه ورودی‌های جاری است و به‌معنای سود تحقق‌یافته یا سود خالص نیست.',
    );
  } else {
    lines.push(
      `مدل نیازمند اصلاح است و به‌عنوان مدل تأییدشده نمایش داده نمی‌شود. ` +
        `برای مانده بودجه صفر، قیمت هدف کارتخوان باید دست‌کم ${formatMillion(result.breakEvenPosTarget)} باشد، یا تعداد/قیمت کش‌لس اصلاح شود.`,
    );
  }
  return lines;
}
