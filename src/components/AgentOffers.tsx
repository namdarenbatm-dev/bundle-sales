import { Info, PackageOpen } from 'lucide-react';
import type { AgentOffer } from '../features/bundle/bundle.presets';
import { formatMillion, formatNumber } from '../lib/format';

interface Props {
  /** فقط AgentOffer؛ این نوع هیچ فیلد داخلی (هزینه، بودجه، حاشیه سود) ندارد */
  offers: AgentOffer[];
}

export function AgentOffers({ offers }: Props) {
  return (
    <section className="agent" aria-labelledby="agent-title">
      <div className="agent__head">
        <h2 id="agent-title">بسته‌های پیشنهادی شبکه فروش</h2>
        <p className="agent__sep no-print">
          <Info size={16} aria-hidden="true" />
          <span>
            این نما فقط اطلاعات تجاری مجاز را نشان می‌دهد. جداسازی نما نمایشی است، نه کنترل امنیتی
            واقعی؛ برنامه ورود کاربر یا مجوز ندارد.
          </span>
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="chart-empty" role="status">
          <PackageOpen size={22} aria-hidden="true" />
          <p>در حال حاضر بسته معتبری برای نمایش وجود ندارد.</p>
        </div>
      ) : (
        <div className="agent__grid">
          {offers.map((offer) => (
            <article key={offer.id} className="offer">
              <header>
                <h3>{offer.name}</h3>
                <p className="offer__focus">{offer.focus}</p>
              </header>
              <dl className="offer__rows">
                <div>
                  <dt>تعداد کارتخوان</dt>
                  <dd className="num">{formatNumber(offer.posCount)} دستگاه</dd>
                </div>
                <div>
                  <dt>قیمت پیشنهادی هر کارتخوان</dt>
                  <dd className="num">{formatMillion(offer.posPrice)}</dd>
                </div>
                <div>
                  <dt>تعداد کش‌لس</dt>
                  <dd className="num">{formatNumber(offer.cashCount)} عدد</dd>
                </div>
                <div>
                  <dt>قیمت پیشنهادی هر کش‌لس</dt>
                  <dd className="num">{formatMillion(offer.cashPrice)}</dd>
                </div>
              </dl>
              <p className="offer__total">
                <span>ارزش فروش اسمی بسته</span>
                <strong className="num">{formatMillion(offer.nominalValue)}</strong>
              </p>
              <ul className="offer__benefits" aria-label="مزایای تجاری بسته">
                <li>
                  ترکیب بسته: {formatNumber(offer.posCount)} کارتخوان همراه با {formatNumber(offer.cashCount)} کش‌لس
                </li>
                {offer.posDiscountVsList !== null ? (
                  <li>
                    قیمت هر کارتخوان در بسته، {formatMillion(offer.posDiscountVsList)} کمتر از قیمت لیست است
                  </li>
                ) : null}
                <li>{offer.focus}</li>
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
