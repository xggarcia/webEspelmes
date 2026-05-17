'use client';

import { useEffect, useState } from 'react';

interface Slide {
  url: string;
  alt: string;
}

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2px] bg-hush/60">
      {slides.length === 0 ? null : (
        <>
          {slides.map((slide, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={slide.url}
              src={slide.url}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}

          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-[5px] rounded-full transition-all duration-300"
                  style={{
                    width: i === active ? '20px' : '5px',
                    background: i === active ? 'rgb(31,27,22)' : 'rgba(31,27,22,0.25)',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
