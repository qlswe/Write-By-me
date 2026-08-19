export interface AccentColorOption {
  name: string;
  nameRu: string;
  shortRu: string;
  shortEn: string;
  hex: string;
}

export const ACCENT_COLOR_PRESETS: AccentColorOption[] = [
  { name: 'Cyber Red (Default)', nameRu: 'Кибер Красный (По умолчанию)', shortRu: 'Кибер', shortEn: 'Cyber', hex: '#ff4d4d' },
  { name: 'Neon Cyan', nameRu: 'Неоновый Циан', shortRu: 'Неоновый', shortEn: 'Neon', hex: '#00f0ff' },
  { name: 'Cyber Purple', nameRu: 'Кибер Фиолетовый', shortRu: 'Фиолетовый', shortEn: 'Purple', hex: '#a855f7' },
  { name: 'Emerald Green', nameRu: 'Изумрудный Зеленый', shortRu: 'Изумрудный', shortEn: 'Emerald', hex: '#10b981' },
  { name: 'Solar Amber', nameRu: 'Солнечный Янтарный', shortRu: 'Солнечный', shortEn: 'Solar', hex: '#f59e0b' },
  { name: 'Electric Pink', nameRu: 'Электрический Розовый', shortRu: 'Электрик', shortEn: 'Electric', hex: '#ec4899' },
  { name: 'Royal Blue', nameRu: 'Королевский Синий', shortRu: 'Королевский', shortEn: 'Royal', hex: '#3b82f6' },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return null;
  }
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

export function getPrimaryAccentColor(): string {
  try {
    const cached = localStorage.getItem('aha_primary_accent');
    if (cached && /^#[0-9a-fA-F]{3,6}$/.test(cached)) {
      return cached;
    }
  } catch (e) {
    // Ignore storage errors
  }
  if (typeof document !== 'undefined') {
    const fromCss = document.documentElement.style.getPropertyValue('--primary-accent');
    if (fromCss && fromCss.trim()) return fromCss.trim();
  }
  return '#ff4d4d';
}

export function applyPrimaryAccentColor(colorHex: string) {
  const cleanHex = (colorHex || '').replace('#', '').trim().toLowerCase();
  const isValidHex = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(cleanHex);
  const color = isValidHex ? `#${cleanHex}` : '#ff4d4d';
  const rgb = hexToRgb(color) || { r: 255, g: 77, b: 77 };

  try {
    localStorage.setItem('aha_primary_accent', color);
  } catch (e) {
    // Ignore storage errors
  }

  // 1. Set CSS Variables on document root
  document.documentElement.style.setProperty('--primary-accent', color);
  document.documentElement.style.setProperty('--primary-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  // Dispatch custom window event so reactive components update instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aha_accent_color_change', {
      detail: { color, rgb }
    }));
  }

  // 2. Manage dynamic style element in document.head
  let styleEl = document.getElementById('aha-custom-accent-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'aha-custom-accent-style';
    document.head.appendChild(styleEl);
  }

  const opacities = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95];
  
  const opacityRules = opacities.map(op => {
    const alpha = (op / 100).toFixed(2).replace(/\.?0+$/, '');
    const rgbaVal = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    return `
      .bg-\\[\\#ff4d4d\\]\\/${op} { background-color: ${rgbaVal} !important; }
      .hover\\:bg-\\[\\#ff4d4d\\]\\/${op}:hover { background-color: ${rgbaVal} !important; }
      .group:hover .group-hover\\:bg-\\[\\#ff4d4d\\]\\/${op} { background-color: ${rgbaVal} !important; }

      .border-\\[\\#ff4d4d\\]\\/${op} { border-color: ${rgbaVal} !important; }
      .hover\\:border-\\[\\#ff4d4d\\]\\/${op}:hover { border-color: ${rgbaVal} !important; }
      .group:hover .group-hover\\:border-\\[\\#ff4d4d\\]\\/${op} { border-color: ${rgbaVal} !important; }
      .focus\\:border-\\[\\#ff4d4d\\]\\/${op}:focus { border-color: ${rgbaVal} !important; }

      .text-\\[\\#ff4d4d\\]\\/${op} { color: ${rgbaVal} !important; }
      .hover\\:text-\\[\\#ff4d4d\\]\\/${op}:hover { color: ${rgbaVal} !important; }
      .group:hover .group-hover\\:text-\\[\\#ff4d4d\\]\\/${op} { color: ${rgbaVal} !important; }

      .from-\\[\\#ff4d4d\\]\\/${op} { --tw-gradient-from: ${rgbaVal} !important; }
      .via-\\[\\#ff4d4d\\]\\/${op} { --tw-gradient-via: ${rgbaVal} !important; }
      .to-\\[\\#ff4d4d\\]\\/${op} { --tw-gradient-to: ${rgbaVal} !important; }

      .shadow-\\[\\#ff4d4d\\]\\/${op} { --tw-shadow-color: ${rgbaVal} !important; box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow) !important; }
    `;
  }).join('\n');

  // Specific glowing box-shadow rules
  const shadowGlowRules = `
    /* Shadow glow dynamic overrides */
    .shadow-\\[0_0_8px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_8px_rgba\\(255\\,77\\,77\\,0\\.8\\)\\] { box-shadow: 0 0 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) !important; }
    .shadow-\\[0_0_10px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_10px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { box-shadow: 0 0 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .shadow-\\[0_0_12px_rgba\\(255\\,77\\,77\\,0\\.2\\)\\] { box-shadow: 0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
    .shadow-\\[0_0_12px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_12px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { box-shadow: 0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.15\\)\\] { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.2\\)\\] { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.3\\)\\] { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .hover\\:shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\]:hover { box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.1\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.25\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.3\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.35\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.6\\)\\] { box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) !important; }
    .shadow-\\[0_0_25px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 0 25px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_0_25px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { box-shadow: 0 0 25px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .shadow-\\[0_0_30px_rgba\\(255\\,77\\,77\\,0\\.15\\)\\] { box-shadow: 0 0 30px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }
    .shadow-\\[0_0_30px_rgba\\(255\\,77\\,77\\,0\\.3\\)\\] { box-shadow: 0 0 30px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }
    .shadow-\\[0_0_30px_rgba\\(255\\,77\\,77\\,0\\.35\\)\\] { box-shadow: 0 0 30px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important; }
    .shadow-\\[0_0_50px_rgba\\(255\\,77\\,77\\,0\\.15\\)\\] { box-shadow: 0 0 50px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }
    .shadow-\\[0_8px_25px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { box-shadow: 0 8px 25px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .shadow-\\[0_10px_30px_rgba\\(255\\,77\\,77\\,0\\.3\\)\\] { box-shadow: 0 10px 30px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }
    .shadow-\\[0_12px_40px_rgba\\(255\\,77\\,77\\,0\\.15\\)\\] { box-shadow: 0 12px 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }
    .hover\\:shadow-\\[0_12px_40px_rgba\\(255\\,77\\,77\\,0\\.15\\)\\]:hover { box-shadow: 0 12px 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }

    /* Drop-shadow glow overrides */
    .drop-shadow-\\[0_0_12px_rgba\\(255\\,77\\,77\\,0\\.8\\)\\] { filter: drop-shadow(0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)) !important; }
    .group:hover .group-hover\\:drop-shadow-\\[0_0_12px_rgba\\(255\\,77\\,77\\,0\\.8\\)\\] { filter: drop-shadow(0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)) !important; }
    .drop-shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] { filter: drop-shadow(0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)) !important; }
    .drop-shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] { filter: drop-shadow(0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)) !important; }
  `;

  styleEl.innerHTML = `
    :root {
      --primary-accent: ${color};
      --primary-accent-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
    }

    /* Overall Body & Background ambient radial glow shift */
    body::before {
      background: 
        radial-gradient(circle at 20% 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255, 183, 3, 0.08) 0%, transparent 50%) !important;
    }
    body.production-mode::before {
      background: 
        radial-gradient(circle at 10% 20%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(255, 183, 3, 0.15) 0%, transparent 60%) !important;
    }

    /* Text Color overrides */
    .text-\\[\\#ff4d4d\\] { color: ${color} !important; }
    .hover\\:text-\\[\\#ff4d4d\\]:hover { color: ${color} !important; }
    .active\\:text-\\[\\#ff4d4d\\]:active { color: ${color} !important; }
    .focus\\:text-\\[\\#ff4d4d\\]:focus { color: ${color} !important; }
    .group:hover .group-hover\\:text-\\[\\#ff4d4d\\] { color: ${color} !important; }

    /* SVG Icon Fill and Stroke */
    .fill-\\[\\#ff4d4d\\] { fill: ${color} !important; }
    .hover\\:fill-\\[\\#ff4d4d\\]:hover { fill: ${color} !important; }
    .group:hover .group-hover\\:fill-\\[\\#ff4d4d\\] { fill: ${color} !important; }
    .stroke-\\[\\#ff4d4d\\] { stroke: ${color} !important; }
    .hover\\:stroke-\\[\\#ff4d4d\\]:hover { stroke: ${color} !important; }
    .group:hover .group-hover\\:stroke-\\[\\#ff4d4d\\] { stroke: ${color} !important; }

    /* Background overrides */
    .bg-\\[\\#ff4d4d\\] { background-color: ${color} !important; }
    .hover\\:bg-\\[\\#ff4d4d\\]:hover { background-color: ${color} !important; }
    .active\\:bg-\\[\\#ff4d4d\\]:active { background-color: ${color} !important; }
    .focus\\:bg-\\[\\#ff4d4d\\]:focus { background-color: ${color} !important; }
    .group:hover .group-hover\\:bg-\\[\\#ff4d4d\\] { background-color: ${color} !important; }

    /* Border overrides */
    .border-\\[\\#ff4d4d\\] { border-color: ${color} !important; }
    .hover\\:border-\\[\\#ff4d4d\\]:hover { border-color: ${color} !important; }
    .active\\:border-\\[\\#ff4d4d\\]:active { border-color: ${color} !important; }
    .focus\\:border-\\[\\#ff4d4d\\]:focus { border-color: ${color} !important; }
    .focus-within\\:border-\\[\\#ff4d4d\\]:focus-within { border-color: ${color} !important; }
    .group:hover .group-hover\\:border-\\[\\#ff4d4d\\] { border-color: ${color} !important; }

    /* Ring & Outline */
    .ring-\\[\\#ff4d4d\\] { --tw-ring-color: ${color} !important; }
    .focus\\:ring-\\[\\#ff4d4d\\]:focus { --tw-ring-color: ${color} !important; }
    .outline-\\[\\#ff4d4d\\] { outline-color: ${color} !important; }
    .accent-\\[\\#ff4d4d\\] { accent-color: ${color} !important; }
    .caret-\\[\\#ff4d4d\\] { caret-color: ${color} !important; }

    /* Gradient overrides */
    .from-\\[\\#ff4d4d\\] { --tw-gradient-from: ${color} !important; }
    .to-\\[\\#ff4d4d\\] { --tw-gradient-to: ${color} !important; }
    .via-\\[\\#ff4d4d\\] { --tw-gradient-via: ${color} !important; }

    /* Scrollbars */
    .custom-scrollbar,
    .custom-scrollbar-code {
      scrollbar-color: ${color} rgba(27, 18, 39, 0.8) !important;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb,
    .custom-scrollbar-code::-webkit-scrollbar-thumb {
      background: ${color} !important;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover,
    .custom-scrollbar-code::-webkit-scrollbar-thumb:hover {
      background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85) !important;
    }

    /* SafeHtml blockquotes */
    .safe-html blockquote {
      border-left-color: ${color} !important;
    }
    .safe-html blockquote::before,
    .safe-html blockquote::after {
      color: ${color} !important;
    }

    /* Recharts Tooltips High-Contrast Styling */
    .recharts-default-tooltip {
      background-color: #120a21 !important;
      border: 1px solid #3d2b4f !important;
      border-radius: 14px !important;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85) !important;
      padding: 10px 14px !important;
      color: #ffffff !important;
    }
    .recharts-tooltip-label {
      color: #ffffff !important;
      font-weight: 800 !important;
      margin-bottom: 4px !important;
      font-size: 12px !important;
    }
    .recharts-tooltip-item {
      color: #ffffff !important;
      font-weight: 600 !important;
      font-size: 12px !important;
    }
    .recharts-tooltip-item-name,
    .recharts-tooltip-item-value {
      color: #ffffff !important;
    }

    /* Selection */
    ::selection {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important;
      color: #ffffff !important;
    }

    ${opacityRules}
    ${shadowGlowRules}
  `;
}
