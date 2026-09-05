// src/utils/storage.ts
// Titik pusat akses localStorage. Semua key terpusat (single source of truth),
// dengan JSON parse/serialize yang aman — menghilangkan literan custom & try/catch
// yang tersebar di setiap page. Data di localStorage dipakai sebagai cache/fallback;
// sumber data utama tetap Firestore.

export const STORAGE_KEYS = {
  PROFILE: "zura:user_profile",
  SOP_CHECKLIST: "zura:sop_checklist",
  CUSTOM_CATEGORIES: "zura:custom_categories",
  OPERATIONAL_EXPENSES: "zura:operational_expenses",
} as const;

// Migrasi key lama (tanpa prefix) yang pernah dipakai sebelum utilitas ini ada,
// supaya cache user lama tidak hilang saat kode baru membaca key baru.
const LEGACY_KEYS: Record<StorageKey, string> = {
  [STORAGE_KEYS.PROFILE]: "user_profile_data",
  [STORAGE_KEYS.SOP_CHECKLIST]: "zura_sop_checklist",
  [STORAGE_KEYS.CUSTOM_CATEGORIES]: "zura_custom_categories",
  [STORAGE_KEYS.OPERATIONAL_EXPENSES]: "zura_operational_expenses",
};

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function resolveKey(key: StorageKey): string {
  return localStorage.getItem(key) === null ? LEGACY_KEYS[key] : key;
}

export function readStoredJSON<T>(key: StorageKey, fallback: T): T {
  try {
    const storedKey = resolveKey(key);
    const raw = localStorage.getItem(storedKey);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJSON(key: StorageKey, value: unknown): void {
  try {
    localStorage.removeItem(LEGACY_KEYS[key]);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Gagal menyimpan ${key} ke localStorage:`, e);
  }
}