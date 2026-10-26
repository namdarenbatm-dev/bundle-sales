import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, Share, WifiOff, X } from 'lucide-react';
import { useInstallPrompt, useOnlineStatus } from '../hooks/usePwa';

/** پیام‌های PWA: آفلاین، نسخه جدید (با تأیید کاربر)، آمادگی آفلاین و نصب */
export function PwaStatus() {
  const online = useOnlineStatus();
  const { canInstall, showIosGuide, install } = useInstallPrompt();
  const [iosDismissed, setIosDismissed] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <div className="pwa no-print" aria-live="polite">
      {!online ? (
        <div className="banner banner--warn" role="status">
          <WifiOff size={18} aria-hidden="true" />
          <span>
            اتصال اینترنت قطع است. محاسبات روی همین دستگاه ادامه دارد؛ ورودی‌ها در هیچ‌جا ذخیره
            نمی‌شوند و با بستن صفحه از بین می‌روند.
          </span>
        </div>
      ) : null}

      {needRefresh ? (
        <div className="banner banner--info" role="status">
          <RefreshCw size={18} aria-hidden="true" />
          <span>نسخه جدید برنامه آماده است.</span>
          <button type="button" className="btn btn--small" onClick={() => void updateServiceWorker(true)}>
            به‌روزرسانی
          </button>
          <button type="button" className="icon-btn" aria-label="بستن" onClick={() => setNeedRefresh(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {offlineReady ? (
        <div className="banner banner--ok" role="status">
          <span>برنامه برای استفاده آفلاین ذخیره شد.</span>
          <button type="button" className="icon-btn" aria-label="بستن" onClick={() => setOfflineReady(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {canInstall ? (
        <div className="banner banner--info">
          <Download size={18} aria-hidden="true" />
          <span>می‌توانید این برنامه را روی دستگاه نصب کنید.</span>
          <button type="button" className="btn btn--small" onClick={() => void install()}>
            نصب برنامه
          </button>
        </div>
      ) : null}

      {showIosGuide && !iosDismissed ? (
        <div className="banner banner--info">
          <Share size={18} aria-hidden="true" />
          <span>
            برای نصب در iPhone: در Safari دکمه Share را بزنید، سپس «Add to Home Screen» را انتخاب کنید.
          </span>
          <button type="button" className="icon-btn" aria-label="بستن" onClick={() => setIosDismissed(true)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
