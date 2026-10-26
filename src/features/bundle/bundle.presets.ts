import { calculateBundle, hasDeficit } from './bundle.calculator';
import { validateInputs, parseNumber } from './bundle.validation';
import type {
  BundleInputs,
  BundleResult,
  Issue,
  ModelStatus,
  RawInputs,
} from './bundle.types';

/**
 * موتور سناریوسازی مدل‌های تجاری.
 *
 * قاعده تجاری تأییدشده‌ای برای تعداد/قیمت بسته‌ها وجود ندارد؛ بنابراین هر مدل با
 * دو «پارامتر قابل تنظیم» ساخته می‌شود و هیچ‌کدام سیاست قطعی توسن تکنو نیست:
 *   ۱) سهم کش‌لس از کل سبد (٪)  ← کل سبد = تعداد کارتخوان + تعداد کش‌لس مدل جاری
 *   ۲) قیمت هدف کارتخوان (خالی = همان قیمت هدف مدل جاری)
 * هر سناریو با همان اعتبارسنجی و فرمول‌های مدل پایه ارزیابی می‌شود.
 */
export interface ScenarioRule {
  id: string;
  name: string;
  focus: string;
  /** سهم پیش‌فرض کش‌لس از کل سبد، به درصد (قابل ویرایش در UI) */
  defaultCashSharePct: number;
}

export const DEFAULT_SCENARIO_RULES: ScenarioRule[] = [
  { id: 'shaparaki', name: 'بسته شاپرکی', focus: 'تمرکز بیشتر بر توسعه کارتخوان', defaultCashSharePct: 30 },
  { id: 'combo', name: 'بسته ترکیبی', focus: 'تعادل بین توسعه کارتخوان و کش‌لس', defaultCashSharePct: 40 },
  { id: 'shetabi', name: 'بسته شتابی', focus: 'تمرکز بیشتر بر فروش کش‌لس', defaultCashSharePct: 50 },
];

export interface ScenarioParams {
  /** متن خام سهم کش‌لس (٪) */
  cashShare: string;
  /** متن خام قیمت هدف کارتخوان؛ خالی = قیمت هدف مدل جاری */
  posTarget: string;
}

export interface ScenarioResult {
  rule: ScenarioRule;
  status: ModelStatus;
  issues: Issue[];
  inputs: BundleInputs | null;
  result: BundleResult | null;
}

export function defaultScenarioParams(
  rules: ScenarioRule[] = DEFAULT_SCENARIO_RULES,
): Record<string, ScenarioParams> {
  return Object.fromEntries(
    rules.map((r) => [r.id, { cashShare: String(r.defaultCashSharePct), posTarget: '' }]),
  );
}

function invalid(rule: ScenarioRule, message: string): ScenarioResult {
  return {
    rule,
    status: 'invalid',
    issues: [{ id: `${rule.id}-invalid`, level: 'error', message }],
    inputs: null,
    result: null,
  };
}

export function buildScenario(
  base: RawInputs,
  rule: ScenarioRule,
  params: ScenarioParams,
): ScenarioResult {
  const nPos = parseNumber(base.posCount);
  const nCash = parseNumber(base.cashCount);
  if (!Number.isInteger(nPos) || !Number.isInteger(nCash) || nPos < 1 || nCash < 1) {
    return invalid(rule, 'تعداد کارتخوان و کش‌لس مدل جاری معتبر نیست؛ اندازه کل سبد مشخص نیست');
  }
  const share = parseNumber(params.cashShare);
  if (Number.isNaN(share) || share <= 0 || share >= 100) {
    return invalid(rule, 'سهم کش‌لس باید عددی بین ۰ تا ۱۰۰ (بدون مرز) باشد');
  }
  const total = nPos + nCash;
  const scenarioCash = Math.round((total * share) / 100);
  const scenarioPos = total - scenarioCash;

  const raw: RawInputs = {
    ...base,
    posCount: String(scenarioPos),
    cashCount: String(scenarioCash),
    posTargetPrice: params.posTarget.trim() === '' ? base.posTargetPrice : params.posTarget,
  };
  const outcome = validateInputs(raw);
  if (!outcome.inputs) {
    return {
      rule,
      status: 'invalid',
      issues: outcome.issues,
      inputs: null,
      result: null,
    };
  }
  const result = calculateBundle(outcome.inputs);
  return {
    rule,
    status: hasDeficit(result) ? 'deficit' : 'valid',
    issues: outcome.issues,
    inputs: outcome.inputs,
    result,
  };
}

export function buildScenarios(
  base: RawInputs,
  params: Record<string, ScenarioParams>,
  rules: ScenarioRule[] = DEFAULT_SCENARIO_RULES,
): ScenarioResult[] {
  return rules.map((rule) =>
    buildScenario(base, rule, params[rule.id] ?? { cashShare: String(rule.defaultCashSharePct), posTarget: '' }),
  );
}

/* ---------------- نمای نماینده فروش ---------------- */

/**
 * فقط فیلدهای تجاری مجاز. هزینه تمام‌شده، بودجه داخلی، حاشیه سود هدف و فرمول‌ها
 * عمداً در این نوع وجود ندارند تا از نمای نماینده عبور نکنند.
 */
export interface AgentOffer {
  id: string;
  name: string;
  focus: string;
  posCount: number;
  cashCount: number;
  posPrice: number;
  cashPrice: number;
  nominalValue: number;
  /** تخفیف هر کارتخوان نسبت به قیمت لیست؛ فقط وقتی مثبت است */
  posDiscountVsList: number | null;
}

export function toAgentOffer(
  id: string,
  name: string,
  focus: string,
  inputs: BundleInputs,
  result: BundleResult,
): AgentOffer {
  return {
    id,
    name,
    focus,
    posCount: inputs.posCount,
    cashCount: inputs.cashCount,
    posPrice: inputs.posTargetPrice,
    cashPrice: inputs.cashSalePrice,
    nominalValue: result.bundleSalesValue,
    posDiscountVsList: result.posDiscountVsList > 0 ? result.posDiscountVsList : null,
  };
}

/** فقط بسته‌های معتبر و بدون کسری به نماینده نشان داده می‌شوند */
export function collectAgentOffers(
  current: { inputs: BundleInputs; result: BundleResult } | null,
  scenarios: ScenarioResult[],
): AgentOffer[] {
  const offers: AgentOffer[] = [];
  if (current && !hasDeficit(current.result)) {
    offers.push(
      toAgentOffer('current', 'بسته پایه (مدل جاری)', 'تعدادهای واردشده در پنل پارامترها', current.inputs, current.result),
    );
  }
  for (const s of scenarios) {
    if (s.status === 'valid' && s.inputs && s.result) {
      offers.push(toAgentOffer(s.rule.id, s.rule.name, s.rule.focus, s.inputs, s.result));
    }
  }
  return offers;
}
