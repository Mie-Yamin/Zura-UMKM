export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  category: string;
  isEmailVerified: boolean;
}

export interface SopTask {
  id: string;
  label: string;
  completed: boolean;
}

export type SopTemplateKey = "online" | "fnb" | "monthly";

export const DEFAULT_BUSINESS_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Pakaian & Fashion",
  "Ritel / Toko Kelontong",
  "Jasa & Pelayanan",
  "Kecantikan & Kesehatan",
];