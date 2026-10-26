import type { BundleResult } from '../features/bundle/bundle.types';
import { formatMillion } from '../lib/format';

type Kind = 'budget' | 'adjust' | 'target' | 'balance' | 'index' | 'nominal';

const KIND_LABEL: Record<Kind, string> = {
  budget: 'بودجه',
  adjust: 'تعدیل',
  target: 'هدف مدیریتی',
  balance: 'مانده',
  index: 'شاخص مدیریتی',
  nominal: 'ارزش اسمی',
};

interface Row {
  key: string;
  label: string;
  value: string;
  negative?: boolean;
  kind: Kind;
  note: string;
}

function buildRows(r: BundleResult): Row[] {
  return [
    {
      key: 'initial',
      label: 'بودجه اولیه باندلینگ',
      value: formatMillion(r.initialBundleBudget),
      kind: 'budget',
      note: '(قیمت فروش − هزینه − حاشیه هدف) × تعداد کش‌لس',
    },
    {
      key: 'adjust',
      label: 'تعدیل کل قیمت کارتخوان',
      value: r.totalPosAdjustment > 0 ? `−${formatMillion(r.totalPosAdjustment)}` : formatMillion(0),
      kind: 'adjust',
      note: 'تعدیل هر کارتخوان × تعداد کارتخوان؛ از بودجه اولیه کسر می‌شود',
    },
    {
      key: 'remaining',
      label: 'مانده بودجه پس از تعدیل',
      value: formatMillion(r.remainingBundleBudget),
      negative: r.remainingBundleBudget < 0,
      kind: 'balance',
      note: 'بودجه اولیه − تعدیل کل؛ منفی یعنی کسری بودجه',
    },
    {
      key: 'markup',
      label: 'حاشیه سود هدف کل کش‌لس',
      value: formatMillion(r.totalCashMarkup),
      kind: 'target',
      note: 'هدف مدیریتی است، نه سود تحقق‌یافته',
    },
    {
      key: 'final',
      label: 'مانده اقتصادی نهایی',
      value: formatMillion(r.finalEconomicBalance),
      negative: r.finalEconomicBalance < 0,
      kind: 'balance',
      note: 'مانده بودجه + حاشیه سود هدف کل',
    },
    {
      key: 'effective',
      label: 'قیمت تخصیصی واقعی کش‌لس در بسته',
      value: formatMillion(r.effectiveCashPrice),
      kind: 'index',
      note: 'شاخص تخصیص مدیریتی؛ قیمت فروش ثبت‌شده یا سود خالص نیست',
    },
    {
      key: 'sales',
      label: 'ارزش فروش اسمی بسته',
      value: formatMillion(r.bundleSalesValue),
      kind: 'nominal',
      note: 'جمع قیمت‌های فروش بسته؛ جدا از مانده بودجه و سود هدف',
    },
  ];
}

interface Props {
  result: BundleResult;
  caption?: string;
}

export function FinancialBreakdown({ result, caption = 'جدول تجزیه اقتصادی بسته' }: Props) {
  const rows = buildRows(result);
  return (
    <div className="table-wrap">
      <table className="breakdown">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">شاخص</th>
            <th scope="col">نوع</th>
            <th scope="col" className="breakdown__num">
              مقدار
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.negative ? 'is-negative' : undefined}>
              <th scope="row">
                <span className="breakdown__label">{row.label}</span>
                <span className="breakdown__note">{row.note}</span>
              </th>
              <td>
                <span className={`tag tag--${row.kind}`}>{KIND_LABEL[row.kind]}</span>
              </td>
              <td className="breakdown__num num">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
