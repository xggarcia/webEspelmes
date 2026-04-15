import { describe, it, expect } from 'vitest';
import { formatEur } from './currency';

describe('formatEur', () => {
  it('formats cents as euros in Catalan locale by default', () => {
    const out = formatEur(2640);
    expect(out).toContain('26,40');
    expect(out).toContain('€');
  });

  it('formats zero with two decimals', () => {
    const out = formatEur(0);
    expect(out).toContain('0,00');
  });

  it('formats negative amounts', () => {
    const out = formatEur(-1500);
    expect(out).toMatch(/-|−/);
    expect(out).toContain('15,00');
  });

  it('respects an explicit Spanish locale', () => {
    const out = formatEur(199999, 'es-ES');
    expect(out).toContain('1999,99');
    expect(out).toContain('€');
  });

  it('rounds fractional cents using banker-style Intl rounding', () => {
    expect(formatEur(1)).toContain('0,01');
    expect(formatEur(99)).toContain('0,99');
  });
});
