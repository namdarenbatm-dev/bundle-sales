import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { BundleResult, ModelStatus } from '../features/bundle/bundle.types';
import { formatMillion, formatPercent } from '../lib/format';

const COLOR_REMAINING = '#0d9488';
const COLOR_MARKUP = '#6d5bd0';

interface Props {
  result: BundleResult | null;
  status: ModelStatus;
}

/** دلیل عدم نمایش نمودار؛ null یعنی داده معتبر و قابل‌نمایش است */
function blockedReason(result: BundleResult | null, status: ModelStatus): string | null {
  if (!result || status === 'invalid') {
    return 'ورودی‌ها نامعتبرند؛ تا اصلاح خطاها نمودار نمایش داده نمی‌شود.';
  }
  if (status === 'deficit' || result.remainingBundleBudget < 0) {
    return 'مانده بودجه منفی است (کسری بودجه). نمودار سهم‌ها در این حالت گمراه‌کننده است و نمایش داده نمی‌شود.';
  }
  if (result.remainingSharePct + result.markupSharePct <= 0) {
    return 'مانده بودجه و حاشیه سود هدف هر دو صفرند؛ سهمی برای نمایش وجود ندارد.';
  }
  return null;
}

export function BudgetDonutChart({ result, status }: Props) {
  const reason = blockedReason(result, status);
  if (reason || !result) {
    return (
      <div className="chart-empty" role="status">
        {reason}
      </div>
    );
  }

  const parts = [
    {
      name: 'مانده بودجه باندلینگ',
      value: result.remainingBundleBudget,
      pct: result.remainingSharePct,
      color: COLOR_REMAINING,
    },
    {
      name: 'حاشیه سود هدف کل کش‌لس',
      value: result.totalCashMarkup,
      pct: result.markupSharePct,
      color: COLOR_MARKUP,
    },
  ];

  const label = `نمودار دونات: ${parts
    .map((p) => `${p.name} ${formatMillion(p.value)} (${formatPercent(p.pct)})`)
    .join('، ')}`;

  return (
    <div className="donut">
      <div className="donut__chart" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={parts}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {parts.map((p) => (
                <Cell key={p.name} fill={p.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut__center">
          <span className="donut__center-label">مانده اقتصادی نهایی</span>
          <strong className="num">{formatMillion(result.finalEconomicBalance)}</strong>
        </div>
      </div>
      <ul className="donut__legend">
        {parts.map((p) => (
          <li key={p.name}>
            <span className="donut__swatch" style={{ background: p.color }} aria-hidden="true" />
            <div>
              <p className="donut__name">{p.name}</p>
              <p className="donut__amount num">
                {formatMillion(p.value)} <span className="donut__pct">({formatPercent(p.pct)})</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
