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
  const hasMany = images.length > 1;

  if (!active) {
    return (
      <div className="aspect-[3/4] w-full bg-hush/50" />
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active.url}
          src={active.url}
          alt={active.alt ?? productName}
          className="h-full w-full object-cover object-center"
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)}
              aria-label="Imatge anterior"
              className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-sm transition hover:bg-white"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % images.length)}
              aria-label="Imatge següent"
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-sm transition hover:bg-white"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMany && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Veure imatge ${i + 1}`}
              className={`relative aspect-square h-16 shrink-0 overflow-hidden bg-stone-100 transition-opacity duration-200 ${
                i === index ? 'opacity-100 ring-1 ring-ink ring-offset-1' : 'opacity-50 hover:opacity-75'
              }`}
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
