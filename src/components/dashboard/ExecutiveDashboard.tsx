/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { formatNpr } from '../../i18n';
import {
  CreditCard,
  Package,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Truck,
  Plus,
  ArrowUpRight,
  Wallet,
  Clock,
  CheckCircle2,
  Users,
  KeyRound,
  ShieldCheck,
  Settings,
  X,
  Check,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

interface ExecutiveDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickAddCustomer?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onOpenQuickAddCustomer,
}) => {
  const {
    metrics,
    sales,
    expenses,
    products,
    customers,
    settings,
    isOnline,
    updateCbfAmounts,
    refreshAllData,
  } = useClothingWholesale();

  // Latest 6 sales
  const recentSales = sales.slice(0, 6);

  // Active customer count
  const activeCustomersCount = customers.filter((c) => (c.status || 'active') === 'active').length;

  // C/B/F Configuration Modal State
  const [isCbfModalOpen, setIsCbfModalOpen] = useState(false);
  const [cbfInputs, setCbfInputs] = useState({
    C: settings.cbfAmounts?.C !== undefined && settings.cbfAmounts?.C !== null ? String(settings.cbfAmounts.C) : '200000',
    B: settings.cbfAmounts?.B !== undefined && settings.cbfAmounts?.B !== null ? String(settings.cbfAmounts.B) : '75000',
    F: settings.cbfAmounts?.F !== undefined && settings.cbfAmounts?.F !== null ? String(settings.cbfAmounts.F) : '35000',
  });
  const [cbfSaveMsg, setCbfSaveMsg] = useState<string | null>(null);

  const handleSaveCbfAmounts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numC = cbfInputs.C.trim() === '' ? null : Number(cbfInputs.C);
      const numB = cbfInputs.B.trim() === '' ? null : Number(cbfInputs.B);
      const numF = cbfInputs.F.trim() === '' ? null : Number(cbfInputs.F);

      await updateCbfAmounts({
        C: numC !== null && !isNaN(numC) ? numC : null,
        B: numB !== null && !isNaN(numB) ? numB : null,
        F: numF !== null && !isNaN(numF) ? numF : null,
      });

      setCbfSaveMsg('C/B/F Category limits successfully updated in persistent storage!');
      setTimeout(() => {
        setCbfSaveMsg(null);
        setIsCbfModalOpen(false);
      }, 1400);
    } catch (err: any) {
      setCbfSaveMsg(err?.message || 'Failed to save amounts');
    }
  };

  const threshold = settings.defaultLowStockThreshold || 15;

  return (
    <div className="space-y-6">
      {/* 1. Executive Welcome & Top Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Executive Operations Control</span>
            <span aria-hidden="true">·</span>
            <span>Local IndexedDB Persistence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {settings.businessName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.tradingName} · Central Backend · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Offline & Central Storage Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs">
            <Database className="w-3.5 h-3.5" />
            <span>IndexedDB: v4 Healthy</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isOnline ? 'Online Sync Ready' : 'Offline Autonomous'}</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Quick Actions
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Customer / Generate Serial */}
          <button
            onClick={() => onNavigate('customers')}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Customer</span>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Generate Serial</span>
          </button>

          {/* New POS Bill */}
          <button
            onClick={() => onNavigate('transactions')}
            className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-700" />
            <span>New Bill (POS)</span>
          </button>

          {/* Add Purchase (Source of Truth in Inventory) */}
          <button
            onClick={() => onNavigate('inventory')}
            className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Purchases are maintained inside Inventory as source of truth"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Purchase</span>
          </button>

          {/* Add Operating Expense */}
          <button
            onClick={() => onNavigate('transactions')}
            className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 3. Core Financial & Operations KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Sales</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatNpr(metrics.todaySalesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{metrics.todaySalesCount} bill(s) issued today</span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ledger <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Today's Operating Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Operating Expenses</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatNpr(metrics.todayExpensesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Shop, freight & utilities</span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-slate-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Expenses <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Active Customers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Customers</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {activeCustomersCount} <span className="text-xs font-normal text-slate-500">buyers</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{customers.length} total registered</span>
            <button
              onClick={() => onNavigate('customers')}
              className="text-blue-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Directory <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Low-Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low-Stock Alerts</span>
            <span
              className={`p-1.5 rounded-lg ${
                metrics.lowStockCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-2 font-mono ${
              metrics.lowStockCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {metrics.lowStockCount} <span className="text-xs font-normal text-slate-500">variants</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Threshold: ≤ {threshold} pcs</span>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-rose-700 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Stock Matrix <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. C/B/F Category Configuration Card (Fixes C/B/F display bug) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-black uppercase tracking-wider">
                CONFIDENTIAL BUSINESS THRESHOLDS
              </span>
              <span className="text-slate-400 text-xs">· Admin Visible Only</span>
            </div>
            <h3 className="text-sm font-bold mt-1 text-white">
              C / B / F Category Credit & Allocation Limits
            </h3>
          </div>

          <button
            onClick={() => {
              setCbfInputs({
                C: settings.cbfAmounts?.C !== undefined && settings.cbfAmounts?.C !== null ? String(settings.cbfAmounts.C) : '',
                B: settings.cbfAmounts?.B !== undefined && settings.cbfAmounts?.B !== null ? String(settings.cbfAmounts.B) : '',
                F: settings.cbfAmounts?.F !== undefined && settings.cbfAmounts?.F !== null ? String(settings.cbfAmounts.F) : '',
              });
              setCbfSaveMsg(null);
              setIsCbfModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            Configure C/B/F Limits
          </button>
        </div>

        {/* Display each category's limit, or "Not Configured" if null/undefined */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Category C */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Category C (Premium)</span>
              <span className="text-[10px] font-mono text-slate-400">T-1 Tier</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-white">
              {settings.cbfAmounts?.C !== undefined && settings.cbfAmounts?.C !== null
                ? formatNpr(settings.cbfAmounts.C)
                : <span className="text-amber-300 font-normal italic text-sm">Not Configured</span>}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Top volume tier and high credit limit
            </p>
          </div>

          {/* Category B */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Category B (Regular)</span>
              <span className="text-[10px] font-mono text-slate-400">T-2 Tier</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-white">
              {settings.cbfAmounts?.B !== undefined && settings.cbfAmounts?.B !== null
                ? formatNpr(settings.cbfAmounts.B)
                : <span className="text-blue-300 font-normal italic text-sm">Not Configured</span>}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Standard wholesale regular buyer limits
            </p>
          </div>

          {/* Category F */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Category F (Trial)</span>
              <span className="text-[10px] font-mono text-slate-400">T-3 Tier</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-white">
              {settings.cbfAmounts?.F !== undefined && settings.cbfAmounts?.F !== null
                ? formatNpr(settings.cbfAmounts.F)
                : <span className="text-emerald-300 font-normal italic text-sm">Not Configured</span>}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Trial entry-level wholesale buyer limits
            </p>
          </div>
        </div>
      </div>

      {/* 5. Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            View All Transactions →
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No transactions recorded yet. Click "New Bill (POS)" to issue your first cash invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer Name</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2 text-right">Items</th>
                  <th className="pb-2 text-right">Grand Total</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                    <td className="py-2.5 text-slate-800 font-medium">
                      {s.customerName || 'Walk-in Cash Buyer'}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700">
                      {s.items.reduce((acc, it) => acc + it.quantity, 0)} pcs
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatNpr(s.grandTotal)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* C/B/F LIMITS CONFIGURATION MODAL                                      */}
      {/* --------------------------------------------------------------------- */}
      {isCbfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Configure C / B / F Category Limits</h3>
              <button
                onClick={() => setIsCbfModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {cbfSaveMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  cbfSaveMsg.includes('success')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {cbfSaveMsg.includes('success') ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{cbfSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCbfAmounts} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Category C Amount Limit (NPR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Leave empty for Not Configured"
                  value={cbfInputs.C}
                  onChange={(e) => setCbfInputs({ ...cbfInputs, C: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Top-tier wholesale credit & allocation limit</p>
              </div>

              <div>
                <label className="block font-bold text-blue-900 mb-1">
                  Category B Amount Limit (NPR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Leave empty for Not Configured"
                  value={cbfInputs.B}
                  onChange={(e) => setCbfInputs({ ...cbfInputs, B: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Standard wholesale regular buyer limit</p>
              </div>

              <div>
                <label className="block font-bold text-emerald-900 mb-1">
                  Category F Amount Limit (NPR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Leave empty for Not Configured"
                  value={cbfInputs.F}
                  onChange={(e) => setCbfInputs({ ...cbfInputs, F: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Trial entry-level wholesale limit</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCbfModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
