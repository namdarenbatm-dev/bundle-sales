import { describe, expect, it } from 'vitest';
import { calculateBundle } from '../features/bundle/bundle.calculator';
import { DEFAULT_INPUTS, DEFAULT_RAW } from '../features/bundle/bundle.defaults';
import {
  CSV_BOM,
  buildAgentCsv,
  buildManagementCsv,
  csvEscape,
} from '../features/bundle/bundle.export';
import { buildScenarios, collectAgentOffers, defaultScenarioParams } from '../features/bundle/bundle.presets';

const result = calculateBundle(DEFAULT_INPUTS);
const scenarios = buildScenarios(DEFAULT_RAW, defaultScenarioParams());
const date = new Date('2026-10-26T08:00:00Z');

describe('خروجی CSV', () => {
  it('escape صحیح', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('ساده')).toBe('ساده');
    expect(csvEscape(12)).toBe('12');
  });

  it('گزارش مدیریتی: BOM، ستون‌های فارسی و مقادیر کنترلی', () => {
    const csv = buildManagementCsv({ date, inputs: DEFAULT_INPUTS, result, status: 'valid', scenarios });
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.split('\r\n')[0]).toBe(`${CSV_BOM}بخش,شاخص,مقدار,واحد`);
    expect(csv).toContain('بودجه اولیه باندلینگ,150,میلیون تومان');
    expect(csv).toContain('مانده اقتصادی نهایی,120,میلیون تومان');
    expect(csv).toContain('ارزش فروش اسمی بسته,570,میلیون تومان');
    expect(csv).toContain('وضعیت اعتبار مدل,معتبر از نظر بودجه تعریف‌شده');
    expect(csv).toContain('سناریو: بسته شاپرکی');
  });

  it('وضعیت کسری در گزارش مدیریتی ثبت می‌شود', () => {
    const inputs = { ...DEFAULT_INPUTS, posTargetPrice: 0 };
    const csv = buildManagementCsv({
      date,
      inputs,
      result: calculateBundle(inputs),
      status: 'deficit',
      scenarios: [],
    });
    expect(csv).toContain('نیازمند اصلاح (کسری بودجه)');
  });

  it('گزارش نماینده هیچ اطلاعات داخلی ندارد', () => {
    const offers = collectAgentOffers({ inputs: DEFAULT_INPUTS, result }, scenarios);
    const csv = buildAgentCsv(offers, date);
    for (const secret of ['هزینه تمام‌شده', 'حاشیه سود', 'بودجه اولیه', 'مانده', 'تعدیل کل', 'شاخص مدیریتی']) {
      expect(csv).not.toContain(secret);
    }
    expect(csv).toContain('ارزش اسمی بسته,570,میلیون تومان');
    expect(csv.startsWith(CSV_BOM)).toBe(true);
  });

  it('نوع AgentOffer فیلد داخلی ندارد', () => {
    const [offer] = collectAgentOffers({ inputs: DEFAULT_INPUTS, result }, []);
    expect(Object.keys(offer).sort()).toEqual(
      ['cashCount', 'cashPrice', 'focus', 'id', 'name', 'nominalValue', 'posCount', 'posDiscountVsList', 'posPrice'].sort(),
    );
  });
});
