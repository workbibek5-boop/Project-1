/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_DISPATCH,
  INITIAL_DISTRIBUTORS,
  INITIAL_INVOICES,
  INITIAL_LEDGER,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
} from '../data/initialData';
import { SupportedLanguage, translations } from '../i18n';
import {
  AccountStatus,
  AuditLog,
  CompanySettings,
  CustomerCategory,
  CustomerProfile,
  DispatchRecord,
  DistributorMember,
  Invoice,
  LedgerEntry,
  Order,
  OrderItem,
  PaymentClaim,
  Product,
  ROLE_PERMISSIONS,
  UserRole,
} from '../types';

interface CartItem {
  product: Product;
  quantityPacks: number;
}

interface WholesaleContextType {
  // Localization & Branding
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: typeof translations['en'];
  companySettings: CompanySettings;
  updateCompanySettings: (newSettings: Partial<CompanySettings>) => { success: boolean; error?: string };

  // Active Session & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentCustomer: CustomerProfile | null;
  setCurrentCustomer: (customer: CustomerProfile | null) => void;
  activeStaffName: string;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; error?: string };
  adjustStock: (productId: string, delta: number, reason: string) => { success: boolean; error?: string };

  // Customers & Approvals
  customers: CustomerProfile[];
  registerCustomer: (profileData: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    businessAddress: string;
    panVatNumber?: string;
    licenseNumber?: string;
  }) => { success: boolean; customerId?: string; error?: string };
  updateCustomerCategory: (customerId: string, newCategory: CustomerCategory) => { success: boolean; error?: string };
  updateCustomerStatus: (customerId: string, newStatus: AccountStatus, notes?: string) => { success: boolean; error?: string };

  // Cart & Order Placement
  cart: CartItem[];
  addToCart: (product: Product, quantityPacks?: number) => void;
  updateCartQuantity: (productId: string, quantityPacks: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartVatAmount: () => number;
  getCartTotal: () => number;
  submitOrder: (shippingAddress: string, contactPhone: string, notes?: string) => { success: boolean; orderId?: string; error?: string };

  // Orders Management
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: Order['status'], note?: string) => { success: boolean; error?: string };
  
  // Payments
  paymentClaims: PaymentClaim[];
  submitPaymentClaim: (claim: Omit<PaymentClaim, 'id' | 'verificationStatus' | 'createdAt'>) => { success: boolean; claimId?: string; error?: string };
  verifyPayment: (claimId: string, status: 'verified' | 'rejected', notes?: string) => { success: boolean; error?: string };

  // Invoices & Dispatch
  invoices: Invoice[];
  generateInvoice: (orderId: string) => { success: boolean; invoiceId?: string; error?: string };
  dispatchRecords: DispatchRecord[];
  createDispatchRecord: (record: Omit<DispatchRecord, 'id'>) => { success: boolean; dispatchId?: string; error?: string };
  updateDispatchStatus: (dispatchId: string, status: DispatchRecord['status']) => { success: boolean; error?: string };

  // Private Ledger
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  reverseLedgerEntry: (entryId: string, reason: string) => { success: boolean; error?: string };

  // Hierarchy & Audit
  distributors: DistributorMember[];
  auditLogs: AuditLog[];
  logAction: (action: string, entityType: AuditLog['entityType'], entityId: string, details: string) => void;
}

const WholesaleContext = createContext<WholesaleContextType | null>(null);

export const WholesaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('wbms_company_settings');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_SETTINGS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    const saved = localStorage.getItem('wbms_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Default active customer for buyer view
  const [currentCustomer, setCurrentCustomer] = useState<CustomerProfile | null>(() => {
    return customers.find(c => c.uid === 'user-bibek-01') || customers[0] || null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wbms_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('wbms_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('wbms_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>(() => {
    const saved = localStorage.getItem('wbms_dispatch');
    return saved ? JSON.parse(saved) : INITIAL_DISPATCH;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('wbms_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [distributors] = useState<DistributorMember[]>(() => {
    const saved = localStorage.getItem('wbms_distributors');
    return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTORS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('wbms_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'aud-001',
        timestamp: new Date().toISOString(),
        actorId: 'system-bootstrap',
        actorEmail: 'system@wbms.internal',
        actorRole: 'owner',
        action: 'SYSTEM_BOOTSTRAP',
        entityType: 'settings',
        entityId: 'init',
        details: 'Initial system bootstrap completed. Nepali wholesale rules configured.',
      },
    ];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('wbms_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [paymentClaims, setPaymentClaims] = useState<PaymentClaim[]>(() => {
    const saved = localStorage.getItem('wbms_payment_claims');
    return saved ? JSON.parse(saved) : [
      {
        id: 'pay-claim-001',
        orderId: 'ord-1001',
        orderNumber: 'ORD-2026-00101',
        customerId: 'cust-101',
        customerBusinessName: 'Kathmandu Valley Fashion Traders',
        amountClaimedNpr: 194360,
        paymentMethod: 'fonepay_qr',
        paymentReference: 'FP-TXN-9988231',
        paymentDate: '2026-10-16',
        verificationStatus: 'verified',
        verifiedBy: 'staff-accounts-01',
        verifiedAt: '2026-10-16T12:00:00Z',
        createdAt: '2026-10-16T11:45:00Z',
      },
      {
        id: 'pay-claim-002',
        orderId: 'ord-1002',
        orderNumber: 'ORD-2026-00102',
        customerId: 'cust-102',
        customerBusinessName: 'Annapurna Readymade Clothing Center',
        amountClaimedNpr: 71868,
        paymentMethod: 'bank_transfer',
        paymentReference: 'NABIL-EFT-441102',
        paymentDate: '2026-10-17',
        verificationStatus: 'pending',
        createdAt: '2026-10-17T15:40:00Z',
      },
    ];
  });

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('wbms_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('wbms_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('wbms_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('wbms_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('wbms_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wbms_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('wbms_dispatch', JSON.stringify(dispatchRecords));
  }, [dispatchRecords]);

  useEffect(() => {
    localStorage.setItem('wbms_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('wbms_payment_claims', JSON.stringify(paymentClaims));
  }, [paymentClaims]);

  useEffect(() => {
    localStorage.setItem('wbms_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const activeStaffName = currentRole === 'owner' ? 'Owner / General Manager' :
    currentRole === 'admin' ? 'Operations Admin' :
    currentRole === 'inventory_manager' ? 'Warehouse Manager' :
    currentRole === 'sales_staff' ? 'Sales Desk Officer' :
    currentRole === 'accounts_staff' ? 'Chief Accountant' :
    currentRole === 'dispatch_staff' ? 'Logistics Coordinator' :
    (currentCustomer?.name || 'Customer');

  const logAction = (action: string, entityType: AuditLog['entityType'], entityId: string, details: string) => {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId: currentCustomer?.id || `staff-${currentRole}`,
      actorEmail: currentCustomer?.email || `${currentRole}@wholesale.internal`,
      actorRole: currentRole,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // Company Settings
  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    if (currentRole !== 'owner') {
      return { success: false, error: 'Authorization Denied: Only Owner can modify company settings.' };
    }
    setCompanySettings(prev => ({ ...prev, ...newSettings }));
    logAction('UPDATE_SETTINGS', 'settings', 'company', 'Company business settings updated by Owner.');
    return { success: true };
  };

  // Products
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canManageProducts) {
      return { success: false, error: 'Unauthorized: Role lacks product creation privilege.' };
    }
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProd, ...prev]);
    logAction('CREATE_PRODUCT', 'product', newProd.id, `Created product ${newProd.name} (SKU: ${newProd.sku})`);
    return { success: true };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canManageProducts) {
      return { success: false, error: 'Unauthorized: Role lacks product modification privilege.' };
    }
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    logAction('UPDATE_PRODUCT', 'product', id, `Updated fields: ${Object.keys(updates).join(', ')}`);
    return { success: true };
  };

  const adjustStock = (productId: string, delta: number, reason: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canManageInventory) {
      return { success: false, error: 'Unauthorized: Role cannot modify inventory.' };
    }
    const target = products.find(p => p.id === productId);
    if (!target) return { success: false, error: 'Product not found.' };

    const newStock = target.availableStock + delta;
    if (newStock < 0) {
      return { success: false, error: 'Stock cannot be negative.' };
    }

    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, availableStock: newStock, updatedAt: new Date().toISOString() } : p))
    );
    logAction('STOCK_ADJUSTMENT', 'inventory', productId, `Adjusted stock by ${delta} packs (New: ${newStock}). Reason: ${reason}`);
    return { success: true };
  };

  // Customers
  const registerCustomer = (profileData: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    businessAddress: string;
    panVatNumber?: string;
    licenseNumber?: string;
  }) => {
    // New customer is placed into 'pending' status with default Tier 'F' (lowest limit)
    const newCust: CustomerProfile = {
      id: `cust-${Date.now()}`,
      uid: `uid-${Date.now()}`,
      ...profileData,
      category: 'F', // Default lowest tier NPR 35,000 until reviewed
      status: 'pending',
      createdAt: new Date().toISOString(),
      staffNotes: 'Self-registered wholesale business. Awaiting PAN/VAT & license review.',
    };
    setCustomers(prev => [...prev, newCust]);
    setCurrentCustomer(newCust);
    logAction('CUSTOMER_REGISTER', 'customer', newCust.id, `New wholesale customer registration: ${newCust.businessName}`);
    return { success: true, customerId: newCust.id };
  };

  const updateCustomerCategory = (customerId: string, newCategory: CustomerCategory) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canChangeCustomerCategory) {
      return { success: false, error: 'Unauthorized: Only Owner or Admin can assign customer credit categories.' };
    }
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, category: newCategory, updatedAt: new Date().toISOString() } : c))
    );
    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => prev ? { ...prev, category: newCategory } : null);
    }
    logAction('UPDATE_CATEGORY', 'customer', customerId, `Changed category to ${newCategory} (Max Limit: NPR ${companySettings.categoryLimits[newCategory]})`);
    return { success: true };
  };

  const updateCustomerStatus = (customerId: string, newStatus: AccountStatus, notes?: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canApproveCustomers) {
      return { success: false, error: 'Unauthorized: Role cannot approve or change customer status.' };
    }
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              status: newStatus,
              staffNotes: notes ? `${c.staffNotes || ''}\n[${new Date().toLocaleDateString()}] ${notes}` : c.staffNotes,
              approvedBy: newStatus === 'active' ? activeStaffName : c.approvedBy,
              approvedAt: newStatus === 'active' ? new Date().toISOString() : c.approvedAt,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    if (currentCustomer?.id === customerId) {
      setCurrentCustomer(prev => prev ? { ...prev, status: newStatus } : null);
    }
    logAction('CUSTOMER_STATUS', 'customer', customerId, `Updated customer status to ${newStatus}`);
    return { success: true };
  };

  // Cart operations
  const addToCart = (product: Product, quantityPacks = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantityPacks: item.quantityPacks + quantityPacks }
            : item
        );
      }
      return [...prev, { product, quantityPacks }];
    });
  };

  const updateCartQuantity = (productId: string, quantityPacks: number) => {
    if (quantityPacks <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantityPacks } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.wholesalePriceNpr * item.quantityPacks, 0);
  };

  const getCartVatAmount = () => {
    const subtotal = getCartSubtotal();
    return (subtotal * companySettings.defaultVatPercent) / 100;
  };

  const getCartTotal = () => {
    return getCartSubtotal() + getCartVatAmount();
  };

  // Trusted Backend-enforced Order Submission
  const submitOrder = (shippingAddress: string, contactPhone: string, notes?: string) => {
    if (!currentCustomer) {
      return { success: false, error: 'Please log in as an authorized wholesale customer first.' };
    }
    if (currentCustomer.status !== 'active') {
      return { success: false, error: `Your wholesale account is currently '${currentCustomer.status}'. Orders can only be submitted by active accounts.` };
    }
    if (cart.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // Backend price and limit revalidation (never trusting frontend-submitted total)
    const categoryLimit = companySettings.categoryLimits[currentCustomer.category] || 35000;
    let validatedSubtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of cart) {
      // Re-fetch current authorized price and stock directly from master list
      const liveProduct = products.find(p => p.id === item.product.id);
      if (!liveProduct || !liveProduct.isActive) {
        return { success: false, error: `Product '${item.product.name}' is no longer available.` };
      }
      if (liveProduct.availableStock < item.quantityPacks) {
        return { success: false, error: `Insufficient stock for '${liveProduct.name}'. Available: ${liveProduct.availableStock} packs.` };
      }
      if (item.quantityPacks < liveProduct.minOrderQuantity) {
        return { success: false, error: `Minimum order for '${liveProduct.name}' is ${liveProduct.minOrderQuantity} packs.` };
      }

      const lineTotal = liveProduct.wholesalePriceNpr * item.quantityPacks;
      validatedSubtotal += lineTotal;
      orderItems.push({
        productId: liveProduct.id,
        sku: liveProduct.sku,
        productName: liveProduct.name,
        unitPriceNpr: liveProduct.wholesalePriceNpr,
        quantityPacks: item.quantityPacks,
        packSize: 10,
        totalGarments: item.quantityPacks * 10,
        lineTotalNpr: lineTotal,
      });
    }

    const testAmount = companySettings.applyLimitBeforeTax
      ? validatedSubtotal
      : validatedSubtotal + (validatedSubtotal * companySettings.defaultVatPercent) / 100;

    if (testAmount > categoryLimit) {
      return {
        success: false,
        error: `Order limit exceeded! Your Tier ${currentCustomer.category} allows a maximum of NPR ${categoryLimit.toLocaleString('en-IN')}. Current order evaluation is NPR ${testAmount.toLocaleString('en-IN')}. Please adjust pack quantities or contact management for limit upgrades.`,
      };
    }

    const vatAmount = (validatedSubtotal * companySettings.defaultVatPercent) / 100;
    const grandTotal = validatedSubtotal + vatAmount;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-${String(orders.length + 101).padStart(5, '0')}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      businessName: currentCustomer.businessName,
      customerCategory: currentCustomer.category,
      categoryLimitNpr: categoryLimit,
      items: orderItems,
      subtotalNpr: validatedSubtotal,
      discountNpr: 0,
      taxNpr: vatAmount,
      totalNpr: grandTotal,
      status: 'submitted',
      shippingAddress,
      contactPhone,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Atomically decrement stock
    setProducts(prev =>
      prev.map(p => {
        const ordered = orderItems.find(oi => oi.productId === p.id);
        if (ordered) {
          return { ...p, availableStock: p.availableStock - ordered.quantityPacks };
        }
        return p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    logAction('ORDER_SUBMITTED', 'order', newOrder.id, `Order ${newOrder.orderNumber} placed by ${currentCustomer.businessName}. Total: NPR ${grandTotal}`);
    return { success: true, orderId: newOrder.id };
  };

  // Orders Management
  const updateOrderStatus = (orderId: string, newStatus: Order['status'], note?: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    // Check permission rules: Customers cannot approve, dispatch, or mark orders paid
    if (currentRole === 'customer') {
      return { success: false, error: 'Customers cannot change order operational status.' };
    }
    if ((newStatus === 'approved' || newStatus === 'rejected') && !perms.canApproveOrders) {
      return { success: false, error: 'Unauthorized: Role lacks authority to approve or reject orders.' };
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            staffNotes: note ? `${o.staffNotes || ''}\n[${new Date().toLocaleDateString()}] ${note}` : o.staffNotes,
            approvedBy: newStatus === 'approved' ? activeStaffName : o.approvedBy,
            approvedAt: newStatus === 'approved' ? new Date().toISOString() : o.approvedAt,
            dispatchedAt: newStatus === 'dispatched' ? new Date().toISOString() : o.dispatchedAt,
            deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : o.deliveredAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    logAction('ORDER_STATUS_UPDATE', 'order', orderId, `Order status changed to '${newStatus}' by ${activeStaffName}`);
    return { success: true };
  };

  // Payments
  const submitPaymentClaim = (claimData: Omit<PaymentClaim, 'id' | 'verificationStatus' | 'createdAt'>) => {
    const newClaim: PaymentClaim = {
      ...claimData,
      id: `claim-${Date.now()}`,
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    setPaymentClaims(prev => [newClaim, ...prev]);
    
    // Update order status to payment_verification_pending
    setOrders(prev =>
      prev.map(o => (o.id === claimData.orderId ? { ...o, status: 'payment_verification_pending', paymentClaimId: newClaim.id, updatedAt: new Date().toISOString() } : o))
    );

    logAction('PAYMENT_CLAIM_SUBMITTED', 'payment', newClaim.id, `Payment claim for ${newClaim.orderNumber} (Ref: ${newClaim.paymentReference})`);
    return { success: true, claimId: newClaim.id };
  };

  const verifyPayment = (claimId: string, status: 'verified' | 'rejected', notes?: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canVerifyPayments) {
      return { success: false, error: 'Unauthorized: Only Accounts Staff or Owner can verify payments.' };
    }

    const claim = paymentClaims.find(c => c.id === claimId);
    if (!claim) return { success: false, error: 'Payment claim not found.' };

    setPaymentClaims(prev =>
      prev.map(c =>
        c.id === claimId
          ? {
              ...c,
              verificationStatus: status,
              verifiedBy: activeStaffName,
              verifiedAt: new Date().toISOString(),
              verificationNotes: notes,
            }
          : c
      )
    );

    // If verified, mark order as paid & record ledger entry
    if (status === 'verified') {
      setOrders(prev =>
        prev.map(o => (o.id === claim.orderId ? { ...o, status: 'paid', updatedAt: new Date().toISOString() } : o))
      );

      // Create ledger income entry
      const ledgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        entryType: 'income',
        amountNpr: claim.amountClaimedNpr,
        accountCategory: 'Wholesale Sales Revenue',
        referenceNumber: claim.orderNumber,
        partyName: claim.customerBusinessName,
        transactionDate: new Date().toISOString().split('T')[0],
        recordedBy: activeStaffName,
        notes: `Payment verified via ${claim.paymentMethod}. Ref: ${claim.paymentReference}`,
        createdAt: new Date().toISOString(),
      };
      setLedger(prev => [ledgerEntry, ...prev]);
    } else {
      setOrders(prev =>
        prev.map(o => (o.id === claim.orderId ? { ...o, status: 'awaiting_payment', updatedAt: new Date().toISOString() } : o))
      );
    }

    logAction('PAYMENT_VERIFIED', 'payment', claimId, `Payment ${claim.orderNumber} marked as ${status} by ${activeStaffName}`);
    return { success: true };
  };

  // Invoices & Dispatch
  const generateInvoice = (orderId: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canGenerateInvoices) {
      return { success: false, error: 'Unauthorized: Role cannot generate tax invoices.' };
    }
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    const customer = customers.find(c => c.id === order.customerId);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 101).padStart(5, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerBusinessName: order.businessName,
      customerAddress: order.shippingAddress,
      panVatNumber: customer?.panVatNumber || 'N/A',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: order.items,
      subtotalNpr: order.subtotalNpr,
      discountNpr: order.discountNpr,
      vatRatePercent: companySettings.defaultVatPercent,
      vatAmountNpr: order.taxNpr,
      totalNpr: order.totalNpr,
      paymentStatus: order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered' ? 'paid' : 'unpaid',
      generatedBy: activeStaffName,
      notes: 'Official wholesale tax invoice compliant with Nepal IRD guidelines.',
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, invoiceId: newInvoice.id } : o)));
    logAction('GENERATE_INVOICE', 'invoice', newInvoice.id, `Generated invoice ${newInvoice.invoiceNumber} for ${order.orderNumber}`);
    return { success: true, invoiceId: newInvoice.id };
  };

  const createDispatchRecord = (record: Omit<DispatchRecord, 'id'>) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canManageDispatch) {
      return { success: false, error: 'Unauthorized: Role cannot create dispatch records.' };
    }
    const newRecord: DispatchRecord = {
      ...record,
      id: `disp-${Date.now()}`,
    };
    setDispatchRecords(prev => [newRecord, ...prev]);
    // Set order status to dispatched
    setOrders(prev => prev.map(o => (o.id === record.orderId ? { ...o, status: 'dispatched', dispatchedAt: record.dispatchDate, updatedAt: new Date().toISOString() } : o)));
    logAction('DISPATCH_RECORD_CREATED', 'dispatch', newRecord.id, `Dispatched Order ${record.orderNumber} via ${record.transporterName} (Bilty: ${record.trackingOrBiltyNumber})`);
    return { success: true, dispatchId: newRecord.id };
  };

  const updateDispatchStatus = (dispatchId: string, status: DispatchRecord['status']) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canManageDispatch) {
      return { success: false, error: 'Unauthorized: Role cannot update dispatch status.' };
    }
    setDispatchRecords(prev =>
      prev.map(d => (d.id === dispatchId ? { ...d, status } : d))
    );
    if (status === 'delivered') {
      const record = dispatchRecords.find(d => d.id === dispatchId);
      if (record) {
        setOrders(prev => prev.map(o => (o.id === record.orderId ? { ...o, status: 'delivered', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : o)));
      }
    }
    logAction('UPDATE_DISPATCH_STATUS', 'dispatch', dispatchId, `Dispatch marked as ${status}`);
    return { success: true };
  };

  // Private Ledger
  const addLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canModifyLedger) {
      return { success: false, error: 'Unauthorized: Restricted Ledger can only be modified by Accounts Staff or Owner.' };
    }
    const newEntry: LedgerEntry = {
      ...entry,
      id: `led-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLedger(prev => [newEntry, ...prev]);
    logAction('ADD_LEDGER_ENTRY', 'ledger', newEntry.id, `Recorded ${entry.entryType} of NPR ${entry.amountNpr} (${entry.accountCategory})`);
    return { success: true };
  };

  const reverseLedgerEntry = (entryId: string, reason: string) => {
    const perms = ROLE_PERMISSIONS[currentRole];
    if (!perms.canModifyLedger) {
      return { success: false, error: 'Unauthorized: Only Accounts Staff or Owner can reverse ledger entries.' };
    }
    setLedger(prev =>
      prev.map(l => (l.id === entryId ? { ...l, isReversed: true, reversalReason: reason } : l))
    );
    logAction('REVERSE_LEDGER_ENTRY', 'ledger', entryId, `Ledger entry reversed. Reason: ${reason}`);
    return { success: true };
  };

  const t = translations[language];

  return (
    <WholesaleContext.Provider
      value={{
        language,
        setLanguage,
        t,
        companySettings,
        updateCompanySettings,
        currentRole,
        setCurrentRole,
        currentCustomer,
        setCurrentCustomer,
        activeStaffName,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        customers,
        registerCustomer,
        updateCustomerCategory,
        updateCustomerStatus,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getCartSubtotal,
        getCartVatAmount,
        getCartTotal,
        submitOrder,
        orders,
        updateOrderStatus,
        paymentClaims,
        submitPaymentClaim,
        verifyPayment,
        invoices,
        generateInvoice,
        dispatchRecords,
        createDispatchRecord,
        updateDispatchStatus,
        ledger,
        addLedgerEntry,
        reverseLedgerEntry,
        distributors,
        auditLogs,
        logAction,
      }}
    >
      {children}
    </WholesaleContext.Provider>
  );
};

export const useWholesale = () => {
  const context = useContext(WholesaleContext);
  if (!context) {
    throw new Error('useWholesale must be used within a WholesaleProvider');
  }
  return context;
};
