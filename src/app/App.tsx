import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { AgentOffers } from '../components/AgentOffers';
import { AppHeader, type ViewMode } from '../components/AppHeader';
import { ManagementView } from '../components/ManagementView';
import { PwaStatus } from '../components/PwaStatus';
import { SplashScreen, hasSeenSplash } from '../components/SplashScreen';
import { buildAgentCsv, buildManagementCsv, downloadCsv } from '../features/bundle/bundle.export';
import { useBundleModel } from '../hooks/useBundleModel';
import { formatPersianDate } from '../lib/format';

const STATUS_TEXT = {
  valid: 'معتبر از نظر بودجه تعریف‌شده',
  deficit: 'نیازمند اصلاح (کسری بودجه)',
  invalid: 'ورودی نامعتبر',
} as const;

function Dashboard() {
  const model = useBundleModel();
  const [view, setView] = useState<ViewMode>('management');
  const [printDate, setPrintDate] = useState(() => new Date());
  const management = view === 'management';

  // تاریخ چاپ همیشه لحظه چاپ است (حتی چاپ با Ctrl+P)
  useEffect(() => {
    const onBeforePrint = () => setPrintDate(new Date());
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  const csvDisabled = management ? !model.current : model.agentOffers.length === 0;

  const handleCsv = () => {
    const date = new Date();
    if (management) {
      if (!model.current) return;
      downloadCsv(
        'FINAL-Bundle-report.csv',
        buildManagementCsv({
          date,
          inputs: model.current.inputs,
          result: model.current.result,
          status: model.status,
          scenarios: model.scenarios,
        }),
      );
    } else {
      if (model.agentOffers.length === 0) return;
      downloadCsv('FINAL-Bundle-agent-offers.csv', buildAgentCsv(model.agentOffers, date));
    }
  };

  const handlePrint = () => {
    flushSync(() => setPrintDate(new Date()));
    window.print();
  };

  return (
    <div className="app-shell">
      <PwaStatus />
      <AppHeader
        view={view}
        onViewChange={setView}
        status={model.status}
        errorCount={model.outcome.issues.filter((i) => i.level === 'error').length}
        onReset={model.reset}
        onCsv={handleCsv}
        onPrint={handlePrint}
        csvDisabled={csvDisabled}
      />

      <main className="container" id="main">
        <div className="print-only print-head">
          <h1>FINAL Bundle | اتاق فرمان باندلینگ توسن تکنو</h1>
          <p>
            {management ? 'گزارش مدیریتی' : 'پیشنهادهای بسته شبکه فروش'} · {formatPersianDate(printDate)}
            {management ? ` · وضعیت اعتبار مدل: ${STATUS_TEXT[model.status]}` : ''}
          </p>
        </div>

        {management ? <ManagementView model={model} /> : <AgentOffers offers={model.agentOffers} />}
      </main>

      <footer className="app-footer">
        <p>طراحی مدل: مهدی نامدار</p>
        {management ? (
          <p>
            حاشیه سود هدف و قیمت تخصیصی شاخص‌های مدیریتی‌اند؛ سود خالص یا تحقق‌یافته محسوب نمی‌شوند.
            محاسبات فقط روی همین دستگاه انجام می‌شود و داده‌ای ارسال یا ذخیره نمی‌شود.
          </p>
        ) : null}
      </footer>
    </div>
  );
}

export function App() {
  const [splash, setSplash] = useState(() => !hasSeenSplash());
  const finishSplash = useCallback(() => setSplash(false), []);
  return splash ? <SplashScreen onDone={finishSplash} /> : <Dashboard />;
}
