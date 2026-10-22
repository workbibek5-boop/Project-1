/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALL_FASHION_CATEGORIES } from '../data/fashionCategories';
import {
  SerialUserAccount,
  StorefrontWishlistItem,
  CentralOrder,
  CentralOrderItem,
  CentralOrderAuditEntry,
  BillingCounter,
  CustomerCategory,
} from '../types';

export type {
  SerialUserAccount,
  StorefrontWishlistItem,
  CentralOrder,
  CentralOrderItem,
  CentralOrderAuditEntry,
  BillingCounter,
  CustomerCategory,
};

// ============================================================================
// OFFLINE-FIRST & CENTRAL SHARED DATABASE REPOSITORY FOR CLOTHING WHOLESALE
// ============================================================================

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${password}::clothing_salt::${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatSerialNumber(category: CustomerCategory, num: number): string {
  if (num <= 9999) {
    return `${category}-${String(num).padStart(4, '0')}`;
  }
  return `${category}-${num}`;
}

export function generateUserNumber(category: CustomerCategory): string {
  // Fallback helper, sequential generator in class is preferred
  return formatSerialNumber(category, Math.floor(1000 + Math.random() * 9000));
}

export interface ProductVariant {
  id: string;
  size: string; // e.g., 'XS', 'S', 'M', 'L', 'XL', 'XXL', '32', '34', 'Custom'
  color: string; // e.g., 'Black', 'Navy', 'Olive', 'Maroon'
  design?: string; // Optional pattern or print variation
  sku: string; // e.g., 'SHT-OXF-BLK-M'
  barcode?: string;
  stock: number;
  lowStockAlert?: number;
}

export interface ClothingProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  department?: string; // 'Formal & Western Wear' | 'Women’s Ethnic Wear' | 'Dresses & Fashion' | 'Men’s Traditional Wear' | 'Textiles & Fabrics'
  category: string;
  brand: string;
  supplier: string;
  manufacturer?: string; // Manufacturer, company, or production-house details
  unit: 'pcs' | 'packs' | 'cartons' | 'metres' | 'rolls';
  packSizePieces?: number; // e.g., 10 or 12 pcs per pack if sold as pack
  purchaseCost: number; // Cost per unit in NPR
  sellingPrice: number; // Wholesale selling price per unit in NPR
  variants: ProductVariant[];
  totalStock: number;
  fabric?: string; // Fabric / material e.g., 'Pure Mulberry Silk', 'Georgette', '100% Cotton'
  designStyleCode?: string; // Design or style code e.g. 'BDL-ZAR-01'
  collectionOccasion?: string; // Collection or occasion e.g. 'Bridal & Trousseau', 'Wedding 2026'
  gstRate?: number; // Configurable GST rate percentage (e.g., 13)
  imageUrl?: string;
  authorizedCategories?: CustomerCategory[]; // Categories authorized to view/order in storefront (C, B, F)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  type:
    | 'purchase'
    | 'cash_sale'
    | 'sale_refund'
    | 'order_billing'
    | 'order_reversal'
    | 'adjustment'
    | 'damaged'
    | 'purchase_return';
  quantityDelta: number; // e.g., -5 for sale, +10 for purchase
  stockBefore: number;
  stockAfter: number;
  referenceId: string; // Invoice number, Purchase ID, or Reason
  reason: string;
  timestamp: string;
  billingCounterId?: string;
  performedBy?: string;
}

export interface PurchaseItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseRecord {
  id: string;
  purchaseNumber: string; // e.g. PUR-2026-0001
  supplierName: string;
  supplierPhone?: string;
  supplierBillNo?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface SaleLineItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discount: number; // flat discount or per item
  lineTotal: number;
  purchaseCostAtSale: number; // to calculate real gross profit offline
}

export interface CashSale {
  id: string;
  invoiceNumber: string; // e.g., INV-2026-0001
  timestamp: string;
  items: SaleLineItem[];
  subtotal: number;
  discountTotal: number;
  taxRatePercent: number;
  taxAmount: number;
  grandTotal: number;
  cashReceived: number;
  changeReturned: number;
  paymentMethod: 'cash';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerCategory?: CustomerCategory;
  customerSerial?: string;
  status: 'completed' | 'cancelled' | 'refunded';
  reversalReason?: string;
  reversedAt?: string;
  notes?: string;
}

export interface AppSettings {
  id: 'main';
  businessName: string;
  tradingName: string;
  panVatNumber: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceFooterNote: string;
  taxEnabled: boolean;
  defaultVatPercent: number;
  allowNegativeStock: boolean;
  defaultLowStockThreshold: number;
  thermalPrinterWidth: '58mm' | '80mm';
  ownerPinHash?: string; // Optional SHA-256 local app lock
  isAppLocked?: boolean;
  lastBackupDate?: string;
  cbfAmounts?: {
    C?: number | null;
    B?: number | null;
    F?: number | null;
  };
}

export interface WholesaleCustomer {
  id: string; // Permanent unique customer ID
  name: string; // Required customer identifying name
  category: CustomerCategory; // Required 'C' | 'B' | 'F'
  serialNumber: string; // Sequential serial number, e.g. 'C-0001'
  shortCode?: string; // Optional admin short code
  phone?: string;
  email?: string;
  panVat?: string;
  city?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  registrationDate: string;
  businessName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SerialCounterRecord {
  category: CustomerCategory;
  lastNumber: number;
  updatedAt: string;
}

export interface WholesaleSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  category: string; // e.g. "Fabric Mill", "Ready-made Garments", "Trims & Zippers"
  notes?: string;
  createdAt: string;
}

export interface WholesaleExpense {
  id: string;
  date: string;
  category: string; // "Shop Rent", "Cargo / Freight", "Packaging Materials", "Staff Tea & Meals", "Electricity & Utilities", "Miscellaneous"
  amount: number;
  description: string;
  voucherNumber?: string;
  paymentMethod: 'cash';
  createdAt: string;
}

export interface WholesaleCategory {
  id: string;
  name: string;
  code: string;
  department?: string; // 'Formal & Western Wear' | 'Women’s Ethnic Wear' | 'Dresses & Fashion' | 'Men’s Traditional Wear' | 'Textiles & Fabrics'
  description?: string;
  createdAt: string;
}

const DB_NAME = 'ClothingWholesaleDB';
const DB_VERSION = 4;

export class ClothingDatabase {
  private db: IDBDatabase | null = null;
  private isConnecting: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.isConnecting) return this.isConnecting;

    this.isConnecting = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by_category', 'category', { unique: false });
          productStore.createIndex('by_sku', 'sku', { unique: false });
          productStore.createIndex('by_name', 'name', { unique: false });
        }

        // 2. Purchases store
        if (!db.objectStoreNames.contains('purchases')) {
          const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purchaseStore.createIndex('by_number', 'purchaseNumber', { unique: true });
          purchaseStore.createIndex('by_date', 'purchaseDate', { unique: false });
        }

        // 3. Cash Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('by_invoice', 'invoiceNumber', { unique: true });
          salesStore.createIndex('by_date', 'timestamp', { unique: false });
          salesStore.createIndex('by_status', 'status', { unique: false });
        }

        // 4. Stock Movements store
        if (!db.objectStoreNames.contains('stockMovements')) {
          const movementStore = db.createObjectStore('stockMovements', { keyPath: 'id' });
          movementStore.createIndex('by_product', 'productId', { unique: false });
          movementStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        }

        // 5. Settings store
        if (!db.objectStoreNames.contains('appSettings')) {
          db.createObjectStore('appSettings', { keyPath: 'id' });
        }

        // 6. Customers store (v2)
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by_name', 'name', { unique: false });
          customerStore.createIndex('by_phone', 'phone', { unique: false });
          customerStore.createIndex('by_serial', 'serialNumber', { unique: false });
          customerStore.createIndex('by_category', 'category', { unique: false });
        } else {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) {
            const customerStore = tx.objectStore('customers');
            if (!customerStore.indexNames.contains('by_serial')) {
              customerStore.createIndex('by_serial', 'serialNumber', { unique: false });
            }
            if (!customerStore.indexNames.contains('by_category')) {
              customerStore.createIndex('by_category', 'category', { unique: false });
            }
          }
        }

        // 7. Suppliers store (v2)
        if (!db.objectStoreNames.contains('suppliers')) {
          const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id' });
          supplierStore.createIndex('by_name', 'name', { unique: false });
        }

        // 8. Expenses store (v2)
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('by_date', 'date', { unique: false });
          expenseStore.createIndex('by_category', 'category', { unique: false });
        }

        // 9. Categories store (v2)
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // 10. Serial Users store (v3) - Unique User Number / Serial Code login with hashed passwords
        if (!db.objectStoreNames.contains('serialUsers')) {
          const userStore = db.createObjectStore('serialUsers', { keyPath: 'id' });
          userStore.createIndex('by_userNumber', 'userNumber', { unique: true });
          userStore.createIndex('by_category', 'category', { unique: false });
          userStore.createIndex('by_phone', 'phone', { unique: false });
          userStore.createIndex('by_status', 'status', { unique: false });
        }

        // 11. Central Orders store (v3) - Central order review, approval, tracking & atomic billing
        if (!db.objectStoreNames.contains('centralOrders')) {
          const orderStore = db.createObjectStore('centralOrders', { keyPath: 'id' });
          orderStore.createIndex('by_orderNumber', 'orderNumber', { unique: true });
          orderStore.createIndex('by_userNumber', 'userNumber', { unique: false });
          orderStore.createIndex('by_category', 'customerCategory', { unique: false });
          orderStore.createIndex('by_status', 'status', { unique: false });
          orderStore.createIndex('by_date', 'submissionDate', { unique: false });
        }

        // 12. Wishlists store (v3) - Private per-user saved products
        if (!db.objectStoreNames.contains('wishlists')) {
          const wishlistStore = db.createObjectStore('wishlists', { keyPath: 'id' });
          wishlistStore.createIndex('by_userNumber', 'userNumber', { unique: false });
          wishlistStore.createIndex('by_product', 'productId', { unique: false });
        }

        // 13. Billing Workstations / Counters (v3) - Shared central backend counters & terminals
        if (!db.objectStoreNames.contains('billingCounters')) {
          const counterStore = db.createObjectStore('billingCounters', { keyPath: 'id' });
          counterStore.createIndex('by_code', 'code', { unique: true });
        }

        // 14. Serial Counters store (v4) - Atomic sequential counters for C, B, F categories
        if (!db.objectStoreNames.contains('serialCounters')) {
          db.createObjectStore('serialCounters', { keyPath: 'category' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.isConnecting;
  }

  // --------------------------------------------------------------------------
  // PRODUCTS & VARIANTS
  // --------------------------------------------------------------------------

  async getAllProducts(): Promise<ClothingProduct[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: string): Promise<ClothingProduct | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProduct(product: ClothingProduct): Promise<void> {
    const db = await this.getDb();
    // Recompute totalStock from variants
    const totalStock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const updated: ClothingProduct = {
      ...product,
      totalStock,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // ATOMIC CASH SALE & INVENTORY REDUCTION
  // --------------------------------------------------------------------------

  async processCashSale(
    saleData: Omit<CashSale, 'id' | 'timestamp' | 'status'>,
    allowNegativeStock: boolean = false
  ): Promise<{ success: boolean; sale?: CashSale; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();
    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return new Promise((resolve) => {
      const tx = db.transaction(['products', 'sales', 'stockMovements'], 'readwrite');
      const productStore = tx.objectStore('products');
      const salesStore = tx.objectStore('sales');
      const movementStore = tx.objectStore('stockMovements');

      const sale: CashSale = {
        ...saleData,
        id: saleId,
        timestamp,
        status: 'completed',
      };

      // Step 1: Pre-fetch and check all products involved
      const productRequests: Promise<{ product: ClothingProduct; item: SaleLineItem }>[] = [];

      for (const item of sale.items) {
        const pReq = new Promise<{ product: ClothingProduct; item: SaleLineItem }>((res, rej) => {
          const req = productStore.get(item.productId);
          req.onsuccess = () => {
            if (!req.result) {
              rej(new Error(`Product "${item.productName}" not found in database.`));
            } else {
              res({ product: req.result, item });
            }
          };
          req.onerror = () => rej(req.error);
        });
        productRequests.push(pReq);
      }

      Promise.all(productRequests)
        .then((resolvedItems) => {
          // Verify stock for all items BEFORE mutating anything
          for (const { product, item } of resolvedItems) {
            const variant = product.variants.find((v) => v.id === item.variantId);
            if (!variant) {
              tx.abort();
              resolve({
                success: false,
                error: `Variant (${item.size} / ${item.color}) for "${product.name}" not found.`,
              });
              return;
            }

            if (!allowNegativeStock && variant.stock < item.quantity) {
              tx.abort();
              resolve({
                success: false,
                error: `Insufficient stock for "${product.name}" (${item.size} / ${item.color}). Requested: ${item.quantity}, Available: ${variant.stock}`,
              });
              return;
            }
          }

          // Step 2: Mutate stock and write movements
          const updatedProductsMap = new Map<string, ClothingProduct>();

          for (const { product, item } of resolvedItems) {
            const currentProd = updatedProductsMap.get(product.id) || product;
            const variantIndex = currentProd.variants.findIndex((v) => v.id === item.variantId);
            const variant = currentProd.variants[variantIndex];

            const stockBefore = variant.stock;
            const stockAfter = stockBefore - item.quantity;

            const updatedVariant: ProductVariant = {
              ...variant,
              stock: stockAfter,
            };

            const updatedVariants = [...currentProd.variants];
            updatedVariants[variantIndex] = updatedVariant;

            const updatedProduct: ClothingProduct = {
              ...currentProd,
              variants: updatedVariants,
              totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
              updatedAt: timestamp,
            };

            updatedProductsMap.set(product.id, updatedProduct);

            // Record stock movement
            const movement: StockMovement = {
              id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              type: 'cash_sale',
              quantityDelta: -item.quantity,
              stockBefore,
              stockAfter,
              referenceId: sale.invoiceNumber,
              reason: `Cash Sale Invoice #${sale.invoiceNumber}`,
              timestamp,
            };
            movementStore.put(movement);
          }

          // Save all updated products
          for (const p of updatedProductsMap.values()) {
            productStore.put(p);
          }

          // Save Sale Record
          salesStore.put(sale);
        })
        .catch((err) => {
          tx.abort();
          resolve({ success: false, error: err.message || 'Database error during sale processing' });
        });

      tx.oncomplete = () => {
        resolve({ success: true, sale });
      };

      tx.onerror = () => {
        resolve({
          success: false,
          error: tx.error?.message || 'Transaction aborted or failed.',
        });
      };
    });
  }

  // --------------------------------------------------------------------------
  // ATOMIC SALE REVERSAL / REFUND (RESTORES STOCK)
  // --------------------------------------------------------------------------

  async reverseSale(
    saleId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();

    return new Promise((resolve) => {
      const tx = db.transaction(['products', 'sales', 'stockMovements'], 'readwrite');
      const salesStore = tx.objectStore('sales');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('stockMovements');

      const saleReq = salesStore.get(saleId);

      saleReq.onsuccess = () => {
        const sale: CashSale = saleReq.result;
        if (!sale) {
          tx.abort();
          resolve({ success: false, error: 'Sale record not found.' });
          return;
        }

        if (sale.status !== 'completed') {
          tx.abort();
          resolve({
            success: false,
            error: `Sale has already been marked as ${sale.status}.`,
          });
          return;
        }

        // Update sale record
        sale.status = 'refunded';
        sale.reversalReason = reason;
        sale.reversedAt = timestamp;
        salesStore.put(sale);

        // Restore stock for all items
        for (const item of sale.items) {
          const prodReq = productStore.get(item.productId);
          prodReq.onsuccess = () => {
            const product: ClothingProduct = prodReq.result;
            if (product) {
              const vIdx = product.variants.findIndex((v) => v.id === item.variantId);
              if (vIdx !== -1) {
                const variant = product.variants[vIdx];
                const stockBefore = variant.stock;
                const stockAfter = stockBefore + item.quantity;

                const updatedVariant = { ...variant, stock: stockAfter };
                const updatedVariants = [...product.variants];
                updatedVariants[vIdx] = updatedVariant;

                const updatedProduct: ClothingProduct = {
                  ...product,
                  variants: updatedVariants,
                  totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
                  updatedAt: timestamp,
                };
                productStore.put(updatedProduct);

                // Stock movement log
                const movement: StockMovement = {
                  id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  productId: product.id,
                  variantId: variant.id,
                  productName: product.name,
                  sku: variant.sku,
                  size: variant.size,
                  color: variant.color,
                  type: 'sale_refund',
                  quantityDelta: +item.quantity,
                  stockBefore,
                  stockAfter,
                  referenceId: sale.invoiceNumber,
                  reason: `Sale Reversal: ${reason}`,
                  timestamp,
                };
                movementStore.put(movement);
              }
            }
          };
        }
      };

      tx.oncomplete = () => resolve({ success: true });
      tx.onerror = () => resolve({ success: false, error: tx.error?.message || 'Reversal failed.' });
    });
  }

  // --------------------------------------------------------------------------
  // ATOMIC STOCK PURCHASE & STOCK ADJUSTMENT
  // --------------------------------------------------------------------------

  async recordPurchase(
    purchase: Omit<PurchaseRecord, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; purchase?: PurchaseRecord; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();
    const purchaseId = `pur-${Date.now()}`;

    return new Promise((resolve) => {
      const tx = db.transaction(['products', 'purchases', 'stockMovements'], 'readwrite');
      const purchaseStore = tx.objectStore('purchases');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('stockMovements');

      const fullPurchase: PurchaseRecord = {
        ...purchase,
        id: purchaseId,
        createdAt: timestamp,
      };

      purchaseStore.put(fullPurchase);

      // Increment stock for each item
      for (const item of purchase.items) {
        const prodReq = productStore.get(item.productId);
        prodReq.onsuccess = () => {
          const product: ClothingProduct = prodReq.result;
          if (product) {
            const vIdx = product.variants.findIndex((v) => v.id === item.variantId);
            if (vIdx !== -1) {
              const variant = product.variants[vIdx];
              const stockBefore = variant.stock;
              const stockAfter = stockBefore + item.quantity;

              const updatedVariant = { ...variant, stock: stockAfter };
              const updatedVariants = [...product.variants];
              updatedVariants[vIdx] = updatedVariant;

              const updatedProduct: ClothingProduct = {
                ...product,
                variants: updatedVariants,
                totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
                updatedAt: timestamp,
              };
              productStore.put(updatedProduct);

              // Movement log
              const movement: StockMovement = {
                id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                productId: product.id,
                variantId: variant.id,
                productName: product.name,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                type: 'purchase',
                quantityDelta: +item.quantity,
                stockBefore,
                stockAfter,
                referenceId: fullPurchase.purchaseNumber,
                reason: `Stock Purchase: ${purchase.supplierName}`,
                timestamp,
              };
              movementStore.put(movement);
            }
          }
        };
      }

      tx.oncomplete = () => resolve({ success: true, purchase: fullPurchase });
      tx.onerror = () => resolve({ success: false, error: tx.error?.message || 'Purchase entry failed.' });
    });
  }

  async recordStockAdjustment(
    productId: string,
    variantId: string,
    delta: number,
    type: 'adjustment' | 'damaged' | 'purchase_return',
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();

    return new Promise((resolve) => {
      const tx = db.transaction(['products', 'stockMovements'], 'readwrite');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('stockMovements');

      const prodReq = productStore.get(productId);
      prodReq.onsuccess = () => {
        const product: ClothingProduct = prodReq.result;
        if (!product) {
          tx.abort();
          resolve({ success: false, error: 'Product not found.' });
          return;
        }

        const vIdx = product.variants.findIndex((v) => v.id === variantId);
        if (vIdx === -1) {
          tx.abort();
          resolve({ success: false, error: 'Variant not found.' });
          return;
        }

        const variant = product.variants[vIdx];
        const stockBefore = variant.stock;
        const stockAfter = stockBefore + delta;

        if (stockAfter < 0) {
          tx.abort();
          resolve({ success: false, error: `Stock cannot become negative (${stockAfter}).` });
          return;
        }

        const updatedVariant = { ...variant, stock: stockAfter };
        const updatedVariants = [...product.variants];
        updatedVariants[vIdx] = updatedVariant;

        const updatedProduct: ClothingProduct = {
          ...product,
          variants: updatedVariants,
          totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
          updatedAt: timestamp,
        };
        productStore.put(updatedProduct);

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          type,
          quantityDelta: delta,
          stockBefore,
          stockAfter,
          referenceId: 'ADJUSTMENT',
          reason,
          timestamp,
        };
        movementStore.put(movement);
      };

      tx.oncomplete = () => resolve({ success: true });
      tx.onerror = () => resolve({ success: false, error: tx.error?.message || 'Adjustment failed.' });
    });
  }

  // --------------------------------------------------------------------------
  // QUERIES FOR SALES, PURCHASES, MOVEMENTS, SETTINGS
  // --------------------------------------------------------------------------

  async getAllSales(): Promise<CashSale[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const request = store.getAll();
      request.onsuccess = () => {
        // Return latest first
        const sales: CashSale[] = request.result || [];
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(sales);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPurchases(): Promise<PurchaseRecord[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('purchases', 'readonly');
      const store = tx.objectStore('purchases');
      const request = store.getAll();
      request.onsuccess = () => {
        const purchases: PurchaseRecord[] = request.result || [];
        purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(purchases);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStockMovements(): Promise<StockMovement[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('stockMovements', 'readonly');
      const store = tx.objectStore('stockMovements');
      const request = store.getAll();
      request.onsuccess = () => {
        const movements: StockMovement[] = request.result || [];
        movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(movements);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<AppSettings> {
    const db = await this.getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('appSettings', 'readonly');
      const store = tx.objectStore('appSettings');
      const request = store.get('main');
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Default settings
          const defaultSettings: AppSettings = {
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
          };
          // Persist default
          this.saveSettings(defaultSettings).catch(console.error);
          resolve(defaultSettings);
        }
      };
      request.onerror = () => {
        // Fallback default
        resolve({
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
      };
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appSettings', 'readwrite');
      const store = tx.objectStore('appSettings');
      const request = store.put(settings);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS (v2)
  // --------------------------------------------------------------------------

  async getAllCustomers(): Promise<WholesaleCustomer[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const request = store.getAll();
      request.onsuccess = () => {
        const list: WholesaleCustomer[] = request.result || [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomer(customer: WholesaleCustomer): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      const request = store.put(customer);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomer(id: string): Promise<WholesaleCustomer | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSerialCounters(): Promise<SerialCounterRecord[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('serialCounters', 'readonly');
      const store = tx.objectStore('serialCounters');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async generateNextSerialNumber(category: CustomerCategory): Promise<string> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['serialCounters', 'customers', 'serialUsers'], 'readwrite');
      const counterStore = tx.objectStore('serialCounters');
      const customerStore = tx.objectStore('customers');
      const userStore = tx.objectStore('serialUsers');

      const counterReq = counterStore.get(category);

      counterReq.onsuccess = () => {
        let currentNumber = 0;
        if (counterReq.result && typeof counterReq.result.lastNumber === 'number') {
          currentNumber = counterReq.result.lastNumber;
        }

        const custReq = customerStore.getAll();
        custReq.onsuccess = () => {
          const custs: WholesaleCustomer[] = custReq.result || [];
          const userReq = userStore.getAll();

          userReq.onsuccess = () => {
            const users: SerialUserAccount[] = userReq.result || [];
            let maxExisting = currentNumber;
            const prefix = `${category}-`;

            for (const c of custs) {
              if (c.serialNumber && c.serialNumber.startsWith(prefix)) {
                const numPart = parseInt(c.serialNumber.slice(prefix.length), 10);
                if (!isNaN(numPart) && numPart > maxExisting) {
                  maxExisting = numPart;
                }
              }
            }
            for (const u of users) {
              if (u.userNumber && u.userNumber.startsWith(prefix)) {
                const numPart = parseInt(u.userNumber.slice(prefix.length), 10);
                if (!isNaN(numPart) && numPart > maxExisting) {
                  maxExisting = numPart;
                }
              }
            }

            const nextNum = maxExisting + 1;
            const formattedSerial = formatSerialNumber(category, nextNum);

            const counterRecord: SerialCounterRecord = {
              category,
              lastNumber: nextNum,
              updatedAt: new Date().toISOString(),
            };
            counterStore.put(counterRecord);

            resolve(formattedSerial);
          };
          userReq.onerror = () => reject(userReq.error);
        };
        custReq.onerror = () => reject(custReq.error);
      };
      counterReq.onerror = () => reject(counterReq.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  async createCustomerWithSerial(data: {
    name: string;
    category: CustomerCategory;
    shortCode?: string;
    phone?: string;
    notes?: string;
    businessName?: string;
    city?: string;
    address?: string;
  }): Promise<{ customer: WholesaleCustomer; serialNumber: string }> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Customer name or short identifying name is required.');
    }
    if (!data.category || !['C', 'B', 'F'].includes(data.category)) {
      throw new Error('Valid category (C, B, or F) is required.');
    }

    const serialNumber = await this.generateNextSerialNumber(data.category);
    const now = new Date().toISOString();
    const customerId = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const customer: WholesaleCustomer = {
      id: customerId,
      name: data.name.trim(),
      category: data.category,
      serialNumber,
      shortCode: data.shortCode ? data.shortCode.trim() : undefined,
      phone: data.phone ? data.phone.trim() : undefined,
      notes: data.notes ? data.notes.trim() : undefined,
      businessName: data.businessName ? data.businessName.trim() : undefined,
      city: data.city ? data.city.trim() : undefined,
      address: data.address ? data.address.trim() : undefined,
      status: 'active',
      registrationDate: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveCustomer(customer);

    // Also register corresponding serial user account
    const salt = `salt_${serialNumber.toLowerCase()}_${Date.now()}`;
    const defaultPassword = 'Wholesale2026!';
    const passwordHash = await hashPassword(defaultPassword, salt);

    const serialUser: SerialUserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userNumber: serialNumber,
      customerId: customer.id,
      customerName: customer.name,
      businessName: customer.businessName || customer.name,
      phone: customer.phone || '',
      email: '',
      category: customer.category,
      status: 'active',
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveSerialUser(serialUser);

    return { customer, serialNumber };
  }

  async setCustomerAccessStatus(customerId: string, status: 'active' | 'inactive'): Promise<void> {
    const cust = await this.getCustomer(customerId);
    if (!cust) throw new Error('Customer record not found');

    cust.status = status;
    cust.updatedAt = new Date().toISOString();
    await this.saveCustomer(cust);

    if (cust.serialNumber) {
      const serialUser = await this.getSerialUserByNumber(cust.serialNumber);
      if (serialUser) {
        serialUser.status = status === 'active' ? 'active' : 'suspended';
        serialUser.updatedAt = new Date().toISOString();
        await this.saveSerialUser(serialUser);
      }
    }
  }

  async getCustomerBillingHistory(
    customerId: string,
    customerName?: string,
    customerSerial?: string
  ): Promise<CashSale[]> {
    const allSales = await this.getAllSales();
    const normName = customerName ? customerName.trim().toLowerCase() : '';
    const normSerial = customerSerial ? customerSerial.trim().toUpperCase() : '';

    return allSales.filter((s) => {
      if (s.customerId && s.customerId === customerId) return true;
      if (s.customerSerial && normSerial && s.customerSerial.toUpperCase() === normSerial) return true;
      if (s.customerName && normName && s.customerName.trim().toLowerCase() === normName) return true;
      return false;
    });
  }

  async getCustomerOrders(customerIdOrUserNumber: string): Promise<CentralOrder[]> {
    const allOrders = await this.getAllCentralOrders();
    const query = customerIdOrUserNumber.trim().toUpperCase();
    return allOrders.filter(
      (o) => o.customerId === customerIdOrUserNumber || o.userNumber.toUpperCase() === query
    );
  }

  async updateCbfAmounts(amounts: { C?: number | null; B?: number | null; F?: number | null }): Promise<AppSettings> {
    const current = await this.getSettings();
    const validated: { C?: number | null; B?: number | null; F?: number | null } = {
      C: current.cbfAmounts?.C !== undefined ? current.cbfAmounts.C : 200000,
      B: current.cbfAmounts?.B !== undefined ? current.cbfAmounts.B : 75000,
      F: current.cbfAmounts?.F !== undefined ? current.cbfAmounts.F : 35000,
    };

    for (const cat of ['C', 'B', 'F'] as const) {
      if (amounts[cat] !== undefined) {
        const val = amounts[cat];
        if (val === null || val === undefined) {
          validated[cat] = null;
        } else {
          const num = Number(val);
          if (isNaN(num) || num < 0) {
            throw new Error(`Invalid amount for Category ${cat}. Must be a non-negative number.`);
          }
          validated[cat] = num;
        }
      }
    }

    const updated: AppSettings = {
      ...current,
      cbfAmounts: validated,
    };
    await this.saveSettings(updated);
    return updated;
  }

  async getCbfAmounts(): Promise<{ C: number | null; B: number | null; F: number | null }> {
    const settings = await this.getSettings();
    return {
      C: settings.cbfAmounts?.C !== undefined ? settings.cbfAmounts.C : 200000,
      B: settings.cbfAmounts?.B !== undefined ? settings.cbfAmounts.B : 75000,
      F: settings.cbfAmounts?.F !== undefined ? settings.cbfAmounts.F : 35000,
    };
  }

  // --------------------------------------------------------------------------
  // SUPPLIERS (v2)
  // --------------------------------------------------------------------------

  async getAllSuppliers(): Promise<WholesaleSupplier[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('suppliers', 'readonly');
      const store = tx.objectStore('suppliers');
      const request = store.getAll();
      request.onsuccess = () => {
        const list: WholesaleSupplier[] = request.result || [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSupplier(supplier: WholesaleSupplier): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('suppliers', 'readwrite');
      const store = tx.objectStore('suppliers');
      const request = store.put(supplier);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('suppliers', 'readwrite');
      const store = tx.objectStore('suppliers');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // EXPENSES (v2)
  // --------------------------------------------------------------------------

  async getAllExpenses(): Promise<WholesaleExpense[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readonly');
      const store = tx.objectStore('expenses');
      const request = store.getAll();
      request.onsuccess = () => {
        const list: WholesaleExpense[] = request.result || [];
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveExpense(expense: WholesaleExpense): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      const store = tx.objectStore('expenses');
      const request = store.put(expense);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      const store = tx.objectStore('expenses');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // CATEGORIES (v2)
  // --------------------------------------------------------------------------

  async getAllCategories(): Promise<WholesaleCategory[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const request = store.getAll();
      request.onsuccess = () => {
        const list: WholesaleCategory[] = request.result || [];
        list.sort((a, b) => a.name.localeCompare(b.name));
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveCategory(category: WholesaleCategory): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const request = store.put(category);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // SERIAL USERS (v3) - Unique User Number / Serial Code Customer Logins
  // --------------------------------------------------------------------------

  async getAllSerialUsers(): Promise<SerialUserAccount[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('serialUsers', 'readonly');
      const store = tx.objectStore('serialUsers');
      const request = store.getAll();
      request.onsuccess = () => {
        const users: SerialUserAccount[] = request.result || [];
        users.sort((a, b) => a.userNumber.localeCompare(b.userNumber));
        resolve(users);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSerialUserByNumber(userNumber: string): Promise<SerialUserAccount | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('serialUsers', 'readonly');
      const store = tx.objectStore('serialUsers');
      const index = store.index('by_userNumber');
      const request = index.get(userNumber.trim().toUpperCase());
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSerialUser(user: SerialUserAccount): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('serialUsers', 'readwrite');
      const store = tx.objectStore('serialUsers');
      const request = store.put({
        ...user,
        userNumber: user.userNumber.trim().toUpperCase(),
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSerialUser(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('serialUsers', 'readwrite');
      const store = tx.objectStore('serialUsers');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // CENTRAL ORDERS & ATOMIC BILLING INVENTORY DEDUCTION (v3)
  // --------------------------------------------------------------------------

  async getAllCentralOrders(): Promise<CentralOrder[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('centralOrders', 'readonly');
      const store = tx.objectStore('centralOrders');
      const request = store.getAll();
      request.onsuccess = () => {
        const orders: CentralOrder[] = request.result || [];
        // Sort newest first
        orders.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        resolve(orders);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCentralOrdersByUser(userNumber: string): Promise<CentralOrder[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('centralOrders', 'readonly');
      const store = tx.objectStore('centralOrders');
      const index = store.index('by_userNumber');
      const request = index.getAll(userNumber.trim().toUpperCase());
      request.onsuccess = () => {
        const orders: CentralOrder[] = request.result || [];
        orders.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        resolve(orders);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveCentralOrder(order: CentralOrder): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('centralOrders', 'readwrite');
      const store = tx.objectStore('centralOrders');
      const request = store.put(order);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ATOMIC INVENTORY DEDUCTION DURING BILLING
   * Critical requirement: Immediately validates variant-level stock across all items,
   * decrements central inventory atomically, creates StockMovement audit log, and generates official invoice.
   */
  async atomicBillCentralOrder(
    orderId: string,
    billingDetails: { staffName: string; counterId: string; gstPercent?: number }
  ): Promise<{ success: boolean; invoiceNumber?: string; order?: CentralOrder; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();

    return new Promise((resolve) => {
      const tx = db.transaction(
        ['products', 'centralOrders', 'stockMovements', 'sales'],
        'readwrite'
      );
      const orderStore = tx.objectStore('centralOrders');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('stockMovements');
      const salesStore = tx.objectStore('sales');

      const orderReq = orderStore.get(orderId);

      orderReq.onsuccess = () => {
        const order: CentralOrder = orderReq.result;
        if (!order) {
          tx.abort();
          resolve({ success: false, error: 'Order not found in central database.' });
          return;
        }

        if (order.status === 'Billed' || order.status === 'Completed') {
          tx.abort();
          resolve({
            success: false,
            error: `Order is already ${order.status} under Invoice #${order.invoiceNumber}.`,
          });
          return;
        }

        if (order.status === 'Cancelled' || order.status === 'Rejected') {
          tx.abort();
          resolve({
            success: false,
            error: `Cannot bill an order that is ${order.status}.`,
          });
          return;
        }

        // Fetch each product from catalog
        const productPromises: Promise<ClothingProduct>[] = order.items.map(
          (item) =>
            new Promise((res, rej) => {
              const req = productStore.get(item.productId);
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            })
        );

        Promise.all(productPromises)
          .then((fetchedProducts) => {
            const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
            const updatedProductsMap = new Map<string, ClothingProduct>();
            let subtotal = 0;

            for (let i = 0; i < order.items.length; i++) {
              const item = order.items[i];
              const product = fetchedProducts[i];
              const currentProd = updatedProductsMap.get(item.productId) || product;

              if (!currentProd) {
                tx.abort();
                resolve({
                  success: false,
                  error: `Product "${item.productName}" was not found in catalog.`,
                });
                return;
              }

              // Locate variant by ID or (size + color)
              let vIdx = -1;
              if (item.variantId) {
                vIdx = currentProd.variants.findIndex((v) => v.id === item.variantId);
              }
              if (vIdx === -1) {
                vIdx = currentProd.variants.findIndex(
                  (v) =>
                    v.size.toLowerCase() === item.size.toLowerCase() &&
                    v.color.toLowerCase() === item.color.toLowerCase()
                );
              }
              if (vIdx === -1 && currentProd.variants.length > 0) {
                vIdx = 0;
              }

              if (vIdx === -1) {
                tx.abort();
                resolve({
                  success: false,
                  error: `Variant Size: ${item.size}, Color: ${item.color} not found for "${currentProd.name}".`,
                });
                return;
              }

              const variant = currentProd.variants[vIdx];
              const billQty = item.approvedQuantity || item.requestedQuantity;
              const stockBefore = variant.stock;

              if (variant.stock < billQty) {
                tx.abort();
                resolve({
                  success: false,
                  error: `Insufficient stock for "${currentProd.name}" (${variant.size} / ${variant.color}). Available: ${variant.stock}, Required: ${billQty}.`,
                });
                return;
              }

              const stockAfter = stockBefore - billQty;
              const updatedVariant = { ...variant, stock: stockAfter };
              const updatedVariants = [...currentProd.variants];
              updatedVariants[vIdx] = updatedVariant;

              const updatedProduct: ClothingProduct = {
                ...currentProd,
                variants: updatedVariants,
                totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
                updatedAt: timestamp,
              };
              updatedProductsMap.set(currentProd.id, updatedProduct);

              // Stock movement record
              const movement: StockMovement = {
                id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                productId: currentProd.id,
                variantId: variant.id,
                productName: currentProd.name,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                type: 'order_billing',
                quantityDelta: -billQty,
                stockBefore,
                stockAfter,
                referenceId: invoiceNumber,
                reason: `Central Order #${order.orderNumber} (User: ${order.userNumber})`,
                timestamp,
                billingCounterId: billingDetails.counterId,
                performedBy: billingDetails.staffName,
              };
              movementStore.put(movement);

              item.billedQuantity = billQty;
              item.lineTotal = billQty * (item.unitPrice || currentProd.sellingPrice);
              subtotal += item.lineTotal;
            }

            // Save updated products
            for (const prod of updatedProductsMap.values()) {
              productStore.put(prod);
            }

            const gstRate = billingDetails.gstPercent !== undefined ? billingDetails.gstPercent : (order.gstPercent || 13);
            const gstAmount = Math.round((subtotal * gstRate) / 100);
            const grandTotal = subtotal + gstAmount;

            const updatedOrder: CentralOrder = {
              ...order,
              status: 'Billed',
              subtotal,
              gstPercent: gstRate,
              gstAmount,
              grandTotal,
              invoiceNumber,
              billedDate: timestamp,
              billedByStaff: billingDetails.staffName,
              billingCounterId: billingDetails.counterId,
              auditTrail: [
                ...(order.auditTrail || []),
                {
                  timestamp,
                  action: 'Finalized Billing & Deducted Inventory',
                  performedBy: billingDetails.staffName,
                  counterId: billingDetails.counterId,
                  details: `Issued Invoice #${invoiceNumber}. Atomically deducted stock across ${order.items.length} variants. Grand Total: NPR ${grandTotal}.`,
                },
              ],
            };
            orderStore.put(updatedOrder);

            // Record consolidated CashSale
            const saleRecord: CashSale = {
              id: `sale-order-${order.id}`,
              invoiceNumber,
              timestamp,
              items: order.items.map((it) => ({
                productId: it.productId,
                variantId: it.variantId || '',
                productName: it.productName,
                sku: it.sku,
                size: it.size,
                color: it.color,
                unit: it.unit as any,
                unitPrice: it.unitPrice,
                quantity: it.billedQuantity,
                discount: 0,
                lineTotal: it.lineTotal,
                purchaseCostAtSale: 0,
              })),
              subtotal,
              discountTotal: 0,
              taxRatePercent: gstRate,
              taxAmount: gstAmount,
              grandTotal,
              cashReceived: grandTotal,
              changeReturned: 0,
              paymentMethod: 'cash',
              customerName: `${order.businessName} (${order.userNumber})`,
              customerPhone: order.contactPhone,
              notes: `Order #${order.orderNumber} Billed via ${billingDetails.counterId}`,
              status: 'completed',
            };
            salesStore.put(saleRecord);
          })
          .catch((err) => {
            tx.abort();
            resolve({ success: false, error: err?.message || 'Database error during order billing' });
          });
      };

      tx.oncomplete = () => {
        resolve({ success: true });
      };

      tx.onerror = () => {
        resolve({ success: false, error: tx.error?.message || 'Transaction failed.' });
      };
    });
  }

  /**
   * ATOMIC ORDER / INVOICE CANCELLATION & CONTROLLED STOCK REVERSAL
   */
  async atomicReverseCentralOrder(
    orderId: string,
    reason: string,
    staffName: string,
    counterId: string = 'COUNTER-01'
  ): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDb();
    const timestamp = new Date().toISOString();

    return new Promise((resolve) => {
      const tx = db.transaction(['products', 'centralOrders', 'stockMovements', 'sales'], 'readwrite');
      const orderStore = tx.objectStore('centralOrders');
      const productStore = tx.objectStore('products');
      const movementStore = tx.objectStore('stockMovements');
      const salesStore = tx.objectStore('sales');

      const orderReq = orderStore.get(orderId);

      orderReq.onsuccess = () => {
        const order: CentralOrder = orderReq.result;
        if (!order) {
          tx.abort();
          resolve({ success: false, error: 'Order not found.' });
          return;
        }

        if (order.status === 'Cancelled') {
          tx.abort();
          resolve({ success: false, error: 'Order is already cancelled.' });
          return;
        }

        // If order was billed, reverse stock back into inventory
        if (order.status === 'Billed' || order.status === 'Ready for Dispatch' || order.status === 'Dispatched') {
          for (const item of order.items) {
            const billQty = item.billedQuantity || item.approvedQuantity || item.requestedQuantity;
            if (billQty <= 0) continue;

            const prodReq = productStore.get(item.productId);
            prodReq.onsuccess = () => {
              const product: ClothingProduct = prodReq.result;
              if (product) {
                let vIdx = -1;
                if (item.variantId) {
                  vIdx = product.variants.findIndex((v) => v.id === item.variantId);
                }
                if (vIdx === -1) {
                  vIdx = product.variants.findIndex(
                    (v) =>
                      v.size.toLowerCase() === item.size.toLowerCase() &&
                      v.color.toLowerCase() === item.color.toLowerCase()
                  );
                }
                if (vIdx !== -1) {
                  const variant = product.variants[vIdx];
                  const stockBefore = variant.stock;
                  const stockAfter = stockBefore + billQty;

                  const updatedVariant = { ...variant, stock: stockAfter };
                  const updatedVariants = [...product.variants];
                  updatedVariants[vIdx] = updatedVariant;

                  const updatedProduct: ClothingProduct = {
                    ...product,
                    variants: updatedVariants,
                    totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
                    updatedAt: timestamp,
                  };
                  productStore.put(updatedProduct);

                  // Movement log
                  const movement: StockMovement = {
                    id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    productId: product.id,
                    variantId: variant.id,
                    productName: product.name,
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    type: 'order_reversal',
                    quantityDelta: +billQty,
                    stockBefore,
                    stockAfter,
                    referenceId: order.invoiceNumber || order.orderNumber,
                    reason: `Order Reversal: ${reason}`,
                    timestamp,
                    billingCounterId: counterId,
                    performedBy: staffName,
                  };
                  movementStore.put(movement);
                }
              }
            };
          }
        }

        const updatedOrder: CentralOrder = {
          ...order,
          status: 'Cancelled',
          rejectionReason: reason,
          auditTrail: [
            ...(order.auditTrail || []),
            {
              timestamp,
              action: 'Order & Invoice Cancelled',
              performedBy: staffName,
              counterId,
              details: `Cancelled order #${order.orderNumber}. Reason: ${reason}. Restored stock quantities.`,
            },
          ],
        };
        orderStore.put(updatedOrder);

        // Update corresponding sales record if present
        if (order.invoiceNumber) {
          const saleReq = salesStore.index('by_invoice').get(order.invoiceNumber);
          saleReq.onsuccess = () => {
            const sale = saleReq.result;
            if (sale) {
              sale.status = 'cancelled';
              sale.notes = `${sale.notes || ''} [Cancelled: ${reason}]`;
              salesStore.put(sale);
            }
          };
        }
      };

      tx.oncomplete = () => resolve({ success: true });
      tx.onerror = () => resolve({ success: false, error: tx.error?.message || 'Reversal failed.' });
    });
  }

  // --------------------------------------------------------------------------
  // STOREFRONT WISHLIST (v3) - Private per User Number
  // --------------------------------------------------------------------------

  async getWishlist(userNumber: string): Promise<StorefrontWishlistItem[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('wishlists', 'readonly');
      const store = tx.objectStore('wishlists');
      const index = store.index('by_userNumber');
      const request = index.getAll(userNumber.trim().toUpperCase());
      request.onsuccess = () => {
        const list: StorefrontWishlistItem[] = request.result || [];
        list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addToWishlist(item: Omit<StorefrontWishlistItem, 'id' | 'addedAt'>): Promise<StorefrontWishlistItem> {
    const db = await this.getDb();
    const wishlistItem: StorefrontWishlistItem = {
      ...item,
      id: `wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userNumber: item.userNumber.trim().toUpperCase(),
      addedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('wishlists', 'readwrite');
      const store = tx.objectStore('wishlists');
      const request = store.put(wishlistItem);
      request.onsuccess = () => resolve(wishlistItem);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromWishlist(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('wishlists', 'readwrite');
      const store = tx.objectStore('wishlists');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearWishlist(userNumber: string): Promise<void> {
    const items = await this.getWishlist(userNumber);
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('wishlists', 'readwrite');
      const store = tx.objectStore('wishlists');
      for (const it of items) {
        store.delete(it.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --------------------------------------------------------------------------
  // BILLING WORKSTATIONS & COUNTERS (v3)
  // --------------------------------------------------------------------------

  async getAllBillingCounters(): Promise<BillingCounter[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('billingCounters', 'readonly');
      const store = tx.objectStore('billingCounters');
      const request = store.getAll();
      request.onsuccess = () => {
        const counters: BillingCounter[] = request.result || [];
        counters.sort((a, b) => a.code.localeCompare(b.code));
        resolve(counters);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveBillingCounter(counter: BillingCounter): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('billingCounters', 'readwrite');
      const store = tx.objectStore('billingCounters');
      const request = store.put(counter);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --------------------------------------------------------------------------
  // BACKUP & RESTORE (v3 - Includes Serial Users, Central Orders, Wishlist, Counters)
  // --------------------------------------------------------------------------

  async exportFullBackup(): Promise<{
    version: number;
    exportDate: string;
    products: ClothingProduct[];
    purchases: PurchaseRecord[];
    sales: CashSale[];
    stockMovements: StockMovement[];
    settings: AppSettings;
    customers?: WholesaleCustomer[];
    suppliers?: WholesaleSupplier[];
    expenses?: WholesaleExpense[];
    categories?: WholesaleCategory[];
    serialUsers?: SerialUserAccount[];
    centralOrders?: CentralOrder[];
    wishlists?: StorefrontWishlistItem[];
    billingCounters?: BillingCounter[];
    serialCounters?: SerialCounterRecord[];
  }> {
    const [
      products,
      purchases,
      sales,
      stockMovements,
      settings,
      customers,
      suppliers,
      expenses,
      categories,
      serialUsers,
      centralOrders,
      billingCounters,
      serialCounters,
    ] = await Promise.all([
      this.getAllProducts(),
      this.getAllPurchases(),
      this.getAllSales(),
      this.getAllStockMovements(),
      this.getSettings(),
      this.getAllCustomers(),
      this.getAllSuppliers(),
      this.getAllExpenses(),
      this.getAllCategories(),
      this.getAllSerialUsers(),
      this.getAllCentralOrders(),
      this.getAllBillingCounters(),
      this.getAllSerialCounters(),
    ]);

    return {
      version: 4,
      exportDate: new Date().toISOString(),
      products,
      purchases,
      sales,
      stockMovements,
      settings,
      customers,
      suppliers,
      expenses,
      categories,
      serialUsers,
      centralOrders,
      billingCounters,
      serialCounters,
    };
  }

  async restoreFullBackup(backupData: any): Promise<{ success: boolean; error?: string }> {
    // Validate backup format
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, error: 'Invalid backup file format.' };
    }
    if (!Array.isArray(backupData.products) || !Array.isArray(backupData.sales)) {
      return { success: false, error: 'Backup is missing required product or sales collections.' };
    }

    const db = await this.getDb();
    const storeNames = ['products', 'purchases', 'sales', 'stockMovements', 'appSettings'];
    if (db.objectStoreNames.contains('customers')) storeNames.push('customers');
    if (db.objectStoreNames.contains('suppliers')) storeNames.push('suppliers');
    if (db.objectStoreNames.contains('expenses')) storeNames.push('expenses');
    if (db.objectStoreNames.contains('categories')) storeNames.push('categories');
    if (db.objectStoreNames.contains('serialUsers')) storeNames.push('serialUsers');
    if (db.objectStoreNames.contains('centralOrders')) storeNames.push('centralOrders');
    if (db.objectStoreNames.contains('wishlists')) storeNames.push('wishlists');
    if (db.objectStoreNames.contains('billingCounters')) storeNames.push('billingCounters');
    if (db.objectStoreNames.contains('serialCounters')) storeNames.push('serialCounters');

    return new Promise((resolve) => {
      const tx = db.transaction(storeNames, 'readwrite');

      // Clear existing stores
      tx.objectStore('products').clear();
      tx.objectStore('purchases').clear();
      tx.objectStore('sales').clear();
      tx.objectStore('stockMovements').clear();
      tx.objectStore('appSettings').clear();

      if (db.objectStoreNames.contains('customers')) tx.objectStore('customers').clear();
      if (db.objectStoreNames.contains('suppliers')) tx.objectStore('suppliers').clear();
      if (db.objectStoreNames.contains('expenses')) tx.objectStore('expenses').clear();
      if (db.objectStoreNames.contains('categories')) tx.objectStore('categories').clear();
      if (db.objectStoreNames.contains('serialUsers')) tx.objectStore('serialUsers').clear();
      if (db.objectStoreNames.contains('centralOrders')) tx.objectStore('centralOrders').clear();
      if (db.objectStoreNames.contains('wishlists')) tx.objectStore('wishlists').clear();
      if (db.objectStoreNames.contains('billingCounters')) tx.objectStore('billingCounters').clear();
      if (db.objectStoreNames.contains('serialCounters')) tx.objectStore('serialCounters').clear();

      // Repopulate products
      const prodStore = tx.objectStore('products');
      for (const p of backupData.products) {
        prodStore.put(p);
      }

      // Repopulate purchases
      if (Array.isArray(backupData.purchases)) {
        const purStore = tx.objectStore('purchases');
        for (const pur of backupData.purchases) {
          purStore.put(pur);
        }
      }

      // Repopulate sales
      const salesStore = tx.objectStore('sales');
      for (const s of backupData.sales) {
        salesStore.put(s);
      }

      // Repopulate movements
      if (Array.isArray(backupData.stockMovements)) {
        const movStore = tx.objectStore('stockMovements');
        for (const m of backupData.stockMovements) {
          movStore.put(m);
        }
      }

      // Repopulate settings
      if (backupData.settings) {
        tx.objectStore('appSettings').put({
          ...backupData.settings,
          id: 'main',
          lastBackupDate: new Date().toISOString(),
        });
      }

      // Repopulate v2 stores if present
      if (Array.isArray(backupData.customers) && db.objectStoreNames.contains('customers')) {
        const custStore = tx.objectStore('customers');
        for (const c of backupData.customers) {
          custStore.put(c);
        }
      }

      if (Array.isArray(backupData.suppliers) && db.objectStoreNames.contains('suppliers')) {
        const suppStore = tx.objectStore('suppliers');
        for (const supp of backupData.suppliers) {
          suppStore.put(supp);
        }
      }

      if (Array.isArray(backupData.expenses) && db.objectStoreNames.contains('expenses')) {
        const expStore = tx.objectStore('expenses');
        for (const exp of backupData.expenses) {
          expStore.put(exp);
        }
      }

      if (Array.isArray(backupData.categories) && db.objectStoreNames.contains('categories')) {
        const catStore = tx.objectStore('categories');
        for (const cat of backupData.categories) {
          catStore.put(cat);
        }
      }

      // Repopulate v3 stores if present
      if (Array.isArray(backupData.serialUsers) && db.objectStoreNames.contains('serialUsers')) {
        const userStore = tx.objectStore('serialUsers');
        for (const u of backupData.serialUsers) {
          userStore.put(u);
        }
      }

      if (Array.isArray(backupData.centralOrders) && db.objectStoreNames.contains('centralOrders')) {
        const orderStore = tx.objectStore('centralOrders');
        for (const o of backupData.centralOrders) {
          orderStore.put(o);
        }
      }

      if (Array.isArray(backupData.wishlists) && db.objectStoreNames.contains('wishlists')) {
        const wishStore = tx.objectStore('wishlists');
        for (const w of backupData.wishlists) {
          wishStore.put(w);
        }
      }

      if (Array.isArray(backupData.billingCounters) && db.objectStoreNames.contains('billingCounters')) {
        const counterStore = tx.objectStore('billingCounters');
        for (const cnt of backupData.billingCounters) {
          counterStore.put(cnt);
        }
      }

      if (Array.isArray(backupData.serialCounters) && db.objectStoreNames.contains('serialCounters')) {
        const sCounterStore = tx.objectStore('serialCounters');
        for (const sc of backupData.serialCounters) {
          sCounterStore.put(sc);
        }
      }

      tx.oncomplete = () => resolve({ success: true });
      tx.onerror = () => resolve({ success: false, error: tx.error?.message || 'Restore failed' });
    });
  }

  // --------------------------------------------------------------------------
  // INITIAL SEEDING (FROM LOCAL GARMENT DATA IF DB IS EMPTY)
  // --------------------------------------------------------------------------
  async seedInitialDataIfEmpty(initialProducts: ClothingProduct[]): Promise<void> {
    const existing = await this.getAllProducts();
    if (existing.length === 0 && initialProducts.length > 0) {
      const db = await this.getDb();
      const tx = db.transaction(['products', 'stockMovements'], 'readwrite');
      const prodStore = tx.objectStore('products');
      const movStore = tx.objectStore('stockMovements');

      for (const prod of initialProducts) {
        prodStore.put(prod);
        for (const variant of prod.variants) {
          movStore.put({
            id: `mov-init-${prod.id}-${variant.id}`,
            productId: prod.id,
            variantId: variant.id,
            productName: prod.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            type: 'purchase',
            quantityDelta: variant.stock,
            stockBefore: 0,
            stockAfter: variant.stock,
            referenceId: 'INITIAL_STOCK',
            reason: 'Opening Inventory Stock',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  async seedAdditionalModulesIfEmpty(): Promise<void> {
    const db = await this.getDb();

    // 1. Categories (Ensure all fashion hierarchy categories exist)
    const existingCats = await this.getAllCategories();
    const existingCatNames = new Set(existingCats.map((c) => c.name.toLowerCase()));

    for (let i = 0; i < ALL_FASHION_CATEGORIES.length; i++) {
      const item = ALL_FASHION_CATEGORIES[i];
      if (!existingCatNames.has(item.category.toLowerCase())) {
        await this.saveCategory({
          id: `cat-fash-${i + 1}-${item.code.toLowerCase()}`,
          name: item.category,
          code: item.code,
          department: item.department,
          description: item.description,
          createdAt: new Date().toISOString(),
        });
        existingCatNames.add(item.category.toLowerCase());
      }
    }

    // 2. Customers
    const existingCust = await this.getAllCustomers();
    if (existingCust.length === 0) {
      const now = new Date().toISOString();
      const defaultCustomers: WholesaleCustomer[] = [
        {
          id: 'cust-1',
          name: 'Rajesh Shrestha',
          category: 'C',
          serialNumber: 'C-0001',
          businessName: 'Kathmandu Fashion Point',
          phone: '9841234567',
          email: 'rajesh.kfp@gmail.com',
          panVat: '301298451',
          city: 'Kathmandu',
          address: 'Asan Bazar, Ward 27',
          notes: 'Frequent buyer of denim packs and Oxford shirts. Cash prompt.',
          status: 'active',
          registrationDate: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cust-2',
          name: 'Sunita Gurung',
          category: 'B',
          serialNumber: 'B-0001',
          businessName: 'Pokhara Valley Collection',
          phone: '9856012345',
          email: 'pokhara.collection@gmail.com',
          city: 'Pokhara',
          address: 'Mahendrapool, Pokhara',
          notes: 'Buys winter hoodies and fleece jackets in bulk.',
          status: 'active',
          registrationDate: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cust-3',
          name: 'Bikram Thapa',
          category: 'F',
          serialNumber: 'F-0001',
          businessName: 'Chitwan Garment Centre',
          phone: '9801234890',
          panVat: '601984210',
          city: 'Narayangarh',
          address: 'Lions Chowk, Narayangarh',
          notes: 'Orders in dozens. Prefers pack assortments.',
          status: 'active',
          registrationDate: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cust-4',
          name: 'Bibek Shrestha',
          category: 'C',
          serialNumber: 'C-0002',
          businessName: 'Kathmandu Royal Boutique',
          phone: '9841234567',
          email: 'workbibek5@gmail.com',
          status: 'active',
          registrationDate: now,
          createdAt: now,
          updatedAt: now,
        },
      ];
      for (const c of defaultCustomers) {
        await this.saveCustomer(c);
      }
    }

    // 3. Suppliers
    const existingSupp = await this.getAllSuppliers();
    if (existingSupp.length === 0) {
      const defaultSuppliers: WholesaleSupplier[] = [
        {
          id: 'supp-1',
          name: 'Himalayan Textile Mills',
          contactPerson: 'Suresh Agrawal',
          phone: '01-4351234',
          email: 'orders@himalayantextiles.com.np',
          city: 'Biratnagar',
          address: 'Mills Area, Biratnagar-13',
          category: 'Fabric & Mill Direct',
          notes: 'Primary supplier for 100% Egyptian Giza & Oxford cotton fabrics.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'supp-2',
          name: 'Apex Knitwear Apparels',
          contactPerson: 'Deepak Sharma',
          phone: '01-5521980',
          city: 'Lalitpur',
          address: 'Patan Industrial Estate',
          category: 'Ready-made Garments',
          notes: 'Manufactures pre-shrunk combed cotton T-shirts and polos.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'supp-3',
          name: 'Bagmati Denim Industries',
          contactPerson: 'Prakash Maharjan',
          phone: '01-4478901',
          city: 'Kathmandu',
          address: 'Balaju Industrial District',
          category: 'Denim Manufacturing',
          notes: 'Specialist in stone-wash and enzyme washed denim jeans.',
          createdAt: new Date().toISOString(),
        },
      ];
      for (const s of defaultSuppliers) {
        await this.saveSupplier(s);
      }
    }

    // 4. Sample Expenses
    const existingExp = await this.getAllExpenses();
    if (existingExp.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const defaultExpenses: WholesaleExpense[] = [
        {
          id: 'exp-1',
          date: today,
          category: 'Shop Rent',
          amount: 25000,
          description: 'Monthly warehouse and counter shop rent',
          voucherNumber: 'VCH-001',
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-2',
          date: today,
          category: 'Cargo / Freight',
          amount: 3800,
          description: 'Biratnagar mill consignment freight & unloading labour',
          voucherNumber: 'VCH-002',
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-3',
          date: today,
          category: 'Staff Tea & Meals',
          amount: 650,
          description: 'Daily counter tea and lunch for helper',
          voucherNumber: 'VCH-003',
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
        },
      ];
      for (const e of defaultExpenses) {
        await this.saveExpense(e);
      }
    }

    // 5. Billing Counters (Workstations)
    const existingCounters = await this.getAllBillingCounters();
    if (existingCounters.length === 0) {
      const defaultCounters: BillingCounter[] = [
        {
          id: 'cnt-1',
          code: 'COUNTER-01',
          name: 'Terminal 1 - Main Front Counter',
          location: 'Kathmandu Showroom Ground Floor',
          isOnline: true,
          lastActive: new Date().toISOString(),
        },
        {
          id: 'cnt-2',
          code: 'COUNTER-02',
          name: 'Terminal 2 - Wholesale Floor Desk',
          location: 'Kathmandu 1st Floor B2B Area',
          isOnline: true,
          lastActive: new Date().toISOString(),
        },
        {
          id: 'cnt-3',
          code: 'COUNTER-03',
          name: 'Terminal 3 - Warehouse Dispatch Desk',
          location: 'Kathmandu Logistics & Cargo Bay',
          isOnline: true,
          lastActive: new Date().toISOString(),
        },
      ];
      for (const cnt of defaultCounters) {
        await this.saveBillingCounter(cnt);
      }
    }

    // 6. Serial Users (Unique User Numbers for C / B / F Logins)
    const existingUsers = await this.getAllSerialUsers();
    if (existingUsers.length === 0) {
      const saltC1 = 'salt_c_0001';
      const hashC1 = await hashPassword('Wholesale2026!', saltC1);

      const saltB1 = 'salt_b_0001';
      const hashB1 = await hashPassword('Wholesale2026!', saltB1);

      const saltF1 = 'salt_f_0001';
      const hashF1 = await hashPassword('Wholesale2026!', saltF1);

      const saltC2 = 'salt_c_0002';
      const hashC2 = await hashPassword('Wholesale2026!', saltC2);

      const saltC = 'salt_c_10023';
      const hashC = await hashPassword('Wholesale2026!', saltC);

      const defaultUsers: SerialUserAccount[] = [
        {
          id: 'usr-1',
          userNumber: 'C-0001',
          customerId: 'cust-1',
          customerName: 'Rajesh Shrestha',
          businessName: 'Kathmandu Fashion Point',
          phone: '9841234567',
          email: 'rajesh.kfp@gmail.com',
          category: 'C',
          status: 'active',
          passwordHash: hashC1,
          salt: saltC1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-2',
          userNumber: 'B-0001',
          customerId: 'cust-2',
          customerName: 'Sunita Gurung',
          businessName: 'Pokhara Valley Collection',
          phone: '9856012345',
          email: 'pokhara.collection@gmail.com',
          category: 'B',
          status: 'active',
          passwordHash: hashB1,
          salt: saltB1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-3',
          userNumber: 'F-0001',
          customerId: 'cust-3',
          customerName: 'Bikram Thapa',
          businessName: 'Chitwan Garment Centre',
          phone: '9801234890',
          email: 'chitwan.garment@gmail.com',
          category: 'F',
          status: 'active',
          passwordHash: hashF1,
          salt: saltF1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-4',
          userNumber: 'C-0002',
          customerId: 'cust-4',
          customerName: 'Bibek Shrestha',
          businessName: 'Kathmandu Royal Boutique',
          phone: '9841234567',
          email: 'workbibek5@gmail.com',
          category: 'C',
          status: 'active',
          passwordHash: hashC2,
          salt: saltC2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-compat-c',
          userNumber: 'C-10023',
          customerId: 'cust-4',
          customerName: 'Bibek Shrestha',
          businessName: 'Kathmandu Royal Boutique',
          phone: '9841234567',
          email: 'workbibek5@gmail.com',
          category: 'C',
          status: 'active',
          passwordHash: hashC,
          salt: saltC,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const u of defaultUsers) {
        await this.saveSerialUser(u);
      }
    }

    // Initialize serial counters if empty
    const existingCountersList = await this.getAllSerialCounters();
    if (existingCountersList.length === 0) {
      const now = new Date().toISOString();
      const db = await this.getDb();
      const tx = db.transaction('serialCounters', 'readwrite');
      const store = tx.objectStore('serialCounters');
      store.put({ category: 'C', lastNumber: 2, updatedAt: now });
      store.put({ category: 'B', lastNumber: 1, updatedAt: now });
      store.put({ category: 'F', lastNumber: 1, updatedAt: now });
    }

    // 7. Sample Central Orders
    const existingOrders = await this.getAllCentralOrders();
    if (existingOrders.length === 0) {
      const allProds = await this.getAllProducts();
      const p1 = allProds[0] || {
        id: 'p-seed-1',
        name: 'Monarch Italian Cut Blazer',
        sku: 'BLZ-ITL-01',
        unit: 'pcs',
        sellingPrice: 4200,
        variants: [{ id: 'v-1', size: '40', color: 'Midnight Navy', sku: 'BLZ-NAV-40', stock: 25 }],
      };
      const p2 = allProds[1] || {
        id: 'p-seed-2',
        name: 'Executive 100% Giza Oxford Shirt',
        sku: 'SHT-GZA-01',
        unit: 'pcs',
        sellingPrice: 1250,
        variants: [{ id: 'v-2', size: 'M', color: 'Crisp White', sku: 'SHT-WHT-M', stock: 40 }],
      };

      const now = new Date();
      const sampleOrders: CentralOrder[] = [
        {
          id: 'ord-central-1',
          orderNumber: 'ORD-2026-00101',
          userNumber: 'C-0001',
          customerId: 'cust-1',
          customerName: 'Bibek Shrestha',
          businessName: 'Kathmandu Royal Boutique',
          customerCategory: 'C',
          status: 'Pending Approval',
          submissionDate: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
          shippingAddress: 'Asan Bazar, Ward 27, Kathmandu',
          contactPhone: '9841234567',
          customerNotes: 'Please ensure crisp packaging for wedding season showcase.',
          items: [
            {
              id: 'item-1',
              productId: p1.id,
              variantId: p1.variants[0]?.id || 'v-1',
              productName: p1.name,
              sku: p1.variants[0]?.sku || p1.sku,
              size: p1.variants[0]?.size || '40',
              color: p1.variants[0]?.color || 'Navy',
              unit: p1.unit,
              requestedQuantity: 5,
              approvedQuantity: 5,
              billedQuantity: 0,
              unitPrice: p1.sellingPrice,
              lineTotal: 5 * p1.sellingPrice,
            },
            {
              id: 'item-2',
              productId: p2.id,
              variantId: p2.variants[0]?.id || 'v-2',
              productName: p2.name,
              sku: p2.variants[0]?.sku || p2.sku,
              size: p2.variants[0]?.size || 'M',
              color: p2.variants[0]?.color || 'White',
              unit: p2.unit,
              requestedQuantity: 10,
              approvedQuantity: 10,
              billedQuantity: 0,
              unitPrice: p2.sellingPrice,
              lineTotal: 10 * p2.sellingPrice,
            },
          ],
          subtotal: 5 * p1.sellingPrice + 10 * p2.sellingPrice,
          gstPercent: 13,
          gstAmount: Math.round(((5 * p1.sellingPrice + 10 * p2.sellingPrice) * 13) / 100),
          grandTotal:
            5 * p1.sellingPrice +
            10 * p2.sellingPrice +
            Math.round(((5 * p1.sellingPrice + 10 * p2.sellingPrice) * 13) / 100),
          auditTrail: [
            {
              timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
              action: 'Order Submitted',
              performedBy: 'Client (User C-10023)',
              details: 'Submitted wholesale order via Customer Storefront.',
            },
          ],
        },
        {
          id: 'ord-central-2',
          orderNumber: 'ORD-2026-00102',
          userNumber: 'B-20045',
          customerId: 'cust-2',
          customerName: 'Sunita Gurung',
          businessName: 'Pokhara Fashion Traders',
          customerCategory: 'B',
          status: 'Approved',
          submissionDate: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          shippingAddress: 'Mahendrapool, Pokhara',
          contactPhone: '9856012345',
          items: [
            {
              id: 'item-21',
              productId: p2.id,
              variantId: p2.variants[0]?.id || 'v-2',
              productName: p2.name,
              sku: p2.variants[0]?.sku || p2.sku,
              size: p2.variants[0]?.size || 'M',
              color: p2.variants[0]?.color || 'White',
              unit: p2.unit,
              requestedQuantity: 15,
              approvedQuantity: 15,
              billedQuantity: 0,
              unitPrice: p2.sellingPrice,
              lineTotal: 15 * p2.sellingPrice,
            },
          ],
          subtotal: 15 * p2.sellingPrice,
          gstPercent: 13,
          gstAmount: Math.round((15 * p2.sellingPrice * 13) / 100),
          grandTotal: 15 * p2.sellingPrice + Math.round((15 * p2.sellingPrice * 13) / 100),
          approvedByStaff: 'Admin Desk',
          approvedDate: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
          auditTrail: [
            {
              timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
              action: 'Order Submitted',
              performedBy: 'Client (User B-20045)',
              details: 'Submitted wholesale order for 15 packs.',
            },
            {
              timestamp: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
              action: 'Order Approved',
              performedBy: 'Admin Desk',
              counterId: 'COUNTER-01',
              details: 'Approved requested quantities. Ready for billing.',
            },
          ],
        },
      ];

      for (const ord of sampleOrders) {
        await this.saveCentralOrder(ord);
      }
    }
  }
}

export const clothingDb = new ClothingDatabase();

