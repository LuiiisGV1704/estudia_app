const pad = (value: number) => String(value).padStart(2, '0');

export const dateKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const addDays = (key: string, days: number): string => {
  const date = parseKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

export const today = (): string => dateKey();

export const weekdayShort = (key: string): string =>
  ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][parseKey(key).getDay()];

export const monthShort = (key: string): string =>
  ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][parseKey(key).getMonth()];

export const formatLongDate = (date: Date = new Date()): string => {
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatShortDate = (key: string): string =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(parseKey(key));

export const greeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

export const daysUntil = (key: string): number => {
  const oneDay = 86_400_000;
  const start = parseKey(today()).getTime();
  const target = parseKey(key).getTime();
  return Math.round((target - start) / oneDay);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const formatTimer = (seconds: number): string => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${pad(mins)}:${pad(secs)}`;
};

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'ayer' : `hace ${days} días`;
};

export const startOfMonth = (date: Date = new Date()): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const monthLabel = (date: Date): string => {
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const lastNDays = (n: number): string[] =>
  Array.from({ length: n }, (_, index) => addDays(today(), index - (n - 1)));

export const isToday = (key: string): boolean => key === today();

export const minutesNow = (): number => {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
};

export const timeToMinutes = (time?: string): number => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
