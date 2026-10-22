/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// ROLES & ACCESS CONTROL
// ============================================================================

export type UserRole =
  | 'owner'
  | 'admin'
  | 'inventory_manager'
  | 'sales_staff'
  | 'accounts_staff'
  | 'dispatch_staff'
  | 'customer';

export type CustomerCategory = 'C' | 'B' | 'F';

export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface RolePermissions {
  canManageProducts: boolean;
  canViewCostPrices: boolean;
  canManageInventory: boolean;
  canApproveCustomers: boolean;
  canChangeCustomerCategory: boolean;
  canReviewOrders: boolean;
  canApproveOrders: boolean;
  canVerifyPayments: boolean;
  canGenerateInvoices: boolean;
  canManageDispatch: boolean;
  canViewLedger: boolean;
  canModifyLedger: boolean;
  canManageStaff: boolean;
  canModifyCompanySettings: boolean;
  canViewAuditLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canManageProducts: true,
    canViewCostPrices: true,
    canManageInventory: true,
    canApproveCustomers: true,
    canChangeCustomerCategory: true,
    canReviewOrders: true,
    canApproveOrders: true,
    canVerifyPayments: true,
    canGenerateInvoices: true,
    canManageDispatch: true,
    canViewLedger: true,
    canModifyLedger: true,
    canManageStaff: true,
    canModifyCompanySettings: true,
    canViewAuditLogs: true,
  },
  admin: {
    canManageProducts: true,
    canViewCostPrices: true,
    canManageInventory: true,
    canApproveCustomers: true,
    canChangeCustomerCategory: true,
    canReviewOrders: true,
    canApproveOrders: true,
    canVerifyPayments: true,
    canGenerateInvoices: true,
    canManageDispatch: true,
    canViewLedger: true,
    canModifyLedger: false,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: true,
  },
  inventory_manager: {
    canManageProducts: true,
    canViewCostPrices: false,
    canManageInventory: true,
    canApproveCustomers: false,
    canChangeCustomerCategory: false,
    canReviewOrders: false,
    canApproveOrders: false,
    canVerifyPayments: false,
    canGenerateInvoices: false,
    canManageDispatch: true,
    canViewLedger: false,
    canModifyLedger: false,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: false,
  },
  sales_staff: {
    canManageProducts: false,
    canViewCostPrices: false,
    canManageInventory: false,
    canApproveCustomers: true,
    canChangeCustomerCategory: false,
    canReviewOrders: true,
    canApproveOrders: true,
    canVerifyPayments: false,
    canGenerateInvoices: true,
    canManageDispatch: false,
    canViewLedger: false,
    canModifyLedger: false,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: false,
  },
  accounts_staff: {
    canManageProducts: false,
    canViewCostPrices: true,
    canManageInventory: false,
    canApproveCustomers: false,
    canChangeCustomerCategory: false,
    canReviewOrders: false,
    canApproveOrders: false,
    canVerifyPayments: true,
    canGenerateInvoices: true,
    canManageDispatch: false,
    canViewLedger: true,
    canModifyLedger: true,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: true,
  },
  dispatch_staff: {
    canManageProducts: false,
    canViewCostPrices: false,
    canManageInventory: false,
    canApproveCustomers: false,
    canChangeCustomerCategory: false,
    canReviewOrders: false,
    canApproveOrders: false,
    canVerifyPayments: false,
    canGenerateInvoices: false,
    canManageDispatch: true,
    canViewLedger: false,
    canModifyLedger: false,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: false,
  },
  customer: {
    canManageProducts: false,
    canViewCostPrices: false,
    canManageInventory: false,
    canApproveCustomers: false,
    canChangeCustomerCategory: false,
    canReviewOrders: false,
    canApproveOrders: false,
    canVerifyPayments: false,
    canGenerateInvoices: false,
    canManageDispatch: false,
    canViewLedger: false,
    canModifyLedger: false,
    canManageStaff: false,
    canModifyCompanySettings: false,
    canViewAuditLogs: false,
  },
};

// ============================================================================
// CATEGORY LIMITS (NPR)
// ============================================================================

export const DEFAULT_CATEGORY_LIMITS: Record<CustomerCategory, number> = {
  C: 200000, // NPR 200,000 max order value
  B: 75000,  // NPR 75,000 max order value
  F: 35000,  // NPR 35,000 max order value
};

// ============================================================================
// USER & CUSTOMER PROFILES
// ============================================================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  panVatNumber?: string;
  licenseNumber?: string;
  category: CustomerCategory;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
  staffNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export type GarmentCategory =
  | 'Formal Shirts'
  | 'Casual & Flannel Shirts'
  | 'Denim Jeans & Trousers'
  | 'Hoodies & Sweatshirts'
  | 'Knitwear & Sweaters'
  | 'T-Shirts & Polos'
  | 'Traditional & Kurtis'
  | 'Jackets & Outerwear';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: GarmentCategory | string;
  images: string[];
  wholesalePriceNpr: number;
  costPriceNpr?: number; // Restricted to authorized staff (owner, accounts)
  availableStock: number;
  minOrderQuantity: number; // e.g., pack of 10 or 12
  fabricComposition: string; // e.g., "100% Combed Cotton, 220 GSM"
  sizeRun: string; // e.g., "S, M, L, XL, XXL (ratio 1:2:2:2:1)"
  colorVariants: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'inbound' | 'outbound_order' | 'adjustment' | 'return';
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceId?: string; // Order ID or Supplier Invoice
  reason: string;
  performedBy: string;
  timestamp: string;
}

// ============================================================================
// ORDERS & ITEMS
// ============================================================================

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'awaiting_payment'
  | 'payment_verification_pending'
  | 'paid'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  unitPriceNpr: number;
  quantityPacks: number;
  packSize: number; // e.g., 10 garments per pack
  totalGarments: number;
  lineTotalNpr: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-2026-00101
  customerId: string;
  customerName: string;
  businessName: string;
  customerCategory: CustomerCategory;
  categoryLimitNpr: number;
  items: OrderItem[];
  subtotalNpr: number;
  discountNpr: number;
  taxNpr: number; // VAT if configured
  totalNpr: number;
  status: OrderStatus;
  shippingAddress: string;
  contactPhone: string;
  notes?: string;
  staffNotes?: string;
  rejectionReason?: string;
  paymentClaimId?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

// ============================================================================
// PAYMENTS & QR VERIFICATION
// ============================================================================

export type PaymentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentClaim {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerBusinessName: string;
  amountClaimedNpr: number;
  paymentMethod: 'fonepay_qr' | 'bank_transfer' | 'esewa' | 'khalti' | 'cash_deposit';
  paymentReference: string; // e.g., Bank transaction ID or Fonepay reference
  paymentDate: string;
  proofDocumentUrl?: string; // Private screenshot or deposit slip
  verificationStatus: PaymentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
}

// ============================================================================
// INVOICES & DISPATCH
// ============================================================================

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0042
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  customerAddress: string;
  panVatNumber?: string;
  issueDate: string;
  dueDate: string;
  items: OrderItem[];
  subtotalNpr: number;
  discountNpr: number;
  vatRatePercent: number;
  vatAmountNpr: number;
  totalNpr: number;
  paymentStatus: 'unpaid' | 'paid';
  generatedBy: string;
  notes?: string;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceId?: string;
  customerBusinessName: string;
  destinationAddress: string;
  transporterName: string; // e.g. Sundar Yatayat, City Cargo, Pathao Freight
  trackingOrBiltyNumber: string; // Cargo bilty receipt number
  driverPhone?: string;
  totalCartons: number;
  dispatchDate: string;
  estimatedArrival?: string;
  status: 'packed' | 'in_transit' | 'delivered';
  dispatchedBy: string;
  notes?: string;
}

// ============================================================================
// RESTRICTED ACCOUNTING LEDGER
// ============================================================================

export type LedgerEntryType =
  | 'income'
  | 'expense'
  | 'customer_receivable'
  | 'supplier_payable'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  entryType: LedgerEntryType;
  amountNpr: number;
  accountCategory: string; // e.g. "Fabric Procurement", "Sales Revenue", "Freight", "Operational Expense"
  referenceNumber: string; // Invoice / Bilty / Voucher number
  partyName: string; // Customer, Textile Mill, Transporter
  transactionDate: string;
  recordedBy: string;
  notes: string;
  isReversed?: boolean;
  reversalReason?: string;
  createdAt: string;
}

// ============================================================================
// DISTRIBUTOR / MEMBER HIERARCHY
// ============================================================================

export interface DistributorMember {
  id: string;
  code: string; // e.g., DIST-NP-01
  fullName: string;
  businessName: string;
  territory: string; // e.g., Pokhara & Western Region, Biratnagar, Narayangarh
  parentMemberId?: string;
  level: number; // 1 = Primary Regional Distributor, 2 = District Partner, 3 = Local Wholesaler
  status: 'active' | 'suspended';
  contactPhone: string;
  joinedDate: string;
  totalOrdersAllocated: number;
  totalVolumeNpr: number;
}

// ============================================================================
// COMPANY SETTINGS & AUDIT
// ============================================================================

export interface CompanySettings {
  businessName: string;
  temporaryDisplayName: string;
  legalEntityName: string;
  panVatNumber: string;
  registeredAddress: string;
  primaryPhone: string;
  supportEmail: string;
  currencyCode: 'NPR';
  currencySymbol: 'रू' | 'NPR';
  defaultVatPercent: number; // 13% standard in Nepal (or 0% exempt wholesale)
  applyLimitBeforeTax: boolean;
  categoryLimits: Record<CustomerCategory, number>;
  qrPaymentImageUrl: string;
  bankAccountDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    date: string;
    isImportant: boolean;
  }>;
  upcomingPlans: Array<{
    id: string;
    title: string;
    season: string;
    description: string;
    expectedDate: string;
  }>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: 'product' | 'inventory' | 'customer' | 'order' | 'payment' | 'invoice' | 'dispatch' | 'ledger' | 'settings' | 'serial_user';
  entityId: string;
  details: string;
}

// ============================================================================
// SERIAL AUTHENTICATION & CBF USER ACCOUNTS
// ============================================================================

export interface SerialUserAccount {
  id: string;
  userNumber: string; // e.g. C-10023, B-20045, F-30018
  customerId: string;
  customerName: string;
  businessName: string;
  phone: string;
  email: string;
  category: CustomerCategory;
  status: 'active' | 'pending_activation' | 'suspended' | 'revoked';
  passwordHash: string; // SHA-256 + salt (never plaintext)
  salt: string;
  activationCode?: string; // One-time token to set initial password
  tempResetToken?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STOREFRONT WISHLIST (PER-USER PRIVATE)
// ============================================================================

export interface StorefrontWishlistItem {
  id: string;
  userNumber: string; // Private to this authenticated user number
  productId: string;
  productName: string;
  sku: string;
  category: string;
  imageUrl?: string;
  fabric?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedVariantId?: string;
  notes?: string;
  addedAt: string;
}

// ============================================================================
// CENTRAL ORDERS & ATOMIC INVENTORY BILLING
// ============================================================================

export type CentralOrderStatus =
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Billed'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface CentralOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  designStyleCode?: string;
  unit: string;
  requestedQuantity: number;
  approvedQuantity: number;
  billedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock?: number;
}

export interface CentralOrderAuditEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  counterId?: string;
  details: string;
}

export interface CentralOrder {
  id: string;
  orderNumber: string; // e.g. ORD-2026-00101
  userNumber: string; // Issued User/Serial Number (e.g. C-10023)
  customerId: string;
  customerName: string;
  businessName: string;
  customerCategory: CustomerCategory; // Strict C / B / F validation
  status: CentralOrderStatus;
  submissionDate: string;
  shippingAddress: string;
  contactPhone: string;
  customerNotes?: string;
  staffNotes?: string;
  items: CentralOrderItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  invoiceNumber?: string;
  billedDate?: string;
  billedByStaff?: string;
  billingCounterId?: string;
  approvedByStaff?: string;
  approvedDate?: string;
  dispatchedDate?: string;
  trackingNumber?: string;
  transporterName?: string;
  rejectionReason?: string;
  auditTrail: CentralOrderAuditEntry[];
}

// ============================================================================
// CENTRAL BILLING WORKSTATIONS & AUDIT
// ============================================================================

export interface BillingCounter {
  id: string;
  code: string; // e.g. COUNTER-01, COUNTER-02, COUNTER-03
  name: string;
  location: string;
  isOnline: boolean;
  lastActive: string;
}

export interface SerialCounterRecord {
  category: CustomerCategory;
  lastNumber: number;
  updatedAt: string;
}

export interface CbfAmountsConfig {
  C: number | null;
  B: number | null;
  F: number | null;
}

