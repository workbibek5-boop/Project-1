/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ClothingProduct,
  ProductVariant,
  CashSale,
  PurchaseRecord,
  StockMovement,
  AppSettings,
  WholesaleCustomer,
  WholesaleSupplier,
  WholesaleExpense,
  WholesaleCategory,
  SerialUserAccount,
  CentralOrder,
  BillingCounter,
  CustomerCategory,
  SerialCounterRecord,
  clothingDb,
} from '../db/indexedDb';
import { INITIAL_CLOTHING_PRODUCTS } from '../data/clothingSeed';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export interface BusinessMetrics {
  totalInventoryPieces: number;
  totalInventoryCostValuation: number;
  totalInventoryRetailValuation: number;
  lowStockCount: number;
  todaySalesCount: number;
  todaySalesTotal: number;
  todayExpensesTotal: number;
  todayGrossProfit: number;
  todayNetProfit: number;
}

interface ClothingWholesaleContextType {
  // Database & Offline status
  isOnline: boolean;
  isDbReady: boolean;
  dbError: string | null;

  // Data collections
  products: ClothingProduct[];
  sales: CashSale[];
  purchases: PurchaseRecord[];
  stockMovements: StockMovement[];
  customers: WholesaleCustomer[];
  suppliers: WholesaleSupplier[];
  expenses: WholesaleExpense[];
  categories: WholesaleCategory[];
  serialUsers: SerialUserAccount[];
  centralOrders: CentralOrder[];
  billingCounters: BillingCounter[];
  settings: AppSettings;
  metrics: BusinessMetrics;

  // Actions
  refreshAllData: () => Promise<void>;
  saveProduct: (product: ClothingProduct) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Stock adjustments
  adjustVariantStock: (
    productId: string,
    variantId: string,
    delta: number,
    type: 'adjustment' | 'damaged' | 'purchase_return',
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Purchases
  recordPurchase: (
    purchase: Omit<PurchaseRecord, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean; purchase?: PurchaseRecord; error?: string }>;

  // Cash POS Sales
  processCashSale: (
    saleData: Omit<CashSale, 'id' | 'timestamp' | 'status'>
  ) => Promise<{ success: boolean; sale?: CashSale; error?: string }>;
  
  // Refund / Reversal
  reverseSale: (saleId: string, reason: string) => Promise<{ success: boolean; error?: string }>;

  // Customers, Suppliers, Expenses, Categories
  saveCustomer: (customer: WholesaleCustomer) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  createCustomerWithSerial: (data: {
    name: string;
    category: CustomerCategory;
    shortCode?: string;
    phone?: string;
    notes?: string;
    businessName?: string;
    city?: string;
    address?: string;
  }) => Promise<{ customer: WholesaleCustomer; serialNumber: string }>;
  setCustomerAccessStatus: (customerId: string, status: 'active' | 'inactive') => Promise<void>;
  updateCbfAmounts: (amounts: { C?: number | null; B?: number | null; F?: number | null }) => Promise<AppSettings>;
  getCbfAmounts: () => Promise<{ C: number | null; B: number | null; F: number | null }>;

  saveSupplier: (supplier: WholesaleSupplier) => Promise<{ success: boolean; error?: string }>;
  deleteSupplier: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveExpense: (expense: WholesaleExpense) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveCategory: (category: WholesaleCategory) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Central Orders & Workstations
  saveCentralOrder: (order: CentralOrder) => Promise<void>;
  atomicBillCentralOrder: (
    orderId: string,
    billingDetails: { staffName: string; counterId: string; gstPercent?: number }
  ) => Promise<{ success: boolean; invoiceNumber?: string; order?: CentralOrder; error?: string }>;
  atomicReverseCentralOrder: (
    orderId: string,
    reason: string,
    staffName: string,
    counterId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  saveBillingCounter: (counter: BillingCounter) => Promise<void>;

  // Settings & Security
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isAppLocked: boolean;
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setOwnerPin: (pin: string) => Promise<void>;
  removeOwnerPin: () => Promise<void>;

  // Backup & Restore
  exportJsonBackup: () => Promise<void>;
  restoreJsonBackup: (jsonContent: string) => Promise<{ success: boolean; error?: string }>;
  exportProductsCsv: () => void;
  exportSalesCsv: () => void;
  exportInventoryCsv: () => void;
}

const ClothingWholesaleContext = createContext<ClothingWholesaleContextType | null>(null);

// Helper for SHA-256 PIN hashing using native Web Crypto API (offline-safe, no external dependency)
async function hashPin(pin: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const ClothingWholesaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [products, setProducts] = useState<ClothingProduct[]>([]);
  const [sales, setSales] = useState<CashSale[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [suppliers, setSuppliers] = useState<WholesaleSupplier[]>([]);
  const [expenses, setExpenses] = useState<WholesaleExpense[]>([]);
  const [categories, setCategories] = useState<WholesaleCategory[]>([]);
  const [serialUsers, setSerialUsers] = useState<SerialUserAccount[]>([]);
  const [centralOrders, setCentralOrders] = useState<CentralOrder[]>([]);
  const [billingCounters, setBillingCounters] = useState<BillingCounter[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'main',
    businessName: 'My Wholesale Business',
    tradingName: 'Himalayan Garment Wholesale',
    panVatNumber: '601234567',
    address: 'New Road Garment Hub, Kathmandu, Nepal',
    phone: '+977-1-4220000',
    email: 'sales@example.com',
    currency: 'NPR',
    currencySymbol: 'रू',
    invoicePrefix: 'INV-2026-',
    invoiceFooterNote: 'Thank you for your business. Wholesale goods sold in cash terms.',
    taxEnabled: true,
    defaultVatPercent: 13,
    allowNegativeStock: false,
    defaultLowStockThreshold: 15,
    thermalPrinterWidth: '80mm',
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);

  // Initialize IndexedDB and seed initial data if empty
  const initDatabase = useCallback(async () => {
    try {
      // 1. Seed initial clothing products & additional modules if DB is brand new
      await clothingDb.seedInitialDataIfEmpty(INITIAL_CLOTHING_PRODUCTS);
      await clothingDb.seedAdditionalModulesIfEmpty();

      // 2. Load all records from IndexedDB
      const [prods, sls, purs, movs, stgs, custs, supps, exps, cats, sUsers, cOrders, bCounters] = await Promise.all([
        clothingDb.getAllProducts(),
        clothingDb.getAllSales(),
        clothingDb.getAllPurchases(),
        clothingDb.getAllStockMovements(),
        clothingDb.getSettings(),
        clothingDb.getAllCustomers(),
        clothingDb.getAllSuppliers(),
        clothingDb.getAllExpenses(),
        clothingDb.getAllCategories(),
        clothingDb.getAllSerialUsers(),
        clothingDb.getAllCentralOrders(),
        clothingDb.getAllBillingCounters(),
      ]);

      setProducts(prods);
      setSales(sls);
      setPurchases(purs);
      setStockMovements(movs);
      setSettings(stgs);
      setCustomers(custs);
      setSuppliers(supps);
      setExpenses(exps);
      setCategories(cats);
      setSerialUsers(sUsers);
      setCentralOrders(cOrders);
      setBillingCounters(bCounters);

      // If owner PIN is enabled, default to locked on load
      if (stgs.ownerPinHash) {
        setIsAppLocked(true);
      }

      setIsDbReady(true);
    } catch (err: any) {
      console.error('IndexedDB initialization failed:', err);
      setDbError(err?.message || 'Failed to initialize local IndexedDB storage');
      setIsDbReady(true);
    }
  }, []);

  useEffect(() => {
    initDatabase();
  }, [initDatabase]);

  const refreshAllData = async () => {
    try {
      const [prods, sls, purs, movs, stgs, custs, supps, exps, cats, sUsers, cOrders, bCounters] = await Promise.all([
        clothingDb.getAllProducts(),
        clothingDb.getAllSales(),
        clothingDb.getAllPurchases(),
        clothingDb.getAllStockMovements(),
        clothingDb.getSettings(),
        clothingDb.getAllCustomers(),
        clothingDb.getAllSuppliers(),
        clothingDb.getAllExpenses(),
        clothingDb.getAllCategories(),
        clothingDb.getAllSerialUsers(),
        clothingDb.getAllCentralOrders(),
        clothingDb.getAllBillingCounters(),
      ]);
      setProducts(prods);
      setSales(sls);
      setPurchases(purs);
      setStockMovements(movs);
      setSettings(stgs);
      setCustomers(custs);
      setSuppliers(supps);
      setExpenses(exps);
      setCategories(cats);
      setSerialUsers(sUsers);
      setCentralOrders(cOrders);
      setBillingCounters(bCounters);
    } catch (err) {
      console.error('Failed to refresh data from IndexedDB:', err);
    }
  };

  // Products
  const saveProduct = async (product: ClothingProduct) => {
    try {
      await clothingDb.saveProduct(product);
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save product' };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await clothingDb.deleteProduct(id);
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete product' };
    }
  };

  // Stock adjustments
  const adjustVariantStock = async (
    productId: string,
    variantId: string,
    delta: number,
    type: 'adjustment' | 'damaged' | 'purchase_return',
    reason: string
  ) => {
    const res = await clothingDb.recordStockAdjustment(productId, variantId, delta, type, reason);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  // Purchases
  const recordPurchase = async (purchase: Omit<PurchaseRecord, 'id' | 'createdAt'>) => {
    const res = await clothingDb.recordPurchase(purchase);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  // Cash POS Sales
  const processCashSale = async (saleData: Omit<CashSale, 'id' | 'timestamp' | 'status'>) => {
    const res = await clothingDb.processCashSale(saleData, settings.allowNegativeStock);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  // Refund / Reversal
  const reverseSale = async (saleId: string, reason: string) => {
    const res = await clothingDb.reverseSale(saleId, reason);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  // Settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = { ...settings, ...newSettings };
    await clothingDb.saveSettings(updated);
    setSettings(updated);
  };

  // PIN security
  const unlockWithPin = async (pin: string): Promise<boolean> => {
    if (!settings.ownerPinHash) {
      setIsAppLocked(false);
      return true;
    }
    const enteredHash = await hashPin(pin);
    if (enteredHash === settings.ownerPinHash) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  };

  const setOwnerPin = async (pin: string) => {
    const pinHash = await hashPin(pin);
    await updateSettings({ ownerPinHash: pinHash });
  };

  const removeOwnerPin = async () => {
    await updateSettings({ ownerPinHash: undefined });
    setIsAppLocked(false);
  };

  // Export full JSON Backup
  const exportJsonBackup = async () => {
    const backup = await clothingDb.exportFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clothing_wholesale_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update last backup date in settings
    const nowIso = new Date().toISOString();
    await updateSettings({ lastBackupDate: nowIso });
  };

  // Restore from JSON Backup
  const restoreJsonBackup = async (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      const res = await clothingDb.restoreFullBackup(parsed);
      if (res.success) {
        await refreshAllData();
      }
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid JSON content.' };
    }
  };

  // CSV Exports
  const exportProductsCsv = () => {
    const headers = [
      'Product ID',
      'Name',
      'SKU',
      'Barcode',
      'Category',
      'Brand',
      'Supplier',
      'Unit',
      'Purchase Cost (NPR)',
      'Selling Price (NPR)',
      'Total Stock',
      'Variants Count',
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.barcode || ''}"`,
      `"${p.category}"`,
      `"${p.brand}"`,
      `"${p.supplier}"`,
      `"${p.unit}"`,
      p.purchaseCost,
      p.sellingPrice,
      p.totalStock,
      p.variants.length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_catalogue_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportInventoryCsv = () => {
    const headers = [
      'Product Name',
      'Product SKU',
      'Category',
      'Variant SKU',
      'Size',
      'Color',
      'Stock (Pcs/Units)',
      'Low Stock Threshold',
      'Unit Selling Price (NPR)',
      'Stock Valuation (NPR)',
    ];

    const rows: string[] = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        rows.push([
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.sku}"`,
          `"${p.category}"`,
          `"${v.sku}"`,
          `"${v.size}"`,
          `"${v.color}"`,
          v.stock,
          v.lowStockAlert ?? settings.defaultLowStockThreshold,
          p.sellingPrice,
          v.stock * p.sellingPrice,
        ].join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_by_size_color_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalesCsv = () => {
    const headers = [
      'Invoice No',
      'Timestamp',
      'Customer',
      'Total Items',
      'Subtotal (NPR)',
      'Discount (NPR)',
      'VAT (NPR)',
      'Grand Total (NPR)',
      'Cash Received',
      'Change Returned',
      'Status',
    ];

    const rows = sales.map((s) => [
      `"${s.invoiceNumber}"`,
      `"${s.timestamp}"`,
      `"${(s.customerName || 'Walk-in Buyer').replace(/"/g, '""')}"`,
      s.items.reduce((sum, item) => sum + item.quantity, 0),
      s.subtotal,
      s.discountTotal,
      s.taxAmount,
      s.grandTotal,
      s.cashReceived,
      s.changeReturned,
      `"${s.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash_sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Customers (v2)
  const saveCustomer = async (cust: WholesaleCustomer) => {
    try {
      await clothingDb.saveCustomer(cust);
      const updated = await clothingDb.getAllCustomers();
      setCustomers(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save customer' };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await clothingDb.deleteCustomer(id);
      const updated = await clothingDb.getAllCustomers();
      setCustomers(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete customer' };
    }
  };

  const createCustomerWithSerial = async (data: {
    name: string;
    category: CustomerCategory;
    shortCode?: string;
    phone?: string;
    notes?: string;
    businessName?: string;
    city?: string;
    address?: string;
  }) => {
    const result = await clothingDb.createCustomerWithSerial(data);
    const [updatedCusts, updatedUsers] = await Promise.all([
      clothingDb.getAllCustomers(),
      clothingDb.getAllSerialUsers(),
    ]);
    setCustomers(updatedCusts);
    setSerialUsers(updatedUsers);
    return result;
  };

  const setCustomerAccessStatus = async (customerId: string, status: 'active' | 'inactive') => {
    await clothingDb.setCustomerAccessStatus(customerId, status);
    const [updatedCusts, updatedUsers] = await Promise.all([
      clothingDb.getAllCustomers(),
      clothingDb.getAllSerialUsers(),
    ]);
    setCustomers(updatedCusts);
    setSerialUsers(updatedUsers);
  };

  const updateCbfAmounts = async (amounts: { C?: number | null; B?: number | null; F?: number | null }) => {
    const updated = await clothingDb.updateCbfAmounts(amounts);
    setSettings(updated);
    return updated;
  };

  const getCbfAmounts = async () => {
    return clothingDb.getCbfAmounts();
  };

  // Central Orders & Workstations
  const saveCentralOrder = async (order: CentralOrder) => {
    await clothingDb.saveCentralOrder(order);
    const updated = await clothingDb.getAllCentralOrders();
    setCentralOrders(updated);
  };

  const atomicBillCentralOrder = async (
    orderId: string,
    billingDetails: { staffName: string; counterId: string; gstPercent?: number }
  ) => {
    const res = await clothingDb.atomicBillCentralOrder(orderId, billingDetails);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  const atomicReverseCentralOrder = async (
    orderId: string,
    reason: string,
    staffName: string,
    counterId?: string
  ) => {
    const res = await clothingDb.atomicReverseCentralOrder(orderId, reason, staffName, counterId);
    if (res.success) {
      await refreshAllData();
    }
    return res;
  };

  const saveBillingCounter = async (counter: BillingCounter) => {
    await clothingDb.saveBillingCounter(counter);
    const updated = await clothingDb.getAllBillingCounters();
    setBillingCounters(updated);
  };

  // Suppliers (v2)
  const saveSupplier = async (supp: WholesaleSupplier) => {
    try {
      await clothingDb.saveSupplier(supp);
      const updated = await clothingDb.getAllSuppliers();
      setSuppliers(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save supplier' };
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await clothingDb.deleteSupplier(id);
      const updated = await clothingDb.getAllSuppliers();
      setSuppliers(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete supplier' };
    }
  };

  // Expenses (v2)
  const saveExpense = async (exp: WholesaleExpense) => {
    try {
      await clothingDb.saveExpense(exp);
      const updated = await clothingDb.getAllExpenses();
      setExpenses(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save expense' };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await clothingDb.deleteExpense(id);
      const updated = await clothingDb.getAllExpenses();
      setExpenses(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete expense' };
    }
  };

  // Categories (v2)
  const saveCategory = async (cat: WholesaleCategory) => {
    try {
      await clothingDb.saveCategory(cat);
      const updated = await clothingDb.getAllCategories();
      setCategories(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save category' };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await clothingDb.deleteCategory(id);
      const updated = await clothingDb.getAllCategories();
      setCategories(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete category' };
    }
  };

  // Memoized Business Metrics (prevents duplicate calculations across tabs)
  const metrics = useMemo<BusinessMetrics>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    let totalPieces = 0;
    let costValuation = 0;
    let retailValuation = 0;
    let lowStock = 0;
    const threshold = settings.defaultLowStockThreshold || 15;

    for (const p of products) {
      if (!p.isActive) continue;
      for (const v of p.variants) {
        const stock = Number(v.stock) || 0;
        totalPieces += stock;
        costValuation += stock * (Number(p.purchaseCost) || 0);
        retailValuation += stock * (Number(p.sellingPrice) || 0);
        const alertLimit = v.lowStockAlert !== undefined ? v.lowStockAlert : threshold;
        if (stock <= alertLimit) {
          lowStock++;
        }
      }
    }

    let todaySalesCount = 0;
    let todaySalesTotal = 0;
    let todaySalesCogs = 0;

    for (const s of sales) {
      if (s.status !== 'completed') continue;
      if (s.timestamp.slice(0, 10) === todayStr) {
        todaySalesCount++;
        todaySalesTotal += Number(s.grandTotal) || 0;
        for (const item of s.items) {
          todaySalesCogs += (Number(item.purchaseCostAtSale) || 0) * item.quantity;
        }
      }
    }

    let todayExpensesTotal = 0;
    for (const e of expenses) {
      if (e.date.slice(0, 10) === todayStr) {
        todayExpensesTotal += Number(e.amount) || 0;
      }
    }

    const todayGrossProfit = todaySalesTotal - todaySalesCogs;
    const todayNetProfit = todayGrossProfit - todayExpensesTotal;

    return {
      totalInventoryPieces: totalPieces,
      totalInventoryCostValuation: costValuation,
      totalInventoryRetailValuation: retailValuation,
      lowStockCount: lowStock,
      todaySalesCount,
      todaySalesTotal,
      todayExpensesTotal,
      todayGrossProfit,
      todayNetProfit,
    };
  }, [products, sales, expenses, settings.defaultLowStockThreshold]);

  return (
    <ClothingWholesaleContext.Provider
      value={{
        isOnline,
        isDbReady,
        dbError,
        products,
        sales,
        purchases,
        stockMovements,
        customers,
        suppliers,
        expenses,
        categories,
        serialUsers,
        centralOrders,
        billingCounters,
        settings,
        metrics,
        refreshAllData,
        saveProduct,
        deleteProduct,
        adjustVariantStock,
        recordPurchase,
        processCashSale,
        reverseSale,
        saveCustomer,
        deleteCustomer,
        createCustomerWithSerial,
        setCustomerAccessStatus,
        updateCbfAmounts,
        getCbfAmounts,
        saveCentralOrder,
        atomicBillCentralOrder,
        atomicReverseCentralOrder,
        saveBillingCounter,
        saveSupplier,
        deleteSupplier,
        saveExpense,
        deleteExpense,
        saveCategory,
        deleteCategory,
        updateSettings,
        isAppLocked,
        lockApp: () => setIsAppLocked(true),
        unlockWithPin,
        setOwnerPin,
        removeOwnerPin,
        exportJsonBackup,
        restoreJsonBackup,
        exportProductsCsv,
        exportSalesCsv,
        exportInventoryCsv,
      }}
    >
      {children}
    </ClothingWholesaleContext.Provider>
  );
};

export const useClothingWholesale = () => {
  const context = useContext(ClothingWholesaleContext);
  if (!context) {
    throw new Error('useClothingWholesale must be used within a ClothingWholesaleProvider');
  }
  return context;
};
