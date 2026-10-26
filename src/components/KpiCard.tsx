import type { ReactNode } from 'react';

export type KpiTone = 'navy' | 'teal' | 'blue' | 'violet' | 'danger';

interface Props {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: KpiTone;
  icon: ReactNode;
}

export function KpiCard({ label, value, unit, note, tone = 'navy', icon }: Props) {
  return (
    <article className={`kpi kpi--${tone}`}>
      <div className="kpi__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="kpi__body">
        <p className="kpi__label">{label}</p>
        <p className="kpi__value">
          <span className="num">{value}</span>
          {unit ? <span className="kpi__unit">{unit}</span> : null}
        </p>
        {note ? <p className="kpi__note">{note}</p> : null}
      </div>
    </article>
  );
}
