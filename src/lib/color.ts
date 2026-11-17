export const PALETTES = [
  { id: 'terracotta', name: 'Terracota', color: '#a33900' },
  { id: 'ocean', name: 'Océano', color: '#0b63ce' },
  { id: 'forest', name: 'Bosque', color: '#2f7d32' },
  { id: 'violet', name: 'Violeta', color: '#6d4aff' },
  { id: 'rose', name: 'Rosa', color: '#b4185d' },
  { id: 'graphite', name: 'Grafito', color: '#475569' },
] as const;

export const TOKENS = [
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'primary-fixed',
  'primary-fixed-dim',
  'on-primary-fixed',
  'on-primary-fixed-variant',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'secondary-fixed',
  'secondary-fixed-dim',
  'on-secondary-fixed',
  'on-secondary-fixed-variant',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'tertiary-fixed',
  'tertiary-fixed-dim',
  'on-tertiary-fixed',
  'on-tertiary-fixed-variant',
  'surface',
  'on-surface',
  'surface-variant',
  'on-surface-variant',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'surface-dim',
  'surface-bright',
  'background',
  'on-background',
  'surface-tint',
  'outline',
  'outline-variant',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'inverse-surface',
  'inverse-on-surface',
  'inverse-primary',
] as const;

export type ThemeToken = (typeof TOKENS)[number];
export type ThemeTokens = Record<ThemeToken, string>;

const WHITE = '#ffffff';
const BLACK = '#000000';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const normalizeHex = (hex: string): string => {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return `#${clean
      .split('')
      .map((char) => char + char)
      .join('')}`;
  }
  return `#${clean.slice(0, 6).padEnd(6, '0')}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(normalizeHex(hex).slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb: [number, number, number]): string =>
  `#${rgb
    .map((channel) =>
      Math.round(clamp(channel, 0, 255))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

export const mix = (colorA: string, colorB: string, weightB: number): string => {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const weight = clamp(weightB);
  return rgbToHex([a[0] + (b[0] - a[0]) * weight, a[1] + (b[1] - a[1]) * weight, a[2] + (b[2] - a[2]) * weight]);
};

export const toRgbTriplet = (hex: string): string => {
  const rgb = hexToRgb(hex);
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
};

const rgbToHsl = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return [hue * 60, saturation, lightness];
};

const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation);
  const l = clamp(lightness);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex([(rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255]);
};

const shift = (hex: string, hueDelta: number, saturationDelta = 0, lightnessDelta = 0): string => {
  const [hue, saturation, lightness] = rgbToHsl(hex);
  return hslToHex(hue + hueDelta, saturation + saturationDelta, lightness + lightnessDelta);
};

const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a: string, b: string): number => {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
};

const readableOn = (hex: string): string => {
  const dark = '#241a15';
  return contrastRatio(hex, WHITE) >= contrastRatio(hex, dark) ? WHITE : dark;
};

export const buildThemeTokens = (accentInput: string, dark: boolean): ThemeTokens => {
  const accent = normalizeHex(accentInput);
  const secondarySeed = mix(accent, '#6f645b', 0.84);
  const tertiarySeed = shift(accent, 18, -0.04, -0.01);

  const primary = dark ? mix(accent, WHITE, 0.36) : accent;
  const onPrimary = readableOn(primary);
  const primaryContainer = dark ? mix(accent, BLACK, 0.22) : mix(accent, BLACK, 0.16);
  const onPrimaryContainer = dark ? mix(accent, WHITE, 0.9) : readableOn(primaryContainer);

  const secondary = dark ? mix(secondarySeed, WHITE, 0.5) : secondarySeed;
  const onSecondary = readableOn(secondary);
  const secondaryContainer = dark ? mix(secondarySeed, BLACK, 0.42) : mix(secondarySeed, WHITE, 0.84);
  const onSecondaryContainer = dark ? mix(secondarySeed, WHITE, 0.84) : mix(secondarySeed, BLACK, 0.24);

  const tertiary = dark ? mix(tertiarySeed, WHITE, 0.42) : tertiarySeed;
  const onTertiary = readableOn(tertiary);
  const tertiaryContainer = dark ? mix(tertiarySeed, BLACK, 0.36) : mix(tertiarySeed, BLACK, 0.14);
  const onTertiaryContainer = dark ? mix(tertiarySeed, WHITE, 0.88) : readableOn(tertiaryContainer);

  const primaryFixed = mix(accent, WHITE, 0.84);
  const primaryFixedDim = mix(accent, WHITE, 0.62);
  const onPrimaryFixed = mix(accent, BLACK, 0.64);
  const onPrimaryFixedVariant = mix(accent, BLACK, 0.32);
  const secondaryFixed = mix(secondarySeed, WHITE, 0.86);
  const secondaryFixedDim = mix(secondarySeed, WHITE, 0.68);
  const onSecondaryFixed = mix(secondarySeed, BLACK, 0.56);
  const onSecondaryFixedVariant = mix(secondarySeed, BLACK, 0.3);
  const tertiaryFixed = mix(tertiarySeed, WHITE, 0.82);
  const tertiaryFixedDim = mix(tertiarySeed, WHITE, 0.6);
  const onTertiaryFixed = mix(tertiarySeed, BLACK, 0.6);
  const onTertiaryFixedVariant = mix(tertiarySeed, BLACK, 0.3);

  const surface = dark ? mix(accent, '#151210', 0.93) : mix(accent, WHITE, 0.968);
  const surfaceContainerLowest = dark ? mix(accent, '#0c0a09', 0.95) : WHITE;
  const surfaceContainerLow = dark ? mix(accent, '#1a1614', 0.91) : mix(accent, WHITE, 0.948);
  const surfaceContainer = dark ? mix(accent, '#1f1a18', 0.91) : mix(accent, WHITE, 0.918);
  const surfaceContainerHigh = dark ? mix(accent, '#25201d', 0.9) : mix(accent, WHITE, 0.883);
  const surfaceContainerHighest = dark ? mix(accent, '#2b2522', 0.9) : mix(accent, WHITE, 0.85);
  const surfaceDim = dark ? mix(accent, '#0f0d0c', 0.95) : mix(accent, WHITE, 0.82);
  const surfaceBright = dark ? mix(accent, '#302a26', 0.9) : mix(accent, WHITE, 0.988);
  const surfaceVariant = dark ? mix(accent, '#3a3330', 0.88) : mix(accent, WHITE, 0.875);
  const onSurface = dark ? '#f4eeeb' : mix(accent, '#1e1b19', 0.96);
  const onSurfaceVariant = dark ? mix(secondarySeed, WHITE, 0.72) : mix(secondarySeed, BLACK, 0.34);
  const outline = dark ? mix(secondarySeed, WHITE, 0.44) : mix(secondarySeed, WHITE, 0.2);
  const outlineVariant = dark ? mix(secondarySeed, BLACK, 0.48) : mix(secondarySeed, WHITE, 0.68);

  const tokens: ThemeTokens = {
    primary,
    'on-primary': onPrimary,
    'primary-container': primaryContainer,
    'on-primary-container': onPrimaryContainer,
    'primary-fixed': primaryFixed,
    'primary-fixed-dim': primaryFixedDim,
    'on-primary-fixed': onPrimaryFixed,
    'on-primary-fixed-variant': onPrimaryFixedVariant,
    secondary,
    'on-secondary': onSecondary,
    'secondary-container': secondaryContainer,
    'on-secondary-container': onSecondaryContainer,
    'secondary-fixed': secondaryFixed,
    'secondary-fixed-dim': secondaryFixedDim,
    'on-secondary-fixed': onSecondaryFixed,
    'on-secondary-fixed-variant': onSecondaryFixedVariant,
    tertiary,
    'on-tertiary': onTertiary,
    'tertiary-container': tertiaryContainer,
    'on-tertiary-container': onTertiaryContainer,
    'tertiary-fixed': tertiaryFixed,
    'tertiary-fixed-dim': tertiaryFixedDim,
    'on-tertiary-fixed': onTertiaryFixed,
    'on-tertiary-fixed-variant': onTertiaryFixedVariant,
    surface,
    'on-surface': onSurface,
    'surface-variant': surfaceVariant,
    'on-surface-variant': onSurfaceVariant,
    'surface-container-lowest': surfaceContainerLowest,
    'surface-container-low': surfaceContainerLow,
    'surface-container': surfaceContainer,
    'surface-container-high': surfaceContainerHigh,
    'surface-container-highest': surfaceContainerHighest,
    'surface-dim': surfaceDim,
    'surface-bright': surfaceBright,
    background: surface,
    'on-background': onSurface,
    'surface-tint': primary,
    outline,
    'outline-variant': outlineVariant,
    error: dark ? '#ffb4ab' : '#ba1a1a',
    'on-error': dark ? '#690005' : WHITE,
    'error-container': dark ? '#93000a' : '#ffdad6',
    'on-error-container': dark ? '#ffdad6' : '#93000a',
    'inverse-surface': dark ? '#f4eeeb' : '#33302d',
    'inverse-on-surface': dark ? '#33302d' : '#f7efeb',
    'inverse-primary': dark ? mix(accent, BLACK, 0.25) : primaryFixedDim,
  };

  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [key, toRgbTriplet(value)])) as ThemeTokens;
};

export const applyTheme = (accent: string, dark: boolean): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const tokens = buildThemeTokens(accent, dark);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  (Object.keys(tokens) as ThemeToken[]).forEach((key) => {
    root.style.setProperty(`--c-${key}`, tokens[key]);
  });
  root.dataset.palette = accent;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', `rgb(${tokens.surface})`);
};
