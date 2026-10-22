/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { CashSale } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Receipt,
  Search,
  Calendar,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';

export const SalesHistoryManager: React.FC = () => {
  const { sales, settings, reverseSale } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Selected invoice for detail modal
  const [selectedSale, setSelectedSale] = useState<CashSale | null>(null);

  // Reversal confirmation modal
  const [reversalTarget, setReversalTarget] = useState<CashSale | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState<string | null>(null);
  const [isSubmittingReversal, setIsSubmittingReversal] = useState(false);

  // Filtered sales
  const filteredSales = useMemo(() => {
    let result = sales;

    // Date filter
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (dateFilter === 'today') {
      result = result.filter((s) => s.timestamp.slice(0, 10) === todayStr);
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      result = result.filter((s) => s.timestamp >= sevenDaysAgo);
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      result = result.filter((s) => s.timestamp >= thirtyDaysAgo);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.customerPhone && s.customerPhone.includes(q))
      );
    }

    return result;
  }, [sales, dateFilter, statusFilter, debouncedSearch]);

  // Paginated sales
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  // Total summary for current view
  const summary = useMemo(() => {
    let completedCount = 0;
    let totalRevenue = 0;
    let reversedCount = 0;

    for (const s of filteredSales) {
      if (s.status === 'completed') {
        completedCount++;
        totalRevenue += s.grandTotal;
      } else {
        reversedCount++;
      }
    }

    return { completedCount, totalRevenue, reversedCount };
  }, [filteredSales]);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget) return;

    if (!reversalReason.trim()) {
      setReversalError('Please provide a specific reason for the cancellation/refund.');
      return;
    }

    setIsSubmittingReversal(true);
    setReversalError(null);

    const res = await reverseSale(reversalTarget.id, reversalReason.trim());
    setIsSubmittingReversal(false);

    if (res.success) {
      setReversalTarget(null);
      if (selectedSale?.id === reversalTarget.id) {
        setSelectedSale(null);
      }
    } else {
      setReversalError(res.error || 'Failed to reverse sale transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Sales History & Invoicing</span>
            <span aria-hidden="true">·</span>
            <span>Cash Sales Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Sales & Invoice Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit completed cash transactions, reprint customer receipts, or execute controlled reversals.
          </p>
        </div>

        {/* Financial Summary Badges */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-2xs text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Completed Volume</div>
            <div className="font-bold text-slate-900 text-sm">{formatNpr(summary.totalRevenue)}</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Paid Bills</div>
            <div className="font-bold text-emerald-700 text-sm">{summary.completedCount}</div>
          </div>
          {summary.reversedCount > 0 && (
            <>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Cancelled</div>
                <div className="font-bold text-rose-700 text-sm">{summary.reversedCount}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed Sales Only</option>
            <option value="cancelled">Cancelled / Refunded Only</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    No cash sale records found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {s.timestamp.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold truncate max-w-[160px]">
                      {s.customerName || 'Walk-in Cash Buyer'}
                      {s.customerPhone && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {s.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {s.items.reduce((sum, it) => sum + it.quantity, 0)} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatNpr(s.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {s.discountTotal > 0 ? `-${formatNpr(s.discountTotal)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatNpr(s.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="View Invoice & Print"
                      >
                        <Eye className="w-3 h-3 text-slate-600" />
                        <span>View</span>
                      </button>

                      {s.status === 'completed' && (
                        <button
                          onClick={() => {
                            setReversalTarget(s);
                            setReversalReason('Customer requested cancellation / exchange');
                            setReversalError(null);
                          }}
                          className="py-1 px-2 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors inline-flex items-center gap-1 text-[11px]"
                          title="Cancel/Refund Sale & Restore Inventory"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredSales.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Invoice Detail & Print Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Invoice {selectedSale.invoiceNumber}</h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedSale.timestamp.slice(0, 16).replace('T', ' ')} · Cash Sale
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-6 space-y-5 text-xs text-slate-800 print:p-0">
              {/* Business & Customer Header */}
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{settings.businessName}</h4>
                  <p className="text-slate-500 text-[11px]">{settings.tradingName}</p>
                  <p className="text-slate-500 text-[11px]">{settings.address}</p>
                  <p className="text-slate-500 text-[11px]">PAN/VAT: {settings.panVatNumber}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Billed To</div>
                  <div className="font-bold text-slate-900">{selectedSale.customerName || 'Walk-in Cash Buyer'}</div>
                  {selectedSale.customerPhone && (
                    <div className="text-slate-500 text-[11px]">{selectedSale.customerPhone}</div>
                  )}
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedSale.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Payment: CASH ({selectedSale.status.toUpperCase()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Variant</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2">
                        <div className="font-semibold text-slate-900">{it.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>
                      </td>
                      <td className="py-2 text-center text-slate-600 font-mono">
                        {it.size} / {it.color}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-700">
                        {formatNpr(it.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900">
                        {it.quantity}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900">
                        {formatNpr(it.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Calculation */}
              <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatNpr(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono text-rose-600">-{formatNpr(selectedSale.discountTotal)}</span>
                  </div>
                )}
                {selectedSale.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT ({selectedSale.taxRatePercent}%):</span>
                    <span className="font-mono">{formatNpr(selectedSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Grand Total (Cash):</span>
                  <span className="font-mono">{formatNpr(selectedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Cash Received:</span>
                  <span className="font-mono">{formatNpr(selectedSale.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Change Returned:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatNpr(selectedSale.changeReturned)}</span>
                </div>
              </div>

              {selectedSale.status === 'cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Transaction Reversed & Inventory Restored</span>
                  </div>
                  <p className="text-[11px]">
                    Reversed at: {selectedSale.reversedAt?.slice(0, 16).replace('T', ' ')}
                  </p>
                  <p className="text-[11px]">
                    Reason: {selectedSale.reversalReason || 'No reason recorded.'}
                  </p>
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                {settings.invoiceFooterNote}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Reverse Cash Sale {reversalTarget.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setReversalTarget(null)}
                className="text-rose-200 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteReversal} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs space-y-1">
                <strong>Attention: Controlled Reversal</strong>
                <p className="text-[11px] leading-relaxed">
                  Reversing this invoice ({formatNpr(reversalTarget.grandTotal)}) will automatically restore all
                  item quantities ({reversalTarget.items.reduce((s, it) => s + it.quantity, 0)} pieces) back into the
                  corresponding variant inventory and log an audit movement.
                </p>
              </div>

              {reversalError && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg">
                  {reversalError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Cancellation / Return <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Defective seam exchange, buyer returned goods, billing error"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Keep Sale
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReversal}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-2xs"
                >
                  {isSubmittingReversal ? 'Restoring Stock...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
