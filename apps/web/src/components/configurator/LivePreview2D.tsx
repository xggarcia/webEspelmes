'use client';

import { useEffect, useRef } from 'react';
import type { ConfiguratorState } from '@espelmes/shared';

/**
 * Canvas-based MVP preview. Intentionally render-agnostic consumption of
 * ConfiguratorState "” the same state will drive the future R3F 3D viewer.
 */
export function LivePreview2D({ state }: { state: ConfiguratorState | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBackdrop(ctx, cssW, cssH);
    if (state) drawCandle(ctx, cssW, cssH, state);
  }, [state]);

  return (
    <div className="relative aspect-[16/10] w-full max-h-[62vh] overflow-hidden rounded-2xl bg-gradient-to-br from-wax via-cream to-dust shadow-warm">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-label="Candle preview" />
    </div>
  );
}

function drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.55, Math.max(w, h));
  grad.addColorStop(0, 'rgba(255,244,220,0.85)');
  grad.addColorStop(1, 'rgba(233,223,203,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

const SIZE_SCALE: Record<string, number> = { S: 0.7, M: 0.85, L: 1, XL: 1.15 };

function drawCandle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: Pick<ConfiguratorState, 'shape' | 'sizeCode' | 'color' | 'finish' | 'platform' | 'label' | 'accessories'>,
) {
  const scale = SIZE_SCALE[s.sizeCode] ?? 1;
  const baseY = h * 0.86;
  const cx = w / 2;

  drawPlatform(ctx, cx, baseY, w, s.platform);
  drawShape(ctx, cx, baseY, scale, w, h, s.shape, s.color.hex, s.finish);
  drawWick(ctx, cx, baseY, scale, w, h, s.shape);
  drawFlame(ctx, cx, baseY, scale, w, h, s.shape);
  if (s.label.text.trim()) drawLabel(ctx, cx, baseY, scale, w, h, s.shape, s.label);
  if (s.accessories.length) drawAccessories(ctx, cx, baseY, w, s.accessories);
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  w: number,
  platform: string,
) {
  if (platform === 'none') return;
  const fills: Record<string, string> = {
    wood: '#8B5A2B',
    ceramic: '#E6DED0',
    metal: '#9AA0A6',
  };
  ctx.fillStyle = fills[platform] ?? '#B8986E';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 8, w * 0.26, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(cx - w * 0.26, baseY + 8, w * 0.52, 4);
}

function shapePath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  w: number,
  h: number,
  shape: string,
) {
  const bodyH = h * 0.48 * scale;
  const bodyW = w * 0.32 * scale;
  const top = baseY - bodyH;

  ctx.beginPath();
  switch (shape) {
    case 'pillar':
      ctx.roundRect(cx - bodyW / 2, top, bodyW, bodyH, 10);
      break;
    case 'taper': {
      const topW = bodyW * 0.38;
      ctx.moveTo(cx - bodyW / 2, baseY);
      ctx.lineTo(cx - topW / 2, top);
      ctx.quadraticCurveTo(cx, top - 6, cx + topW / 2, top);
      ctx.lineTo(cx + bodyW / 2, baseY);
      ctx.closePath();
      break;
    }
    case 'votive':
      ctx.roundRect(cx - bodyW / 2, top + bodyH * 0.4, bodyW, bodyH * 0.6, 12);
      break;
    case 'container': {
      ctx.roundRect(cx - bodyW / 2, top + bodyH * 0.2, bodyW, bodyH * 0.8, 16);
      break;
    }
    case 'heart': {
      const cy = baseY - bodyH / 2;
      const r = bodyW * 0.45;
      ctx.moveTo(cx, cy + r * 0.9);
      ctx.bezierCurveTo(cx + r * 1.6, cy + r * 0.2, cx + r * 0.8, cy - r * 0.9, cx, cy - r * 0.2);
      ctx.bezierCurveTo(cx - r * 0.8, cy - r * 0.9, cx - r * 1.6, cy + r * 0.2, cx, cy + r * 0.9);
      ctx.closePath();
      break;
    }
    case 'sphere': {
      const cy = baseY - bodyH * 0.5;
      ctx.arc(cx, cy, bodyW * 0.55, 0, Math.PI * 2);
      break;
    }
    default:
      ctx.roundRect(cx - bodyW / 2, top, bodyW, bodyH, 10);
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  w: number,
  h: number,
  shape: string,
  hex: string,
  finish: string,
) {
  shapePath(ctx, cx, baseY, scale, w, h, shape);
  const grad = ctx.createLinearGradient(cx - 60, baseY - h * 0.3, cx + 60, baseY);
  grad.addColorStop(0, lighten(hex, 0.12));
  grad.addColorStop(1, darken(hex, 0.08));
  ctx.fillStyle = grad;
  ctx.fill();

  // finish overlay
  ctx.save();
  shapePath(ctx, cx, baseY, scale, w, h, shape);
  ctx.clip();
  if (finish === 'glossy') {
    const g = ctx.createLinearGradient(cx - 40, baseY - h * 0.4, cx + 40, baseY);
    g.addColorStop(0, 'rgba(255,255,255,0.45)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - w, baseY - h, w * 2, h * 2);
  } else if (finish === 'pearl') {
    const g = ctx.createLinearGradient(cx - 40, baseY - h * 0.6, cx + 40, baseY);
    g.addColorStop(0, 'rgba(255,240,255,0.3)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.2)');
    g.addColorStop(1, 'rgba(255,220,200,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - w, baseY - h, w * 2, h * 2);
  } else if (finish === 'textured') {
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 2 ? '#000' : '#fff';
      ctx.fillRect(cx - w / 2 + Math.random() * w, baseY - h * 0.5 + Math.random() * h * 0.4, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // subtle outline
  shapePath(ctx, cx, baseY, scale, w, h, shape);
  ctx.strokeStyle = 'rgba(43,32,26,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawWick(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  w: number,
  h: number,
  shape: string,
) {
  const bodyH = h * 0.48 * scale;
  const topY = shape === 'sphere' ? baseY - bodyH * 0.9 : baseY - bodyH;
  ctx.strokeStyle = '#2B201A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, topY - 10);
  ctx.stroke();
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  w: number,
  h: number,
  shape: string,
) {
  const bodyH = h * 0.48 * scale;
  const topY = shape === 'sphere' ? baseY - bodyH * 0.9 : baseY - bodyH;
  const fy = topY - 10;
  const grad = ctx.createRadialGradient(cx, fy - 8, 1, cx, fy - 8, 18);
  grad.addColorStop(0, '#fff7c2');
  grad.addColorStop(0.4, '#f7a948');
  grad.addColorStop(1, 'rgba(138,58,30,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, fy - 10, 8, 16, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  scale: number,
  w: number,
  h: number,
  shape: string,
  label: ConfiguratorState['label'],
) {
  const bodyH = h * 0.48 * scale;
  const y = baseY - bodyH * (shape === 'heart' || shape === 'sphere' ? 0.4 : 0.35);
  const fonts: Record<string, string> = {
    serif: 'Georgia, "Times New Roman", serif',
    script: '"Brush Script MT", "Snell Roundhand", cursive',
    sans: 'Inter, system-ui, sans-serif',
  };
  ctx.fillStyle = label.color;
  ctx.font = `600 ${Math.max(14, Math.round(w * 0.045))}px ${fonts[label.font] ?? fonts.serif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.text.slice(0, 24), cx, y);
}

function drawAccessories(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  w: number,
  accessories: string[],
) {
  ctx.save();
  ctx.translate(cx - w * 0.22, baseY + 4);
  accessories.slice(0, 4).forEach((code, i) => {
    ctx.fillStyle = code.includes('flower') ? '#C47B94' : code.includes('ribbon') ? '#8A9A7B' : '#B86E4B';
    ctx.beginPath();
    ctx.arc(i * 12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}
function rgb(r: number, g: number, b: number) {
  return `rgb(${clamp(Math.round(r))},${clamp(Math.round(g))},${clamp(Math.round(b))})`;
}
function lighten(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgb(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function darken(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgb(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

