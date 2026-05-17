import Image from 'next/image';
import { getLocale } from 'next-intl/server';

export async function BrandLogo() {
  const locale = await getLocale();
  const label = locale === 'es' ? 'hecho a mano' : 'fet a mà';

  return (
    <span className="flex items-end gap-2.5">
      <Image
        src="/logo.png"
        alt="Casa Tierraluz"
        width={140}
        height={56}
        className="h-10 w-auto object-contain"
        priority
      />
      <span className="meta mb-0.5 text-ink/45">{label}</span>
    </span>
  );
}
