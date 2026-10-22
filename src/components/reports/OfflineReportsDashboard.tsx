/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { formatNpr } from '../../i18n';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Wallet,
  Truck,
  Receipt,
  Download,
} from 'lucide-react';

export const OfflineReportsDashboard: React.FC = () => {
  const {
    products,
    sales,
    purchases,
    expenses,
    customers,
    stockMovements,
    settings,
    exportSalesCsv,
    exportInventoryCsv,
    exportProductsCsv,
  } = useClothingWholesale();

  // 6 Primary Tabs
  const [activeReportTab, setActiveReportTab] = useState<
    'overview' | 'sales' | 'expenses' | 'purchases' | 'customers' | 'inventory'
  >('overview');

  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | '7days' | 'month' | 'all'>('today');

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Filter sales based on selected date range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.status !== 'completed') return false;
      if (dateRangeFilter === 'today') return s.timestamp.startsWith(todayStr);
      if (dateRangeFilter === '7days') return s.timestamp >= sevenDaysAgo;
      if (dateRangeFilter === 'month') return s.timestamp >= monthStart;
      return true;
    });
  }, [sales, dateRangeFilter, todayStr, sevenDaysAgo, monthStart]);

  // Filter expenses based on selected date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (dateRangeFilter === 'today') return e.date === todayStr;
      if (dateRangeFilter === '7days') return e.date >= sevenDaysAgo.slice(0, 10);
      if (dateRangeFilter === 'month') return e.date >= monthStart.slice(0, 10);
      return true;
    });
  }, [expenses, dateRangeFilter, todayStr, sevenDaysAgo, monthStart]);

  // Financial aggregates
  const totalCashSalesNpr = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalExpensesNpr = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Total cost of goods sold (COGS)
  let totalCogsNpr = 0;
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      totalCogsNpr += (item.purchaseCostAtSale || 0) * item.quantity;
    });
  });

  const estimatedGrossProfitNpr = totalCashSalesNpr - totalCogsNpr;
  const grossProfitMarginPercent =
    totalCashSalesNpr > 0 ? Math.round((estimatedGrossProfitNpr / totalCashSalesNpr) * 100) : 0;
  const estimatedNetProfitNpr = estimatedGrossProfitNpr - totalExpensesNpr;

  // Inventory Totals
  const totalStockPieces = products.reduce((sum, p) => sum + p.totalStock, 0);
  const inventoryValuationCost = products.reduce(
    (sum, p) => sum + p.totalStock * p.purchaseCost,
    0
  );
  const inventoryValuationSelling = products.reduce(
    (sum, p) => sum + p.totalStock * p.sellingPrice,
    0
  );

  // Low stock variants list
  const lowStockVariants: Array<{
    productName: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    threshold: number;
  }> = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      const threshold = v.lowStockAlert ?? settings.defaultLowStockThreshold;
      if (v.stock <= threshold) {
        lowStockVariants.push({
          productName: p.name,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
          threshold,
        });
      }
    });
  });

  // Export Expenses to CSV
  const exportExpensesCsv = () => {
    const headers = ['Voucher No', 'Date', 'Category', 'Description', 'Amount (NPR)', 'Payment Method'];
    const rows = filteredExpenses.map((e) => [
      `"${e.voucherNumber || ''}"`,
      `"${e.date}"`,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.paymentMethod}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${dateRangeFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Purchases to CSV
  const exportPurchasesCsv = () => {
    const headers = ['Invoice / Consignment', 'Date', 'Supplier', 'Items Count', 'Total Cost (NPR)', 'Notes'];
    const rows = purchases.map((p) => [
      `"${p.purchaseNumber}"`,
      `"${p.purchaseDate}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.items.reduce((acc, it) => acc + it.quantity, 0),
      p.totalCost,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Customers to CSV
  const exportCustomersCsv = () => {
    const headers = ['Serial Code', 'Customer Name', 'Category', 'Short Code', 'Phone', 'Status', 'Registered Date'];
    const rows = customers.map((c) => [
      `"${c.serialNumber || ''}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.shortCode || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.status || 'active'}"`,
      `"${c.registrationDate || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Offline Local Business Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Cloud Real Calculations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Reports & Profitability Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Computed in real time from persistent IndexedDB records on this machine.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'today', label: "Today's Sales" },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRangeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dateRangeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Report Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold w-full overflow-x-auto shadow-2xs">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'sales', label: `Sales Reports (${filteredSales.length})`, icon: Receipt },
          { id: 'expenses', label: `Expense Reports (${filteredExpenses.length})`, icon: Wallet },
          { id: 'purchases', label: `Purchase Reports (${purchases.length})`, icon: Truck },
          { id: 'customers', label: `Customer Reports (${customers.length})`, icon: Users },
          { id: 'inventory', label: `Inventory Reports (${products.length})`, icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeReportTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 text-slate-700" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash Sales Total */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">
                Cash Sales Revenue ({dateRangeFilter})
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-2 block tabular-nums">
                {formatNpr(totalCashSalesNpr)}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                {filteredSales.length} completed cash invoice(s)
              </span>
            </div>

            {/* Estimated Gross Profit */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 block">
                  Estimated Gross Profit
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  ~{grossProfitMarginPercent}%
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-emerald-700 mt-2 block tabular-nums">
                {formatNpr(estimatedGrossProfitNpr)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Revenue minus purchase cost of goods sold
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">
                Operating Expenses ({dateRangeFilter})
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-2 block tabular-nums">
                {formatNpr(totalExpensesNpr)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                {filteredExpenses.length} expense voucher(s) logged
              </span>
            </div>

            {/* Net Cash Profit */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500 block">Estimated Net Profit</span>
              <span
                className={`text-2xl font-bold font-mono mt-2 block tabular-nums ${
                  estimatedNetProfitNpr >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatNpr(estimatedNetProfitNpr)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Gross profit minus all recorded cash expenses
              </span>
            </div>
          </div>

          {/* Warehouse Valuation Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Warehouse Valuation & Working Capital</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Total Garment Units</span>
                <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                  {totalStockPieces.toLocaleString()} pcs
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Stock Valuation at Purchase Cost</span>
                <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                  {formatNpr(inventoryValuationCost)}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Stock Valuation at Retail Price</span>
                <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
                  {formatNpr(inventoryValuationSelling)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALES REPORTS TAB */}
      {activeReportTab === 'sales' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cash Sales Breakdown & Invoices</h3>
              <p className="text-xs text-slate-500">Showing {filteredSales.length} invoices for {dateRangeFilter}</p>
            </div>
            <button
              onClick={exportSalesCsv}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Sales CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                <th className="pb-2">Invoice #</th>
                <th className="pb-2">Date & Time</th>
                <th className="pb-2">Customer Name</th>
                <th className="pb-2 text-right">Items</th>
                <th className="pb-2 text-right">Subtotal</th>
                <th className="pb-2 text-right">GST</th>
                <th className="pb-2 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                  <td className="py-2.5 text-slate-600">{new Date(s.timestamp).toLocaleString('en-GB')}</td>
                  <td className="py-2.5 text-slate-800 font-medium">{s.customerName || 'Walk-in'}</td>
                  <td className="py-2.5 text-right font-mono">{s.items.reduce((acc, it) => acc + it.quantity, 0)}</td>
                  <td className="py-2.5 text-right font-mono">{formatNpr(s.subtotal)}</td>
                  <td className="py-2.5 text-right font-mono">{formatNpr(s.taxAmount)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatNpr(s.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. EXPENSES REPORTS TAB */}
      {activeReportTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operating Expenses Breakdown</h3>
              <p className="text-xs text-slate-500">Total: {formatNpr(totalExpensesNpr)} across {filteredExpenses.length} vouchers</p>
            </div>
            <button
              onClick={exportExpensesCsv}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Expenses CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                <th className="pb-2">Voucher #</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono font-bold text-slate-900">{e.voucherNumber || '—'}</td>
                  <td className="py-2.5 text-slate-600">{e.date}</td>
                  <td className="py-2.5 font-semibold text-slate-800">{e.category}</td>
                  <td className="py-2.5 text-slate-600 max-w-xs truncate">{e.description}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatNpr(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. PURCHASE REPORTS TAB */}
      {activeReportTab === 'purchases' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inbound Mill Purchases & Consignments</h3>
              <p className="text-xs text-slate-500">
                Purchases maintained in Inventory as primary source of truth ({purchases.length} consignments logged)
              </p>
            </div>
            <button
              onClick={exportPurchasesCsv}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Purchases CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                <th className="pb-2">Invoice / Consignment #</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Supplier</th>
                <th className="pb-2 text-right">Total Units</th>
                <th className="pb-2 text-right">Total Inbound Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono font-bold text-slate-900">{p.purchaseNumber}</td>
                  <td className="py-2.5 text-slate-600">{p.purchaseDate}</td>
                  <td className="py-2.5 text-slate-800 font-medium">{p.supplierName}</td>
                  <td className="py-2.5 text-right font-mono text-slate-700">
                    {p.items.reduce((acc, it) => acc + it.quantity, 0)} pcs
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatNpr(p.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. CUSTOMER REPORTS TAB */}
      {activeReportTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Accounts & Tier Allocations</h3>
              <p className="text-xs text-slate-500">
                {customers.length} registered buyers · C: {customers.filter((c) => c.category === 'C').length} · B: {customers.filter((c) => c.category === 'B').length} · F: {customers.filter((c) => c.category === 'F').length}
              </p>
            </div>
            <button
              onClick={exportCustomersCsv}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Customers CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                <th className="pb-2">Serial Code</th>
                <th className="pb-2">Customer Name</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Lifetime Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => {
                const totalSpent = sales
                  .filter((s) => s.customerId === c.id || s.customerSerial === c.serialNumber)
                  .reduce((acc, s) => acc + s.grandTotal, 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-slate-900">{c.serialNumber || '—'}</td>
                    <td className="py-2.5 text-slate-800 font-medium">{c.name}</td>
                    <td className="py-2.5 font-bold">Category {c.category}</td>
                    <td className="py-2.5 font-mono text-slate-600">{c.phone || '—'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'inactive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatNpr(totalSpent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. INVENTORY REPORTS TAB */}
      {activeReportTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Stock & Valuations</h3>
              <p className="text-xs text-slate-500">
                {products.length} products · {lowStockVariants.length} variants below threshold
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportInventoryCsv}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Variants Matrix CSV</span>
              </button>
              <button
                onClick={exportProductsCsv}
                className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Export Catalog CSV</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[11px] font-semibold">
                <th className="pb-2">Product Name</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Variants</th>
                <th className="pb-2 text-right">Total Stock</th>
                <th className="pb-2 text-right">Cost Price</th>
                <th className="pb-2 text-right">Selling Price</th>
                <th className="pb-2 text-right">Stock Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                  <td className="py-2.5 font-mono text-slate-600">{p.sku}</td>
                  <td className="py-2.5 text-slate-700">{p.category}</td>
                  <td className="py-2.5 text-right font-mono">{p.variants.length}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">{p.totalStock} pcs</td>
                  <td className="py-2.5 text-right font-mono text-slate-600">{formatNpr(p.purchaseCost)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-900">{formatNpr(p.sellingPrice)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                    {formatNpr(p.totalStock * p.sellingPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
