import { FileText } from 'lucide-react';
import type { ModelStatus } from '../features/bundle/bundle.types';

interface Props {
  lines: string[];
  status: ModelStatus;
}

/** متن خلاصه از buildExecutiveSummary می‌آید و فقط از محاسبات جاری ساخته می‌شود */
export function ImpactSummary({ lines, status }: Props) {
  return (
    <div className={`summary summary--${status}`}>
      <FileText size={20} aria-hidden="true" className="summary__icon" />
      <div className="summary__text">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
