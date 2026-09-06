import { db, auth } from '../config/firebase';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import type {
  Product,
  SalesRecap,
  Transaction,
  KpiSummaryResponse,
  SalesChartResponse,
  SalesDataPoint,
  RestockPlanResponse,
  RestockDataPoint,
} from '../types';

// ─── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
const productsRef = collection(db, 'products');
const transactionsRef = collection(db, 'transactions');
const recapsRef = collection(db, 'recaps');
const settingsRef = collection(db, 'settings');
const usersRef = collection(db, 'users');

// Helper cepat dan aman untuk memastikan sesi Firebase Auth siap
let authUidPromise: Promise<string | null> | null = null;

export const getAuthUserId = async (): Promise<string | null> => {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  if (!authUidPromise) {
    authUidPromise = new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        authUidPromise = null;
        resolve(user ? user.uid : null);
      });
    });
  }
  return authUidPromise;
};

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function fetchUserProfile() {
  try {
    const uid = await getAuthUserId();
    if (!uid) return null;

    const docSnap = await getDoc(doc(usersRef, uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    const user = auth.currentUser;
    return {
      name: user?.displayName || 'Pemilik Toko',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
      storeName: 'Zura Store',
      address: '',
      category: '',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(profileData: Record<string, any>) {
  try {
    const uid = await getAuthUserId();
    if (!uid) throw new Error('User belum login');

    const payload = {
      ...profileData,
      userId: uid,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(usersRef, uid), payload, { merge: true });
    return payload;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// ─── USER SETTINGS ────────────────────────────────────────────────────────────

export async function fetchUserSettings(): Promise<any> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return { lowStockThreshold: 5 };

    const docSnap = await getDoc(doc(settingsRef, uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { lowStockThreshold: 5 };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { lowStockThreshold: 5 };
  }
}

export async function updateUserSettings(newSettings: Record<string, any>) {
  try {
    const uid = await getAuthUserId();
    if (!uid) throw new Error('User belum login');

    await setDoc(doc(settingsRef, uid), { ...newSettings, userId: uid }, { merge: true });
    return newSettings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

// ─── PRODUK / INVENTARIS ──────────────────────────────────────────────────────

export async function fetchInventory(): Promise<Product[]> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return [];

    const q = query(productsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as Product[];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function addProduct(product: Omit<Product, 'id'>) {
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const { id, ...cleanProduct } = product as any;
  const payload = {
    ...cleanProduct,
    userId: uid,
    createdAt: cleanProduct.createdAt || new Date().toISOString(),
  };

  const docRef = await addDoc(productsRef, payload);
  return { id: docRef.id, ...payload } as Product;
}

export async function updateProduct(id: string, updatedData: Partial<Product>) {
  if (!id) throw new Error('ID Produk tidak valid untuk pembaruan');
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const productDoc = doc(db, 'products', id);
  const { userId: _ignored, ...safeUpdatedData } = updatedData as any;
  await updateDoc(productDoc, {
    ...safeUpdatedData,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string) {
  if (!id) throw new Error('ID Produk tidak valid untuk penghapusan');
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const productDoc = doc(db, 'products', id);
  await deleteDoc(productDoc);
}

// Aliases
export const getFirestoreProducts = fetchInventory;
export const getLocalProducts = fetchInventory;
export const addFirestoreProduct = addProduct;
export const updateFirestoreProduct = updateProduct;

// ─── REKAP PENJUALAN ──────────────────────────────────────────────────────────

export async function fetchRecaps(): Promise<SalesRecap[]> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return [];

    const q = query(recapsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as SalesRecap[];
  } catch (error) {
    console.error('Error fetching recaps:', error);
    return [];
  }
}

export async function addRecap(recap: Omit<SalesRecap, 'id'>) {
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const now = new Date();
  const payload = {
    ...recap,
    createdAt: recap.createdAt || now.toISOString(),
    userId: uid,
  };

  const docRef = await addDoc(recapsRef, payload);
  return { id: docRef.id, ...payload } as SalesRecap;
}

export async function deleteRecap(id: string) {
  if (!id) throw new Error('ID Rekap tidak valid untuk penghapusan');
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const recapDoc = doc(db, 'recaps', id);
  await deleteDoc(recapDoc);
}

// Simpan batch impor Excel/CSV sekaligus dalam 1 request transaksi atomic
export async function importRecapsFromFile(recaps: Omit<SalesRecap, 'id'>[]) {
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');
  if (!recaps || recaps.length === 0) return [];

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const createdList: SalesRecap[] = [];

  for (const recap of recaps) {
    const docRef = doc(recapsRef);
    const payload = {
      ...recap,
      createdAt: recap.createdAt || now,
      userId: uid,
    };
    batch.set(docRef, payload);
    createdList.push({ id: docRef.id, ...payload } as SalesRecap);
  }

  await batch.commit();
  return createdList;
}

// Simpan rekap penjualan dan potong seluruh stok item dalam 1 request batch Firestore
export async function recordSaleWithBatch(
  recap: Omit<SalesRecap, 'id'>,
  stockUpdates: { productId: string; newStock: number; minStock?: number }[] = []
) {
  const uid = await getAuthUserId();
  if (!uid) throw new Error('User belum login');

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  const recapDocRef = doc(recapsRef);
  const recapPayload = {
    ...recap,
    createdAt: recap.createdAt || now,
    userId: uid,
  };
  batch.set(recapDocRef, recapPayload);

  for (const item of stockUpdates) {
    if (item.productId) {
      const prodRef = doc(db, 'products', item.productId);
      const min = item.minStock || 10;
      batch.update(prodRef, {
        stockCount: item.newStock,
        status: item.newStock <= min ? 'low_stock' : 'healthy',
        updatedAt: now,
      });
    }
  }

  await batch.commit();
  return { id: recapDocRef.id, ...recapPayload } as SalesRecap;
}

// Aliases
export const getFirestoreRecaps = fetchRecaps;
export const getLocalRecaps = fetchRecaps;
export const addFirestoreRecap = addRecap;
export const deleteFirestoreRecap = deleteRecap;

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return [];

    const q = query(transactionsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export const getLocalTransactions = fetchTransactions;

// ─── KPI SUMMARY (DASHBOARD) ──────────────────────────────────────────────────

// Normalisasi beragam format tanggal dari rekap agar bisa dibandingkan per hari
const normalizeRecapDate = (item: SalesRecap): Date | null => {
  const field =
    item?.date ||
    item?.recapDate ||
    item?.tanggal ||
    item?.transactionDate ||
    item?.createdAt ||
    item?.timestamp;
  if (!field) return null;

  if (field instanceof Date) return field;
  if (typeof field === 'object' && typeof (field as any).toDate === 'function') {
    return (field as any).toDate();
  }
  if (typeof field === 'string') {
    // String "YYYY-MM-DD" → parse lokal tanpa selisih UTC
    if (field.length === 10 && field.includes('-')) {
      const [year, month, day] = field.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(field);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const sumAmount = (list: SalesRecap[]) =>
  list.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);

export async function fetchKpiSummary(
  preloadedProducts?: Product[],
  preloadedRecaps?: SalesRecap[]
): Promise<KpiSummaryResponse> {
  try {
    const products = preloadedProducts ?? (await fetchInventory());
    const recaps = preloadedRecaps ?? (await fetchRecaps());

    const safeRecaps = Array.isArray(recaps) ? recaps : [];
    const safeProducts = Array.isArray(products) ? products : [];

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const todayRecaps = safeRecaps.filter((r) => {
      const d = normalizeRecapDate(r);
      return d !== null && isSameDay(d, now);
    });
    const yesterdayRecaps = safeRecaps.filter((r) => {
      const d = normalizeRecapDate(r);
      return d !== null && isSameDay(d, yesterday);
    });

    const todayValue = sumAmount(todayRecaps);
    const yesterdayValue = sumAmount(yesterdayRecaps);

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendPercent = 0;
    if (yesterdayValue > 0) {
      trendPercent = Math.round(((todayValue - yesterdayValue) / yesterdayValue) * 1000) / 10;
      trend = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral';
    } else if (todayValue > 0) {
      trend = 'up';
      trendPercent = 100;
    }

    // Sparkline 7 hari terakhir
    const sparkline: number[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return sumAmount(
        safeRecaps.filter((r) => {
          const rd = normalizeRecapDate(r);
          return rd !== null && isSameDay(rd, d);
        })
      );
    });

    // Best seller dari detail item rekap (aggregasi qty per nama produk)
    const unitByName = new Map<string, number>();
    safeRecaps.forEach((r) => {
      (r.items || []).forEach((it) => {
        if (it?.name) {
          unitByName.set(it.name, (unitByName.get(it.name) || 0) + (Number(it.qty) || 0));
        }
      });
    });
    let bestSellerName = '';
    let bestSellerUnits = 0;
    unitByName.forEach((qty, name) => {
      if (qty > bestSellerUnits) {
        bestSellerUnits = qty;
        bestSellerName = name;
      }
    });

    const lowStock = safeProducts.filter(
      (p) => (p.stockCount || 0) <= (p.minStock || 10)
    );

    return {
      todayRevenue: {
        value: todayValue,
        currency: 'IDR',
        trend,
        trendPercent,
        sparkline,
      },
      todayTransactions: todayRecaps.length,
      bestSellerProduct: {
        name: bestSellerName || '-',
        unitsSold: bestSellerUnits,
      },
      stockAlerts: {
        count: lowStock.length,
        productIds: lowStock.map((p) => p.id),
      },
    };
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    return {
      todayRevenue: { value: 0, currency: 'IDR', trend: 'neutral', trendPercent: 0, sparkline: [] },
      todayTransactions: 0,
      bestSellerProduct: { name: '-', unitsSold: 0 },
      stockAlerts: { count: 0, productIds: [] },
    };
  }
}

export const getKpiSummary = fetchKpiSummary;

// ─── SALES CHART (HISTORIS + PROYEKSI) ────────────────────────────────────────

export async function fetchSalesChart(preloadedRecaps?: SalesRecap[]): Promise<SalesChartResponse> {
  try {
    const recaps = preloadedRecaps ?? (await fetchRecaps());
    const safeRecaps = Array.isArray(recaps) ? recaps : [];

    const now = new Date();
    const historical: SalesDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const total = safeRecaps.reduce((acc, r) => {
        const rd = normalizeRecapDate(r);
        if (rd && rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()) {
          return acc + (Number(r.totalAmount) || 0);
        }
        return acc;
      }, 0);
      historical.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue: total,
      });
    }

    // Proyeksi sederhana: rata-rata 3 bulan terakhir untuk 3 bulan ke depan
    const last3 = historical.slice(-3);
    const avg = last3.length
      ? last3.reduce((acc, m) => acc + m.revenue, 0) / last3.length
      : 0;
    const prediction: SalesDataPoint[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      prediction.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue: Math.round(avg),
      });
    }

    return { historical, prediction, currency: 'IDR' };
  } catch (error) {
    console.error('Error fetching sales chart:', error);
    return { historical: [], prediction: [], currency: 'IDR' };
  }
}

export const getSalesChart = fetchSalesChart;

// ─── RESTOCK PLAN (MINGGU BERJALAN) ───────────────────────────────────────────

export async function fetchRestockPlan(preloadedRecaps?: SalesRecap[]): Promise<RestockPlanResponse> {
  try {
    const recaps = preloadedRecaps ?? (await fetchRecaps());
    const safeRecaps = Array.isArray(recaps) ? recaps : [];

    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = Senin
    const monday = new Date(now);
    monday.setDate(now.getDate() - dow);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const plan: RestockDataPoint[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const quantity = safeRecaps.reduce((acc, r) => {
        const rd = normalizeRecapDate(r);
        if (rd && rd.toDateString() === d.toDateString()) {
          return acc + (Number(r.unitsSold) || 0);
        }
        return acc;
      }, 0);
      return { day: dayNames[i], quantity };
    });

    return { weekOf: monday.toISOString().slice(0, 10), plan };
  } catch (error) {
    console.error('Error fetching restock plan:', error);
    return { weekOf: '', plan: [] };
  }
}

export const getRestockPlan = fetchRestockPlan;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────

export function initializeDatabase() { }