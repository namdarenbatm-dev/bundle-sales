import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { Issue, IssueLevel } from '../features/bundle/bundle.types';

const ORDER: Record<IssueLevel, number> = { error: 0, warning: 1, info: 2 };

const ICON = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

interface Props {
  issues: Issue[];
}

export function ValidationMessages({ issues }: Props) {
  if (issues.length === 0) {
    return (
      <div className="notice notice--ok" role="status">
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>همه ورودی‌ها معتبرند.</span>
      </div>
    );
  }
  const sorted = [...issues].sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const hasError = sorted.some((i) => i.level === 'error');
  return (
    <ul className="issues" aria-label="پیام‌های اعتبارسنجی" role={hasError ? 'alert' : 'status'}>
      {sorted.map((issue) => {
        const Icon = ICON[issue.level];
        return (
          <li key={issue.id} className={`issue issue--${issue.level}`}>
            <Icon size={18} aria-hidden="true" />
            <span>{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
