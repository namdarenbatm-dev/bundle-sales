import { Layers } from 'lucide-react';
import { BRAND } from '../brand/brand.generated';

interface Props {
  size?: 'sm' | 'lg';
}

/**
 * لوگوی رسمی توسن تکنو (public/brand/logo.*) اگر وجود داشته باشد؛ در غیر این صورت
 * فقط یک آیکون خنثی نمایش داده می‌شود و هیچ لوگوی جعلی ساخته نمی‌شود.
 */
export function BrandMark({ size = 'sm' }: Props) {
  return (
    <span className={`brand-mark brand-mark--${size}`}>
      {BRAND.logoSrc ? (
        <img src={BRAND.logoSrc} alt="لوگوی توسن تکنو" decoding="async" />
      ) : (
        <Layers aria-hidden="true" size={size === 'lg' ? 56 : 26} strokeWidth={1.75} />
      )}
    </span>
  );
}
