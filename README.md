# Wholesale Clothing Management System
### Professional, Offline-First PWA for Garment & Apparel Distribution

A complete, production-minded, offline-first web application tailored for wholesale clothing businesses, distributors, and single-operator garment warehouses. Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **IndexedDB**.

---

## 🌟 Key Features

### 1. 100% Offline-First Architecture (PWA)
- **Zero Mandatory Cloud Dependency**: Runs completely offline once loaded or installed on desktop, tablet, or mobile.
- **Client-Side Storage**: Powered by browser-native **IndexedDB** (`wholesale_clothing_db_v1`) with transactional consistency.
- **Service Worker & App Manifest**: Pre-caches all app shell assets, styles, fonts, and icons for instant offline launch.
- **Local Owner PIN Lock**: Protects sensitive pricing, cost of goods sold (COGS), and financial reports with client-side SHA-256 PIN hashing and auto-lock timers.

### 2. Fast POS Cash-Only Billing
- **Wholesale-Optimized Counter Interface**: Fast SKU and product search with real-time stock availability.
- **Multi-Variant Garment Matrix**: Select specific **Sizes** (XS, S, M, L, XL, XXL, Free Size, Custom) and **Colors** (Navy, Charcoal, Olive, Maroon, etc.).
- **Units & Packs**: Support for single pieces, 6-piece packs, 12-piece dozens, and cartons.
- **Instant Change Calculation**: Cash-only billing with tender calculator (e.g. NPR 5,000 received → NPR 450 change).
- **Controlled Reversals & Refunds**: Full audit trail for cancelled or refunded sales, automatically restoring the exact variant stock quantities.
- **Dual Invoice Formats**: Instant 1-click generation of **A4 Full Wholesale Tax Invoices** and **80mm Thermal Receipts** with browser printing and PDF export.

### 3. Garment Product Catalog & Inventory
- **Granular Variant Tracking**: Inventory tracked separately for every size and color combination.
- **Stock Movement Ledger**: Complete timestamped audit history for every inbound shipment, cash sale, stock adjustment, damage write-off, or return.
- **Strict Negative Stock Prevention**: System rejects sales that exceed current stock, unless explicit owner override is unlocked.
- **Low-Stock Alerts**: Visual threshold indicators highlighting fast-depleting sizes or colors.

### 4. Supplier Purchases & Stock Inbound
- **Mill / Supplier Intake**: Record inbound shipments with invoice numbers, suppliers, variant quantities, and purchase costs.
- **Stock Adjustments & Write-Offs**: Handle customer returns, supplier returns, damaged goods, and inventory audit corrections with logged reason codes.
- **Duplicate Prevention**: Debounced transaction handlers prevent duplicate billing or double inventory deductions.

### 5. Financial Reports & Profit Analytics
- **Wholesale Sales Breakdown**: Daily, weekly, monthly, and custom range revenue summaries.
- **Cost of Goods Sold (COGS) & Gross Margin**: Accurate profit calculation comparing selling prices against variant purchase costs.
- **Top Performing Garments**: Volume and revenue ranking by category and variant.

### 6. Data Portability, Backup & Disaster Recovery
- **JSON Database Backup**: 1-click snapshot export of all products, stock variants, sales records, purchase logs, and audit trails.
- **Safe JSON Restore**: Validated file restore with schema verification and pre-restore confirmation.
- **Spreadsheet Exports**: Standard CSV exports for Products & Prices, Variant Inventory, and Cash Sales.
- **Project Archive**: In-app download of the complete source code as a ZIP archive.

### 7. Built-in Offline Test Suite
- Automated 9-point self-test suite testing:
  - Database Initialization
  - Variant Stock Deductions
  - Negative Stock Enforcement
  - Change Calculations
  - Controlled Sale Reversals & Stock Restoration
  - Damage Write-Off Audits
  - JSON Backup & Schema Integrity
  - CSV Serialization
  - Offline Service Worker Cache Registration

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: Version 18.x or 20.x or higher
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

1. **Extract or clone the project files**:
   ```bash
   cd wholesale-clothing-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for production / PWA distribution**:
   ```bash
   npm run build
   ```
   The compiled assets will be placed in the `dist/` directory, ready to be served statically by Nginx, Apache, Caddy, Vercel, Netlify, or any static file host.

5. **Preview the production build**:
   ```bash
   npm run preview
   ```

---

## 📁 Project Architecture & File Structure

```text
├── index.html                   # HTML entry point, PWA meta tags, and web manifest link
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS and Vite-PWA plugin
├── metadata.json                # Application metadata
├── public/
│   ├── icon.svg                 # Scalable PWA vector icon
│   ├── wholesale-clothing-management-system.zip    # Full ready-to-run ZIP archive
│   └── wholesale-clothing-management-system.tar.gz # Full tarball archive
├── src/
│   ├── main.tsx                 # React application mounting point
│   ├── App.tsx                  # Core application shell, navigation bar, and tab router
│   ├── index.css                # Tailwind CSS v4 styling rules and typography
│   │
│   ├── types/
│   │   └── index.ts             # Complete TypeScript interfaces (Products, Variants, Sales, etc.)
│   │
│   ├── db/
│   │   └── indexedDb.ts         # IndexedDB storage engine, schemas, seeds, and CRUD transactions
│   │
│   ├── context/
│   │   ├── ClothingWholesaleContext.tsx  # Central offline wholesale state and business rules
│   │   └── WholesaleContext.tsx          # Preserved public B2B marketplace context
│   │
│   ├── hooks/
│   │   ├── useOnlineStatus.ts   # Real-time online/offline network detection
│   │   └── usePWAInstall.ts     # PWA browser installation prompt handler
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── OfflineStatusBanner.tsx   # Offline status indicator and PWA install button
│   │   │   └── AppLockScreen.tsx         # Secure PIN entry screen for owner protection
│   │   │
│   │   ├── pos/
│   │   │   └── CashBillingPos.tsx        # Fast POS billing counter, receipts, and invoices
│   │   │
│   │   ├── products/
│   │   │   └── ProductCatalogManager.tsx # Product catalog, size/color variant matrix, stock limits
│   │   │
│   │   ├── purchases/
│   │   │   └── PurchasesAndStockManager.tsx # Stock intake, damaged goods write-offs, returns
│   │   │
│   │   ├── reports/
│   │   │   └── OfflineReportsDashboard.tsx # Revenue, COGS, gross margins, and sales graphs
│   │   │
│   │   ├── backup/
│   │   │   └── BackupRestoreManager.tsx  # JSON database backup/restore, CSV exports, ZIP download
│   │   │
│   │   ├── settings/
│   │   │   └── OwnerSettingsModal.tsx    # Business details, invoice prefixes, tax, PIN management
│   │   │
│   │   ├── tests/
│   │   │   └── OfflineTestSuite.tsx      # Automated 9-point offline verification suite
│   │   │
│   │   ├── layout/
│   │   │   └── Navbar.tsx                # Preserved top navigation bar
│   │   │
│   │   ├── public/                       # Preserved public B2B digital catalog and storefront
│   │   │   ├── HeroAndFeatures.tsx
│   │   │   ├── CatalogueSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── AnnouncementsSection.tsx
│   │   │   ├── FuturePlansSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   ├── CartModal.tsx
│   │   │   └── AuthModal.tsx
│   │   │
│   │   └── dashboard/
│   │       └── DashboardLayout.tsx       # Preserved administrative office desks
│   │
│   ├── data/
│   │   ├── clothingSeed.ts      # Initial offline catalog (Jeans, Shirts, Hoodies, T-Shirts)
│   │   └── initialData.ts       # Preserved initial wholesale dataset
│   │
│   └── i18n/
│       └── index.ts             # English & Nepali translation strings and NPR currency formatter
```

---

## 🔒 Security & Privacy Notice
- **100% Client-Side Privacy**: No customer details, wholesale purchase prices, or sales revenue figures are uploaded to third-party tracking services or external databases.
- **IndexedDB Isolation**: Data is stored inside the browser's origin-sandboxed IndexedDB database.
- **Disaster Recovery Best Practice**: Because browser storage can be cleared if the browser cache is wiped, owners should regularly export a **JSON Database Backup** from the Backup & Restore screen and store it on an external flash drive or secure storage drive.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
