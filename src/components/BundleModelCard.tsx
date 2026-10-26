import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ScenarioParams, ScenarioResult } from '../features/bundle/bundle.presets';
import type { ModelStatus } from '../features/bundle/bundle.types';
import { formatMillion, formatNumber } from '../lib/format';

const STATUS: Record<ModelStatus, { text: string; Icon: typeof CheckCircle2 }> = {
  valid: { text: 'معتبر از نظر بودجه تعریف‌شده', Icon: CheckCircle2 },
  deficit: { text: 'نیازمند اصلاح (کسری بودجه)', Icon: AlertTriangle },
  invalid: { text: 'ورودی نامعتبر', Icon: XCircle },
};

interface Props {
  scenario: ScenarioResult;
  params: ScenarioParams;
  /** قیمت هدف مدل جاری برای نمایش در placeholder */
  currentTargetText: string;
  selected: boolean;
  onParams: (id: string, patch: Partial<ScenarioParams>) => void;
  onSelect: (id: string) => void;
}

export function BundleModelCard({
  scenario,
  params,
  currentTargetText,
  selected,
  onParams,
  onSelect,
}: Props) {
  const { rule, status, inputs, result, issues } = scenario;
  const { text, Icon } = STATUS[status];
  const errors = issues.filter((i) => i.level === 'error');
  const shareId = `${rule.id}-share`;
  const targetId = `${rule.id}-target`;

  return (
    <article className={`model-card model-card--${status}${selected ? ' is-selected' : ''}`}>
      <header className="model-card__head">
        <div>
          <h3>{rule.name}</h3>
          <p className="model-card__focus">{rule.focus}</p>
        </div>
        <span className={`badge badge--${status}`}>
          <Icon size={14} aria-hidden="true" />
          {text}
        </span>
      </header>

      <div className="model-card__params no-print">
        <div className="mini-field">
          <label htmlFor={shareId}>سهم کش‌لس از کل سبد (٪)</label>
          <input
            id={shareId}
            className="num"
            type="text"
            inputMode="decimal"
            dir="ltr"
            autoComplete="off"
            value={params.cashShare}
            onChange={(e) => onParams(rule.id, { cashShare: e.target.value })}
          />
        </div>
        <div className="mini-field">
          <label htmlFor={targetId}>قیمت هدف کارتخوان (میلیون تومان)</label>
          <input
            id={targetId}
            className="num"
            type="text"
            inputMode="decimal"
            dir="ltr"
            autoComplete="off"
            placeholder={currentTargetText}
            value={params.posTarget}
            onChange={(e) => onParams(rule.id, { posTarget: e.target.value })}
          />
        </div>
      </div>

      {inputs && result ? (
        <dl className="model-card__stats">
          <div>
            <dt>کارتخوان</dt>
            <dd className="num">{formatNumber(inputs.posCount)}</dd>
          </div>
          <div>
            <dt>کش‌لس</dt>
            <dd className="num">{formatNumber(inputs.cashCount)}</dd>
          </div>
          <div>
            <dt>قیمت هدف کارتخوان</dt>
            <dd className="num">{formatMillion(inputs.posTargetPrice)}</dd>
          </div>
          <div>
            <dt>مانده بودجه پس از تعدیل</dt>
            <dd className={`num${result.remainingBundleBudget < 0 ? ' is-negative' : ''}`}>
              {formatMillion(result.remainingBundleBudget)}
            </dd>
          </div>
          <div>
            <dt>ارزش فروش اسمی بسته</dt>
            <dd className="num">{formatMillion(result.bundleSalesValue)}</dd>
          </div>
        </dl>
      ) : (
        <ul className="model-card__errors">
          {errors.map((e) => (
            <li key={e.id}>{e.message}</li>
          ))}
        </ul>
      )}

      {status === 'deficit' ? (
        <p className="model-card__warn">
          این سناریو کسری بودجه دارد و به‌عنوان مدل تأییدشده یا پیشنهاد قابل‌اجرا نمایش داده نمی‌شود.
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--ghost no-print"
        aria-pressed={selected}
        disabled={!result}
        onClick={() => onSelect(rule.id)}
      >
        {selected ? 'بستن جزئیات' : 'مشاهده جزئیات'}
      </button>
    </article>
  );
}
