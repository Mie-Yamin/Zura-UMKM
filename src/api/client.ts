import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import type { Product, Customer, SalesRecap, Transaction } from '../types';

// ─── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
const productsRef = collection(db, 'products');
const customersRef = collection(db, 'customers');
const transactionsRef = collection(db, 'transactions');
const recapsRef = collection(db, 'recaps');

// ─── PRODUK / INVENTARIS ──────────────────────────────────────────────────────

export async function fetchInventory(): Promise<Product[]> {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}

export async function addProduct(product: Omit<Product, 'id'>) {
  const docRef = await addDoc(productsRef, product);
  return { id: docRef.id, ...product };
}

export async function updateProduct(id: string, updatedData: Partial<Product>) {
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, updatedData);
}

export async function deleteProduct(id: string) {
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
  const snapshot = await getDocs(recapsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SalesRecap[];
}

export async function addRecap(recap: Omit<SalesRecap, 'id'>) {
  const docRef = await addDoc(recapsRef, recap);
  return { id: docRef.id, ...recap };
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
  const snapshot = await getDocs(customersRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

export const getLocalCustomers = fetchCustomers;

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  const snapshot = await getDocs(transactionsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}

export const getLocalTransactions = fetchTransactions;

// ─── KPI SUMMARY (DASHBOARD) ──────────────────────────────────────────────────

export async function fetchKpiSummary() {
  const [products, recaps, customers] = await Promise.all([
    fetchInventory(),
    fetchRecaps(),
    fetchCustomers(),
  ]);

  const totalRevenue = recaps.reduce((acc, item) => acc + (item.revenue || 0), 0);
  const totalOrders = recaps.reduce((acc, item) => acc + (item.totalTransactions || 0), 0);

  return {
    totalRevenue,
    totalOrders,
    totalCustomers: customers.length,
    activeProducts: products.length,
  };
}

export const getKpiSummary = fetchKpiSummary;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────

export function initializeDatabase() {
}