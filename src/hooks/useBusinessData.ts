import { useQuery } from '@tanstack/react-query';
import {
  fetchRecaps,
  fetchInventory,
  fetchCustomers,
  fetchTransactions,
} from '../api/client';
import type { SalesRecap, Product, Customer, Transaction } from '../types';

// Hook terpusat untuk data Firestore dengan normalisasi Array yang konsisten.
// Memakai query key yang sama di seluruh aplikasi agar cache TanStack Query terpakai bersama.

export function useRecaps() {
  return useQuery<SalesRecap[]>({
    queryKey: ['recaps'],
    queryFn: async () => {
      const res = await fetchRecaps();
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetchInventory();
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetchCustomers();
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetchTransactions();
      return Array.isArray(res) ? res : [];
    },
  });
}