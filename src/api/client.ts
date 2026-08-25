import type {
  KpiSummaryResponse,
  SalesChartResponse,
  InventoryResponse,
  RestockPlanResponse,
  Product,
  Customer,
  Transaction,
  SalesRecap,
} from "../types/index";

// ─── LOCAL STORAGE KEYS ──────────────────────────────────────────────────────
const STORAGE_PRODUCTS_KEY = "zura_products";
const STORAGE_CUSTOMERS_KEY = "zura_customers";
const STORAGE_TRANSACTIONS_KEY = "zura_transactions";
const STORAGE_RECAPS_KEY = "zura_recaps";

// Helper delay
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const networkDelay = (): Promise<void> => delay(150 + Math.random() * 150);

// ─── INITIALIZATION LOGIC ────────────────────────────────────────────────────

export function initializeDatabase() {
  if (!localStorage.getItem(STORAGE_PRODUCTS_KEY)) {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_CUSTOMERS_KEY)) {
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_TRANSACTIONS_KEY)) {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_RECAPS_KEY)) {
    localStorage.setItem(STORAGE_RECAPS_KEY, JSON.stringify([]));
  }
}

// Call initialization immediately
initializeDatabase();

// ─── PUBLIC FETCH OPERATIONS (REACT QUERY INTERFACES) ───────────────────────

/** Fetches the KPI summary card data. */
export async function fetchKpiSummary(): Promise<KpiSummaryResponse> {
  await networkDelay();
  initializeDatabase();

  const products: Product[] = JSON.parse(
    localStorage.getItem(STORAGE_PRODUCTS_KEY) || "[]",
  );
  const recaps: SalesRecap[] = JSON.parse(
    localStorage.getItem(STORAGE_RECAPS_KEY) || "[]",
  );
  const transactions: Transaction[] = JSON.parse(
    localStorage.getItem(STORAGE_TRANSACTIONS_KEY) || "[]",
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecaps = recaps.filter((r) => r.date === todayStr);
  const todayTransactions = transactions.filter((t) => t.date === todayStr);

  const todayRevenueVal =
    todayRecaps.reduce((acc, r) => acc + r.totalAmount, 0) +
    todayTransactions.reduce((acc, t) => acc + t.amount, 0);

  const todayTransactionsCount = todayRecaps.length + todayTransactions.length;
  const stockAlertProducts = products.filter(
    (p) => p.stockCount <= (p.minStock || 10),
  );

  return {
    todayRevenue: {
      value: todayRevenueVal,
      currency: "IDR",
      trend: "up",
      trendPercent: 0,
      sparkline: [0, 0, 0, 0, 0, 0, todayRevenueVal],
    },
    todayTransactions: todayTransactionsCount,
    bestSellerProduct: {
      name: "-",
      unitsSold: 0,
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
  return {
    historical: [],
    predicted: [],
  };
}

/** Fetches the full product inventory list. */
export async function fetchInventory(): Promise<InventoryResponse> {
  await networkDelay();
  initializeDatabase();
  const products: Product[] = JSON.parse(
    localStorage.getItem(STORAGE_PRODUCTS_KEY) || "[]",
  );

  const processedProducts = products.map((p) => ({
    ...p,
    status:
      p.stockCount <= (p.minStock || 10)
        ? ("low_stock" as const)
        : ("healthy" as const),
  }));

  return {
    products: processedProducts,
    lastUpdated: new Date().toISOString(),
  };
}

/** Fetches the weekly AI-generated restock plan. */
export async function fetchRestockPlan(): Promise<RestockPlanResponse> {
  await networkDelay();
  return {
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };
}

// ─── CUSTOM DATABASE OPERATIONS (DIRECT CRUD WITH STORAGE SYNC) ─────────────

/** Retrieve products synchronously */
export function getLocalProducts(): Product[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY) || "[]");
}

/** Save products synchronously */
export function saveLocalProducts(products: Product[]) {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

/** Retrieve customers synchronously */
export function getLocalCustomers(): Customer[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_CUSTOMERS_KEY) || "[]");
}

/** Save customers synchronously */
export function saveLocalCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
}

/** Retrieve transactions synchronously */
export function getLocalTransactions(): Transaction[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_TRANSACTIONS_KEY) || "[]");
}

/** Save transactions synchronously */
export function saveLocalTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

/** Retrieve recaps synchronously */
export function getLocalRecaps(): SalesRecap[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(STORAGE_RECAPS_KEY) || "[]");
}

/** Save recaps synchronously */
export function saveLocalRecaps(recaps: SalesRecap[]) {
  localStorage.setItem(STORAGE_RECAPS_KEY, JSON.stringify(recaps));
}

/** Add a new sales recap record, deducting stock */
export function addRecap(recap: SalesRecap) {
  const products = getLocalProducts();
  const recaps = getLocalRecaps();

  if (recap.items) {
    recap.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        product.stockCount = Math.max(0, product.stockCount - item.qty);
        product.status =
          product.stockCount <= (product.minStock || 10)
            ? "low_stock"
            : "healthy";
      }
    });
    saveLocalProducts(products);
  }

  recaps.unshift(recap);
  saveLocalRecaps(recaps);
}

/** Import recap simulation for CSV/Excel upload */
export async function importRecapsFromFile(
  source: "Shopee" | "Tokopedia" | "TikTok Shop",
) {
  await delay(1200);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const recapId = `RCP-IMP-${Math.floor(100 + Math.random() * 900)}`;

  const importedRecap: SalesRecap = {
    id: recapId,
    date: dateStr,
    source,
    unitsSold: 0,
    totalAmount: 0,
    adminFee: 0,
    status: "Tersinkronisasi",
    items: [],
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
