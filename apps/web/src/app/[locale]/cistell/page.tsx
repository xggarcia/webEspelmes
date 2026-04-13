import { getTranslations, setRequestLocale, getLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';
import { CartItemControls } from '@/components/cart/CartItemControls';

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type CartSnapshot = {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  currency: 'EUR';
};

type Props = { params: Promise<{ locale: string }> };

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('cart');
  const loc = await getLocale();
  const cart = await safeApiFetch<CartSnapshot>('/cart', { forwardCookies: true });

  const format = (n: number) => formatEur(n, loc === 'es' ? 'es-ES' : 'ca-ES');

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
      {!cart || cart.items.length === 0 ? (
        <div className="card-warm flex flex-col items-start gap-4">
          <p className="text-ink/70">{t('empty')}</p>
          <Link href="/botiga" className="btn-primary no-underline">
            {t('goShop')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start">
          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li key={item.id} className="card-warm flex items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/botiga/${item.productSlug}`}
                    className="no-underline font-display text-lg text-ink hover:text-ember"
                  >
                    {item.productName || item.productId}
                  </Link>
                  <p className="text-sm text-ink/60">
                    {format(item.unitPriceCents)} · {t('qty')} {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ember">{format(item.lineTotalCents)}</span>
                  <CartItemControls itemId={item.id} quantity={item.quantity} removeLabel={t('remove')} />
                </div>
              </li>
            ))}
          </ul>
          <aside className="card-warm space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-ink/70">{t('subtotal')}</span>
              <span className="font-display text-2xl text-ember">{format(cart.subtotalCents)}</span>
            </div>
            <p className="text-sm text-ink/60">{t('shippingNote')}</p>
            <Link href="/checkout" className="btn-primary w-full no-underline">
              {t('checkout')}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
