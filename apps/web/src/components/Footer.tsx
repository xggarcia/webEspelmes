import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function Footer() {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');
  const tBrand = await getTranslations('brand');
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 border-t border-ink/[0.07] bg-hush/40">
      <div className="container-lux py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <p className="font-display text-2xl text-ink">Espelmes</p>
            <p className="max-w-xs text-sm leading-relaxed text-ink/65">{tBrand('tagline')}</p>
          </div>
          <div className="space-y-3">
            <p className="meta">Botiga</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/botiga" className="no-underline text-ink/75 hover:text-ember">{tNav('shop')}</Link></li>
              <li><Link href="/botiga?cat=veles" className="no-underline text-ink/75 hover:text-ember">Veles</Link></li>
              <li><Link href="/botiga?cat=ciment" className="no-underline text-ink/75 hover:text-ember">Ciment</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="meta">Casa</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sobre-nosaltres" className="no-underline text-ink/75 hover:text-ember">{tNav('about')}</Link></li>
              <li><Link href="/contacte" className="no-underline text-ink/75 hover:text-ember">{tNav('contact')}</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="meta">Lletres</p>
            <p className="text-sm text-ink/65">Noticies de noves colleccions, cada estacio.</p>
            <form className="flex items-center gap-2">
              <input type="email" placeholder="el-teu@correu.cat"
                className="field flex-1 text-sm" />
              <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm text-bone transition hover:bg-ember">
                &rarr;
              </button>
            </form>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-2 border-t border-ink/[0.07] pt-6 text-xs text-ink/55 md:flex-row md:items-center">
          <p>&copy; {year} {tBrand('name')} &mdash; {t('rights')}</p>
          <p className="meta">Manresa &middot; Catalunya</p>
        </div>
      </div>
    </footer>
  );
}
