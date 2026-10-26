import { FileDown, Printer, RotateCcw, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { ModelStatus } from '../features/bundle/bundle.types';
import { formatNumber } from '../lib/format';
import { BrandMark } from './BrandMark';

export type ViewMode = 'management' | 'agent';

interface Props {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  status: ModelStatus;
  errorCount: number;
  onReset: () => void;
  onCsv: () => void;
  onPrint: () => void;
  csvDisabled: boolean;
}

const CHIP = {
  valid: { cls: 'chip--ok', Icon: ShieldCheck },
  deficit: { cls: 'chip--warn', Icon: ShieldAlert },
  invalid: { cls: 'chip--danger', Icon: ShieldX },
} as const;

export function AppHeader({
  view,
  onViewChange,
  status,
  errorCount,
  onReset,
  onCsv,
  onPrint,
  csvDisabled,
}: Props) {
  const management = view === 'management';
  const chip = CHIP[status];
  const chipText =
    status === 'valid'
      ? 'ورودی‌ها معتبر · مدل بدون کسری'
      : status === 'deficit'
        ? 'ورودی‌ها معتبر · نیازمند اصلاح (کسری بودجه)'
        : `ورودی نامعتبر · ${formatNumber(errorCount)} خطا`;

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <BrandMark />
          <div className="brand__text">
            <span className="brand__en">FINAL Bundle</span>
            <h1 className="brand__fa">اتاق فرمان باندلینگ</h1>
            <span className="brand__sub">توسن تکنو</span>
          </div>
        </div>

        {/* وضعیت داخلی مدل فقط در نمای مدیریتی نمایش داده می‌شود */}
        {management ? (
          <p className={`chip ${chip.cls}`} role="status">
            <chip.Icon size={16} aria-hidden="true" />
            {chipText}
          </p>
        ) : null}

        <div className="app-header__actions no-print">
          {management ? (
            <button type="button" className="btn btn--light" onClick={onReset}>
              <RotateCcw size={16} aria-hidden="true" />
              بازنشانی مقادیر
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--light"
            onClick={onCsv}
            disabled={csvDisabled}
            title={csvDisabled ? 'تا اصلاح خطاها یا نبود بسته معتبر، خروجی ممکن نیست' : undefined}
          >
            <FileDown size={16} aria-hidden="true" />
            خروجی CSV
          </button>
          <button type="button" className="btn btn--light" onClick={onPrint}>
            <Printer size={16} aria-hidden="true" />
            چاپ / ذخیره PDF
          </button>
        </div>
      </div>

      <div className="view-switch no-print" role="group" aria-label="انتخاب نما">
        <button
          type="button"
          className={management ? 'is-active' : undefined}
          aria-pressed={management}
          onClick={() => onViewChange('management')}
        >
          نمای مدیریتی
        </button>
        <button
          type="button"
          className={!management ? 'is-active' : undefined}
          aria-pressed={!management}
          onClick={() => onViewChange('agent')}
        >
          نمای شبکه فروش
        </button>
      </div>
    </header>
  );
}
