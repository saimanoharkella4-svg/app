import AsyncStorage from '@react-native-async-storage/async-storage';

// Synchronous key-value cache backed by AsyncStorage (replaces browser localStorage).
// Call hydrateStorage() once at startup before reading.
const cache = new Map<string, string>();
const KEYS = ['fst_staff_token', 'fst_pending_locations_sqlite_queue'];

export async function hydrateStorage() {
  try {
    const pairs = await AsyncStorage.multiGet(KEYS);
    pairs.forEach(([k, v]) => {
      if (v != null) cache.set(k, v);
    });
  } catch (e) {
    console.warn('Storage hydrate error:', e);
  }
}

export const storage = {
  getItem: (key: string): string | null => cache.get(key) ?? null,
  setItem: (key: string, value: string) => {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  removeItem: (key: string) => {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  }
};
