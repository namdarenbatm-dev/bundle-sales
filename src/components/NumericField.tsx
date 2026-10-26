import { AlertCircle, Info } from 'lucide-react';
import { FIELD_META } from '../features/bundle/bundle.defaults';
import type { FieldKey } from '../features/bundle/bundle.types';

interface Props {
  field: FieldKey;
  value: string;
  error?: string;
  /** هشدار یا یادداشت غیرمسدودکننده برای همین فیلد */
  note?: string;
  onChange: (field: FieldKey, value: string) => void;
}

/** ورودی عددی؛ متن خام را نگه می‌دارد و اعتبارسنجی در bundle.validation.ts انجام می‌شود */
export function NumericField({ field, value, error, note, onChange }: Props) {
  const meta = FIELD_META[field];
  const id = `field-${field}`;
  const describedBy = [error ? `${id}-error` : null, note ? `${id}-note` : null, meta.hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {meta.label}
      </label>
      <div className="field__control">
        <input
          id={id}
          className="field__input num"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          dir="ltr"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => onChange(field, e.target.value)}
        />
        <span className="field__unit">{meta.unit}</span>
      </div>
      {meta.hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {meta.hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {!error && note ? (
        <p className="field__note" id={`${id}-note`}>
          <Info size={14} aria-hidden="true" />
          <span>{note}</span>
        </p>
      ) : null}
    </div>
  );
}
