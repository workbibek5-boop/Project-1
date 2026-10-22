/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WholesaleProvider } from './context/WholesaleContext';
import { ClothingWholesaleProvider, useClothingWholesale } from './context/ClothingWholesaleContext';
import { clothingDb } from './db/indexedDb';
import { SerialUserAccount } from './types';

// Core 5 Primary Section Components & Settings
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { AppLockScreen } from './components/common/AppLockScreen';
import { AppSidebar } from './components/layout/AppSidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { CustomerManager } from './components/customers/CustomerManager';
import { InventoryWorkspace } from './components/inventory/InventoryWorkspace';
import { TransactionsWorkspace } from './components/pos/TransactionsWorkspace';
import { OfflineReportsDashboard } from './components/reports/OfflineReportsDashboard';
import { SettingsMoreModal } from './components/settings/SettingsMoreModal';

// Preserved Public B2B Website & Storefront Modules
import { HeroAndFeatures } from './components/public/HeroAndFeatures';
import { CatalogueSection } from './components/public/CatalogueSection';
import { WishlistSection } from './components/public/WishlistSection';
import { OrderTrackingSection } from './components/public/OrderTrackingSection';
import { AboutSection } from './components/public/AboutSection';
import { AnnouncementsSection } from './components/public/AnnouncementsSection';
import { FuturePlansSection } from './components/public/FuturePlansSection';
import { ContactSection } from './components/public/ContactSection';
import { CartModal } from './components/public/CartModal';
import { AuthModal } from './components/public/AuthModal';

import {
  CreditCard,
  Menu,
  Sparkles,
  Settings,
  Lock,
  Package,
  Boxes,
  Users,
  TrendingUp,
  Globe,
  LayoutDashboard,
  ClipboardCheck,
  KeyRound,
  Heart,
  User,
  ShoppingBag,
  Sliders,
} from 'lucide-react';

const ClothingWholesaleApp: React.FC = () => {
  const { isAppLocked, settings, lockApp, isOnline } = useClothingWholesale();

  // STRICT REQUIREMENT: Only five primary navigation sections:
  // 'dashboard' | 'customers' | 'inventory' | 'transactions' | 'reports' | 'public_storefront'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Customer Storefront State
  const [publicView, setPublicView] = useState<string>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Authenticated Serial User in Storefront
  const [currentSerialUser, setCurrentSerialUser] = useState<SerialUserAccount | null>(null);

  useEffect(() => {
    // Check if an active serial user code was previously remembered
    const savedCode = localStorage.getItem('AUTH_SERIAL_USER_NUMBER') || 'C-0001';
    clothingDb.getSerialUserByNumber(savedCode).then((user) => {
      if (user && user.status === 'active') {
        setCurrentSerialUser(user);
      }
    });
  }, []);

  const handleLoginSuccess = (user: SerialUserAccount) => {
    setCurrentSerialUser(user);
    localStorage.setItem('AUTH_SERIAL_USER_NUMBER', user.userNumber);
  };

  const handleLogoutSerialUser = () => {
    setCurrentSerialUser(null);
    localStorage.removeItem('AUTH_SERIAL_USER_NUMBER');
  };

  // If local owner PIN lock is active, show lock screen
  if (isAppLocked) {
    return <AppLockScreen />;
  }

  // Header meta for the 5 primary tabs
  const getTabHeader = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Executive Dashboard',
          icon: LayoutDashboard,
          subtitle: 'Today sales, expenses, active customer count, low-stock alerts, and C/B/F limits',
        };
      case 'customers':
        return {
          title: 'Wholesale Customers',
          icon: Users,
          subtitle: 'Buyer directory, sequential serial generation, billing history, and statements',
        };
      case 'inventory':
        return {
          title: 'Inventory & Stock Management',
          icon: Boxes,
          subtitle: 'Products catalog, stock matrix, purchases inbound, and fashion showcase',
        };
      case 'transactions':
        return {
          title: 'Transactions & POS Billing',
          icon: CreditCard,
          subtitle: 'POS cash counter, C/B/F order desk, sales ledger, and operating expenses',
        };
      case 'reports':
        return {
          title: 'Business Reports & Profitability',
          icon: TrendingUp,
          subtitle: 'Real-time sales, expenses, purchases, customers, and inventory calculations',
        };
      case 'public_storefront':
        return {
          title: 'Customer Storefront Portal',
          icon: Globe,
          subtitle: 'Client product browsing, category isolation, private wishlist, and serial login',
        };
      default:
        return {
          title: 'Clothing Wholesale System',
          icon: LayoutDashboard,
          subtitle: settings.businessName,
        };
    }
  };

  const currentTabMeta = getTabHeader();
  const HeaderIcon = currentTabMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* 1. Left Compact & Collapsible ERP Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Workspace Layout */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-18' : 'md:pl-60'
        }`}
      >
        {/* Offline Status Banner */}
        <OfflineStatusBanner />

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Tab Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 hidden sm:flex">
                  <HeaderIcon className="w-4 h-4 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
                    {currentTabMeta.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate hidden md:block">
                    {currentTabMeta.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick POS Shortcut */}
              {activeTab !== 'transactions' && (
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
                  title="Open POS Billing Counter"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Bill</span>
                </button>
              )}

              {/* Quick Add Customer Shortcut */}
              {activeTab !== 'customers' && (
                <button
                  onClick={() => setActiveTab('customers')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  title="Add Customer & Generate Serial"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Customer Serial</span>
                </button>
              )}

              {/* Terminal Screen Lock */}
              {settings.ownerPinHash && (
                <button
                  onClick={lockApp}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Lock terminal now"
                  aria-label="Lock terminal"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {/* Settings / More Trigger */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Application Settings / More"
                aria-label="Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 3. Main Workspace Router */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {/* SECTION 1: DASHBOARD */}
          {activeTab === 'dashboard' && <ExecutiveDashboard onNavigate={setActiveTab} />}

          {/* SECTION 2: CUSTOMERS */}
          {activeTab === 'customers' && (
            <CustomerManager onStartSaleForCustomer={() => setActiveTab('transactions')} />
          )}

          {/* SECTION 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <InventoryWorkspace onNavigateToTransactions={() => setActiveTab('transactions')} />
          )}

          {/* SECTION 4: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <TransactionsWorkspace onNavigateToPurchases={() => setActiveTab('inventory')} />
          )}

          {/* SECTION 5: REPORTS */}
          {activeTab === 'reports' && <OfflineReportsDashboard />}

          {/* CUSTOMER STOREFRONT PORTAL */}
          {activeTab === 'public_storefront' && (
            <div className="space-y-6">
              {/* Storefront Navigation Bar & User Status */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold block">CUSTOMER STOREFRONT</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300">Product Browsing & Order Placement</span>
                  </div>
                  {currentSerialUser ? (
                    <div className="mt-1 flex items-center gap-2 text-slate-300 text-[11px]">
                      <span>Logged in as:</span>
                      <strong className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {currentSerialUser.userNumber} ({currentSerialUser.customerName})
                      </strong>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        Category {currentSerialUser.category}
                      </span>
                      <button
                        onClick={handleLogoutSerialUser}
                        className="text-slate-400 hover:text-rose-400 underline ml-2 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-slate-400 text-[11px]">
                      Guest buyer browsing. Log in with your admin-issued User Number to view category limits and submit orders.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {!currentSerialUser ? (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Serial Login</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setPublicView('wishlist')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Wishlist</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg cursor-pointer"
                  >
                    Admin Counter &rarr;
                  </button>
                </div>
              </div>

              {/* Sub-view Navigation Tabs */}
              <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'catalogue', label: 'Product Catalogue' },
                  { id: 'tracking', label: 'Track Orders' },
                  { id: 'about', label: 'About Us' },
                  { id: 'announcements', label: 'Announcements' },
                  { id: 'future', label: 'Future Plans' },
                  { id: 'contact', label: 'Contact' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPublicView(item.id)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      publicView === item.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Render Storefront Sub-view */}
              <div>
                {publicView === 'home' && (
                  <HeroAndFeatures
                    onExploreCatalogue={() => setPublicView('catalogue')}
                    onOpenRegister={() => setIsAuthOpen(true)}
                  />
                )}
                {publicView === 'catalogue' && <CatalogueSection />}
                {publicView === 'wishlist' && (
                  <WishlistSection
                    currentUser={currentSerialUser}
                    onOpenAuth={() => setIsAuthOpen(true)}
                    onAddToCart={() => setIsCartOpen(true)}
                    onExploreCatalogue={() => setPublicView('catalogue')}
                  />
                )}
                {publicView === 'tracking' && (
                  <OrderTrackingSection
                    currentUser={currentSerialUser}
                    onOpenAuth={() => setIsAuthOpen(true)}
                    onExploreCatalogue={() => setPublicView('catalogue')}
                  />
                )}
                {publicView === 'about' && <AboutSection />}
                {publicView === 'announcements' && <AnnouncementsSection />}
                {publicView === 'future' && <FuturePlansSection />}
                {publicView === 'contact' && <ContactSection />}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Serial User Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Settings / More Modal */}
      <SettingsMoreModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WholesaleProvider>
      <ClothingWholesaleProvider>
        <ClothingWholesaleApp />
      </ClothingWholesaleProvider>
    </WholesaleProvider>
  );
};

export default App;
