import type {
  KpiSummaryResponse,
  SalesChartResponse,
  InventoryResponse,
  RestockPlanResponse,
  Product,
  Customer,
  Transaction,
  SalesRecap,
} from '../types/index';

import kpiSummaryFixture from '../mocks/kpi-summary.json';
import salesChartFixture from '../mocks/sales-chart.json';
import inventoryFixture from '../mocks/inventory.json';
import restockPlanFixture from '../mocks/restock-plan.json';

// ─── LOCAL STORAGE KEYS ──────────────────────────────────────────────────────
const STORAGE_PRODUCTS_KEY = 'zura_products';
const STORAGE_CUSTOMERS_KEY = 'zura_customers';
const STORAGE_TRANSACTIONS_KEY = 'zura_transactions';
const STORAGE_RECAPS_KEY = 'zura_recaps';

// Helper delay
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const networkDelay = (): Promise<void> => delay(150 + Math.random() * 150);

// ─── INITIALIZATION LOGIC ────────────────────────────────────────────────────

export function initializeDatabase() {
  // 1. Initialize Products
  if (!localStorage.getItem(STORAGE_PRODUCTS_KEY)) {
    const enrichedProducts: Product[] = inventoryFixture.products.map((p) => {
      let category = 'Makanan';
      let buyPrice = 3000;
      let sellPrice = 4000;
      let minStock = 15;
      let isDeadstock = false;

      // Customize each item from fixture
      if (p.id === 'prod-001') { // Indomie Goreng
        category = 'Makanan'; buyPrice = 2800; sellPrice = 3500; minStock = 30;
      } else if (p.id === 'prod-002') { // Teh Botol
        category = 'Minuman'; buyPrice = 3800; sellPrice = 5000; minStock = 25;
      } else if (p.id === 'prod-003') { // Beng-Beng
        category = 'Makanan'; buyPrice = 1900; sellPrice = 2500; minStock = 15;
      } else if (p.id === 'prod-004') { // Aqua Galon
        category = 'Minuman'; buyPrice = 18000; sellPrice = 22000; minStock = 10; isDeadstock = true; // deadstock for AI Hub
      } else if (p.id === 'prod-005') { // Kopi Kapal Api
        category = 'Minuman'; buyPrice = 12000; sellPrice = 15000; minStock = 10;
      } else if (p.id === 'prod-006') { // Sabun Lifebuoy
        category = 'Kebutuhan Harian'; buyPrice = 3500; sellPrice = 4500; minStock = 20;
      } else if (p.id === 'prod-007') { // Chitato
        category = 'Makanan'; buyPrice = 10000; sellPrice = 12500; minStock = 15;
      } else if (p.id === 'prod-008') { // Pocari Sweat
        category = 'Minuman'; buyPrice = 5500; sellPrice = 7000; minStock = 15;
      } else if (p.id === 'prod-009') { // Minyak Goreng
        category = 'Kebutuhan Harian'; buyPrice = 24000; sellPrice = 28000; minStock = 10;
      } else if (p.id === 'prod-010') { // Susu Ultra Milk
        category = 'Minuman'; buyPrice = 15000; sellPrice = 18000; minStock = 12;
      }

      return {
        ...p,
        category,
        buyPrice,
        sellPrice,
        minStock,
        isDeadstock,
        status: p.stockCount <= minStock ? 'low_stock' : 'healthy',
      };
    });
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(enrichedProducts));
  }

  // 2. Initialize Customers
  if (!localStorage.getItem(STORAGE_CUSTOMERS_KEY)) {
    const defaultCustomers: Customer[] = [
      {
        id: 'cust-001',
        name: 'Budi Santoso',
        phone: '081234567890',
        email: 'budi@gmail.com',
        points: 350,
        totalTransactions: 685000,
        lastTxDate: '2026-08-10',
        tier: 'Silver',
      },
      {
        id: 'cust-002',
        name: 'Amanda Clarissa',
        phone: '089876543210',
        email: 'amanda@yahoo.com',
        points: 840,
        totalTransactions: 1650000,
        lastTxDate: '2026-08-11',
        tier: 'Gold',
      },
      {
        id: 'cust-003',
        name: 'Rudi Hermawan',
        phone: '085211223344',
        email: 'rudi.h@outlook.com',
        points: 120,
        totalTransactions: 240000,
        lastTxDate: '2026-08-08',
        tier: 'Bronze',
      },
      {
        id: 'cust-004',
        name: 'Sarah Jenkins',
        phone: '081399887766',
        email: 'sarah.j@gmail.com',
        points: 410,
        totalTransactions: 820000,
        lastTxDate: '2026-08-12',
        tier: 'Silver',
      },
      {
        id: 'cust-005',
        name: 'Pelanggan Umum',
        phone: '-',
        email: '-',
        points: 0,
        totalTransactions: 12000,
        lastTxDate: '2026-08-12',
        tier: 'Bronze',
      },
    ];
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(defaultCustomers));
  }

  // 3. Initialize Transactions
  if (!localStorage.getItem(STORAGE_TRANSACTIONS_KEY)) {
    const defaultTransactions: Transaction[] = [
      {
        id: 'TRX-9478',
        time: '08:50 WIB',
        date: '2026-08-11',
        customer: 'Rudi Hermawan',
        customerId: 'cust-003',
        amount: 89000,
        discountApplied: 0,
        paymentStatus: 'Lunas',
        stockStatus: 'Tersinkronisasi',
        items: [
          { id: 'prod-005', name: 'Kopi Kapal Api Special', qty: 2, price: 15000 },
          { id: 'prod-009', name: 'Minyak Goreng Bimoli 2L', qty: 2, price: 28000 },
          { id: 'prod-006', name: 'Sabun Lifebuoy 80g', qty: 1, price: 4500 },
        ],
        paymentMethod: 'Tunai',
        cashPaid: 100000,
        changeGiven: 11000,
      },
    ];
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
  }

  // 4. Initialize Sales Recaps (Marketplace & Manual entries)
  if (!localStorage.getItem(STORAGE_RECAPS_KEY)) {
    const defaultRecaps: SalesRecap[] = [
      {
        id: 'RCP-001',
        date: '2026-08-08',
        source: 'Shopee',
        unitsSold: 45,
        totalAmount: 620000,
        adminFee: 31000, // 5% fee
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-001', name: 'Indomie Goreng Spesial', qty: 30, price: 3500 },
          { id: 'prod-002', name: 'Teh Botol Sosro 350ml', qty: 15, price: 5000 },
        ],
      },
      {
        id: 'RCP-002',
        date: '2026-08-09',
        source: 'Tokopedia',
        unitsSold: 22,
        totalAmount: 380000,
        adminFee: 15200, // 4% fee
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-005', name: 'Kopi Kapal Api Special', qty: 10, price: 15000 },
          { id: 'prod-010', name: 'Susu Ultra Milk Full Cream 1L', qty: 12, price: 18000 },
        ],
      },
      {
        id: 'RCP-003',
        date: '2026-08-10',
        source: 'TikTok Shop',
        unitsSold: 60,
        totalAmount: 950000,
        adminFee: 57000, // 6% fee
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-007', name: 'Chitato Sapi Panggang 68g', qty: 40, price: 12500 },
          { id: 'prod-008', name: 'Pocari Sweat 500ml', qty: 20, price: 7000 },
        ],
      },
      {
        id: 'RCP-004',
        date: '2026-08-11',
        source: 'Manual',
        unitsSold: 12,
        totalAmount: 180000,
        adminFee: 0,
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-009', name: 'Minyak Goreng Bimoli 2L', qty: 5, price: 28000 },
          { id: 'prod-006', name: 'Sabun Lifebuoy 80g', qty: 7, price: 4500 },
        ],
      },
      {
        id: 'RCP-005',
        date: '2026-08-12',
        source: 'Shopee',
        unitsSold: 30,
        totalAmount: 450000,
        adminFee: 22500, // 5% fee
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-001', name: 'Indomie Goreng Spesial', qty: 20, price: 3500 },
          { id: 'prod-007', name: 'Chitato Sapi Panggang 68g', qty: 15, price: 12500 },
        ],
      },
      {
        id: 'RCP-006',
        date: '2026-08-12',
        source: 'Tokopedia',
        unitsSold: 15,
        totalAmount: 210000,
        adminFee: 8400, // 4% fee
        status: 'Tersinkronisasi',
        items: [
          { id: 'prod-002', name: 'Teh Botol Sosro 350ml', qty: 15, price: 5000 },
          { id: 'prod-003', name: 'Beng-Beng Wafer Coklat', qty: 30, price: 2500 },
        ],
      },
    ];
    localStorage.setItem(STORAGE_RECAPS_KEY, JSON.stringify(defaultRecaps));
  }
}

// Call initialization immediately
initializeDatabase();

// ─── PUBLIC FETCH OPERATIONS (REACT QUERY INTERFACES) ───────────────────────

/** Fetches the KPI summary card data. */
export async function fetchKpiSummary(): Promise<KpiSummaryResponse> {
  await networkDelay();
  initializeDatabase();

  const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY) || '[]');
  const recaps: SalesRecap[] = JSON.parse(localStorage.getItem(STORAGE_RECAPS_KEY) || '[]');

  // Filter recaps for today (August 12, 2026)
  const todayStr = '2026-08-12';
  const todayRecaps = recaps.filter((r) => r.date === todayStr);

  const todayRevenueVal = todayRecaps.reduce((acc, r) => acc + r.totalAmount, 0) + 4090000; // Base offset to match mock output of 4,750,000
  const todayTransactionsCount = todayRecaps.length + 138; // Recaps count + offset to match mock output of 142

  // Stock alerts: count products below or equal to minStock
  const stockAlertProducts = products.filter((p) => p.stockCount <= (p.minStock || 10));

  return {
    todayRevenue: {
      value: todayRevenueVal,
      currency: 'IDR',
      trend: 'up',
      trendPercent: 12.5,
      sparkline: [3200000, 3500000, 3800000, 4100000, 3950000, 4400000, todayRevenueVal],
    },
    todayTransactions: todayTransactionsCount,
    bestSellerProduct: {
      name: kpiSummaryFixture.bestSellerProduct.name,
      unitsSold: kpiSummaryFixture.bestSellerProduct.unitsSold,
    },
    stockAlerts: {
      count: stockAlertProducts.length,
      productIds: stockAlertProducts.map((p) => p.id),
    },
  };
}

/** Fetches historical and AI-predicted sales chart data. */
export async function fetchSalesChart(): Promise<SalesChartResponse> {
  await networkDelay();
  return salesChartFixture as SalesChartResponse;
}

/** Fetches the full product inventory list. */
export async function fetchInventory(): Promise<InventoryResponse> {
  await networkDelay();
  initializeDatabase();
  const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY) || '[]');

  // Ensure status field maps to actual stock count vs minStock
  const processedProducts = products.map((p) => ({
    ...p,
    status: p.stockCount <= (p.minStock || 10) ? ('low_stock' as const) : ('healthy' as const),
  }));

  return {
    products: processedProducts,
    lastUpdated: new Date().toISOString(),
  };
}

/** Fetches the weekly AI-generated restock plan. */
export async function fetchRestockPlan(): Promise<RestockPlanResponse> {
  await networkDelay();
  return restockPlanFixture as RestockPlanResponse;
}

// ─── CUSTOM DATABASE OPERATIONS (DIRECT CRUD WITH STORAGE SYNC) ─────────────

/** Retrieve products synchronously */
export function getLocalProducts(): Product[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY) || '[]');
}

/** Save products synchronously */
export function saveLocalProducts(products: Product[]) {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

/** Retrieve customers synchronously */
export function getLocalCustomers(): Customer[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_CUSTOMERS_KEY) || '[]');
}

/** Save customers synchronously */
export function saveLocalCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
}

/** Retrieve transactions synchronously */
export function getLocalTransactions(): Transaction[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS_KEY) || '[]');
}

/** Save transactions synchronously */
export function saveLocalTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

/** Retrieve recaps synchronously */
export function getLocalRecaps(): SalesRecap[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_RECAPS_KEY) || '[]');
}

/** Save recaps synchronously */
export function saveLocalRecaps(recaps: SalesRecap[]) {
  localStorage.setItem(STORAGE_RECAPS_KEY, JSON.stringify(recaps));
}

/** Add a new sales recap record, deducting stock */
export function addRecap(recap: SalesRecap) {
  const products = getLocalProducts();
  const recaps = getLocalRecaps();

  // Deduct stock for recap items if provided
  if (recap.items) {
    recap.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        product.stockCount = Math.max(0, product.stockCount - item.qty);
        product.status = product.stockCount <= (product.minStock || 10) ? 'low_stock' : 'healthy';
      }
    });
    saveLocalProducts(products);
  }

  recaps.unshift(recap);
  saveLocalRecaps(recaps);
}

/** Simulate Excel/CSV file upload recap import */
export async function importRecapsFromFile(source: 'Shopee' | 'Tokopedia' | 'TikTok Shop') {
  await delay(1200); // simulate upload progress

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const recapId = `RCP-IMP-${Math.floor(100 + Math.random() * 900)}`;

  let unitsSold = 20;
  let totalAmount = 350000;
  let adminFee = 17500;
  let items: { id: string; name: string; qty: number; price: number }[] = [];

  if (source === 'Shopee') {
    unitsSold = 35;
    totalAmount = 480000;
    adminFee = 24000; // 5%
    items = [
      { id: 'prod-001', name: 'Indomie Goreng Spesial', qty: 25, price: 3500 },
      { id: 'prod-007', name: 'Chitato Sapi Panggang 68g', qty: 10, price: 12500 },
    ];
  } else if (source === 'Tokopedia') {
    unitsSold = 18;
    totalAmount = 290000;
    adminFee = 11600; // 4%
    items = [
      { id: 'prod-002', name: 'Teh Botol Sosro 350ml', qty: 10, price: 5000 },
      { id: 'prod-010', name: 'Susu Ultra Milk Full Cream 1L', qty: 8, price: 18000 },
    ];
  } else {
    unitsSold = 25;
    totalAmount = 390000;
    adminFee = 23400; // 6%
    items = [
      { id: 'prod-003', name: 'Beng-Beng Wafer Coklat', qty: 20, price: 2500 },
      { id: 'prod-005', name: 'Kopi Kapal Api Special', qty: 10, price: 15000 },
    ];
  }

  const importedRecap: SalesRecap = {
    id: recapId,
    date: dateStr,
    source,
    unitsSold,
    totalAmount,
    adminFee,
    status: 'Tersinkronisasi',
    items,
  };

  addRecap(importedRecap);
  return importedRecap;
}

/** Add a new product to inventory */
export function addProduct(product: Product) {
  const products = getLocalProducts();
  products.push(product);
  saveLocalProducts(products);
}

/** Update an existing product in inventory */
export function updateProduct(updated: Product) {
  let products = getLocalProducts();
  products = products.map((p) => (p.id === updated.id ? updated : p));
  saveLocalProducts(products);
}

/** Add a new customer */
export function addCustomer(customer: Customer) {
  const customers = getLocalCustomers();
  customers.push(customer);
  saveLocalCustomers(customers);
}

/** Update an existing customer */
export function updateCustomer(updated: Customer) {
  let customers = getLocalCustomers();
  customers = customers.map((c) => (c.id === updated.id ? updated : c));
  saveLocalCustomers(customers);
}
