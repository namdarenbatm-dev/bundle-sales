import { useState } from 'react';
import { Boxes, Coins, Smartphone, Wallet } from 'lucide-react';
import { FIELD_GROUPS, FIELD_META } from '../features/bundle/bundle.defaults';
import { formatMillion, formatNumber } from '../lib/format';
import type { FieldKey } from '../features/bundle/bundle.types';
import type { BundleModel } from '../hooks/useBundleModel';
import { BudgetDonutChart } from './BudgetDonutChart';
import { BundleModelCard } from './BundleModelCard';
import { FinancialBreakdown } from './FinancialBreakdown';
import { ImpactSummary } from './ImpactSummary';
import { KpiCard } from './KpiCard';
import { NumericField } from './NumericField';
import { ValidationMessages } from './ValidationMessages';

interface Props {
  model: BundleModel;
}

export function ManagementView({ model }: Props) {
  const { raw, outcome, current, result, status, scenarios, scenarioParams, summary } = model;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputs = current?.inputs ?? null;
  const dash = '—';

  // یادداشت‌های غیرمسدودکننده (هشدار/اطلاع) کنار فیلد مربوط
  const notes: Partial<Record<FieldKey, string>> = {};
  for (const issue of outcome.issues) {
    if (issue.level !== 'error' && issue.field && !notes[issue.field]) notes[issue.field] = issue.message;
  }

  const selected = scenarios.find((s) => s.rule.id === selectedId) ?? null;
  const totalBasket =
    inputs !== null ? formatNumber(inputs.posCount + inputs.cashCount) : null;

  return (
    <>
      <section className="kpi-grid" aria-label="شاخص‌های اصلی">
        <KpiCard
          label="تعداد کارتخوان"
          value={inputs ? formatNumber(inputs.posCount) : dash}
          unit="دستگاه"
          tone="blue"
          icon={<Smartphone size={22} />}
        />
        <KpiCard
          label="تعداد کش‌لس"
          value={inputs ? formatNumber(inputs.cashCount) : dash}
          unit="عدد"
          tone="violet"
          icon={<Boxes size={22} />}
        />
        <KpiCard
          label="مانده بودجه پس از تعدیل قیمت کارتخوان"
          value={result ? formatMillion(result.remainingBundleBudget) : dash}
          tone={result && result.remainingBundleBudget < 0 ? 'danger' : 'teal'}
          note={result && result.remainingBundleBudget < 0 ? 'کسری بودجه؛ مدل نیازمند اصلاح است' : undefined}
          icon={<Wallet size={22} />}
        />
        <KpiCard
          label="قیمت تخصیصی واقعی کش‌لس در بسته"
          value={result ? formatMillion(result.effectiveCashPrice) : dash}
          note="شاخص تخصیص مدیریتی؛ قیمت فروش ثبت‌شده نیست"
          tone="navy"
          icon={<Coins size={22} />}
        />
      </section>

      <ValidationMessages issues={outcome.issues} />

      <div className="layout">
        <aside className="card params" aria-labelledby="params-title">
          <h2 id="params-title">پنل پارامترها</h2>
          <p className="card__sub">همه مبالغ بر حسب میلیون تومان است. نتایج بلافاصله به‌روز می‌شوند.</p>
          {FIELD_GROUPS.map((group) => (
            <fieldset key={group.id} className="params__group">
              <legend>{group.title}</legend>
              {group.fields.map((key) => (
                <NumericField
                  key={key}
                  field={key}
                  value={raw[key]}
                  error={outcome.fieldErrors[key]}
                  note={notes[key]}
                  onChange={model.setField}
                />
              ))}
            </fieldset>
          ))}
        </aside>

        <div className="stack">
          <section className="card" aria-labelledby="chart-title">
            <h2 id="chart-title">نمودار بودجه باندلینگ</h2>
            <BudgetDonutChart result={result} status={status} />
          </section>

          <section className="card" aria-labelledby="table-title">
            <h2 id="table-title">جدول تجزیه اقتصادی</h2>
            {result ? (
              <FinancialBreakdown result={result} />
            ) : (
              <p className="chart-empty" role="status">
                تا اصلاح ورودی‌های نامعتبر، جدول محاسبه نمی‌شود.
              </p>
            )}
          </section>

          <section className="card" aria-labelledby="summary-title">
            <h2 id="summary-title">خلاصه مدیریتی</h2>
            <ImpactSummary lines={summary} status={status} />
          </section>
        </div>
      </div>

      <section className="card scenarios" aria-labelledby="scenarios-title">
        <h2 id="scenarios-title">مدل‌های تجاری شبکه فروش</h2>
        <p className="card__sub">
          هر سناریو با همان فرمول‌ها و اعتبارسنجی مدل پایه ارزیابی می‌شود.
          {totalBasket ? ` کل سبد برابر مجموع کارتخوان و کش‌لس مدل جاری است (${totalBasket} واحد).` : ''}{' '}
          سهم کش‌لس و قیمت هدف، پارامترهای قابل‌تنظیم‌اند و سیاست قطعی توسن تکنو نیستند؛ سناریوها رتبه‌بندی
          نمی‌شوند.
        </p>
        <div className="scenarios__grid">
          {scenarios.map((s) => (
            <BundleModelCard
              key={s.rule.id}
              scenario={s}
              params={scenarioParams[s.rule.id] ?? { cashShare: '', posTarget: '' }}
              currentTargetText={raw.posTargetPrice}
              selected={selectedId === s.rule.id}
              onParams={model.setScenarioParam}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
            />
          ))}
        </div>

        {selected?.result ? (
          <div className="scenarios__detail">
            <h3>جزئیات: {selected.rule.name}</h3>
            {selected.status === 'deficit' ? (
              <p className="notice notice--warn" role="alert">
                این سناریو کسری بودجه دارد و مدل تأییدشده نیست.
              </p>
            ) : null}
            <FinancialBreakdown result={selected.result} caption={`جدول تجزیه اقتصادی ${selected.rule.name}`} />
          </div>
        ) : null}
      </section>

      <details className="card assumptions">
        <summary>فرضیات و فرمول‌ها</summary>
        <ul>
          <li>مرجع اقتصادی کارتخوان = قیمت پایه + بودجه بازاریابی کارخانه (به‌ازای هر کارتخوان)</li>
          <li>تعدیل هر کارتخوان = بیشینه (۰، مرجع اقتصادی − قیمت هدف)</li>
          <li>بودجه هر کش‌لس = قیمت فروش − هزینه تمام‌شده − حاشیه سود هدف</li>
          <li>مانده بودجه = (بودجه هر کش‌لس × تعداد کش‌لس) − (تعدیل هر کارتخوان × تعداد کارتخوان)</li>
          <li>مانده اقتصادی نهایی = مانده بودجه + (حاشیه سود هدف × تعداد کش‌لس)</li>
          <li>
            قیمت تخصیصی واقعی کش‌لس = هزینه تمام‌شده + مانده اقتصادی نهایی ÷ تعداد کش‌لس (شاخص مدیریتی)
          </li>
          <li>ارزش فروش اسمی = قیمت هدف کارتخوان × تعداد کارتخوان + قیمت فروش کش‌لس × تعداد کش‌لس</li>
          <li>بودجه بازاریابی کارخانه فقط یک‌بار، در مرجع اقتصادی کارتخوان، لحاظ می‌شود.</li>
          <li>
            حاشیه سود هدف، سود تحقق‌یافته نیست و قیمت پایه کارتخوان لزوماً بهای تمام‌شده آن نیست؛ سود خالص
            محاسبه یا ادعا نمی‌شود.
          </li>
          {result ? (
            <li>
              کمترین قیمت هدف کارتخوان برای مانده بودجه صفر در ورودی‌های جاری:{' '}
              <span className="num">{formatMillion(result.breakEvenPosTarget)}</span>
            </li>
          ) : null}
        </ul>
        <p className="assumptions__meta">
          واحد همه مبالغ: {FIELD_META.posBasePrice.unit}. اعتبار مدل فقط بر پایه ورودی‌های وارد‌شده است.
        </p>
      </details>
    </>
  );
}
