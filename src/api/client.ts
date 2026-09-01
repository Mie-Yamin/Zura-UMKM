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
} from 'firebase/firestore';
import type { Product, Customer, SalesRecap, Transaction } from '../types';

// ─── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
const productsRef = collection(db, 'products');
const customersRef = collection(db, 'customers');
const transactionsRef = collection(db, 'transactions');
const recapsRef = collection(db, 'recaps');
const settingsRef = collection(db, 'settings');
const usersRef = collection(db, 'users');

// Helper untuk memastikan sesi Firebase Auth siap sebelum query dijalankan
const getAuthUserId = async (): Promise<string | null> => {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user ? user.uid : null);
    });
  });
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

    // Fallback default jika data belum pernah disimpan di Firestore
    const user = auth.currentUser;
    return {
      name: user?.displayName || 'Pemilik Toko',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
      storeName: 'Zura Store',
      address: '',
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

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
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
  const payload = { ...cleanProduct, userId: uid };

  const docRef = await addDoc(productsRef, payload);
  return { id: docRef.id, ...payload };
}

export async function updateProduct(id: string, updatedData: Partial<Product>) {
  if (!id) throw new Error('ID Produk tidak valid untuk pembaruan');
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, updatedData);
}

export async function deleteProduct(id: string) {
  if (!id) throw new Error('ID Produk tidak valid untuk penghapusan');
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
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
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
  return { id: docRef.id, ...payload };
}

export async function deleteRecap(id: string) {
  if (!id) throw new Error('ID Rekap tidak valid untuk penghapusan');
  const recapDoc = doc(db, 'recaps', id);
  await deleteDoc(recapDoc);
}

export async function importRecapsFromFile(recaps: Omit<SalesRecap, 'id'>[]) {
  const promises = recaps.map((recap) => addRecap(recap));
  return await Promise.all(promises);
}

// Aliases
export const getFirestoreRecaps = fetchRecaps;
export const getLocalRecaps = fetchRecaps;
export const addFirestoreRecap = addRecap;
export const deleteFirestoreRecap = deleteRecap;

// ─── PELANGGAN ────────────────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return [];

    const q = query(customersRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Customer[];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export const getLocalCustomers = fetchCustomers;

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const uid = await getAuthUserId();
    if (!uid) return [];

    const q = query(transactionsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export const getLocalTransactions = fetchTransactions;

// ─── KPI SUMMARY (DASHBOARD) ──────────────────────────────────────────────────

export async function fetchKpiSummary() {
  try {
    const [products, recaps, customers] = await Promise.all([
      fetchInventory(),
      fetchRecaps(),
      fetchCustomers(),
    ]);

    const safeRecaps = Array.isArray(recaps) ? recaps : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];

    const totalRevenue = safeRecaps.reduce(
      (acc, item) => acc + (item.totalAmount || item.revenue || 0),
      0
    );
    const totalOrders = safeRecaps.reduce(
      (acc, item) => acc + (item.unitsSold || item.totalTransactions || 0),
      0
    );

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: safeCustomers.length,
      activeProducts: safeProducts.length,
    };
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      activeProducts: 0,
    };
  }
}

export const getKpiSummary = fetchKpiSummary;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────

export function initializeDatabase() { }