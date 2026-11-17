import type { AppData } from '../types';

export const DATA_STORAGE_KEY = 'estudia.data.v1';
export const THEME_STORAGE_KEY = 'estudia.theme';

export const loadData = (): AppData | null => {
  try {
    const raw = localStorage.getItem(DATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.cards)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private mode; the app keeps working in memory.
  }
};

export const clearData = (): void => {
  try {
    localStorage.removeItem(DATA_STORAGE_KEY);
  } catch {
    // no-op
  }
};
