/**
 * Dynamic Video Color Extractor
 * Samples video frames using a lightweight offscreen canvas to extract vibrant dominant colors,
 * ambient glow, and accent palettes that smoothly adapt to video scenes.
 */

export interface VideoPalette {
  primary: string;       // Hex e.g. "#ff4d4d"
  primaryRgb: string;    // "255, 77, 77"
  secondary: string;     // Complementary or analogous hue hex
  glow: string;          // rgba string for box-shadow
  bgPill: string;        // rgba string for buttons/badges
  borderGlow: string;    // rgba string for borders
}

// Fallback vibrant cyberpunk/cinematic palettes
const DEFAULT_PALETTES: VideoPalette[] = [
  {
    primary: '#ff4d4d',
    primaryRgb: '255, 77, 77',
    secondary: '#c026d3',
    glow: 'rgba(255, 77, 77, 0.45)',
    bgPill: 'rgba(255, 77, 77, 0.18)',
    borderGlow: 'rgba(255, 77, 77, 0.55)'
  },
  {
    primary: '#00f0ff',
    primaryRgb: '0, 240, 255',
    secondary: '#3b82f6',
    glow: 'rgba(0, 240, 255, 0.45)',
    bgPill: 'rgba(0, 240, 255, 0.18)',
    borderGlow: 'rgba(0, 240, 255, 0.55)'
  },
  {
    primary: '#a855f7',
    primaryRgb: '168, 85, 247',
    secondary: '#ec4899',
    glow: 'rgba(168, 85, 247, 0.45)',
    bgPill: 'rgba(168, 85, 247, 0.18)',
    borderGlow: 'rgba(168, 85, 247, 0.55)'
  },
  {
    primary: '#10b981',
    primaryRgb: '16, 185, 129',
    secondary: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.45)',
    bgPill: 'rgba(16, 185, 129, 0.18)',
    borderGlow: 'rgba(16, 185, 129, 0.55)'
  },
  {
    primary: '#f59e0b',
    primaryRgb: '245, 158, 11',
    secondary: '#ef4444',
    glow: 'rgba(245, 158, 11, 0.45)',
    bgPill: 'rgba(245, 158, 11, 0.18)',
    borderGlow: 'rgba(245, 158, 11, 0.55)'
  }
];

export const getDefaultVideoPalette = (seed = 0): VideoPalette => {
  return DEFAULT_PALETTES[Math.abs(seed) % DEFAULT_PALETTES.length];
};

// Helper: Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Helper: Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper: Hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvasContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = 24;
    sharedCanvas.height = 24;
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!sharedCtx) return null;
  return { canvas: sharedCanvas, ctx: sharedCtx };
}

/**
 * Extracts dominant vibrant color palette from an HTML5 Video frame.
 * Boosts saturation and normalizes lightness for crisp, high-contrast UI accents.
 */
export function extractVideoFrameColor(video: HTMLVideoElement): VideoPalette | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const canvasContext = getSharedCanvasContext();
  if (!canvasContext) return null;

  const { ctx } = canvasContext;

  try {
    ctx.drawImage(video, 0, 0, 24, 24);
    const imgData = ctx.getImageData(0, 0, 24, 24);
    const data = imgData.data;
    const length = data.length;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let validPixels = 0;

    // Collect bucketed hues to find most vibrant hue in scene
    const hueBuckets = new Array(12).fill(0);
    const hueColors: Array<[number, number, number]> = new Array(12).fill([0, 0, 0]);

    for (let i = 0; i < length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue;

      // Skip pitch black and pure washed white pixels for dominant vibrancy calculation
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness < 18 || brightness > 245) continue;

      const [h, s, l] = rgbToHsl(r, g, b);
      if (s > 15) {
        const bucketIndex = Math.min(11, Math.floor(h / 30));
        hueBuckets[bucketIndex] += s;
        hueColors[bucketIndex] = [r, g, b];
      }

      totalR += r;
      totalG += g;
      totalB += b;
      validPixels++;
    }

    let dominantHue = 0;
    let maxSaturationWeight = 0;

    for (let b = 0; b < 12; b++) {
      if (hueBuckets[b] > maxSaturationWeight) {
        maxSaturationWeight = hueBuckets[b];
        dominantHue = b * 30 + 15;
      }
    }

    // If no colorful pixels found, use average RGB
    if (maxSaturationWeight === 0) {
      if (validPixels === 0) return null;
      const avgR = Math.round(totalR / validPixels);
      const avgG = Math.round(totalG / validPixels);
      const avgB = Math.round(totalB / validPixels);
      const [h, s] = rgbToHsl(avgR, avgG, avgB);
      dominantHue = s > 10 ? h : 0;
    }

    // Boost saturation and constrain lightness for maximum UI contrast
    const targetSaturation = Math.max(75, Math.min(95, maxSaturationWeight > 0 ? 88 : 75));
    const targetLightness = 56; // Perfect 56% for vibrant neon/cyber glow
    const secondaryHue = (dominantHue + 40) % 360;

    const primaryHex = hslToHex(dominantHue, targetSaturation, targetLightness);
    const secondaryHex = hslToHex(secondaryHue, 85, 60);
    const [r, g, b] = hexToRgb(primaryHex);

    return {
      primary: primaryHex,
      primaryRgb: `${r}, ${g}, ${b}`,
      secondary: secondaryHex,
      glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
      bgPill: `rgba(${r}, ${g}, ${b}, 0.2)`,
      borderGlow: `rgba(${r}, ${g}, ${b}, 0.65)`
    };
  } catch (err) {
    // Cross-origin tainted canvas fallback: gracefully return null so fallback dynamic palette takes over
    return null;
  }
}
