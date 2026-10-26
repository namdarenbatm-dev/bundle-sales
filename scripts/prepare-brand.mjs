// آماده‌سازی برند: لوگو، فونت یکان و آیکون‌های PWA
// - اگر public/brand/logo.(svg|png|webp) باشد، در رابط استفاده و آیکون‌ها از روی آن ساخته می‌شوند.
// - اگر public/fonts/Yekan-*.woff2 (یا woff/ttf) باشد، @font-face یکان تولید می‌شود.
// - اگر هیچ‌کدام نباشد، چیزی جعل نمی‌شود: متن «توسن تکنو» و فونت Vazirmatn/Tahoma می‌مانند.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const outDir = path.join(root, 'src', 'brand');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(pub, 'icons'), { recursive: true });

const find = (dir, names) => names.find((n) => fs.existsSync(path.join(dir, n)));

// ---------- لوگو ----------
const logoName = find(path.join(pub, 'brand'), ['logo.svg', 'logo.png', 'logo.webp']);
const logoSrc = logoName ? `/brand/${logoName}` : null;

// ---------- فونت یکان ----------
const fontExts = ['woff2', 'woff', 'ttf'];
const pick = (base) => {
  for (const ext of fontExts) {
    const file = `${base}.${ext}`;
    if (fs.existsSync(path.join(pub, 'fonts', file))) return { file, ext };
  }
  return null;
};
const reg = pick('Yekan-Regular');
const bold = pick('Yekan-Bold');
const fmt = { woff2: 'woff2', woff: 'woff', ttf: 'truetype' };
const face = (f, weight) =>
  `@font-face {\n  font-family: 'Yekan';\n  font-style: normal;\n  font-display: swap;\n  font-weight: ${weight};\n  src: url('/fonts/${f.file}') format('${fmt[f.ext]}');\n}\n`;

let css = '/* تولیدشده توسط scripts/prepare-brand.mjs — دستی ویرایش نکنید */\n';
if (reg || bold) {
  if (reg) css += face(reg, bold ? 400 : '400 700');
  if (bold) css += face(bold, reg ? 700 : '400 700');
} else {
  css += '/* فایل یکان یافت نشد؛ از Vazirmatn و Tahoma استفاده می‌شود. */\n';
}
fs.writeFileSync(path.join(outDir, 'brand-fonts.generated.css'), css);

fs.writeFileSync(
  path.join(outDir, 'brand.generated.ts'),
  `// تولیدشده توسط scripts/prepare-brand.mjs — دستی ویرایش نکنید\nexport const BRAND = {\n  logoSrc: ${JSON.stringify(logoSrc)} as string | null,\n  hasYekan: ${Boolean(reg || bold)},\n} as const;\n`,
);

// ---------- آیکون‌های PWA ----------
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[brand] sharp نصب نیست؛ آیکون‌های PNG موجود دست‌نخورده می‌مانند.');
}

if (sharp) {
  const source = logoName ? path.join(pub, 'brand', logoName) : path.join(pub, 'icon.svg');
  const make = async (size, pad, bg, file) => {
    const inner = Math.round(size * (1 - pad * 2));
    const logo = await sharp(source, { density: 384 })
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(path.join(pub, 'icons', file));
  };
  // لوگوی رسمی روی زمینه سفید؛ آیکون پیش‌فرض (که خودش زمینه دارد) تمام‌قاب.
  const bg = logoName ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 11, g: 31, b: 58, alpha: 1 };
  const pad = logoName ? 0.14 : 0;
  await make(192, pad, bg, 'icon-192.png');
  await make(512, pad, bg, 'icon-512.png');
  await make(512, logoName ? 0.24 : 0.1, bg, 'icon-maskable-512.png');
  await make(180, pad, bg, 'apple-touch-icon.png');
}

console.log(
  `[brand] لوگو: ${logoSrc ?? 'یافت نشد (متن جایگزین)'} | یکان: ${reg || bold ? 'فعال' : 'یافت نشد (Vazirmatn/Tahoma)'}`,
);
