import { db, auth } from '../config/firebase';
import {
  collection,
  getDocs,
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

// Helper untuk mendapatkan User ID aktif
const getCurrentUserId = () => {
  return auth.currentUser?.uid || null;
};

// ─── PRODUK / INVENTARIS ──────────────────────────────────────────────────────

export async function fetchInventory(): Promise<Product[]> {
  try {
    const uid = getCurrentUserId();
    if (!uid) return [];

    const q = query(productsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Product[];
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

export async function addProduct(product: Omit<Product, 'id'>) {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("User belum login");

  // Memastikan field 'id' tidak ikut tersimpan dan menambahkan userId
  const { id, ...cleanProduct } = product as any;
  const payload = { ...cleanProduct, userId: uid };

  const docRef = await addDoc(productsRef, payload);
  return { id: docRef.id, ...payload };
}

export async function updateProduct(id: string, updatedData: Partial<Product>) {
  if (!id) throw new Error("ID Produk tidak valid untuk pembaruan");
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, updatedData);
}

export async function deleteProduct(id: string) {
  if (!id) throw new Error("ID Produk tidak valid untuk penghapusan");

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
    const uid = getCurrentUserId();
    if (!uid) return [];

    const q = query(recapsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as SalesRecap[];
  } catch (error) {
    console.error("Error fetching recaps:", error);
    return [];
  }
}

export async function addRecap(recap: Omit<SalesRecap, 'id'>) {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("User belum login");

  const payload = { ...recap, userId: uid };
  const docRef = await addDoc(recapsRef, payload);
  return { id: docRef.id, ...payload };
}

export async function importRecapsFromFile(recaps: Omit<SalesRecap, 'id'>[]) {
  const promises = recaps.map((recap) => addRecap(recap));
  return await Promise.all(promises);
}

// Aliases
export const getFirestoreRecaps = fetchRecaps;
export const getLocalRecaps = fetchRecaps;
export const addFirestoreRecap = addRecap;

// ─── PELANGGAN ────────────────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const uid = getCurrentUserId();
    if (!uid) return [];

    const q = query(customersRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Customer[];
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export const getLocalCustomers = fetchCustomers;

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const uid = getCurrentUserId();
    if (!uid) return [];

    const q = query(transactionsRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Transaction[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
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

    const totalRevenue = safeRecaps.reduce((acc, item) => acc + (item.totalAmount || item.revenue || 0), 0);
    const totalOrders = safeRecaps.reduce((acc, item) => acc + (item.unitsSold || item.totalTransactions || 0), 0);

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: safeCustomers.length,
      activeProducts: safeProducts.length,
    };
  } catch (error) {
    console.error("Error fetching KPI summary:", error);
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