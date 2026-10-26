import { describe, expect, it } from 'vitest';
import { calculateBundle, hasDeficit } from '../features/bundle/bundle.calculator';
import { DEFAULT_INPUTS, DEFAULT_RAW } from '../features/bundle/bundle.defaults';
import {
  DEFAULT_SCENARIO_RULES,
  buildScenario,
  buildScenarios,
  collectAgentOffers,
  defaultScenarioParams,
} from '../features/bundle/bundle.presets';
import { buildExecutiveSummary } from '../features/bundle/bundle.summary';
import { normalizeDigits, parseNumber, validateInputs } from '../features/bundle/bundle.validation';
import type { BundleInputs, RawInputs } from '../features/bundle/bundle.types';
import { formatMillion } from '../lib/format';

const withInputs = (patch: Partial<BundleInputs> = {}): BundleInputs => ({ ...DEFAULT_INPUTS, ...patch });
const withRaw = (patch: Partial<RawInputs> = {}): RawInputs => ({ ...DEFAULT_RAW, ...patch });
const calc = (patch: Partial<BundleInputs> = {}) => calculateBundle(withInputs(patch));
const errorIds = (patch: Partial<RawInputs>) =>
  validateInputs(withRaw(patch))
    .issues.filter((i) => i.level === 'error')
    .map((i) => i.id);

describe('۱) مدل پیش‌فرض و مقادیر کنترلی', () => {
  const r = calc();
  it('مرجع اقتصادی و تعدیل', () => {
    expect(r.posReference).toBe(20);
    expect(r.posAdjustmentPerUnit).toBe(5);
    expect(r.totalPosAdjustment).toBe(50);
  });
  it('بودجه‌ها', () => {
    expect(r.cashBudgetPerUnit).toBe(15);
    expect(r.initialBundleBudget).toBe(150);
    expect(r.remainingBundleBudget).toBe(100);
  });
  it('حاشیه سود هدف و مانده اقتصادی نهایی', () => {
    expect(r.totalCashMarkup).toBe(20);
    expect(r.finalEconomicBalance).toBe(120);
  });
  it('قیمت تخصیصی واقعی و ارزش فروش اسمی', () => {
    expect(r.effectiveCashPrice).toBe(37);
    expect(r.bundleSalesValue).toBe(570);
  });
  it('بودجه بازاریابی کارخانه دوباره از بودجه کش‌لس کم نمی‌شود', () => {
    // اگر دوباره کم می‌شد، بودجه هر کش‌لس ۱۴ می‌شد
    expect(r.cashBudgetPerUnit).toBe(15);
    expect(calc({ factoryMarketing: 3 }).cashBudgetPerUnit).toBe(15);
  });
  it('قیمت پایه ورودی به مدل سود خالص تبدیل نمی‌شود (فقط شاخص‌های تعریف‌شده)', () => {
    expect(Object.keys(r)).not.toContain('netProfit');
  });
});

describe('۲–۵) تغییر ورودی‌ها و به‌روزرسانی لحظه‌ای', () => {
  it('تغییر تعداد کارتخوان', () => {
    const r = calc({ posCount: 12 });
    expect(r.totalPosAdjustment).toBe(60);
    expect(r.remainingBundleBudget).toBe(90);
    expect(r.bundleSalesValue).toBe(12 * 15 + 10 * 42);
  });
  it('تغییر تعداد کش‌لس', () => {
    const r = calc({ cashCount: 8 });
    expect(r.initialBundleBudget).toBe(120);
    expect(r.remainingBundleBudget).toBe(70);
    expect(r.totalCashMarkup).toBe(16);
  });
  it('تغییر قیمت هدف کارتخوان', () => {
    const r = calc({ posTargetPrice: 12 });
    expect(r.posAdjustmentPerUnit).toBe(8);
    expect(r.remainingBundleBudget).toBe(70);
  });
  it('قیمت هدف بالاتر از مرجع ⇒ تعدیل صفر، نه منفی', () => {
    const r = calc({ posTargetPrice: 25 });
    expect(r.posAdjustmentPerUnit).toBe(0);
    expect(r.totalPosAdjustment).toBe(0);
    expect(r.remainingBundleBudget).toBe(150);
  });
  it('افزایش هزینه کش‌لس بودجه را کم می‌کند', () => {
    const r = calc({ cashCost: 30 });
    expect(r.cashBudgetPerUnit).toBe(10);
    expect(r.remainingBundleBudget).toBe(50);
    expect(r.effectiveCashPrice).toBe(30 + 70 / 10);
  });
  it('هر تغییر ورودی نتیجه جدید و سازگار می‌دهد', () => {
    const a = calc();
    const b = calc({ posTargetPrice: 14 });
    expect(b.remainingBundleBudget).toBe(a.remainingBundleBudget - 10);
  });
  it('دقت اعشاری: ۰٫۱ + ۰٫۲ دقیقاً ۰٫۳ است', () => {
    const r = calc({ posBasePrice: 0.1, factoryMarketing: 0.2, posTargetPrice: 0 });
    expect(r.posReference).toBe(0.3);
  });
});

describe('۶) قیمت فروش کش‌لس کمتر از هزینه + حاشیه سود هدف', () => {
  it('خطای اعتبارسنجی با پیام روشن', () => {
    const outcome = validateInputs(withRaw({ cashSalePrice: '26' }));
    expect(outcome.hasErrors).toBe(true);
    expect(outcome.inputs).toBeNull();
    expect(outcome.fieldErrors.cashSalePrice).toContain('باید هزینه تمام‌شده و حاشیه سود هدف را پوشش دهد');
  });
  it('برابر با مجموع مجاز است', () => {
    expect(errorIds({ cashSalePrice: '27' })).toHaveLength(0);
  });
});

describe('۷) مانده بودجه منفی', () => {
  it('کسری شناسایی می‌شود و مرز سربه‌سر درست است', () => {
    const r = calc({ posTargetPrice: 0 });
    expect(r.remainingBundleBudget).toBe(-50);
    expect(hasDeficit(r)).toBe(true);
    expect(r.breakEvenPosTarget).toBe(5);
    expect(hasDeficit(calc({ posTargetPrice: 5 }))).toBe(false);
    expect(calc({ posTargetPrice: 5 }).remainingBundleBudget).toBe(0);
  });
  it('سناریوی کسری «معتبر» نمی‌شود و به نماینده نمی‌رسد', () => {
    const rule = DEFAULT_SCENARIO_RULES[0];
    const s = buildScenario(DEFAULT_RAW, rule, { cashShare: '30', posTarget: '10' });
    expect(s.status).toBe('deficit');
    expect(collectAgentOffers(null, [s])).toHaveLength(0);
  });
  it('خلاصه مدیریتی «نیازمند اصلاح» را اعلام می‌کند', () => {
    const inputs = withInputs({ posTargetPrice: 0 });
    const lines = buildExecutiveSummary(inputs, calculateBundle(inputs), 'deficit');
    expect(lines.join(' ')).toContain('نیازمند اصلاح');
    expect(lines.join(' ')).toContain('کسری بودجه');
  });
});

describe('۸) تعداد کش‌لس بیشتر از کارتخوان', () => {
  it('خطا کنار فیلد کش‌لس', () => {
    const outcome = validateInputs(withRaw({ posCount: '5', cashCount: '6' }));
    expect(outcome.fieldErrors.cashCount).toContain('نباید از تعداد کارتخوان بیشتر شود');
    expect(outcome.inputs).toBeNull();
  });
  it('برابر بودن مجاز است', () => {
    expect(errorIds({ posCount: '6', cashCount: '6' })).toHaveLength(0);
  });
});

describe('۹) ورودی صفر، منفی، خالی و غیرعددی', () => {
  it('صفر برای تعداد‌ها', () => {
    expect(errorIds({ posCount: '0' })).toContain('field-posCount');
    expect(errorIds({ cashCount: '0' })).toContain('field-cashCount');
  });
  it('منفی', () => {
    expect(errorIds({ posBasePrice: '-1' })).toContain('field-posBasePrice');
    expect(errorIds({ cashCount: '-3' })).toContain('field-cashCount');
  });
  it('خالی و فقط فاصله', () => {
    expect(errorIds({ cashCost: '' })).toContain('field-cashCost');
    expect(errorIds({ cashCost: '   ' })).toContain('field-cashCost');
  });
  it('غیرعددی و اعشار برای تعداد', () => {
    expect(errorIds({ posTargetPrice: 'abc' })).toContain('field-posTargetPrice');
    expect(errorIds({ posCount: '2.5' })).toContain('field-posCount');
    expect(errorIds({ posTargetPrice: '1e3' })).toContain('field-posTargetPrice');
  });
  it('صفر برای قیمت‌ها مجاز است', () => {
    expect(errorIds({ posTargetPrice: '0' })).toHaveLength(0);
    expect(errorIds({ factoryMarketing: '0' })).toHaveLength(0);
  });
  it('ارقام فارسی و عربی و جداکننده هزارگان', () => {
    expect(parseNumber('۱۰')).toBe(10);
    expect(parseNumber('٢٥')).toBe(25);
    expect(parseNumber('۱٬۲۰۰')).toBe(1200);
    expect(parseNumber('۱۲٫۵')).toBe(12.5);
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });
  it('ورودی نامعتبر مقدار خروجی نمی‌دهد', () => {
    expect(validateInputs(withRaw({ posCount: 'x' })).inputs).toBeNull();
  });
});

describe('۱۰) جلوگیری از تقسیم بر صفر، NaN و Infinity', () => {
  const allFinite = (obj: object) =>
    Object.values(obj).every((v) => typeof v === 'number' && Number.isFinite(v));

  it('تعداد کش‌لس صفر', () => {
    const r = calc({ cashCount: 0 });
    expect(allFinite(r)).toBe(true);
    expect(r.effectiveCashPrice).toBe(0);
    expect(r.remainingSharePct).toBe(0);
    expect(r.markupSharePct).toBe(0);
  });
  it('تعداد کارتخوان صفر', () => {
    const r = calc({ posCount: 0, cashCount: 0 });
    expect(allFinite(r)).toBe(true);
    expect(r.breakEvenPosTarget).toBe(0);
  });
  it('مخرج درصدها صفر', () => {
    const r = calc({ cashTargetMargin: 0, cashSalePrice: 25, posTargetPrice: 20 });
    expect(r.remainingBundleBudget).toBe(0);
    expect(r.totalCashMarkup).toBe(0);
    expect(r.remainingSharePct).toBe(0);
    expect(r.markupSharePct).toBe(0);
  });
  it('ورودی غیرمتناهی یا NaN خطای کنترل‌شده می‌دهد، نه نتیجه خراب', () => {
    expect(() => calc({ posBasePrice: Number.NaN })).toThrow();
    expect(() => calc({ cashCost: Number.POSITIVE_INFINITY })).toThrow();
  });
});

describe('۱۱) درصدهای نمودار', () => {
  it('مدل پیش‌فرض: ۱۰۰ و ۲۰ ⇒ ۸۳٫۳ و ۱۶٫۷', () => {
    const r = calc();
    expect(r.remainingSharePct).toBeCloseTo(83.3333, 3);
    expect(r.markupSharePct).toBeCloseTo(16.6667, 3);
    expect(r.remainingSharePct + r.markupSharePct).toBeCloseTo(100, 9);
  });
  it('مجموع همیشه ۱۰۰ است وقتی داده مثبت است', () => {
    const r = calc({ posTargetPrice: 18, cashTargetMargin: 3 });
    expect(r.remainingSharePct + r.markupSharePct).toBeCloseTo(100, 9);
  });
  it('مانده منفی در درصدها منفی نمی‌شود', () => {
    const r = calc({ posTargetPrice: 0 });
    expect(r.remainingSharePct).toBe(0);
    expect(r.markupSharePct).toBe(100);
  });
});

describe('۱۲) سناریوهای جایگزین', () => {
  const params = defaultScenarioParams();
  const scenarios = buildScenarios(DEFAULT_RAW, params);

  it('تعداد‌ها از روی سهم قابل تنظیم و کل سبد (۲۰) ساخته می‌شود', () => {
    const counts = scenarios.map((s) => [s.inputs?.posCount, s.inputs?.cashCount]);
    expect(counts).toEqual([
      [14, 6],
      [12, 8],
      [10, 10],
    ]);
  });
  it('هر سناریو با همان فرمول پایه محاسبه می‌شود', () => {
    for (const s of scenarios) {
      expect(s.status).toBe('valid');
      expect(s.result).toEqual(calculateBundle(s.inputs as BundleInputs));
    }
    expect(scenarios[0].result?.remainingBundleBudget).toBe(15 * 6 - 5 * 14);
    expect(scenarios[1].result?.remainingBundleBudget).toBe(15 * 8 - 5 * 12);
    expect(scenarios[2].result?.remainingBundleBudget).toBe(100);
  });
  it('اندازه کل سبد حفظ می‌شود', () => {
    for (const s of scenarios) {
      expect((s.inputs?.posCount ?? 0) + (s.inputs?.cashCount ?? 0)).toBe(20);
    }
  });
  it('تغییر قیمت هدف سناریو روی نتیجه اثر می‌گذارد', () => {
    const s = buildScenario(DEFAULT_RAW, DEFAULT_SCENARIO_RULES[1], { cashShare: '40', posTarget: '16' });
    expect(s.inputs?.posTargetPrice).toBe(16);
    expect(s.result?.posAdjustmentPerUnit).toBe(4);
  });
  it('سهم کش‌لس بیش از نیمه سبد ⇒ نامعتبر (کش‌لس بیشتر از کارتخوان)', () => {
    const s = buildScenario(DEFAULT_RAW, DEFAULT_SCENARIO_RULES[2], { cashShare: '60', posTarget: '' });
    expect(s.status).toBe('invalid');
    expect(s.result).toBeNull();
  });
  it('سهم نامعتبر یا خالی ⇒ نامعتبر', () => {
    for (const cashShare of ['', 'abc', '0', '100', '-5']) {
      const s = buildScenario(DEFAULT_RAW, DEFAULT_SCENARIO_RULES[0], { cashShare, posTarget: '' });
      expect(s.status).toBe('invalid');
    }
  });
  it('مدل پایه نامعتبر ⇒ همه سناریوها نامعتبرند', () => {
    const bad = buildScenarios(withRaw({ posCount: '' }), params);
    expect(bad.every((s) => s.status === 'invalid')).toBe(true);
  });
  it('نماینده فقط بسته‌های معتبر را می‌بیند', () => {
    const current = { inputs: DEFAULT_INPUTS, result: calc() };
    const offers = collectAgentOffers(current, scenarios);
    expect(offers).toHaveLength(4);
    expect(offers[0].nominalValue).toBe(570);
    const withDeficit = collectAgentOffers({ inputs: withInputs({ posTargetPrice: 0 }), result: calc({ posTargetPrice: 0 }) }, []);
    expect(withDeficit).toHaveLength(0);
  });
});

describe('خلاصه مدیریتی با داده واقعی', () => {
  it('مقادیر جاری در متن می‌آیند', () => {
    const inputs = withInputs();
    const text = buildExecutiveSummary(inputs, calculateBundle(inputs), 'valid').join(' ');
    expect(text).toContain(formatMillion(5));
    expect(text).toContain(formatMillion(150));
    expect(text).toContain(formatMillion(100));
    expect(text).toContain('معتبر است');
  });
  it('ورودی نامعتبر ⇒ فقط پیام توقف', () => {
    const lines = buildExecutiveSummary(DEFAULT_INPUTS, calc(), 'invalid');
    expect(lines).toHaveLength(1);
  });
});
