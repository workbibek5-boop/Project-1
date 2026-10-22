/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { ShoppingBag, ShieldCheck, User, Globe, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openCart: () => void;
  openAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openCart,
  openAuth,
}) => {
  const { language, setLanguage, t, companySettings, currentRole, setCurrentRole, currentCustomer, cart } = useWholesale();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantityPacks, 0);

  const roleLabels: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    inventory_manager: 'Inventory',
    sales_staff: 'Sales',
    accounts_staff: 'Accounts',
    dispatch_staff: 'Dispatch',
    customer: 'Customer',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      {/* Top Banner for System Mode & Currency Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold tracking-wide">PHASE 0 ARCHITECTURE</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Currency: <strong className="text-white font-mono">NPR (Nepalese Rupees)</strong></span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Legal Entity: <span className="text-slate-200">{companySettings.legalEntityName}</span></span>
        </div>
        
        {/* Role & Language Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              className="text-xs hover:text-white transition-colors underline decoration-slate-600"
            >
              {language === 'en' ? 'नेपालीमा हेर्नुहोस्' : 'English'}
            </button>
          </div>
          
          <span aria-hidden="true" className="text-slate-600">·</span>

          {/* Persona selector for instant multi-role verification */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-slate-800 text-amber-300 text-xs font-medium rounded px-2 py-0.5 border border-slate-700 cursor-pointer focus:outline-none focus:border-amber-400"
            >
              <option value="customer">Buyer: {currentCustomer?.businessName || 'Wholesale Buyer'}</option>
              <option value="owner">Owner (Full Privileges)</option>
              <option value="admin">Operations Admin</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="sales_staff">Sales Officer</option>
              <option value="accounts_staff">Accounts Staff (Ledger)</option>
              <option value="dispatch_staff">Dispatch & Cargo</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('home')}
            className="text-left group flex items-center gap-2.5"
          >
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg tracking-wider group-hover:bg-amber-600 transition-colors">
              W
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                {companySettings.temporaryDisplayName}
              </span>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Wholesale Garments Nepal
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentView('catalogue')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 ${
              currentView === 'catalogue' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t.nav.catalogue}
          </button>

          <button
            onClick={() => setCurrentView('about')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 ${
              currentView === 'about' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t.nav.about}
          </button>

          <button
            onClick={() => setCurrentView('announcements')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 ${
              currentView === 'announcements' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t.nav.announcements}
          </button>

          <button
            onClick={() => setCurrentView('plans')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 ${
              currentView === 'plans' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t.nav.futurePlans}
          </button>

          <button
            onClick={() => setCurrentView('contact')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 ${
              currentView === 'contact' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t.nav.contact}
          </button>
        </nav>

        {/* Zone 3: 1 primary action or workspace portal switch */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart Icon Button */}
          <button
            onClick={openCart}
            aria-label="View Shopping Cart"
            className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ShoppingBag className="w-5 h-5 text-slate-800" />
            <span className="hidden sm:inline">{t.nav.cart}</span>
            {totalCartItems > 0 && (
              <span className="bg-amber-600 text-white font-mono text-[11px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Dashboard Portal or Customer View switch */}
          {currentRole !== 'customer' ? (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Office Console ({roleLabels[currentRole]})</span>
            </button>
          ) : (
            <button
              onClick={openAuth}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <User className="w-4 h-4" />
              <span>{currentCustomer ? currentCustomer.businessName : t.nav.login}</span>
            </button>
          )}

          {/* Quick toggle to Dashboard if currently in store view */}
          {currentView !== 'dashboard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="hidden lg:flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium py-1 px-2 border border-slate-200 rounded-md whitespace-nowrap"
            >
              <span>Staff Hub</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
