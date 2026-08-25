import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import type { Product, Customer, SalesRecap, Transaction } from '../types';

// ─── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
const productsRef = collection(db, 'products');
const customersRef = collection(db, 'customers');
const transactionsRef = collection(db, 'transactions');
const recapsRef = collection(db, 'recaps');

// 1. Ambil Data Produk dari Firestore
export async function getFirestoreProducts(): Promise<Product[]> {
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
}

// 2. Tambah Produk Baru ke Firestore
export async function addFirestoreProduct(product: Omit<Product, 'id'>) {
  const docRef = await addDoc(productsRef, product);
  return { id: docRef.id, ...product };
}

// 3. Update Produk di Firestore
export async function updateFirestoreProduct(id: string, updatedData: Partial<Product>) {
  const productDoc = doc(db, 'products', id);
  await updateDoc(productDoc, updatedData);
}

// 4. Ambil Data Rekap Penjualan dari Firestore
export async function getFirestoreRecaps(): Promise<SalesRecap[]> {
  const snapshot = await getDocs(recapsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SalesRecap[];
}

// 5. Tambah Rekap Baru ke Firestore
export async function addFirestoreRecap(recap: Omit<SalesRecap, 'id'>) {
  const docRef = await addDoc(recapsRef, recap);
  return { id: docRef.id, ...recap };
}