import { describe, it, expect, beforeEach, vi } from 'vitest';

const dbStore = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  currentUser: null as { uid: string } | null,
  autoId: 0,
}));

const collKey = (name: string, id: string) => `${name}\u0000${id}`;

vi.mock('firebase/firestore', () => {
  return {
    collection: (_db: unknown, name: string) => ({ name }),
    doc: (parent: { name?: string }, first?: string, ...rest: string[]) => {
      if (!first) {
        return { name: parent?.name, id: `auto-${++dbStore.autoId}` };
      }
      if (rest.length === 0) return { name: parent?.name, id: first };
      return { name: first, id: rest.join('/') };
    },
    query: (ref: Record<string, unknown>, ...clauses: Record<string, unknown>[]) =>
      Object.assign({}, ref, ...clauses),
    where: (field: string, _op: string, value: unknown) => ({
      _where: { field, value },
    }),
    getDoc: async (ref: { name: string; id: string }) => {
      const data = dbStore.docs.get(collKey(ref.name, ref.id));
      return {
        id: ref.id,
        exists: () => data !== undefined,
        data: () => data ?? {},
      };
    },
    getDocs: async (q: {
      name: string;
      _where?: { field: string; value: unknown };
    }) => {
      let list = [...dbStore.docs.entries()]
        .filter(([k]) => k.startsWith(`${q.name}\u0000`))
        .map(([k, d]) => ({ id: k.split('\u0000')[1], data: () => d }));

      const whereClause = q._where;
      if (whereClause) {
        list = list.filter(
          (item) => item.data()[whereClause.field] === whereClause.value,
        );
      }
      return { docs: list };
    },
    addDoc: async (ref: { name: string }, data: Record<string, unknown>) => {
      const id = `auto-${++dbStore.autoId}`;
      dbStore.docs.set(collKey(ref.name, id), data);
      return { id };
    },
    setDoc: async (
      ref: { name: string; id: string },
      data: Record<string, unknown>,
    ) => {
      dbStore.docs.set(collKey(ref.name, ref.id), data);
    },
    updateDoc: async (
      ref: { name: string; id: string },
      data: Record<string, unknown>,
    ) => {
      const k = collKey(ref.name, ref.id);
      dbStore.docs.set(k, { ...(dbStore.docs.get(k) ?? {}), ...data });
    },
    deleteDoc: async (ref: { name: string; id: string }) => {
      dbStore.docs.delete(collKey(ref.name, ref.id));
    },
    writeBatch: (_db: unknown) => {
      const ops: Array<() => void> = [];
      return {
        set: (ref: { name: string; id: string }, data: Record<string, unknown>) => {
          ops.push(() => dbStore.docs.set(collKey(ref.name, ref.id), data));
        },
        update: (ref: { name: string; id: string }, data: Record<string, unknown>) => {
          ops.push(() => {
            const k = collKey(ref.name, ref.id);
            dbStore.docs.set(k, { ...(dbStore.docs.get(k) ?? {}), ...data });
          });
        },
        delete: (ref: { name: string; id: string }) => {
          ops.push(() => dbStore.docs.delete(collKey(ref.name, ref.id)));
        },
        commit: async () => {
          ops.forEach((op) => op());
        },
      };
    },
  };
});

vi.mock('../config/firebase', () => ({
  db: {},
  auth: {
    get currentUser() {
      return dbStore.currentUser;
    },
    onAuthStateChanged: (cb: (u: { uid: string } | null) => void) => {
      cb(dbStore.currentUser);
      return () => undefined;
    },
  },
}));

import {
  fetchInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  fetchRecaps,
  addRecap,
  deleteRecap,
  importRecapsFromFile,
  recordSaleWithBatch,
} from './client';

describe('client.ts — data-layer ownership & fast batching', () => {
  beforeEach(() => {
    dbStore.docs.clear();
    dbStore.autoId = 0;
    dbStore.currentUser = { uid: 'user-a' };
  });

  describe('Stamping kepemilikan (ownership stamping)', () => {
    it('addProduct selalu menulis userId dari sesi yang terautentikasi', async () => {
      dbStore.currentUser = { uid: 'user-a' };
      const created = await addProduct({
        name: 'Kopi Arabica',
        sku: 'KOP-001',
        stockCount: 10,
      } as never);

      expect(created.userId).toBe('user-a');
      const stored = [...dbStore.docs.values()].find(
        (d) => d.name === 'Kopi Arabica',
      );
      expect(stored?.userId).toBe('user-a');
    });

    it('addRecap selalu menulis userId dari sesi yang terautentikasi', async () => {
      const created = await addRecap({
        totalAmount: 150000,
        items: [],
      } as never);

      expect(created.userId).toBe('user-a');
    });
  });

  describe('Kontainer data per-user (multi-tenancy)', () => {
    it('fetchInventory hanya mengembalikan produk milik user aktif', async () => {
      dbStore.docs.set(collKey('products', 'p1'), {
        userId: 'user-a',
        name: 'Milik A',
      });
      dbStore.docs.set(collKey('products', 'p2'), {
        userId: 'user-b',
        name: 'Milik B',
      });

      const mine = await fetchInventory();
      expect(mine.map((p) => p.name).sort()).toEqual(['Milik A']);
    });

    it('fetchRecaps hanya mengembalikan rekap milik user aktif', async () => {
      dbStore.docs.set(collKey('recaps', 'r1'), {
        userId: 'user-a',
        totalAmount: 100,
      });
      dbStore.docs.set(collKey('recaps', 'r2'), {
        userId: 'user-b',
        totalAmount: 200,
      });

      const mine = await fetchRecaps();
      expect(mine).toHaveLength(1);
      expect(mine[0].totalAmount).toBe(100);
    });
  });

  describe('Operasi Cepat & Batch Firestore', () => {
    it('updateProduct sukses memperbarui data produk', async () => {
      dbStore.docs.set(collKey('products', 'p1'), {
        userId: 'user-a',
        name: 'Lama',
        stockCount: 1,
      });

      await updateProduct('p1', { name: 'Baru' });
      expect(dbStore.docs.get(collKey('products', 'p1'))?.name).toBe('Baru');
    });

    it('deleteProduct sukses menghapus produk', async () => {
      dbStore.docs.set(collKey('products', 'p1'), {
        userId: 'user-a',
        name: 'Milik Sendiri',
      });

      await deleteProduct('p1');
      expect(dbStore.docs.has(collKey('products', 'p1'))).toBe(false);
    });

    it('deleteRecap sukses menghapus rekap', async () => {
      dbStore.docs.set(collKey('recaps', 'r1'), {
        userId: 'user-a',
        totalAmount: 500,
      });

      await deleteRecap('r1');
      expect(dbStore.docs.has(collKey('recaps', 'r1'))).toBe(false);
    });

    it('importRecapsFromFile menulis batch dengan userId terstempel', async () => {
      const results = await importRecapsFromFile([
        { date: '2026-09-01', totalAmount: 50000, unitsSold: 2 } as never,
        { date: '2026-09-02', totalAmount: 75000, unitsSold: 3 } as never,
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].userId).toBe('user-a');
      expect(results[1].userId).toBe('user-a');
    });

    it('recordSaleWithBatch menyimpan rekap dan memperbarui stok dalam 1 operasi batch', async () => {
      dbStore.docs.set(collKey('products', 'p1'), {
        userId: 'user-a',
        name: 'Kopi',
        stockCount: 10,
      });

      const saved = await recordSaleWithBatch(
        { date: '2026-09-06', totalAmount: 20000, unitsSold: 2 } as never,
        [{ productId: 'p1', newStock: 8, minStock: 5 }]
      );

      expect(saved.userId).toBe('user-a');
      expect(dbStore.docs.get(collKey('products', 'p1'))?.stockCount).toBe(8);
    });
  });
});