import { randomBytes } from 'crypto';

/** Human-friendly order number: ESP-YYMMDD-XXXX (XXXX base32 from random bytes). */
export function generateOrderNumber(now = new Date()): string {
  const y = String(now.getUTCFullYear()).slice(2);
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const buf = randomBytes(3);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[buf[i % buf.length]! % alphabet.length];
  }
  return `ESP-${y}${m}${d}-${suffix}`;
}
