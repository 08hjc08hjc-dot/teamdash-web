/**
 * Load JSON from localStorage, handling both raw and zustand persist wrapper formats.
 * zustand persist stores data as { state: { ... }, version: 0 }
 * Our manual approach stores raw data.
 */
export function loadFromStorage<T>(key: string, field: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Handle zustand persist wrapper format: { state: { field: data }, version: 0 }
    if (parsed && typeof parsed === 'object' && 'state' in parsed && parsed.state && field in parsed.state) {
      return parsed.state[field] as T;
    }
    // Handle raw value format (our manual approach)
    if (Array.isArray(parsed) || typeof parsed !== 'object') {
      return parsed as T;
    }
    // Handle plain object with the field directly
    if (field in parsed) {
      return parsed[field] as T;
    }
    // If it's the right shape, return as-is
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable - silently ignore
  }
}
