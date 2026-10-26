import { useEffect, useState } from 'react';
import { BrandMark } from './BrandMark';

/** مدت نمایش Splash: دقیقاً ۱۰ ثانیه */
export const SPLASH_MS = 10_000;
const SEEN_KEY = 'final-bundle:splash-seen';

/** زمان شروع در سطح ماژول نگه داشته می‌شود تا remount شدن کامپوننت، شمارش را از نو شروع نکند */
let startedAt: number | null = null;
const elapsedMs = (): number => {
  if (startedAt === null) startedAt = Date.now();
  return Math.min(SPLASH_MS, Date.now() - startedAt);
};

/** sessionStorage فقط برای جلوگیری از نمایش مجدد Splash در همان نشست؛ هیچ داده مالی ذخیره نمی‌شود */
export function hasSeenSplash(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* حالت خصوصی یا مسدود؛ فقط Splash ممکن است دوباره نمایش داده شود */
  }
}

interface Props {
  /** باید پایدار باشد (useCallback) */
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [elapsed] = useState(elapsedMs);

  useEffect(() => {
    const remaining = Math.max(0, SPLASH_MS - elapsedMs());
    const timer = window.setTimeout(() => {
      markSplashSeen();
      onDone();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash" role="status" aria-live="polite" aria-label="در حال آماده‌سازی داشبورد">
      <div className="splash__content">
        <BrandMark size="lg" />
        <p className="splash__en">FINAL Bundle</p>
        <h1 className="splash__fa">اتاق فرمان باندلینگ</h1>
        <p className="splash__sub">توسن تکنو</p>
        <p className="splash__goal">
          مدل باندلینگ ترکیبی با محوریت کارتخوان به‌عنوان محصول هدف و کش‌لس به‌عنوان محصول محرک،
          با هدف توسعه شبکه کارتخوان توسن تکنو.
        </p>
        <div className="splash__bar" aria-hidden="true">
          <span style={{ animationDelay: `-${elapsed}ms`, animationDuration: `${SPLASH_MS}ms` }} />
        </div>
        <p className="splash__credit">طراحی مدل: مهدی نامدار</p>
      </div>
    </div>
  );
}
