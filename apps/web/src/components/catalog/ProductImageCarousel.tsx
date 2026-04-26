'use client';

import { useState } from 'react';

type ProductImage = { url: string; alt: string | null };

export function ProductImageCarousel({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? null;

  if (!active) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-wax/40 shadow-warm">
          <div className="flex h-full w-full items-center justify-center text-ember/30">
            <svg width="100" height="130" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-1.5 2-3 3.5-3 5.5A3 3 0 0 0 12 11.5 3 3 0 0 0 15 8.5C15 6.5 13.5 5 12 3z" />
              <rect x="9" y="12" width="6" height="8" rx="1" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const hasMany = images.length > 1;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-wax/40 shadow-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt ?? productName}
          className="h-full w-full object-cover object-center"
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-ink/65 text-base text-cream transition hover:bg-ink/85 sm:left-3"
              aria-label="Imatge anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-ink/65 text-base text-cream transition hover:bg-ink/85 sm:right-3"
              aria-label="Imatge següent"
            >
              →
            </button>
          </>
        )}
      </div>

      {hasMany && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`aspect-square overflow-hidden rounded-md bg-wax/40 ring-offset-2 transition ${
                i === index ? 'ring-2 ring-ember' : 'hover:ring-1 hover:ring-ink/30'
              }`}
              aria-label={`Veure imatge ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
