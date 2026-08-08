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

export function applyPrimaryAccentColor(colorHex: string) {
  const color = (colorHex || '#ff4d4d').trim().toLowerCase();
  const rgb = hexToRgb(color) || { r: 255, g: 77, b: 77 };

  try {
    localStorage.setItem('aha_primary_accent', color);
  } catch (e) {
    // Ignore storage errors
  }

  // 1. Set CSS Variables on document root
  document.documentElement.style.setProperty('--primary-accent', color);
  document.documentElement.style.setProperty('--primary-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  // 2. Manage dynamic style element in document.head
  let styleEl = document.getElementById('aha-custom-accent-style') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'aha-custom-accent-style';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    :root {
      --primary-accent: ${color};
      --primary-accent-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
    }

    /* Overall Body & Background subtle radial glow shift */
    body::before {
      background: 
        radial-gradient(circle at 20% 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255, 183, 3, 0.08) 0%, transparent 50%) !important;
    }

    /* Text Color overrides */
    .text-\\[\\#ff4d4d\\] { color: ${color} !important; }
    .hover\\:text-\\[\\#ff4d4d\\]:hover { color: ${color} !important; }
    .group:hover .group-hover\\:text-\\[\\#ff4d4d\\] { color: ${color} !important; }

    /* Background overrides */
    .bg-\\[\\#ff4d4d\\] { background-color: ${color} !important; }
    .hover\\:bg-\\[\\#ff4d4d\\]:hover { background-color: ${color} !important; }
    .bg-\\[\\#ff4d4d\\]\\/10 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important; }
    .bg-\\[\\#ff4d4d\\]\\/20 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
    .bg-\\[\\#ff4d4d\\]\\/30 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }

    /* Border overrides */
    .border-\\[\\#ff4d4d\\] { border-color: ${color} !important; }
    .hover\\:border-\\[\\#ff4d4d\\]:hover { border-color: ${color} !important; }
    .border-\\[\\#ff4d4d\\]\\/20 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
    .border-\\[\\#ff4d4d\\]\\/30 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important; }
    .border-\\[\\#ff4d4d\\]\\/40 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
    .border-\\[\\#ff4d4d\\]\\/50 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }
    .hover\\:border-\\[\\#ff4d4d\\]\\/50:hover { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important; }

    /* Gradient overrides */
    .from-\\[\\#ff4d4d\\] { --tw-gradient-from: ${color} !important; }
    .to-\\[\\#ff4d4d\\] { --tw-gradient-to: ${color} !important; }
    .via-\\[\\#ff4d4d\\] { --tw-gradient-via: ${color} !important; }
    .from-\\[\\#ff4d4d\\]\\/20 { --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }

    /* Shadow overrides */
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.3\\)\\] {
      box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .shadow-\\[0_0_15px_rgba\\(255\\,77\\,77\\,0\\.4\\)\\] {
      box-shadow: 0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.5\\)\\] {
      box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .shadow-\\[0_0_20px_rgba\\(255\\,77\\,77\\,0\\.6\\)\\] {
      box-shadow: 0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) !important;
    }

    /* Selection */
    ::selection {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
  `;
}
