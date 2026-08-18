export interface PalettePreset {
  id: string;
  name: string;
  nameRu: string;
  colors: string[];
}

export const CANVAS_PALETTES: PalettePreset[] = [
  {
    id: 'cyber',
    name: 'Cyberpunk (Default)',
    nameRu: 'Киберпанк (Базовая)',
    colors: [
      '#000000', '#ffffff', '#ff4d4d', '#4dff4d', '#4d4dff',
      '#ffff4d', '#ff4dff', '#4dffff', '#ff8800', '#8c1aff',
      '#00cc66', '#808080'
    ]
  },
  {
    id: 'neon',
    name: 'Neon Synthwave',
    nameRu: 'Неоновый Синтвейв',
    colors: [
      '#ff007f', '#00f0ff', '#ffe600', '#7928ca', '#ff4d4d',
      '#00ff88', '#2e0854', '#180033', '#ffffff', '#ff0055',
      '#3b82f6', '#10b981'
    ]
  },
  {
    id: 'gameboy',
    name: 'GameBoy Retro',
    nameRu: 'Ретро Геймбой (4-Bit)',
    colors: [
      '#0f380f', '#306230', '#8bac0f', '#9bbc0f',
      '#ffffff', '#000000', '#42692f', '#204620'
    ]
  },
  {
    id: 'stellar',
    name: 'Honkai Stellar',
    nameRu: 'Звёздный Путь (HSR)',
    colors: [
      '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#10b981',
      '#8b5cf6', '#e0e7ff', '#1e1b4b', '#f43f5e', '#fbbf24',
      '#ffffff', '#0f172a'
    ]
  },
  {
    id: 'pico8',
    name: 'PICO-8 Fantasy',
    nameRu: 'PICO-8 Классика',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ]
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    nameRu: 'Пастельная Мечта',
    colors: [
      '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
      '#e8c5ff', '#fcd5ce', '#d8e2dc', '#ffe5d9', '#ffcad4',
      '#b5e2fa', '#edafb8'
    ]
  },
  {
    id: 'monochrome',
    name: 'Monochrome Shading',
    nameRu: 'Монохром и Тени',
    colors: [
      '#000000', '#1a1a1a', '#333333', '#4d4d4d',
      '#666666', '#808080', '#999999', '#b3b3b3',
      '#cccccc', '#e6e6e6', '#ffffff'
    ]
  }
];
