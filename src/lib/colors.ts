// ========================
// Color Utilities
// ========================

const namedColors: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  black: '#000000',
  white: '#ffffff',
  gray: '#6b7280',
  grey: '#6b7280',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  lime: '#84cc16',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  navy: '#1e3a8a',
  maroon: '#7f1d1d',
  olive: '#4d7c0f',
  coral: '#ff7f50',
  mint: '#98ff98',
  lavender: '#e6e6fa',
  brown: '#8b4513',
  silver: '#c0c0c0',
  gold: '#ffd700',
  crimson: '#dc143c',
  salmon: '#fa8072',
  khaki: '#f0e68c',
  plum: '#dda0dd',
};

export function resolveColor(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  // Direct hex
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    // expand shorthand
    return (
      '#' +
      trimmed[1] +
      trimmed[1] +
      trimmed[2] +
      trimmed[2] +
      trimmed[3] +
      trimmed[3]
    );
  }

  // Named color
  if (namedColors[trimmed]) return namedColors[trimmed];

  return null;
}

export function colorNameToHex(input: string): string | null {
  return resolveColor(input);
}

export function isValidColor(input: string): boolean {
  return resolveColor(input) !== null;
}

// Get a readable text color (black or white) for a given background
export function readableTextColor(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
