export interface StrokeAction {
  pixelId: string;
  oldColor: string | null;
  newColor: string | null;
}

export function getLinePixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const coords: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;

  while (true) {
    coords.push([currX, currY]);
    if (currX === x1 && currY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }
  return coords;
}

export function getRectPixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const coords: [number, number][] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  for (let x = minX; x <= maxX; x++) {
    coords.push([x, minY]);
    coords.push([x, maxY]);
  }
  for (let y = minY + 1; y < maxY; y++) {
    coords.push([minX, y]);
    coords.push([maxX, y]);
  }
  return coords;
}

export function getRectFilledPixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const coords: [number, number][] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      coords.push([x, y]);
    }
  }
  return coords;
}

export function getCirclePixels(x0: number, y0: number, x1: number, y1: number, filled = false): [number, number][] {
  const coords: [number, number][] = [];
  const r = Math.round(Math.hypot(x1 - x0, y1 - y0));
  if (r === 0) return [[x0, y0]];
  const inner2 = Math.max(0, (r - 0.7) * (r - 0.7));
  const outer2 = (r + 0.7) * (r + 0.7);

  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      const d2 = dx * dx + dy * dy;
      if (filled ? d2 <= outer2 : (d2 >= inner2 && d2 <= outer2)) {
        coords.push([x0 + dx, y0 + dy]);
      }
    }
  }
  return coords;
}

export function getSprayPixels(cx: number, cy: number, radius = 2, count = 4): [number, number][] {
  const coords: [number, number][] = [];
  coords.push([cx, cy]);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.floor(Math.random() * (radius + 1));
    const sx = Math.round(cx + Math.cos(angle) * dist);
    const sy = Math.round(cy + Math.sin(angle) * dist);
    if (!coords.some(([x, y]) => x === sx && y === sy)) {
      coords.push([sx, sy]);
    }
  }
  return coords;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) return null;
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function invertHex(hex: string | null): string | null {
  if (!hex || hex === 'eraser') return null;
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

export function toGrayscaleHex(hex: string | null): string | null {
  if (!hex || hex === 'eraser') return null;
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return rgbToHex(gray, gray, gray);
}

export function adjustBrightnessHex(hex: string | null, factor: number): string | null {
  if (!hex || hex === 'eraser') return null;
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

export function shiftCanvasPixels(
  pixels: Record<string, { color: string }>,
  size: number,
  dx: number,
  dy: number,
  wrap = false
): { updates: Record<string, string | null>; strokeActions: StrokeAction[] } {
  const updates: Record<string, string | null> = {};
  const strokeActions: StrokeAction[] = [];
  const newPixelsMap: Record<string, string> = {};

  // Compute new target positions for every existing pixel
  Object.entries(pixels).forEach(([key, pixel]) => {
    if (!pixel || !pixel.color) return;
    const [x, y] = key.split(',').map(Number);
    let targetX = x + dx;
    let targetY = y + dy;

    if (wrap) {
      targetX = (targetX + size) % size;
      targetY = (targetY + size) % size;
    }

    if (targetX >= 0 && targetX < size && targetY >= 0 && targetY < size) {
      newPixelsMap[`${targetX},${targetY}`] = pixel.color;
    }
  });

  // Calculate delta against existing
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      const oldColor = pixels[key]?.color || null;
      const newColor = newPixelsMap[key] || null;

      if (oldColor !== newColor) {
        updates[key] = newColor;
        strokeActions.push({ pixelId: key, oldColor, newColor });
      }
    }
  }

  return { updates, strokeActions };
}

export function generateCanvasSVG(pixels: Record<string, { color: string }>, size: number): string {
  const viewBoxSize = size;
  let rects = '';
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = pixels[`${x},${y}`];
      if (p && p.color && p.color !== 'eraser') {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${p.color}" shape-rendering="crispEdges"/>`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${viewBoxSize * 16}" height="${viewBoxSize * 16}" shape-rendering="crispEdges">
  <rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#15101e"/>
  ${rects}
</svg>`;
}

export function processImageToPixels(
  img: HTMLImageElement,
  targetSize: number,
  alphaThreshold = 50
): Record<string, string> {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, targetSize, targetSize);

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;
  const result: Record<string, string> = {};

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const index = (y * targetSize + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a >= alphaThreshold) {
        result[`${x},${y}`] = rgbToHex(r, g, b);
      }
    }
  }

  return result;
}
