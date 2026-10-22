/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { CashBillingPos } from './CashBillingPos';
import { SalesHistoryManager } from '../sales/SalesHistoryManager';
import { ExpenseManager } from '../expenses/ExpenseManager';
import { CbfOrderManager } from '../admin/CbfOrderManager';
import { formatNpr } from '../../i18n';
import {
  CreditCard,
  Receipt,
  Wallet,
  ClipboardCheck,
  TrendingUp,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface TransactionsWorkspaceProps {
  initialSubTab?: 'pos' | 'sales' | 'expenses' | 'orders';
  onNavigateToPurchases?: () => void;
}

export const TransactionsWorkspace: React.FC<TransactionsWorkspaceProps> = ({
  initialSubTab = 'pos',
  onNavigateToPurchases,
}) => {
  const { metrics, centralOrders, purchases } = useClothingWholesale();
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'sales' | 'expenses' | 'orders'>(
    initialSubTab
  );

  const pendingOrdersCount = centralOrders.filter((o) => o.status === 'Pending Approval').length;
  const approvedOrdersCount = centralOrders.filter((o) => o.status === 'Approved').length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Billing, Expenses & Financial Flows</span>
            <span aria-hidden="true">·</span>
            <span>Central Transaction Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Transactions & Cash Register
          </h1>
        </div>

        {/* Financial Highlights */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Today's Sales:</span>
            <strong className="font-mono">{formatNpr(metrics.todaySalesTotal)}</strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span>Today's Expenses:</span>
            <strong className="text-slate-900 font-mono">{formatNpr(metrics.todayExpensesTotal)}</strong>
          </div>

          {onNavigateToPurchases && (
            <button
              onClick={onNavigateToPurchases}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Purchases are maintained inside Inventory as source of truth"
            >
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Purchases in Inventory</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold w-full overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>POS Cash Billing Counter</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-amber-600" />
          <span>C/B/F Order Review & Billing</span>
          {pendingOrdersCount + approvedOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full">
              {pendingOrdersCount + approvedOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sales'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-slate-700" />
          <span>Sales Invoices & Receipts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'expenses'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4 text-slate-700" />
          <span>Operating Expenses</span>
        </button>
      </div>

      {/* Render Active Module */}
      <div>
        {activeSubTab === 'pos' && <CashBillingPos />}
        {activeSubTab === 'orders' && <CbfOrderManager />}
        {activeSubTab === 'sales' && <SalesHistoryManager />}
        {activeSubTab === 'expenses' && <ExpenseManager />}
      </div>
    </div>
  );
};
